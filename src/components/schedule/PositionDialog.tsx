import React from 'react';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { Task } from '@/hooks/useAgendamentos';

interface PositionDialogProps {
  taskToMove: Task;
  existingTasks: Task[];
  onPositionChoice: (position: 'above' | 'below') => void;
  onCancel: () => void;
}

const PositionDialog: React.FC<PositionDialogProps> = ({
  taskToMove,
  existingTasks,
  onPositionChoice,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary to-primary/80 text-white">
          <h2 className="text-xl font-bold">Escolher Posição</h2>
          <p className="text-white/80 text-sm mt-1">
            Onde quer colocar <strong>{taskToMove.client}</strong>?
          </p>
        </div>
        
        <div className="p-6 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Este dia já tem {existingTasks.length} agendamento(s). 
            Escolha se quer colocar antes ou depois:
          </p>
          
          {/* Existing tasks preview */}
          <div className="bg-secondary rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Agendamentos existentes:</p>
            {existingTasks.map((task, idx) => (
              <div key={idx} className="text-sm text-card-foreground flex justify-between">
                <span>{task.client}</span>
                <span className="text-muted-foreground">{task.startTime} - {task.endTime}</span>
              </div>
            ))}
          </div>

          {/* Position buttons */}
          <button
            onClick={() => onPositionChoice('above')}
            className="w-full p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowUp size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-card-foreground">Colocar Antes</p>
              <p className="text-sm text-muted-foreground">1 hora antes do primeiro agendamento</p>
            </div>
          </button>

          <button
            onClick={() => onPositionChoice('below')}
            className="w-full p-4 border-2 border-border rounded-xl hover:border-success hover:bg-success/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <ArrowDown size={24} className="text-success" />
            </div>
            <div className="text-left">
              <p className="font-bold text-card-foreground">Colocar Depois</p>
              <p className="text-sm text-muted-foreground">1 hora depois do último agendamento</p>
            </div>
          </button>
        </div>

        <div className="p-4 border-t border-border bg-secondary">
          <button
            onClick={onCancel}
            className="w-full py-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PositionDialog;
