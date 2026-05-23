import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onImport: (rows: { nome: string; telefone: string; morada: string }[]) => Promise<void>;
  onClose: () => void;
}

/**
 * Quick CSV/paste importer for bulk client creation.
 * Accepts lines: nome, telefone, morada  (telefone/morada optional)
 */
const ImportClientsModal: React.FC<Props> = ({ onImport, onClose }) => {
  const { toast } = useToast();
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);

  const parsed = raw
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      return {
        nome: parts[0] || '',
        telefone: parts[1] || '',
        morada: parts[2] || '',
      };
    })
    .filter(r => r.nome.length > 0);

  const handleImport = async () => {
    if (parsed.length === 0) {
      toast({ title: 'Nada para importar', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      await onImport(parsed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg relative z-10 max-h-[80vh] flex flex-col">
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Upload size={20} /> Importar clientes
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <p className="text-sm text-muted-foreground">
            Cola uma linha por cliente. Formato: <code className="text-xs bg-muted px-1 rounded">nome, telefone, morada</code>.
            Telefone e morada são opcionais.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Ana Silva, 912345678, Rua das Flores 12\nMaria Santos, 933444555\nJoão Costa`}
            rows={10}
            className="w-full p-3 border border-border rounded-lg bg-input text-foreground text-sm font-mono"
          />
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-primary" />
            <span>
              Vão ser criados <strong className="text-foreground">{parsed.length}</strong> clientes.
              Nomes duplicados são ignorados.
            </span>
          </div>
        </div>
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={handleImport} disabled={busy || parsed.length === 0}>
            {busy ? 'A importar...' : `Importar ${parsed.length}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportClientsModal;
