import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileJson, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const PROJECT_STRUCTURE = `
# Estrutura do Projeto - Agenda Neury

## Tecnologias
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (Auth, Database, Edge Functions)
- TanStack React Query
- React Router DOM
- shadcn/ui components

## Estrutura de Ficheiros

### Páginas (src/pages/)
- Login.tsx - Página de autenticação
- AdminAgendamentos.tsx - Gestão de agendamentos (admin)
- NeuryAgendamentos.tsx - Vista de agendamentos (neury)
- ClientesAdmin.tsx - Gestão de clientes
- Dashboard.tsx - Dashboard com estatísticas
- Pagamentos.tsx - Controlo de pagamentos
- NotFound.tsx - Página 404

### Componentes Principais (src/components/)
- ProtectedRoute.tsx - Proteção de rotas por role
- ScheduleView.tsx - Vista principal de agenda
- CalendarModal.tsx - Modal de calendário
- NavLink.tsx - Links de navegação

### Componentes de Schedule (src/components/schedule/)
- DayCard.tsx - Card de dia com tarefas
- TaskCard.tsx - Card individual de tarefa
- ScheduleHeader.tsx - Header com navegação
- MonthTabs.tsx - Tabs de meses
- MonthSummaryBar.tsx - Resumo mensal
- FloatingActionMenu.tsx - Menu flutuante de ações
- FloatingAddButton.tsx - Botão adicionar flutuante
- FloatingTotal.tsx - Total flutuante
- PositionDialog.tsx - Dialog de posição
- TypeSelectorModal.tsx - Modal de seleção de tipo
- TodaySummary.tsx - Resumo do dia
- GoToTodayButton.tsx - Botão ir para hoje
- ConflictAlert.tsx - Alerta de conflitos
- UndoBar.tsx - Barra de undo

### Hooks (src/hooks/)
- useAgendamentos.ts - CRUD de agendamentos
- useClients.ts - CRUD de clientes
- usePayments.ts - Gestão de pagamentos
- useClientStats.ts - Estatísticas de clientes
- useTheme.ts - Gestão de tema
- useMobile.tsx - Deteção de mobile
- useCountUp.tsx - Animação de contagem

### Contextos (src/contexts/)
- AuthContext.tsx - Contexto de autenticação

### Utilitários (src/utils/)
- monthConfig.ts - Configuração de meses
- pdfHelpers.ts - Helpers para PDF
- portugueseHolidays.ts - Feriados portugueses

## Rotas da Aplicação

| Rota | Componente | Roles Permitidos |
|------|------------|------------------|
| / | Login | Público |
| /admin/agendamentos | AdminAgendamentos | admin |
| /neury/agendamentos | NeuryAgendamentos | neury |
| /admin/clientes | ClientesAdmin | admin |
| /admin/dashboard | Dashboard | admin |
| /admin/pagamentos | Pagamentos | admin |
`;

const DATABASE_SCHEMA = `
## Schema da Base de Dados (Supabase)

### Tabela: agendamentos
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NOT NULL | gen_random_uuid() |
| cliente_nome | TEXT | NOT NULL | - |
| cliente_contacto | TEXT | NULL | - |
| data_inicio | TIMESTAMP | NOT NULL | - |
| data_fim | TIMESTAMP | NOT NULL | - |
| descricao | TEXT | NULL | - (JSON com preco, preco_hora, etc) |
| status | ENUM | NOT NULL | 'agendado' |
| pago | BOOLEAN | NOT NULL | FALSE |
| data_pagamento | TIMESTAMP | NULL | - |
| created_at | TIMESTAMP | NOT NULL | now() |
| updated_at | TIMESTAMP | NOT NULL | now() |

Status possíveis: 'agendado', 'concluido', 'cancelado'

### Tabela: clients
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NOT NULL | gen_random_uuid() |
| nome | TEXT | NOT NULL | - |
| telefone | TEXT | NULL | - |
| morada | TEXT | NULL | - |
| preco_hora | TEXT | NULL | - |
| notas | TEXT | NULL | - |
| created_at | TIMESTAMP | NOT NULL | now() |
| updated_at | TIMESTAMP | NOT NULL | now() |

### Tabela: user_roles
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NOT NULL | gen_random_uuid() |
| user_id | UUID | NOT NULL | - |
| role | ENUM | NOT NULL | - |
| created_at | TIMESTAMP | NOT NULL | now() |

Roles possíveis: 'admin', 'neury'

### Tabela: ai_conversations
| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| id | UUID | NOT NULL | gen_random_uuid() |
| user_role | TEXT | NOT NULL | 'admin' |
| messages | JSONB | NOT NULL | '[]' |
| created_at | TIMESTAMP | NOT NULL | now() |
| updated_at | TIMESTAMP | NOT NULL | now() |

### Funções SQL
- get_user_role(user_id) - Retorna role do utilizador
- has_role(role, user_id) - Verifica se utilizador tem role
`;

const FEATURES_DOC = `
## Funcionalidades Principais

### 1. Autenticação
- Login com email/password via Supabase Auth
- Roles: admin e neury
- Rotas protegidas por role

### 2. Gestão de Agendamentos
- Criar, editar, eliminar agendamentos
- Vista por semana/mês
- Drag & drop para reorganizar
- Marcar como concluído/cancelado
- Suporte para feriados portugueses
- Conflitos de horário

### 3. Gestão de Clientes
- CRUD completo de clientes
- Preço por hora por cliente
- Notas e contactos
- Estatísticas por cliente

### 4. Controlo de Pagamentos
- Marcar serviços como pagos
- Resumo financeiro (faturado/recebido/pendente)
- Filtros por mês/ano/estado
- Marcar pagamentos em lote

### 5. Dashboard
- Estatísticas gerais
- Gráficos de desempenho
- Resumo mensal

### 6. PWA
- Instalável como app
- Service worker para offline
- Manifest configurado
`;

export function ExportSiteButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'structure' | 'data' | null>(null);

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportStructure = async () => {
    setIsExporting(true);
    setExportType('structure');
    
    try {
      const { count: agendamentosCount } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true });
      
      const { count: clientsCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      const dataStats = `
## Estatísticas Atuais da Base de Dados

- Total de Agendamentos: ${agendamentosCount || 0}
- Total de Clientes: ${clientsCount || 0}
- Data de Exportação: ${new Date().toLocaleString('pt-PT')}
`;

      const fullExport = `${PROJECT_STRUCTURE}
${DATABASE_SCHEMA}
${FEATURES_DOC}
${dataStats}

---
Exportado de: Agenda Neury
Plataforma: Lovable.dev
`;

      downloadFile(
        fullExport, 
        `agenda-neury-estrutura-${new Date().toISOString().split('T')[0]}.md`,
        'text/markdown'
      );
      
      toast.success('Estrutura exportada com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar estrutura');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportData = async () => {
    setIsExporting(true);
    setExportType('data');
    
    try {
      // Fetch all data
      const [agendamentosRes, clientsRes] = await Promise.all([
        supabase.from('agendamentos').select('*').order('data_inicio', { ascending: false }),
        supabase.from('clients').select('*').order('nome')
      ]);

      if (agendamentosRes.error) throw agendamentosRes.error;
      if (clientsRes.error) throw clientsRes.error;

      const exportData = {
        exportedAt: new Date().toISOString(),
        exportedAtFormatted: new Date().toLocaleString('pt-PT'),
        summary: {
          totalAgendamentos: agendamentosRes.data?.length || 0,
          totalClientes: clientsRes.data?.length || 0,
          agendamentosPorStatus: {
            agendado: agendamentosRes.data?.filter(a => a.status === 'agendado').length || 0,
            concluido: agendamentosRes.data?.filter(a => a.status === 'concluido').length || 0,
            cancelado: agendamentosRes.data?.filter(a => a.status === 'cancelado').length || 0,
          },
          pagamentos: {
            pagos: agendamentosRes.data?.filter(a => a.pago).length || 0,
            pendentes: agendamentosRes.data?.filter(a => !a.pago && a.status === 'concluido').length || 0,
          }
        },
        agendamentos: agendamentosRes.data?.map(a => ({
          id: a.id,
          cliente: a.cliente_nome,
          contacto: a.cliente_contacto,
          dataInicio: a.data_inicio,
          dataFim: a.data_fim,
          descricao: a.descricao ? JSON.parse(a.descricao) : null,
          status: a.status,
          pago: a.pago,
          dataPagamento: a.data_pagamento,
          criadoEm: a.created_at,
          atualizadoEm: a.updated_at,
        })),
        clientes: clientsRes.data?.map(c => ({
          id: c.id,
          nome: c.nome,
          telefone: c.telefone,
          morada: c.morada,
          precoHora: c.preco_hora,
          notas: c.notas,
          criadoEm: c.created_at,
          atualizadoEm: c.updated_at,
        })),
      };

      downloadFile(
        JSON.stringify(exportData, null, 2),
        `agenda-neury-dados-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      );
      
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const exportAll = async () => {
    await exportStructure();
    await exportData();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar para IA
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportStructure} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Estrutura do Projeto</span>
            <span className="text-xs text-muted-foreground">Schema, rotas, componentes (.md)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportData} disabled={isExporting}>
          <FileJson className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Dados Completos</span>
            <span className="text-xs text-muted-foreground">Agendamentos e clientes (.json)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAll} disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Exportar Tudo</span>
            <span className="text-xs text-muted-foreground">Estrutura + Dados</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
