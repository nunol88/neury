import React, { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { MessageSquare, Send, Trash2, Loader2, Mic, Square, X, Play, Pause } from 'lucide-react';
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
  content: string | null;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
}

const MAX_LEN = 500;
const MAX_AUDIO_SECONDS = 120;

const messageSchema = z.object({
  content: z.string().trim().max(MAX_LEN, `Máx. ${MAX_LEN} caracteres`).optional(),
});

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Audio player component
const AudioPlayer: React.FC<{ url: string; duration: number | null; mine: boolean }> = ({ url, duration, mine }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().catch(() => toast.error('Não foi possível reproduzir'));
    }
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <button
        type="button"
        onClick={toggle}
        className={`p-2 rounded-full ${mine ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30' : 'bg-foreground/10 hover:bg-foreground/20'} transition-colors`}
        aria-label={playing ? 'Pausar' : 'Reproduzir'}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className={`h-1 rounded-full ${mine ? 'bg-primary-foreground/20' : 'bg-foreground/10'} overflow-hidden`}>
          <div
            className={`h-full ${mine ? 'bg-primary-foreground' : 'bg-foreground/60'} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] opacity-70 tabular-nums">
          {formatDuration(current)} / {formatDuration(duration ?? 0)}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCurrent(0);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setCurrent(a.currentTime);
          if (a.duration && isFinite(a.duration)) {
            setProgress((a.currentTime / a.duration) * 100);
          }
        }}
      />
    </div>
  );
};

const Recados: React.FC = () => {
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [pendingAudio, setPendingAudio] = useState<{ blob: Blob; duration: number; url: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const listEndRef = useRef<HTMLDivElement>(null);

  const authorName = useMemo(() => {
    const meta = user?.user_metadata as { name?: string; full_name?: string } | undefined;
    return meta?.name || meta?.full_name || user?.email?.split('@')[0] || 'Anónimo';
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(500);
      if (!mounted) return;
      if (error) toast.error('Não foi possível carregar os recados');
      else setMessages((data as Message[]) ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  // Cleanup recording resources on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (pendingAudio?.url) URL.revokeObjectURL(pendingAudio.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    if (pendingAudio) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recordChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(recordChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const duration = (Date.now() - recordStartRef.current) / 1000;
        const url = URL.createObjectURL(blob);
        setPendingAudio({ blob, duration, url });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current = mr;
      recordStartRef.current = Date.now();
      setRecordSeconds(0);
      mr.start();
      setRecording(true);
      recordTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - recordStartRef.current) / 1000;
        setRecordSeconds(elapsed);
        if (elapsed >= MAX_AUDIO_SECONDS) stopRecording();
      }, 200);
    } catch (err) {
      console.error(err);
      toast.error('Sem acesso ao microfone');
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
    setRecording(false);
  };

  const cancelRecording = () => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = null as unknown as () => void;
      mr.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recordChunksRef.current = [];
    setRecording(false);
    setRecordSeconds(0);
  };

  const discardPending = () => {
    if (pendingAudio?.url) URL.revokeObjectURL(pendingAudio.url);
    setPendingAudio(null);
  };

  const handleSend = async () => {
    if (!user) return;
    const trimmed = draft.trim();
    if (!trimmed && !pendingAudio) {
      toast.error('Escreve um recado ou grava um áudio');
      return;
    }
    const parsed = messageSchema.safeParse({ content: trimmed || undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Recado inválido');
      return;
    }

    setSending(true);
    try {
      let audio_url: string | null = null;
      let audio_duration: number | null = null;

      if (pendingAudio) {
        const ext = pendingAudio.blob.type.includes('mp4') ? 'm4a' : 'webm';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('recados-audio')
          .upload(path, pendingAudio.blob, { contentType: pendingAudio.blob.type, upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('recados-audio').getPublicUrl(path);
        audio_url = pub.publicUrl;
        audio_duration = pendingAudio.duration;
      }

      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        author_name: authorName,
        author_role: role ?? 'neury',
        content: trimmed || null,
        audio_url,
        audio_duration,
      });
      if (error) throw error;

      setDraft('');
      discardPending();
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível enviar o recado');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (m: Message) => {
    const ok = window.confirm('Apagar este recado?');
    if (!ok) return;
    // Try delete storage object if present
    if (m.audio_url) {
      const marker = '/recados-audio/';
      const idx = m.audio_url.indexOf(marker);
      if (idx >= 0) {
        const path = m.audio_url.substring(idx + marker.length);
        await supabase.storage.from('recados-audio').remove([path]);
      }
    }
    const { error } = await supabase.from('messages').delete().eq('id', m.id);
    if (error) toast.error('Não foi possível apagar');
  };

  const canDelete = (m: Message) => role === 'admin' || m.user_id === user?.id;

  const canSend = !sending && (draft.trim().length > 0 || !!pendingAudio);

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
                      className={`relative group rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words border shadow-sm space-y-2 ${
                        mine
                          ? 'bg-primary text-primary-foreground border-primary/40'
                          : isAdminMsg
                          ? 'bg-accent/30 text-foreground border-accent/40'
                          : 'bg-secondary/60 text-foreground border-border/60'
                      }`}
                    >
                      {m.content && <div>{m.content}</div>}
                      {m.audio_url && (
                        <AudioPlayer url={m.audio_url} duration={m.audio_duration} mine={mine} />
                      )}
                      {canDelete(m) && (
                        <button
                          type="button"
                          onClick={() => handleDelete(m)}
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

        <div className="border-t border-border/60 p-3 bg-background/40 backdrop-blur space-y-2">
          {/* Pending audio preview */}
          {pendingAudio && !recording && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/60 border border-border/60">
              <audio src={pendingAudio.url} controls className="flex-1 h-9" />
              <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(pendingAudio.duration)}</span>
              <Button type="button" size="icon" variant="ghost" onClick={discardPending} aria-label="Descartar áudio">
                <X size={16} />
              </Button>
            </div>
          )}

          {/* Recording indicator */}
          {recording && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm text-destructive font-medium">A gravar… {formatDuration(recordSeconds)}</span>
              <span className="text-xs text-muted-foreground ml-auto">máx. {MAX_AUDIO_SECONDS}s</span>
              <Button type="button" size="sm" variant="ghost" onClick={cancelRecording}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={stopRecording}>
                <Square size={14} className="mr-1" /> Parar
              </Button>
            </div>
          )}

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
              placeholder={pendingAudio ? 'Adiciona uma legenda (opcional)…' : 'Escreve um recado ou grava um áudio…'}
              className="resize-none min-h-[44px] max-h-32 bg-background/60"
              rows={1}
              disabled={sending || recording}
            />
            {!recording && !pendingAudio && (
              <Button
                type="button"
                onClick={startRecording}
                size="icon"
                variant="outline"
                className="h-11 w-11 shrink-0"
                aria-label="Gravar áudio"
                disabled={sending}
              >
                <Mic size={18} />
              </Button>
            )}
            <Button onClick={handleSend} disabled={!canSend} size="icon" className="h-11 w-11 shrink-0">
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </div>
          <div className="flex justify-end">
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
