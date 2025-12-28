import React from 'react';
import { Calendar, Users, ClipboardList, Search } from 'lucide-react';

type EmptyStateType = 'schedule' | 'clients' | 'tasks' | 'search';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const illustrations: Record<EmptyStateType, React.ReactNode> = {
  schedule: (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
      <div className="absolute inset-2 bg-primary/5 rounded-full" />
      <Calendar className="absolute inset-0 m-auto w-12 h-12 text-primary/60" strokeWidth={1.5} />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
        <span className="text-success text-lg">✓</span>
      </div>
    </div>
  ),
  clients: (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
      <div className="absolute inset-4 flex items-center justify-center gap-1">
        <div className="w-6 h-6 rounded-full bg-rose-400/60" />
        <div className="w-8 h-8 rounded-full bg-blue-400/60 -ml-2" />
        <div className="w-6 h-6 rounded-full bg-emerald-400/60 -ml-2" />
      </div>
      <Users className="absolute bottom-2 right-2 w-8 h-8 text-primary/40" strokeWidth={1.5} />
    </div>
  ),
  tasks: (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
      <div className="absolute inset-4 flex flex-col gap-2 items-center justify-center">
        <div className="w-16 h-2 bg-muted rounded-full" />
        <div className="w-12 h-2 bg-muted rounded-full" />
        <div className="w-14 h-2 bg-muted rounded-full" />
      </div>
      <ClipboardList className="absolute bottom-2 right-2 w-8 h-8 text-primary/40" strokeWidth={1.5} />
    </div>
  ),
  search: (
    <div className="relative w-32 h-32 mx-auto mb-4">
      <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
      <Search className="absolute inset-0 m-auto w-12 h-12 text-primary/40" strokeWidth={1.5} />
      <div className="absolute -top-1 -right-1 w-6 h-6 bg-warning/20 rounded-full flex items-center justify-center">
        <span className="text-warning text-sm">?</span>
      </div>
    </div>
  ),
};

const defaultContent: Record<EmptyStateType, { title: string; description: string }> = {
  schedule: {
    title: 'Sem agendamentos',
    description: 'Não há agendamentos para este dia. Clique em + para adicionar.',
  },
  clients: {
    title: 'Sem clientes',
    description: 'Ainda não tem clientes registados. Adicione o primeiro cliente.',
  },
  tasks: {
    title: 'Lista vazia',
    description: 'Não há tarefas para mostrar neste momento.',
  },
  search: {
    title: 'Nenhum resultado',
    description: 'Não foram encontrados resultados para a sua pesquisa.',
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  title, 
  description, 
  action 
}) => {
  const content = defaultContent[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
      {illustrations[type]}
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {title || content.title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">
        {description || content.description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
