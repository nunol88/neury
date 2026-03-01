import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Sparkles, Bug, Wrench, Rocket, Star } from 'lucide-react';
import logoMayslimpo from '@/assets/logo-mayslimpo.jpg';

const APP_VERSION = '2.1.0';

type ChangeType = 'new' | 'fix' | 'improvement';

interface ChangeItem {
  text: string;
  type: ChangeType;
}

interface VersionEntry {
  version: string;
  date: string;
  highlights?: string;
  changes: ChangeItem[];
}

const changelog: VersionEntry[] = [
  {
    version: '2.1.0',
    date: '2026-03-01',
    highlights: 'Gestão de utilizadores e controlo de acessos',
    changes: [
      { text: 'Página de gestão de utilizadores com adicionar, remover e ativar/inativar', type: 'new' },
      { text: 'Edge function segura para criar e eliminar contas de utilizadores', type: 'new' },
      { text: 'Funcionários apenas podem observar por predefinição (sem edição)', type: 'new' },
      { text: 'Admin pode ativar/desativar funcionários para permitir marcar tarefas', type: 'new' },
      { text: 'Preços diferenciados: funcionários veem €7/hora, admin vê valores reais', type: 'new' },
      { text: 'Proteção a nível de base de dados (RLS) para utilizadores inativos', type: 'improvement' },
      { text: 'Estado ativo/inativo integrado no contexto de autenticação', type: 'improvement' },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-01',
    highlights: 'Nova identidade, página Sobre e refinamentos',
    changes: [
      { text: 'Rebranding completo: "Agenda Neury" → "Agenda Mayara Godoi"', type: 'new' },
      { text: 'Página "Sobre" com histórico detalhado de versões e changelog', type: 'new' },
      { text: 'Atualização de metadados (título, Open Graph, manifest PWA)', type: 'improvement' },
      { text: 'Uniformização do nome Mayslimpo em toda a aplicação', type: 'improvement' },
      { text: 'Rodapés de exportação PDF atualizados com nova marca', type: 'improvement' },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-02-15',
    highlights: 'Modal de relatório Liquid Glass e melhorias visuais',
    changes: [
      { text: 'Modal "Liquid Glass" (glassmorphism) para geração de relatório de cliente', type: 'new' },
      { text: 'Efeitos de orbes animadas, blur e gradientes no modal de relatório', type: 'new' },
      { text: 'Avatares personalizados por cliente com iniciais coloridas', type: 'new' },
      { text: 'Componente Empty State reutilizável para listas vazias', type: 'new' },
      { text: 'Skeleton loaders para carregamento de páginas', type: 'improvement' },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-02-01',
    highlights: 'Widget de comparação de períodos no Dashboard',
    changes: [
      { text: 'Widget de comparação entre períodos (semanal, mensal, trimestral, semestral, anual)', type: 'new' },
      { text: 'Gráficos comparativos com barras lado a lado e indicadores de tendência', type: 'new' },
      { text: 'Seletor flexível de períodos com anos dinâmicos', type: 'new' },
      { text: 'Cálculo automático de variação percentual entre períodos', type: 'improvement' },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-01-15',
    highlights: 'Dashboard avançado com gráficos e exportação',
    changes: [
      { text: 'Dashboard com KPIs: total agendamentos, concluídos, receita, taxa de conclusão', type: 'new' },
      { text: 'Gráficos interativos: barras, linhas, áreas, pizza e radial', type: 'new' },
      { text: 'Sparklines e indicadores de tendência nos cards de estatísticas', type: 'new' },
      { text: 'Animação CountUp nos valores numéricos do dashboard', type: 'new' },
      { text: 'Exportação do dashboard em PDF com cabeçalho profissional', type: 'new' },
      { text: 'Exportação de contexto para IA com dados da app', type: 'new' },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-01-01',
    highlights: 'Gestão fiscal e recibos verdes',
    changes: [
      { text: 'Página de gestão fiscal com cálculo automático de Segurança Social', type: 'new' },
      { text: 'Marcação de clientes com/sem recibo verde', type: 'new' },
      { text: 'Cálculo de base de incidência (70%) e taxa efetiva (24,5%)', type: 'new' },
      { text: 'Resumo financeiro: receita bruta, contribuição SS e receita líquida', type: 'new' },
      { text: 'Exportação de relatório fiscal em PDF', type: 'new' },
      { text: 'Filtros por tipo de cliente (recibo verde / normal)', type: 'improvement' },
    ],
  },
  {
    version: '1.5.0',
    date: '2025-12-15',
    highlights: 'Gestão de pagamentos',
    changes: [
      { text: 'Página de pagamentos com resumo mensal (total, pago, pendente)', type: 'new' },
      { text: 'Marcação individual e em massa de pagamentos como pagos', type: 'new' },
      { text: 'Registo automático de data de pagamento', type: 'new' },
      { text: 'Filtros por estado (pago/pendente) e pesquisa por cliente', type: 'new' },
      { text: 'Badges visuais de estado de pagamento', type: 'improvement' },
    ],
  },
  {
    version: '1.4.0',
    date: '2025-12-01',
    highlights: 'Gestão avançada de clientes',
    changes: [
      { text: 'Página de gestão de clientes com CRUD completo', type: 'new' },
      { text: 'Campos: nome, telefone, morada, preço/hora e notas', type: 'new' },
      { text: 'Histórico detalhado por cliente com estatísticas', type: 'new' },
      { text: 'Geração de relatório PDF por cliente com dados do período', type: 'new' },
      { text: 'Pesquisa e filtragem de clientes', type: 'new' },
      { text: 'Validação de duplicados ao adicionar clientes', type: 'improvement' },
      { text: 'Integração automática de clientes dos agendamentos', type: 'improvement' },
    ],
  },
  {
    version: '1.3.0',
    date: '2025-11-15',
    highlights: 'Funcionalidades avançadas de agendamento',
    changes: [
      { text: 'Menu de ações flutuante (FAB) com adicionar, exportar e eliminar mês', type: 'new' },
      { text: 'Deteção automática de conflitos de horário entre agendamentos', type: 'new' },
      { text: 'Diálogo de confirmação para eliminar todos os dados de um mês', type: 'new' },
      { text: 'Botão "Ir para Hoje" com navegação automática ao mês/dia atual', type: 'new' },
      { text: 'Resumo do dia atual com contagem de tarefas e receita', type: 'new' },
      { text: 'Sistema de desfazer (undo) para ações de eliminação', type: 'new' },
      { text: 'Agendamento em datas passadas via date picker', type: 'new' },
      { text: 'Seletor de tipo de serviço (limpeza, engomadoria, etc.)', type: 'new' },
    ],
  },
  {
    version: '1.2.0',
    date: '2025-11-01',
    highlights: 'Calendário e exportação PDF',
    changes: [
      { text: 'Visualização de calendário mensal com dias e tarefas', type: 'new' },
      { text: 'Cards de dia com lista de agendamentos e resumo', type: 'new' },
      { text: 'Barra de resumo mensal com totais e receita', type: 'new' },
      { text: 'Total flutuante com valor acumulado do mês', type: 'new' },
      { text: 'Exportação de agenda mensal em PDF profissional', type: 'new' },
      { text: 'Cabeçalhos e rodapés profissionais nos PDFs com logo', type: 'new' },
      { text: 'Separadores por abas de mês com navegação rápida', type: 'new' },
    ],
  },
  {
    version: '1.1.0',
    date: '2025-10-15',
    highlights: 'Sistema de autenticação e perfis',
    changes: [
      { text: 'Login com estética "Liquid Glass" (glassmorphism)', type: 'new' },
      { text: 'Saudação dinâmica por hora do dia (bom dia/boa tarde/boa noite)', type: 'new' },
      { text: 'Funcionalidade "Lembrar utilizador" com auto-preenchimento', type: 'new' },
      { text: 'Indicador visual de Caps Lock ativo', type: 'new' },
      { text: 'Modal de ajuda com contactos de suporte (email e WhatsApp)', type: 'new' },
      { text: 'Dois perfis de acesso: Admin (gestão total) e Neury (apenas visualização)', type: 'new' },
      { text: 'Rotas protegidas com verificação de permissões', type: 'new' },
      { text: 'Sidebar responsiva com navegação contextual por perfil', type: 'improvement' },
    ],
  },
  {
    version: '1.0.0',
    date: '2025-10-01',
    highlights: 'Lançamento inicial — fundação da aplicação',
    changes: [
      { text: 'Estrutura base React + Vite + TypeScript + Tailwind CSS', type: 'new' },
      { text: 'Integração com base de dados (Lovable Cloud)', type: 'new' },
      { text: 'Sistema de agendamentos com criação, edição e eliminação', type: 'new' },
      { text: 'Suporte a tema claro e escuro com toggle na sidebar', type: 'new' },
      { text: 'Layout responsivo com sidebar colapsável', type: 'new' },
      { text: 'PWA com service worker e suporte offline', type: 'new' },
      { text: 'Feriados portugueses calculados automaticamente', type: 'new' },
      { text: 'Favicon e manifesto configurados', type: 'new' },
    ],
  },
];

const typeConfig: Record<ChangeType, { label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: 'Novo', icon: Sparkles, variant: 'default' },
  fix: { label: 'Correção', icon: Bug, variant: 'secondary' },
  improvement: { label: 'Melhoria', icon: Wrench, variant: 'outline' },
};

const Sobre = () => {
  const { theme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img
          src={logoMayslimpo}
          alt="Mayslimpo Logo"
          className="w-16 h-16 rounded-full object-cover shadow-md border border-border"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Mayara Godoi</h1>
          <p className="text-sm text-muted-foreground">
            Versão atual: <span className="font-semibold text-primary">{APP_VERSION}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestão de agendamentos · Mayslimpo
          </p>
        </div>
      </div>

      <Separator />

      {/* Changelog */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Histórico de Versões</h2>
        </div>

        <div className="space-y-6">
          {changelog.map((entry, i) => (
            <div
              key={entry.version}
              className="relative rounded-xl border border-border bg-card p-5 space-y-3"
            >
              {/* Version badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {i === 0 ? (
                    <Star className="h-4 w-4 text-primary" />
                  ) : (
                    <Rocket className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-bold text-foreground text-lg">v{entry.version}</span>
                  {i === 0 && (
                    <Badge variant="default" className="text-xs">Atual</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{entry.date}</span>
              </div>

              {entry.highlights && (
                <p className="text-sm text-muted-foreground italic">{entry.highlights}</p>
              )}

              <ul className="space-y-2">
                {entry.changes.map((change, j) => {
                  const config = typeConfig[change.type];
                  const Icon = config.icon;
                  return (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <Badge variant={config.variant} className="text-[10px] px-1.5 py-0 shrink-0 mt-0.5">
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                      <span className="text-foreground">{change.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground pt-4">
        Desenvolvido com ❤️ para Mayslimpo
      </div>
    </div>
  );
};

export default Sobre;
