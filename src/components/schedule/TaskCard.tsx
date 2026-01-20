import React, { useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Phone, MapPin, Trash2, Check, Pencil, Navigation, GripVertical, Euro, Clock, StickyNote, Shield, User, Banknote } from 'lucide-react';
import ClientAvatar from '@/components/ui/client-avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TaskCardProps {
  task: Task;
  isAdmin: boolean;
  userRole?: string;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, completed: boolean, userRole?: string) => void;
  onTogglePayment?: (id: string, pago: boolean) => void;
  animationDelay?: number;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isAdmin,
  userRole = 'user',
  onDragStart,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePayment,
  animationDelay = 0,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleToggleStatus = () => {
    if (!task.completed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 800);
    }
    onToggleStatus(task.id, task.completed, userRole);
  };

  const handleTogglePayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTogglePayment) {
      onTogglePayment(task.id, task.pago);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, task);
    
    // Create custom drag image
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
    
    requestAnimationFrame(() => {
      document.body.removeChild(dragElement);
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Calculate hours
  const startTime = new Date(`1970-01-01T${task.startTime}`);
  const endTime = new Date(`1970-01-01T${task.endTime}`);
  const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return (
    <div
      draggable={isAdmin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ 
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'backwards'
      }}
      className={`relative group p-3 rounded-xl border-2 transition-all duration-300 text-sm animate-fade-in ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${
        isDragging 
          ? 'opacity-40 scale-95 border-dashed border-primary/50 bg-primary/5 rotate-1' 
          : 'hover:shadow-lg hover:-translate-y-0.5'
      } ${
        task.completed
          ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/40 shadow-success/10'
          : 'bg-gradient-to-br from-card to-card/80 border-border/50 hover:border-primary/40'
      }`}
    >
      {/* Gradient border effect on hover */}
      <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
        ${task.completed ? '' : 'bg-gradient-to-br from-primary/5 via-transparent to-primary/5'}
      `} />

      {/* Drag handle indicator */}
      {isAdmin && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-all duration-300 group-hover:-translate-x-1">
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
      )}

      {/* Completed seal - different style based on who completed */}
      {task.completed && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute -top-1 -right-1 z-10">
                {task.completedByRole === 'admin' ? (
                  <div className="rounded-full p-1.5 shadow-lg animate-scale-in flex items-center gap-0.5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-2 ring-primary/30">
                    <Shield size={10} strokeWidth={3} />
                    <Check size={8} strokeWidth={3} />
                  </div>
                ) : task.completedByRole === 'neury' ? (
                  <div className="rounded-full p-1.5 shadow-lg animate-scale-in flex items-center gap-0.5 bg-gradient-to-br from-success to-success/80 text-success-foreground ring-2 ring-success/30">
                    <User size={10} strokeWidth={3} />
                    <Check size={8} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="rounded-full p-1.5 shadow-lg animate-scale-in bg-gradient-to-br from-success to-success/80 text-success-foreground ring-2 ring-success/30">
                    <Check size={10} strokeWidth={3} />
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

      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${10 + i * 11}%`,
                top: '50%',
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'][i],
                animationDelay: `${i * 0.03}s`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Header: Avatar + Name + Time */}
      <div className="flex justify-between items-start mb-2 gap-2 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`relative ${task.completed ? '' : 'ring-2 ring-offset-1 ring-offset-card ring-primary/20'} rounded-full`}>
            <ClientAvatar name={task.client} size="sm" />
          </div>
          <span className={`font-bold truncate ${task.completed ? 'text-success line-through decoration-2' : 'text-card-foreground'}`}>
            {task.client}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock size={10} className="text-muted-foreground" />
          <span className="text-xs bg-secondary/80 backdrop-blur-sm px-2 py-1 rounded-lg text-muted-foreground font-medium border border-border/50">
            {task.startTime} - {task.endTime}
          </span>
        </div>
      </div>

      {/* Contact info */}
      {task.phone && (
        <a 
          href={`tel:${task.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary truncate flex items-center gap-1.5 mb-1.5 font-medium hover:underline hover:text-primary/80 transition-colors group/phone"
        >
          <Phone size={11} className="group-hover/phone:animate-wiggle" />
          {task.phone}
        </a>
      )}

      {task.address && (
        <button
          onClick={openGoogleMaps}
          className="text-xs text-muted-foreground flex items-start gap-1.5 mb-2 hover:text-primary transition-colors text-left w-full group/address"
        >
          <MapPin size={11} className="shrink-0 mt-0.5 group-hover/address:text-primary transition-colors" />
          <span className="break-words group-hover/address:underline line-clamp-2">{task.address}</span>
          <Navigation size={11} className="shrink-0 mt-0.5 opacity-0 group-hover/address:opacity-100 text-primary transition-all -translate-x-1 group-hover/address:translate-x-0" />
        </button>
      )}

      {/* Footer: Price + Actions */}
      <div className="flex justify-between items-center border-t pt-2 border-dashed border-border/50 mt-1 relative z-10">
        <div className="flex items-center gap-2">
          {/* Price badge - clickable for admin to toggle payment */}
          {isAdmin && onTogglePayment ? (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleTogglePayment}
                    className={`relative overflow-hidden rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                      task.pago ? 'ring-2 ring-primary/50' : ''
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 font-bold text-sm px-2.5 py-1.5 border transition-all ${
                      task.pago 
                        ? 'bg-gradient-to-r from-primary/30 to-primary/20 text-primary border-primary/50' 
                        : 'bg-gradient-to-r from-success/20 to-success/10 text-success border-success/30 hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:border-primary/30'
                    }`}>
                      <Euro size={14} className={task.pago ? 'animate-pulse' : ''} />
                      <span>{task.price}</span>
                      {task.pago && <Check size={12} className="ml-0.5" />}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium">
                  {task.pago ? '✓ Pago - Clique para desmarcar' : 'Clique para marcar como PAGO'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="relative overflow-hidden rounded-lg">
              <div className={`flex items-center gap-1 font-bold text-sm px-2.5 py-1 border ${
                task.pago 
                  ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30' 
                  : 'bg-gradient-to-r from-success/20 to-success/10 text-success border-success/30'
              }`}>
                <Euro size={12} />
                {task.price}
                {task.pago && <Check size={10} className="ml-0.5" />}
              </div>
            </div>
          )}
          
          {/* Hours indicator */}
          <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded font-medium">
            {hours.toFixed(1)}h
          </span>
          {task.notes && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded font-medium cursor-help border border-amber-200 dark:border-amber-800/50">
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
        
        <div className="flex items-center gap-1">
          {/* Notes indicator on mobile */}
          {task.notes && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-full transition-all duration-200 sm:hidden">
                    <StickyNote size={14} className="text-amber-600 dark:text-amber-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] text-xs">
                  <p className="whitespace-pre-wrap">{task.notes}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Map button */}
          {task.address && (
            <button
              onClick={openGoogleMaps}
              className="p-2 hover:bg-primary/10 rounded-full transition-all duration-200 hover:scale-110"
              title="Navegar no Google Maps"
            >
              <Navigation size={14} className="text-primary" />
            </button>
          )}
          
          {/* Complete button - visible for all users */}
          <button
            onClick={handleToggleStatus}
            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
              task.completed
                ? 'bg-success/20 hover:bg-success/30 text-success'
                : 'bg-muted hover:bg-success/10 text-muted-foreground hover:text-success border border-border/50'
            }`}
            title={task.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
          >
            <Check size={14} className={task.completed ? 'animate-success-pop' : ''} />
          </button>
          
          {/* Edit and Delete - reveal on hover */}
          {isAdmin && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <button
                onClick={() => onEdit(task)}
                className="p-2 hover:bg-primary/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Editar"
              >
                <Pencil size={14} className="text-primary" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 hover:bg-destructive/10 rounded-full transition-all duration-200 hover:scale-110"
                title="Eliminar"
              >
                <Trash2 size={14} className="text-destructive" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
