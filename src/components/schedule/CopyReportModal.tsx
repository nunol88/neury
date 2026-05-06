import React from 'react';
import { AlertTriangle, ArrowRight, Calendar } from 'lucide-react';

export interface Relocation {
  client: string;
  from: string; // YYYY-MM-DD original (preferred)
  to: string;   // YYYY-MM-DD new
  reason: string;
}

export interface OverloadedDay {
  date: string;
  count: number;
  clients: string[];
}

interface CopyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  overloadedDays: OverloadedDay[];
  relocations: Relocation[];
  totalCopied: number;
}

const formatDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' });
};

const CopyReportModal: React.FC<CopyReportModalProps> = ({
  isOpen,
  onClose,
  overloadedDays,
  relocations,
  totalCopied,
}) => {
  if (!isOpen) return null;

  const hasIssues = overloadedDays.length > 0 || relocations.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border shrink-0 flex items-center gap-3">
          {hasIssues ? (
            <AlertTriangle className="text-warning" size={22} />
          ) : (
            <Calendar className="text-primary" size={22} />
          )}
          <div>
            <h2 className="text-lg font-bold">Relatório da cópia</h2>
            <p className="text-xs text-muted-foreground">
              {totalCopied} agendamento{totalCopied !== 1 ? 's' : ''} criado{totalCopied !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {!hasIssues && (
            <div className="text-sm text-muted-foreground text-center py-6">
              Nenhum dia com sobrecarga. Tudo distribuído com sucesso. ✅
            </div>
          )}

          {overloadedDays.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle size={14} className="text-warning" />
                Dias com sobrecarga ({overloadedDays.length})
              </h3>
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
            </section>
          )}

          {relocations.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <ArrowRight size={14} className="text-primary" />
                Relocalizações automáticas ({relocations.length})
              </h3>
              <ul className="space-y-2">
                {relocations.map((r, i) => (
                  <li
                    key={i}
                    className="bg-muted/50 border border-border rounded-lg p-3 text-xs"
                  >
                    <div className="font-medium mb-1">{r.client}</div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="line-through">{formatDate(r.from)}</span>
                      <ArrowRight size={12} />
                      <span className="text-foreground font-medium">{formatDate(r.to)}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 italic">{r.reason}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyReportModal;
