import React, { useState } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Task } from '@/hooks/useAgendamentos';

interface Props {
  overdueTasks: Task[];
  onToggleStatus: (id: string, completed: boolean, userRole?: string) => void;
  userRole?: string;
}

const formatDateLabel = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff > 1 && diff < 7) return `Há ${diff} dias`;
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
};

const PendingCompletionBanner: React.FC<Props> = ({ overdueTasks, onToggleStatus, userRole }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || overdueTasks.length === 0) return null;

  const visible = expanded ? overdueTasks : overdueTasks.slice(0, 3);

  const markAll = () => {
    overdueTasks.forEach(t => onToggleStatus(t.id, false, userRole));
  };

  return (
    <div className="glass-card rounded-xl border border-destructive/40 bg-destructive/5 p-3 sm:p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center">
          <AlertCircle size={18} className="text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-destructive">
                {overdueTasks.length === 1
                  ? '1 serviço por marcar como concluído'
                  : `${overdueTasks.length} serviços por marcar como concluídos`}
              </h3>
              <p className="text-xs text-muted-foreground">
                Já passaram da hora de fim e continuam pendentes.
              </p>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors shrink-0"
              title="Dispensar até voltar a abrir a página"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>

          <ul className="mt-3 space-y-1.5">
            {visible.map(t => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 bg-card/60 border border-border/50 rounded-lg px-2.5 py-1.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-card-foreground">{t.client}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDateLabel(t.date)} • {t.startTime}–{t.endTime}
                  </p>
                </div>
                <button
                  onClick={() => onToggleStatus(t.id, false, userRole)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-success/15 hover:bg-success/25 text-success text-xs font-semibold transition-colors"
                  title="Marcar como concluído"
                >
                  <Check size={12} strokeWidth={3} />
                  Concluído
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
            {overdueTasks.length > 3 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Mostrar menos' : `Mostrar todos (${overdueTasks.length})`}
              </button>
            )}
            <button
              onClick={markAll}
              className="ml-auto text-xs font-bold px-3 py-1.5 rounded-md bg-success text-success-foreground hover:bg-success/90 transition-colors inline-flex items-center gap-1.5"
            >
              <Check size={12} strokeWidth={3} />
              Marcar todos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingCompletionBanner;
