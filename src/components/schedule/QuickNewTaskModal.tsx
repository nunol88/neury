import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useClients, Client } from '@/hooks/useClients';
import { useAgendamentos, Task } from '@/hooks/useAgendamentos';
import { calculatePrice } from '@/utils/monthConfig';
import { ChevronDown, ChevronUp, Loader2, Check, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickNewTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  editingTask?: Task | null;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const QuickNewTaskModal: React.FC<QuickNewTaskModalProps> = ({ open, onClose, defaultDate, editingTask }) => {
  const { clients, addClient } = useClients();
  const { addTask, updateTask } = useAgendamentos();
  const { toast } = useToast();

  const [clientQuery, setClientQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [date, setDate] = useState(defaultDate || todayStr());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [tipo, setTipo] = useState('Limpeza regular');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pricePerHour, setPricePerHour] = useState('7');
  const [price, setPrice] = useState('21.00');
  const [notes, setNotes] = useState('');
  const [saveClient, setSaveClient] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [touched, setTouched] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setClientQuery(editingTask.client);
      const existing = clients.find(c => c.nome.toLowerCase() === editingTask.client.toLowerCase());
      setSelectedClient(existing || null);
      setDate(editingTask.date);
      setStartTime(editingTask.startTime);
      setEndTime(editingTask.endTime);
      setAddress(editingTask.address);
      setPhone(editingTask.phone);
      setPricePerHour(editingTask.pricePerHour);
      setPrice(editingTask.price);
      setNotes(editingTask.notes);
      setTipo('Limpeza regular');
    } else {
      setClientQuery('');
      setSelectedClient(null);
      setDate(defaultDate || todayStr());
      setStartTime('09:00');
      setEndTime('12:00');
      setAddress('');
      setPhone('');
      setPricePerHour('7');
      setPrice('21.00');
      setNotes('');
      setTipo('Limpeza regular');
      setSaveClient(false);
    }
    setMoreOpen(false);
    setShowSummary(false);
    setTouched(false);
  }, [open, editingTask]);

  // Recalc price
  useEffect(() => {
    const p = calculatePrice(startTime, endTime, pricePerHour);
    if (p) setPrice(p);
  }, [startTime, endTime, pricePerHour]);

  const suggestions = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q || selectedClient?.nome.toLowerCase() === q) return [];
    return clients
      .filter(c => c.nome.toLowerCase().includes(q))
      .slice(0, 5);
  }, [clientQuery, clients, selectedClient]);

  const pickClient = (c: Client) => {
    setSelectedClient(c);
    setClientQuery(c.nome);
    if (c.telefone) setPhone(c.telefone);
    if (c.morada) setAddress(c.morada);
    if (c.preco_hora) setPricePerHour(c.preco_hora);
  };

  const clientName = clientQuery.trim();
  const isValid = clientName.length > 0 && date && startTime && endTime && endTime > startTime;
  const missingContact = !phone && !address;

  const handleSubmit = async () => {
    if (!isValid) {
      setTouched(true);
      toast({ title: 'Preenche os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (!showSummary) {
      setShowSummary(true);
      return;
    }
    setSaving(true);
    const payload = {
      date, client: clientName, phone, startTime, endTime, address,
      pricePerHour, price, notes, completed: false, pago: false,
    };
    let ok = false;
    if (editingTask) {
      ok = await updateTask(editingTask.id, payload);
    } else {
      const created = await addTask(payload);
      ok = !!created;
    }
    if (ok && saveClient && !selectedClient && clientName) {
      // best-effort save as new client
      await addClient({
        nome: clientName,
        telefone: phone,
        morada: address,
        preco_hora: pricePerHour,
        notas: notes,
        recibo_verde: false,
        favorito: false,
        dias_preferidos: [],
        frequencia_preferida: 'semanal',
        periodo_preferido: null,
        hora_preferida: null,
        duracao_preferida_horas: 3,
        data_nascimento: null,
        tags: [],
      } as any);
    }
    setSaving(false);
    if (ok) {
      toast({ title: editingTask ? 'Marcação atualizada' : 'Nova limpeza criada ✓' });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 pb-3 border-b">
          <DialogTitle className="text-lg">
            {editingTask ? 'Editar limpeza' : 'Nova limpeza'}
          </DialogTitle>
        </DialogHeader>

        {!showSummary ? (
          <div className="p-5 space-y-4">
            {/* Cliente */}
            <div className="space-y-1.5 relative">
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Input
                value={clientQuery}
                onChange={(e) => { setClientQuery(e.target.value); setSelectedClient(null); }}
                placeholder="Nome do cliente"
                className="h-11"
                autoFocus={!editingTask}
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-popover border rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickClient(c)}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between items-center"
                    >
                      <span className="font-medium">{c.nome}</span>
                      {c.favorito && <span className="text-xs text-yellow-500">★ fixo</span>}
                    </button>
                  ))}
                </div>
              )}
              {clientQuery && !selectedClient && suggestions.length === 0 && (
                <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <input type="checkbox" checked={saveClient} onChange={(e) => setSaveClient(e.target.checked)} />
                  Guardar como novo cliente
                </label>
              )}
            </div>

            {/* Data + Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data <span className="text-destructive">*</span></Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option>Limpeza regular</option>
                  <option>Limpeza profunda</option>
                  <option>Pós-obra</option>
                  <option>Mudança</option>
                  <option>Escritório</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Início <span className="text-destructive">*</span></Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Fim <span className="text-destructive">*</span></Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11" />
              </div>
            </div>

            {/* Morada + Telefone */}
            <div className="space-y-1.5">
              <Label>Morada</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, cidade" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone / WhatsApp</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9XX XXX XXX" className="h-11" inputMode="tel" />
            </div>

            {missingContact && clientName && (
              <div className="flex items-start gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 text-xs text-yellow-800 dark:text-yellow-200">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Sem telefone nem morada guardados — vais precisar destes dados no dia.
              </div>
            )}

            {/* Mais detalhes */}
            <button
              type="button"
              onClick={() => setMoreOpen(v => !v)}
              className="flex items-center gap-1 text-sm text-primary font-medium"
            >
              {moreOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Mais detalhes
            </button>

            {moreOpen && (
              <div className="space-y-3 pt-1 border-t">
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div className="space-y-1.5">
                    <Label>€/hora</Label>
                    <Input type="number" step="0.5" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Preço total</Label>
                    <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="h-11" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações internas" rows={2} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">Confirma os dados da marcação:</p>
            <div className="rounded-xl border p-4 space-y-2 bg-muted/30">
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Cliente</span><span className="font-semibold">{clientName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Data</span><span className="font-semibold">{new Date(date).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Horário</span><span className="font-semibold">{startTime} — {endTime}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Tipo</span><span className="font-semibold">{tipo}</span></div>
              {address && <div className="flex justify-between gap-4"><span className="text-muted-foreground text-sm">Morada</span><span className="font-medium text-right text-sm">{address}</span></div>}
              {phone && <div className="flex justify-between"><span className="text-muted-foreground text-sm">Telefone</span><span className="font-medium">{phone}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground text-sm">Preço</span><span className="font-bold text-primary">€ {price}</span></div>
            </div>
          </div>
        )}

        <div className="p-5 pt-3 border-t flex gap-2 sticky bottom-0 bg-background">
          {showSummary && (
            <Button variant="outline" onClick={() => setShowSummary(false)} className="h-11">Voltar</Button>
          )}
          <Button variant="ghost" onClick={onClose} className="h-11">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !isValid} className="h-11 flex-1">
            {saving ? <Loader2 className="animate-spin" size={16} /> : showSummary ? <><Check size={16} className="mr-1" /> Guardar</> : 'Rever e guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickNewTaskModal;
