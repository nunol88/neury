import React, { useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Phone, MapPin, Trash2, Check, Pencil, Navigation, GripVertical, Euro, Clock, StickyNote, Shield, User, Copy } from 'lucide-react';
import ClientAvatar from '@/components/ui/client-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskCardProps {
  task: Task;
  isAdmin: boolean;
  canEdit?: boolean;
  userRole?: string;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, completed: boolean, userRole?: string) => void;
  onTogglePayment?: (id: string, pago: boolean) => void;
  onCopy?: (task: Task) => void;
  animationDelay?: number;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isAdmin,
  canEdit = true,
  userRole = 'user',
  onDragStart,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePayment,
  onCopy,
  animationDelay = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleStatus = () => {
    onToggleStatus(task.id, task.completed, userRole);
  };

  const handleTogglePayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePayment) onTogglePayment(task.id, task.pago);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, task);
    const dragElement = e.currentTarget.cloneNode(true) as HTMLElement;
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-1000px';
    dragElement.style.width = `${e.currentTarget.clientWidth}px`;
    dragElement.style.opacity = '0.95';
    dragElement.style.transform = 'rotate(2deg) scale(1.05)';
    dragElement.style.boxShadow = '0 20px 60px rgba(0,0,0,0.4)';
    dragElement.style.borderRadius = '16px';
    dragElement.style.background = 'hsl(var(--card))';
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    requestAnimationFrame(() => document.body.removeChild(dragElement));
  };

  const handleDragEnd = () => setIsDragging(false);

  const startTime = new Date(`1970-01-01T${task.startTime}`);
  const endTime = new Date(`1970-01-01T${task.endTime}`);
  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  const NEURY_RATE = 7;
  const displayPrice = isAdmin ? task.price : (hours * NEURY_RATE).toFixed(2);

  return (
    <div
      draggable={isAdmin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'backwards' }}
      className={`relative group p-3.5 rounded-xl border transition-all duration-200 text-sm animate-fade-in ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${
        isDragging 
          ? 'opacity-40 scale-95 border-dashed border-primary/50 bg-primary/5' 
          : 'hover:shadow-md'
      } ${
        task.completed
          ? 'bg-success/5 border-success/30'
          : 'bg-card border-border/60 hover:border-primary/30'
      }`}
    >
      {/* Drag handle */}
      {isAdmin && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
      )}

      {/* Completed seal */}
      {task.completed && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-1 -right-1 z-10">
                {task.completedByRole === 'admin' ? (
                  <div className="rounded-full p-1 shadow-sm flex items-center gap-0.5 bg-primary text-primary-foreground">
                    <Shield size={9} strokeWidth={3} />
                    <Check size={7} strokeWidth={3} />
                  </div>
                ) : task.completedByRole === 'neury' ? (
                  <div className="rounded-full p-1 shadow-sm flex items-center gap-0.5 bg-success text-success-foreground">
                    <User size={9} strokeWidth={3} />
                    <Check size={7} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="rounded-full p-1 shadow-sm bg-success text-success-foreground">
                    <Check size={9} strokeWidth={3} />
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              {task.completedByRole === 'admin' 
                ? 'Confirmado pelo Admin' 
                : task.completedByRole === 'neury'
                  ? 'Marcado pela Neury'
                  : 'Concluído'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Header: Avatar + Name + Time */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <ClientAvatar name={task.client} size="sm" />
          <span className={`font-bold truncate ${task.completed ? 'text-success line-through decoration-1' : 'text-card-foreground'}`}>
            {task.client}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock size={10} className="text-muted-foreground" />
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-md text-muted-foreground font-medium">
            {task.startTime} - {task.endTime}
          </span>
        </div>
      </div>

      {/* Contact info */}
      {task.phone && (
        <a 
          href={`tel:${task.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary truncate flex items-center gap-1.5 mb-1.5 font-medium hover:underline transition-colors"
        >
          <Phone size={11} />
          {task.phone}
        </a>
      )}

      {task.address && (
        <button
          onClick={openGoogleMaps}
          className="text-xs text-muted-foreground flex items-start gap-1.5 mb-2 hover:text-primary transition-colors text-left w-full group/address"
        >
          <MapPin size={11} className="shrink-0 mt-0.5" />
          <span className="break-words group-hover/address:underline line-clamp-2">{task.address}</span>
          <Navigation size={11} className="shrink-0 mt-0.5 opacity-0 group-hover/address:opacity-100 text-primary transition-opacity" />
        </button>
      )}

      {/* Footer: Price + Actions */}
      <div className="flex justify-between items-center border-t pt-2 border-border/40 mt-1">
        <div className="flex items-center gap-2 min-w-0">
          {/* Price badge */}
          {isAdmin && onTogglePayment ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleTogglePayment}
                    className="transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
                  >
                    <div className={`flex items-center gap-1 font-bold text-sm px-2 py-1 rounded-lg border transition-colors ${
                      task.pago 
                        ? 'bg-primary/10 text-primary border-primary/30' 
                        : 'bg-success/10 text-success border-success/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                    }`}>
                      <Euro size={13} />
                      <span>{displayPrice}</span>
                      {task.pago && <Check size={11} className="ml-0.5" />}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {task.pago ? '✓ Pago — clique para desmarcar' : 'Clique para marcar como pago'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className={`flex items-center gap-1 font-bold text-sm px-2 py-1 rounded-lg border shrink-0 ${
              task.pago 
                ? 'bg-primary/10 text-primary border-primary/30' 
                : 'bg-success/10 text-success border-success/30'
            }`}>
              <Euro size={12} />
              {displayPrice}
              {task.pago && <Check size={10} className="ml-0.5" />}
            </div>
          )}
          
          {/* Hours */}
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-medium shrink-0">
            {hours.toFixed(1)}h
          </span>
          
          {/* Notes indicator */}
          {task.notes && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-1.5 py-0.5 rounded font-medium cursor-help border border-warning/20 shrink-0">
                    <StickyNote size={10} />
                    <span className="hidden sm:inline">Notas</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-xs">
                  <p className="whitespace-pre-wrap">{task.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Notes on mobile */}
          {task.notes && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-1.5 hover:bg-warning/10 rounded-full transition-colors sm:hidden">
                    <StickyNote size={13} className="text-warning" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-xs">
                  <p className="whitespace-pre-wrap">{task.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {(isAdmin || canEdit) && (
            <button
              onClick={handleToggleStatus}
              className={`p-1.5 rounded-full transition-colors ${
                task.completed
                  ? 'bg-success/15 hover:bg-success/25 text-success'
                  : 'bg-muted hover:bg-success/10 text-muted-foreground hover:text-success'
              }`}
              title={task.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
            >
              <Check size={13} />
            </button>
          )}
          
          {isAdmin && (
            <>
              {onCopy && (
                <button onClick={() => onCopy(task)} className="p-1.5 hover:bg-success/10 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Copiar para outro dia">
                  <Copy size={13} className="text-success" />
                </button>
              )}
              <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Editar">
                <Pencil size={13} className="text-primary" />
              </button>
              <button onClick={() => onDelete(task.id)} className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100" title="Eliminar">
                <Trash2 size={13} className="text-destructive" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
