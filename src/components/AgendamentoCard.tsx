import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Phone, User, Pencil, Trash2, FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Agendamento {
  id: string;
  cliente_nome: string;
  cliente_contacto: string | null;
  data_inicio: string;
  data_fim: string;
  descricao: string | null;
  status: 'agendado' | 'concluido' | 'cancelado';
}

interface AgendamentoCardProps {
  agendamento: Agendamento;
  isAdmin?: boolean;
  onEdit?: (agendamento: Agendamento) => void;
  onDelete?: (id: string) => void;
}

const AgendamentoCard: React.FC<AgendamentoCardProps> = ({ 
  agendamento, 
  isAdmin = false,
  onEdit,
  onDelete 
}) => {
  const dataInicio = new Date(agendamento.data_inicio);
  const dataFim = new Date(agendamento.data_fim);
  
  const dataFormatada = format(dataInicio, "EEEE, d 'de' MMMM", { locale: pt });
  const horaInicio = format(dataInicio, 'HH:mm');
  const horaFim = format(dataFim, 'HH:mm');

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              {agendamento.cliente_nome}
            </CardTitle>
            <p className="text-sm text-muted-foreground capitalize mt-1">
              {dataFormatada}
            </p>
          </div>
          <StatusBadge status={agendamento.status} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium">{horaInicio}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium">{horaFim}</span>
        </div>
        
        {agendamento.cliente_contacto && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span>{agendamento.cliente_contacto}</span>
          </div>
        )}
        
        {agendamento.descricao && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{agendamento.descricao}</span>
          </div>
        )}
        
        {isAdmin && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit?.(agendamento)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete?.(agendamento.id)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Apagar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgendamentoCard;
