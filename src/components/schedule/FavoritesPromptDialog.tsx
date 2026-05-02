import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Sparkles, Loader2 } from 'lucide-react';
import { Client } from '@/hooks/useClients';

interface FavoritesPromptDialogProps {
  open: boolean;
  onClose: () => void;
  missingFavorites: Client[];
  monthLabel: string;
  onConfirm: (selectedClientIds: string[]) => Promise<void> | void;
}

const FavoritesPromptDialog: React.FC<FavoritesPromptDialogProps> = ({
  open,
  onClose,
  missingFavorites,
  monthLabel,
  onConfirm,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Pre-select all when opening
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set(missingFavorites.map(c => c.id)));
    }
  }, [open, missingFavorites]);

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = selectedIds.size === missingFavorites.length;
  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(missingFavorites.map(c => c.id)));
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(Array.from(selectedIds));
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !submitting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
              <Star size={20} className="text-amber-500 fill-current" />
            </div>
            <div>
              <DialogTitle>Incluir clientes favoritos?</DialogTitle>
              <DialogDescription>
                Estes favoritos não foram copiados para <strong>{monthLabel}</strong>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          <button
            type="button"
            onClick={toggleAll}
            className="w-full text-left text-xs font-medium text-primary hover:underline px-2 py-1"
          >
            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>

          {missingFavorites.map((client) => {
            const checked = selectedIds.has(client.id);
            return (
              <label
                key={client.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? 'border-amber-400/50 bg-amber-400/5'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(client.id)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-amber-500 fill-current shrink-0" />
                    <span className="font-medium text-card-foreground truncate">{client.nome}</span>
                  </div>
                  {client.morada && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{client.morada}</p>
                  )}
                </div>
                <span className="text-xs text-success font-medium shrink-0">€{client.preco_hora}/h</span>
              </label>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Não, obrigado
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || selectedIds.size === 0}
            className="gap-2"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            Adicionar ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FavoritesPromptDialog;
