import React from 'react';
import { Calendar, Repeat, CalendarRange, Copy, X, Loader2 } from 'lucide-react';
import { getThemeGradient, MonthConfig } from '@/utils/monthConfig';

interface TypeSelectorModalProps {
  activeConfig: MonthConfig;
  previousMonthLabel: string | null;
  canCopyFromPrevious: boolean;
  copyingFromPrevious: boolean;
  onSelectSingle: () => void;
  onSelectFixed: () => void;
  onSelectBiWeekly: () => void;
  onCopyFromPrevious: () => void;
  onClose: () => void;
}

const TypeSelectorModal: React.FC<TypeSelectorModalProps> = ({
  activeConfig,
  previousMonthLabel,
  canCopyFromPrevious,
  copyingFromPrevious,
  onSelectSingle,
  onSelectFixed,
  onSelectBiWeekly,
  onCopyFromPrevious,
  onClose,
}) => {
  const themeGradient = getThemeGradient(activeConfig.color);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        <div className={`bg-gradient-to-r ${themeGradient} text-white p-5 flex items-center justify-between`}>
          <h3 className="font-bold text-lg">Tipo de Agendamento</h3>
          <button 
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <button
            onClick={onSelectSingle}
            className="w-full p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-card-foreground">Único</p>
              <p className="text-sm text-muted-foreground">Agendamento para um dia específico</p>
            </div>
          </button>
          
          <button
            onClick={onSelectFixed}
            className="w-full p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Repeat size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-card-foreground">Semanal</p>
              <p className="text-sm text-muted-foreground">Repetir todas as semanas no mesmo dia</p>
            </div>
          </button>
          
          <button
            onClick={onSelectBiWeekly}
            className="w-full p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarRange size={24} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="font-bold text-card-foreground">Quinzenal</p>
              <p className="text-sm text-muted-foreground">Repetir a cada 2 semanas</p>
            </div>
          </button>

          {/* Separator */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-xs text-muted-foreground font-medium">OU</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Copy from Previous Month Button */}
          <button
            onClick={onCopyFromPrevious}
            disabled={copyingFromPrevious || !canCopyFromPrevious}
            className={`w-full p-4 border-2 rounded-xl transition-all flex items-center gap-4 ${
              !canCopyFromPrevious 
                ? 'border-border bg-muted cursor-not-allowed opacity-50' 
                : 'border-border hover:border-success hover:bg-success/5'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              !canCopyFromPrevious ? 'bg-muted' : 'bg-success/10'
            }`}>
              {copyingFromPrevious ? (
                <Loader2 size={24} className="text-success animate-spin" />
              ) : (
                <Copy size={24} className={!canCopyFromPrevious ? 'text-muted-foreground' : 'text-success'} />
              )}
            </div>
            <div className="text-left">
              <p className={`font-bold ${!canCopyFromPrevious ? 'text-muted-foreground' : 'text-card-foreground'}`}>
                Copiar do Mês Anterior
              </p>
              <p className="text-sm text-muted-foreground">
                {!canCopyFromPrevious 
                  ? 'Não disponível para o primeiro mês' 
                  : `Copiar clientes cadastrados de ${previousMonthLabel || ''}`
                }
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TypeSelectorModal;
