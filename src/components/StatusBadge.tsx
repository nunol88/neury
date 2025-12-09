import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'agendado' | 'concluido' | 'cancelado';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    agendado: {
      label: 'Agendado',
      icon: Clock,
      className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    },
    concluido: {
      label: 'Concluído',
      icon: CheckCircle2,
      className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    },
    cancelado: {
      label: 'Cancelado',
      icon: XCircle,
      className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge variant="outline" className={`${className} font-medium gap-1.5`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
};

export default StatusBadge;
