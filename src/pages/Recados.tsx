import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import ClientAvatar from '@/components/ui/client-avatar';

interface Message {
  id: string;
  user_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
}

const MAX_LEN = 500;

const messageSchema = z.object({
  content: z.string().trim().min(1, 'Escreve um recado').max(MAX_LEN, `Máx. ${MAX_LEN} caracteres`),
});

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const Recados: React.FC = () => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const listEndRef = useRef<HTMLDivElement>(null);

  const authorName = useMemo(() => {
    const meta = user?.user_metadata as { name?: string; full_name?: string } | undefined;
    return (
      meta?.name ||
      meta?.full_name ||
      user?.email?.split('@')[0] ||
      'Anónimo'
    );
  }, [user]);

  // Initial fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(500);
      if (!mounted) return;
      if (error) {
        toast.error('Não foi possível carregar os recados');
      } else {
        setMessages(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('messages-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          const next = payload.new as Message;
          if (prev.some((m) => m.id === next.id)) return prev;
          return [...prev, next];
        });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        const oldId = (payload.old as { id?: string }).id;
        if (!oldId) return;
        setMessages((prev) => prev.filter((m) => m.id !== oldId));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!user) return;
    const parsed = messageSchema.safeParse({ content: draft });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Recado inválido');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      author_name: authorName,
      author_role: role ?? 'neury',
      content: parsed.data.content,
    });
    setSending(false);
    if (error) {
      toast.error('Não foi possível enviar o recado');
      return;
    }
    setDraft('');
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Apagar este recado?');
    if (!ok) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) {
      toast.error('Não foi possível apagar');
    }
  };

  const canDelete = (m: Message) => role === 'admin' || m.user_id === user?.id;

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col h-[calc(100vh-6rem)]">
      <header className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <MessageSquare size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Recados</h1>
          <p className="text-sm text-muted-foreground">Mural partilhado entre administrador e funcionários</p>
        </div>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden bg-card/60 backdrop-blur-xl border-border/60">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={18} /> A carregar…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare size={32} className="mb-2 opacity-40" />
              <p>Ainda não há recados. Sê o/a primeiro/a a escrever!</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === user?.id;
              const isAdminMsg = m.author_role === 'admin';
              return (
                <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                  <ClientAvatar name={m.author_name} size="sm" />
                  <div className={`flex flex-col max-w-[80%] ${mine ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5 px-1">
                      <span className="font-medium text-foreground">{m.author_name}</span>
                      {isAdminMsg && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wide">
                          Admin
                        </span>
                      )}
                      <span>·</span>
                      <span>{relativeTime(m.created_at)}</span>
                    </div>
                    <div
                      className={`relative group rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words border shadow-sm ${
                        mine
                          ? 'bg-primary text-primary-foreground border-primary/40'
                          : isAdminMsg
                          ? 'bg-accent/30 text-foreground border-accent/40'
                          : 'bg-secondary/60 text-foreground border-border/60'
                      }`}
                    >
                      {m.content}
                      {canDelete(m) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className={`absolute -top-2 ${mine ? '-left-2' : '-right-2'} opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-background border border-border text-muted-foreground hover:text-destructive`}
                          aria-label="Apagar recado"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={listEndRef} />
        </div>

        <div className="border-t border-border/60 p-3 bg-background/40 backdrop-blur">
          <div className="flex gap-2 items-end">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escreve um recado… (Enter envia, Shift+Enter quebra linha)"
              className="resize-none min-h-[44px] max-h-32 bg-background/60"
              rows={1}
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || draft.trim().length === 0} size="icon" className="h-11 w-11 shrink-0">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${draft.length >= MAX_LEN ? 'text-destructive' : 'text-muted-foreground'}`}>
              {draft.length}/{MAX_LEN}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Recados;
