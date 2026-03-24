import React, { useState } from 'react';
import { X, Euro, StickyNote, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ExtraValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { valor: number; data: string; observacoes: string }) => Promise<boolean>;
  defaultDate?: string;
}

const ExtraValueModal: React.FC<ExtraValueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultDate,
}) => {
  const [valor, setValor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    defaultDate ? new Date(defaultDate + 'T00:00:00') : new Date()
  );
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valor || !selectedDate) return;

    setSaving(true);
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const success = await onSubmit({
      valor: parseFloat(valor),
      data: dateString,
      observacoes,
    });

    if (success) {
      setValor('');
      setObservacoes('');
      setSelectedDate(new Date());
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-success/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Euro size={20} className="text-success" />
            </div>
            <div>
              <h2 className="font-bold text-card-foreground text-lg">Valor Extra</h2>
              <p className="text-xs text-muted-foreground">Adicionar rendimento extra ao mês</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-1.5">
              <Euro size={14} className="text-success" />
              Valor (€) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="Ex: 50.00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full p-3 border border-border rounded-xl bg-input text-foreground text-lg font-bold focus:ring-2 focus:ring-success/50 focus:border-success transition-all"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              Data <span className="text-destructive">*</span>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12 rounded-xl",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <Calendar size={16} className="mr-2" />
                  {selectedDate
                    ? format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: pt })
                    : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-1.5">
              <StickyNote size={14} className="text-warning" />
              Observações
            </label>
            <Textarea
              placeholder="De onde vem este valor? Ex: Gorjeta, trabalho extra, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !valor || !selectedDate}
            className="w-full bg-success text-success-foreground font-bold py-3 rounded-xl shadow transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Euro size={18} />}
            Adicionar Valor Extra
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExtraValueModal;
