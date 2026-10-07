import React, { useEffect, useRef, useState } from 'react';
import { X, Euro, StickyNote, Calendar, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Extra, ExtraTipo } from '@/hooks/useExtras';

interface ExtraValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { valor: number; data: string; observacoes: string; tipo: ExtraTipo }) => Promise<boolean>;
  defaultDate?: string;
  /** Tipo preselected when creating a new record */
  defaultTipo?: ExtraTipo;
  /** When provided, the modal works in edit mode, pre-filled from this extra. */
  editingExtra?: Extra | null;
}

const ExtraValueModal: React.FC<ExtraValueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultDate,
  defaultTipo = 'receita',
  editingExtra,
}) => {
  const [tipo, setTipo] = useState<ExtraTipo>('receita');
  const [valor, setValor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [observacoes, setObservacoes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  // Always (re)initialize from the current source when opening — never reuse stale state.
  useEffect(() => {
    if (!isOpen) return;
    if (editingExtra) {
      setTipo(editingExtra.tipo === 'despesa' ? 'despesa' : 'receita');
      setValor(String(Number(editingExtra.valor)));
      setSelectedDate(new Date(editingExtra.data + 'T00:00:00'));
      setObservacoes(editingExtra.observacoes || '');
    } else {
      setTipo(defaultTipo);
      setValor('');
      setSelectedDate(defaultDate ? new Date(defaultDate + 'T00:00:00') : new Date());
      setObservacoes('');
    }
    setError(null);
    setSaving(false);
    savingRef.current = false;
  }, [isOpen, editingExtra, defaultDate, defaultTipo]);

  if (!isOpen) return null;

  const isEdit = !!editingExtra;
  const isDespesa = tipo === 'despesa';
  const accentClass = isDespesa ? 'text-destructive' : 'text-success';
  const accentBg = isDespesa ? 'bg-destructive/20' : 'bg-success/20';
  const accentGradient = isDespesa ? 'from-destructive/10 to-transparent' : 'from-success/10 to-transparent';
  const buttonClass = isDespesa
    ? 'bg-destructive text-destructive-foreground'
    : 'bg-success text-success-foreground';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    const num = parseFloat(valor.replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Indique um valor positivo válido.');
      return;
    }
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      setError('Selecione uma data válida.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const success = await onSubmit({
        valor: num,
        data: format(selectedDate, 'yyyy-MM-dd'),
        observacoes,
        tipo,
      });
      if (success) {
        onClose();
      } else {
        setError('Não foi possível guardar. Os dados foram mantidos — tente novamente.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className={cn("flex items-center justify-between p-5 border-b border-border bg-gradient-to-r", accentGradient)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", accentBg)}>
              {isDespesa
                ? <TrendingDown size={20} className={accentClass} />
                : <TrendingUp size={20} className={accentClass} />}
            </div>
            <div>
              <h2 className="font-bold text-card-foreground text-lg">
                {isEdit ? 'Editar registo' : isDespesa ? 'Despesa' : 'Valor Extra'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isDespesa ? 'Registar despesa do dia (produtos, transportes...)' : 'Adicionar rendimento extra ao mês'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo toggle */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('receita')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all',
                  tipo === 'receita'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border text-muted-foreground hover:border-success/40'
                )}
              >
                <TrendingUp size={16} />
                Receita
              </button>
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all',
                  tipo === 'despesa'
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border text-muted-foreground hover:border-destructive/40'
                )}
              >
                <TrendingDown size={16} />
                Despesa
              </button>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5 flex items-center gap-1.5">
              <Euro size={14} className={accentClass} />
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
              className={cn(
                "w-full p-3 border border-border rounded-xl bg-input text-foreground text-lg font-bold transition-all",
                isDespesa
                  ? "focus:ring-2 focus:ring-destructive/50 focus:border-destructive"
                  : "focus:ring-2 focus:ring-success/50 focus:border-success"
              )}
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
              placeholder={isDespesa
                ? 'O que comprou? Ex: detergente, sacos do lixo, gasolina...'
                : 'De onde vem este valor? Ex: gorjeta, trabalho extra...'}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive font-medium">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !valor || !selectedDate}
            className={cn(
              "w-full font-bold py-3 rounded-xl shadow transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50",
              buttonClass
            )}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Euro size={18} />}
            {isEdit ? 'Guardar alterações' : isDespesa ? 'Registar Despesa' : 'Adicionar Valor Extra'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExtraValueModal;
