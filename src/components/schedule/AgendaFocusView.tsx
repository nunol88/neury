import React, { useMemo, useState } from 'react';
import { Task, useAgendamentos } from '@/hooks/useAgendamentos';
import { useExtras } from '@/hooks/useExtras';
import {
  Phone, MapPin, MessageCircle, Pencil, Check, Clock, Euro,
  Trash2, StickyNote, ChevronRight, CalendarDays, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildServiceConfirmationMessage, openWhatsApp } from '@/utils/whatsappMessages';
import WhatsAppLangButton from '@/components/whatsapp/WhatsAppLangButton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface Props {
  view: 'hoje' | 'semana';
  tasks: Task[]; // all tasks flattened
  searchQuery: string;
  statusFilter: StatusFilter;
  onEditTask: (t: Task) => void;
  onNewTask: (defaultDate?: string) => void;
  role: string;
}

export type StatusFilter = 'todas' | 'pendentes' | 'concluidas' | 'pagas' | 'porpagar';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dateISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const humanDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
};

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
};

const hoursBetween = (s: string, e: string) => {
  const [sh, sm] = s.split(':').map(Number);
  const [eh, em] = e.split(':').map(Number);
  return (eh * 60 + em - sh * 60 - sm) / 60;
};

const StatusBadge: React.FC<{ task: Task }> = ({ task }) => {
  if (task.completed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
        <Check size={11} /> Concluída
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
      <Clock size={11} /> Pendente
    </span>
  );
};

const TaskDetailCard: React.FC<{
  task: Task;
  onEdit: () => void;
  onToggleStatus: () => void;
  onTogglePayment: () => void;
  onDelete: () => void;
  role: string;
}> = ({ task, onEdit, onToggleStatus, onTogglePayment, onDelete, role }) => {
  const duration = hoursBetween(task.startTime, task.endTime);
  const mapsHref = task.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}` : null;

  return (
    <article className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex flex-col items-center justify-center bg-primary/10 text-primary rounded-xl w-14 h-14">
            <span className="text-lg font-bold leading-none">{task.startTime}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{task.endTime}</span>
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-card-foreground truncate">{task.client}</h3>
            <p className="text-xs text-muted-foreground">
              Limpeza · {duration.toFixed(1)}h
            </p>
          </div>
        </div>
        <StatusBadge task={task} />
      </header>

      {task.address && (
        <a
          href={mapsHref!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-1.5 text-sm text-muted-foreground hover:text-primary mb-1.5 min-h-[24px]"
        >
          <MapPin size={14} className="shrink-0 mt-0.5" />
          <span className="break-words">{task.address}</span>
        </a>
      )}

      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          {task.price && parseFloat(task.price) > 0 && (
            <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-lg border ${task.pago ? 'bg-primary/10 text-primary border-primary/30' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'}`}>
              <Euro size={12} /> {parseFloat(task.price).toFixed(2)}
              {task.pago && <Check size={11} />}
            </span>
          )}
          {task.notes && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg" title={task.notes}>
              <StickyNote size={11} /> Notas
            </span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {task.phone && (
          <a
            href={`tel:${task.phone}`}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground"
          >
            <Phone size={15} /> <span className="hidden sm:inline">Ligar</span>
          </a>
        )}
        {task.phone && (
          <WhatsAppLangButton
            prefKey={task.client}
            getMessage={(lang) => buildServiceConfirmationMessage(task.client, task.date, task.startTime, task.endTime, lang)}
            onPick={(msg) => openWhatsApp(task.phone, msg)}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300"
            title="WhatsApp"
            ariaLabel="WhatsApp"
          >
            <MessageCircle size={15} /> <span className="hidden sm:inline">WhatsApp</span>
          </WhatsAppLangButton>
        )}
        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300"
          >
            <MapPin size={15} /> <span className="hidden sm:inline">Maps</span>
          </a>
        )}
        <button
          onClick={onEdit}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground"
        >
          <Pencil size={15} /> <span className="hidden sm:inline">Editar</span>
        </button>
        <button
          onClick={onToggleStatus}
          className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3 rounded-lg ${task.completed ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25' : 'bg-emerald-500/90 text-white hover:bg-emerald-600'}`}
        >
          <Check size={15} /> {task.completed ? 'Reabrir' : 'Concluir'}
        </button>
        {parseFloat(task.price) > 0 && (
          <button
            onClick={onTogglePayment}
            className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 rounded-lg ${task.pago ? 'bg-primary/15 text-primary hover:bg-primary/25' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
          >
            <Euro size={15} /> {task.pago ? 'Pago ✓' : 'Marcar pago'}
          </button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-sm font-medium px-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive">
              <Trash2 size={15} /> <span className="hidden sm:inline">Apagar</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar marcação?</AlertDialogTitle>
              <AlertDialogDescription>
                Vais eliminar a limpeza de <strong>{task.client}</strong> em {shortDate(task.date)} às {task.startTime}. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Apagar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  );
};

const AgendaFocusView: React.FC<Props> = ({ view, tasks, searchQuery, statusFilter, onEditTask, onNewTask, role }) => {
  const { toggleTaskStatus, togglePaymentStatus, deleteTask } = useAgendamentos();

  const today = todayISO();
  const weekEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return dateISO(d);
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tasks.filter(t => {
      // range filter
      if (view === 'hoje') {
        if (t.date !== today) return false;
      } else {
        if (t.date < today || t.date > weekEnd) return false;
      }
      // status filter
      if (statusFilter === 'pendentes' && t.completed) return false;
      if (statusFilter === 'concluidas' && !t.completed) return false;
      if (statusFilter === 'pagas' && !t.pago) return false;
      if (statusFilter === 'porpagar' && (t.pago || !t.completed)) return false;
      // search
      if (q) {
        const hay = `${t.client} ${t.address}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [tasks, view, searchQuery, statusFilter, today, weekEnd]);

  const grouped = useMemo(() => {
    const g = new Map<string, Task[]>();
    filtered.forEach(t => {
      const arr = g.get(t.date) || [];
      arr.push(t);
      g.set(t.date, arr);
    });
    return Array.from(g.entries());
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
          <CalendarDays size={28} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {view === 'hoje' ? 'Sem limpezas hoje' : 'Sem limpezas esta semana'}
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          {view === 'hoje' ? 'Aproveita para descansar ou marcar novos serviços.' : 'Cria uma nova marcação para começar.'}
        </p>
        <Button onClick={() => onNewTask(view === 'hoje' ? today : undefined)} className="min-h-[44px]">
          + Nova limpeza
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([date, dayTasks]) => (
        <section key={date}>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              {date === today ? 'Hoje · ' : ''}{humanDate(date)}
            </h2>
            <span className="text-xs text-muted-foreground">
              {dayTasks.length} serviço{dayTasks.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {dayTasks.map(t => (
              <TaskDetailCard
                key={t.id}
                task={t}
                onEdit={() => onEditTask(t)}
                onToggleStatus={() => toggleTaskStatus(t.id, t.completed, role)}
                onTogglePayment={() => togglePaymentStatus(t.id, t.pago)}
                onDelete={() => deleteTask(t.id)}
                role={role}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default AgendaFocusView;
