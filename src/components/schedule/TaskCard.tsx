import React, { useState } from 'react';
import { Task } from '@/hooks/useAgendamentos';
import { Phone, MapPin, Trash2, Check, Pencil, Navigation, GripVertical } from 'lucide-react';
import ClientAvatar from '@/components/ui/client-avatar';

interface TaskCardProps {
  task: Task;
  isAdmin: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, completed: boolean) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isAdmin,
  onDragStart,
  onEdit,
  onDelete,
  onToggleStatus,
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
    onToggleStatus(task.id, task.completed);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, task);
    
    // Create custom drag image
    const dragElement = e.currentTarget.cloneNode(true) as HTMLElement;
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-1000px';
    dragElement.style.width = `${e.currentTarget.clientWidth}px`;
    dragElement.style.opacity = '0.9';
    dragElement.style.transform = 'rotate(2deg) scale(1.02)';
    dragElement.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
    dragElement.style.borderRadius = '12px';
    dragElement.style.background = 'hsl(var(--card))';
    document.body.appendChild(dragElement);
    e.dataTransfer.setDragImage(dragElement, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    
    // Clean up after drag starts
    requestAnimationFrame(() => {
      document.body.removeChild(dragElement);
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      draggable={isAdmin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative group p-2 rounded-lg border transition-all text-sm ${
        isAdmin ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${
        isDragging 
          ? 'opacity-40 scale-95 border-dashed border-primary/50 bg-primary/5' 
          : 'hover-lift'
      } ${
        task.completed
          ? 'bg-success/10 border-success/30'
          : 'bg-card border-border hover:border-primary/50'
      }`}
    >
      {/* Drag handle indicator */}
      {isAdmin && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity">
          <GripVertical size={14} className="text-muted-foreground" />
        </div>
      )}

      {/* Confetti animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="confetti-particle"
              style={{
                left: `${20 + i * 12}%`,
                top: '50%',
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][i],
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}
      
      <div className="flex justify-between items-start mb-1 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ClientAvatar name={task.client} size="sm" />
          <span className={`font-bold truncate ${task.completed ? 'text-success line-through' : 'text-card-foreground'}`}>
            {task.client}
          </span>
        </div>
        <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap shrink-0">
          {task.startTime} - {task.endTime}
        </span>
      </div>

      {task.phone && (
        <a 
          href={`tel:${task.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary truncate flex items-center gap-1 mb-1 font-medium hover:underline"
        >
          <Phone size={10} />
          {task.phone}
        </a>
      )}

      {task.address && (
        <button
          onClick={openGoogleMaps}
          className="text-xs text-muted-foreground flex items-start gap-1 mb-1 hover:text-primary transition-colors text-left w-full group/address"
        >
          <MapPin size={10} className="shrink-0 mt-0.5 group-hover/address:text-primary" />
          <span className="break-words group-hover/address:underline">{task.address}</span>
          <Navigation size={10} className="shrink-0 mt-0.5 opacity-0 group-hover/address:opacity-100 text-primary transition-opacity" />
        </button>
      )}

      <div className="flex justify-between items-center border-t pt-1.5 border-dashed border-border mt-1">
        <div className="text-success font-bold text-xs flex items-center gap-0.5">
          €{task.price}
        </div>
        <div className="flex items-center gap-1">
          {/* Map button - always visible if address exists */}
          {task.address && (
            <button
              onClick={openGoogleMaps}
              className="p-1.5 hover:bg-primary/10 rounded-full transition-all hover:scale-110 hover-wiggle"
              title="Navegar no Google Maps"
            >
              <Navigation size={12} className="text-primary" />
            </button>
          )}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 hover:bg-primary/10 rounded-full transition-all hover:scale-110"
                title="Editar"
              >
                <Pencil size={12} className="text-primary" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-1.5 hover:bg-destructive/10 rounded-full transition-all hover:scale-110"
                title="Eliminar"
              >
                <Trash2 size={12} className="text-destructive" />
              </button>
              <button
                onClick={handleToggleStatus}
                className={`p-1.5 rounded-full transition-all hover:scale-110 ${
                  task.completed
                    ? 'bg-success/20 hover:bg-success/30 text-success'
                    : 'hover:bg-success/10 text-muted-foreground hover:text-success'
                }`}
                title={task.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
              >
                <Check size={12} className={task.completed ? 'animate-success-pop' : ''} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
