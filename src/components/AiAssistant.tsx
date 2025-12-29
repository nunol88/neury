import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAiAssistant, QUICK_SUGGESTIONS, Message } from '@/hooks/useAiAssistant';
import { cn } from '@/lib/utils';

const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useAiAssistant();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      sendMessage(suggestion);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "transition-all duration-300 hover:scale-110",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Panel */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-out",
          isOpen 
            ? "opacity-100 translate-y-0 h-[600px] max-h-[calc(100vh-6rem)]" 
            : "opacity-0 translate-y-4 h-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Assistente IA</h3>
              <p className="text-xs text-muted-foreground">Pergunta sobre agendamentos</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={clearMessages}
                title="Limpar conversa"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div ref={scrollContainerRef}>
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Olá! 👋</h4>
                  <p className="text-sm text-muted-foreground">
                    Sou o teu assistente de agendamentos. Posso ajudar-te com informações sobre clientes, receitas e agenda.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">
                    Sugestões rápidas:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {QUICK_SUGGESTIONS.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(suggestion.text)}
                        disabled={isLoading}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-left",
                          "bg-muted/50 hover:bg-muted text-sm",
                          "transition-colors duration-200",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <span>{suggestion.emoji}</span>
                        <span>{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, i) => (
                  <MessageBubble key={i} message={message} />
                ))}
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    </div>
                    <span className="text-sm">A pensar...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve a tua pergunta..."
              disabled={isLoading}
              className="flex-1 bg-background"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={isLoading || !input.trim()}
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
};

export default AiAssistant;
