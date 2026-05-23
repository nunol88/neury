import React, { useEffect, useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Clock, MapPin, Navigation, Phone, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface Props {
  tasks: Task[];
  onArrived?: (id: string) => void;
  onLeft?: (id: string) => void;
}

const fmtTime = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const NextServiceHero: React.FC<Props> = ({ tasks, onArrived, onLeft }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(i);
  }, []);

  // Pick the next/current pending task by start time
  const pending = tasks
    .filter(t => !t.completed)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Prefer ones not yet ended
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const upcoming = pending.find(t => {
    const [h, m] = t.endTime.split(':').map(Number);
    return h * 60 + m >= nowMin;
  }) || pending[0];

  if (!upcoming) return null;

  const arrived = !!upcoming.arrivedAt;
  const mapsHref = upcoming.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(upcoming.address)}`
    : null;

  const [sh, sm] = upcoming.startTime.split(':').map(Number);
  const minutesUntil = sh * 60 + sm - nowMin;
  const status = minutesUntil > 0
    ? `Começa em ${minutesUntil < 60 ? `${minutesUntil} min` : `${Math.floor(minutesUntil / 60)}h${String(minutesUntil % 60).padStart(2, '0')}`}`
    : arrived ? 'A decorrer' : 'Já começou';

  return (
    <div className="glass-card rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 mb-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Próximo serviço
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground bg-card/70 px-2 py-0.5 rounded-full">
          {status}
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-extrabold text-card-foreground truncate">
        {upcoming.client}
      </h2>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
        <Clock size={14} className="text-primary" />
        <span className="font-semibold">{upcoming.startTime} – {upcoming.endTime}</span>
        {arrived && (
          <span className="ml-auto text-[11px] inline-flex items-center gap-1 text-success font-semibold">
            <CheckCircle2 size={12} /> Cheguei às {fmtTime(upcoming.arrivedAt)}
          </span>
        )}
      </div>

      {upcoming.address && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1.5">
          <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
          <span className="break-words">{upcoming.address}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3">
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            <Navigation size={16} />
            Maps
          </a>
        )}
        {upcoming.phone && (
          <a
            href={`tel:${upcoming.phone}`}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-success text-success-foreground font-bold text-sm shadow-md hover:bg-success/90 active:scale-[0.98] transition-all ${
              !mapsHref ? 'col-span-2' : ''
            }`}
          >
            <Phone size={16} />
            Ligar
          </a>
        )}
        {!mapsHref && !upcoming.phone && null}
      </div>

      {(onArrived || onLeft) && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            type="button"
            disabled={arrived || !onArrived}
            onClick={() => onArrived?.(upcoming.id)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
              arrived
                ? 'bg-success/15 text-success cursor-default'
                : 'bg-card border-2 border-success/40 text-success hover:bg-success/10'
            }`}
          >
            <LogIn size={14} />
            {arrived ? `Cheguei ${fmtTime(upcoming.arrivedAt)}` : 'Cheguei'}
          </button>
          <button
            type="button"
            disabled={!onLeft}
            onClick={() => onLeft?.(upcoming.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold bg-card border-2 border-primary/40 text-primary hover:bg-primary/10 active:scale-[0.98] transition-all"
          >
            <LogOut size={14} />
            Saí & concluído
          </button>
        </div>
      )}
    </div>
  );
};

export default NextServiceHero;
