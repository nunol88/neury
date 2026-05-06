import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { OverloadedDay } from './CopyReportModal';

interface CopyConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  overloadedDays: OverloadedDay[];
  monthLabel: string;
}

const formatDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
};

const CopyConflictDialog: React.FC<CopyConflictDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  overloadedDays,
  monthLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border shrink-0 flex items-center gap-3">
          <AlertTriangle className="text-warning shrink-0" size={22} />
          <div>
            <h2 className="text-lg font-bold">Conflitos detetados</h2>
            <p className="text-xs text-muted-foreground">
              Cópia para {monthLabel}
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Esta cópia vai criar {overloadedDays.length} dia
            {overloadedDays.length !== 1 ? 's' : ''} com 3 ou mais fixos:
          </p>
          <ul className="space-y-2">
            {overloadedDays.map(d => (
              <li
                key={d.date}
                className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{formatDate(d.date)}</span>
                  <span className="text-warning font-bold">{d.count} fixos</span>
                </div>
                <div className="text-muted-foreground">{d.clients.join(', ')}</div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground italic mt-2">
            A app vai tentar redistribuir quinzenais automaticamente. Se mesmo assim sobrar conflito, vais ter de mover manualmente.
          </p>
        </div>

        <div className="px-6 py-3 border-t border-border shrink-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Copiar mesmo assim
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyConflictDialog;
