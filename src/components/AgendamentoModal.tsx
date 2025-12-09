import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';

interface Agendamento {
  id?: string;
  cliente_nome: string;
  cliente_contacto: string | null;
  data_inicio: string;
  data_fim: string;
  descricao: string | null;
  status: 'agendado' | 'concluido' | 'cancelado';
}

interface AgendamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento?: Agendamento | null;
  onSave: (data: Omit<Agendamento, 'id'>) => Promise<void>;
  isLoading?: boolean;
}

const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  open,
  onOpenChange,
  agendamento,
  onSave,
  isLoading = false,
}) => {
  const isEditing = !!agendamento?.id;

  const [formData, setFormData] = useState({
    cliente_nome: '',
    cliente_contacto: '',
    data: '',
    hora_inicio: '08:00',
    hora_fim: '12:00',
    descricao: '',
    status: 'agendado' as 'agendado' | 'concluido' | 'cancelado',
  });

  useEffect(() => {
    if (agendamento) {
      const dataInicio = new Date(agendamento.data_inicio);
      const dataFim = new Date(agendamento.data_fim);
      
      setFormData({
        cliente_nome: agendamento.cliente_nome,
        cliente_contacto: agendamento.cliente_contacto || '',
        data: dataInicio.toISOString().split('T')[0],
        hora_inicio: dataInicio.toTimeString().slice(0, 5),
        hora_fim: dataFim.toTimeString().slice(0, 5),
        descricao: agendamento.descricao || '',
        status: agendamento.status,
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        cliente_nome: '',
        cliente_contacto: '',
        data: today,
        hora_inicio: '08:00',
        hora_fim: '12:00',
        descricao: '',
        status: 'agendado',
      });
    }
  }, [agendamento, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data_inicio = `${formData.data}T${formData.hora_inicio}:00`;
    const data_fim = `${formData.data}T${formData.hora_fim}:00`;
    
    await onSave({
      cliente_nome: formData.cliente_nome,
      cliente_contacto: formData.cliente_contacto || null,
      data_inicio,
      data_fim,
      descricao: formData.descricao || null,
      status: formData.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente_nome">Nome do Cliente *</Label>
            <Input
              id="cliente_nome"
              value={formData.cliente_nome}
              onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
              placeholder="Nome do cliente"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cliente_contacto">Contacto</Label>
            <Input
              id="cliente_contacto"
              value={formData.cliente_contacto}
              onChange={(e) => setFormData({ ...formData, cliente_contacto: e.target.value })}
              placeholder="912 345 678"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input
              id="data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora Início *</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fim">Hora Fim *</Label>
              <Input
                id="hora_fim"
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'agendado' | 'concluido' | 'cancelado') => 
                setFormData({ ...formData, status: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agendado">Agendado</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Notas adicionais..."
              rows={3}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentoModal;
