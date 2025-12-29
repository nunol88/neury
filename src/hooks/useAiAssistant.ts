import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const QUICK_SUGGESTIONS = [
  { emoji: '🇬🇧', text: 'Traduz para inglês:' },
  { emoji: '🇵🇹', text: 'Traduz para português:' },
  { emoji: '💰', text: 'Quanto ganhei este mês?' },
  { emoji: '📅', text: 'Resumo de amanhã' },
  { emoji: '✉️', text: 'Escreve uma mensagem para confirmar agendamento' },
  { emoji: '🧹', text: 'Dicas para limpar vidros sem manchas' },
  { emoji: '💡', text: 'Como remover gordura da cozinha?' },
  { emoji: '👥', text: 'Clientes mais frequentes' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
const MAX_HISTORY_MESSAGES = 20; // Keep last 20 messages for context

export const useAiAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .select('id, messages')
          .eq('user_role', 'admin')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading conversation:', error);
          return;
        }

        if (data) {
          setConversationId(data.id);
          const storedMessages = data.messages as unknown as Message[];
          if (Array.isArray(storedMessages) && storedMessages.length > 0) {
            // Load only last N messages to keep context manageable
            setMessages(storedMessages.slice(-MAX_HISTORY_MESSAGES));
          }
        }
      } catch (err) {
        console.error('Error loading conversation history:', err);
      }
    };

    loadHistory();
  }, []);

  // Save messages to database
  const saveMessages = useCallback(async (newMessages: Message[]) => {
    try {
      // Keep only last N messages
      const messagesToSave = newMessages.slice(-MAX_HISTORY_MESSAGES);

      if (conversationId) {
        await supabase
          .from('ai_conversations')
          .update({ messages: JSON.parse(JSON.stringify(messagesToSave)) })
          .eq('id', conversationId);
      } else {
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert([{ 
            user_role: 'admin', 
            messages: JSON.parse(JSON.stringify(messagesToSave))
          }])
          .select('id')
          .single();

        if (!error && data) {
          setConversationId(data.id);
        }
      }
    } catch (err) {
      console.error('Error saving conversation:', err);
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = { role: 'user', content: content.trim() };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const allMessages = [...messages, userMessage];
      
      // Get user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          messages: allMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Resposta vazia do servidor');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              updateAssistant(deltaContent);
            }
          } catch {
            // Incomplete JSON, put it back
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              updateAssistant(deltaContent);
            }
          } catch {
            // Ignore
          }
        }
      }

      // Save the complete conversation after assistant responds
      const finalMessages = [...allMessages, { role: 'assistant' as const, content: assistantContent }];
      await saveMessages(finalMessages);

    } catch (err) {
      console.error('AI Assistant error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao comunicar com o assistente';
      setError(errorMessage);
      
      // Add error message as assistant response
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev;
        }
        return [...prev, { 
          role: 'assistant', 
          content: `❌ ${errorMessage}` 
        }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, saveMessages]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    setError(null);
    
    // Clear from database too
    if (conversationId) {
      await supabase
        .from('ai_conversations')
        .update({ messages: [] })
        .eq('id', conversationId);
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
};
