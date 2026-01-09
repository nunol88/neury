import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
- AiAssistant.tsx - Assistente IA integrado
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
- useAiAssistant.ts - Integração com IA
- useTheme.ts - Gestão de tema
- useMobile.tsx - Deteção de mobile
- useCountUp.tsx - Animação de contagem

### Contextos (src/contexts/)
- AuthContext.tsx - Contexto de autenticação

### Utilitários (src/utils/)
- monthConfig.ts - Configuração de meses
- pdfHelpers.ts - Helpers para PDF
- portugueseHolidays.ts - Feriados portugueses

### Edge Functions (supabase/functions/)
- ai-assistant/index.ts - Função de assistente IA

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

### 6. Assistente IA
- Chat integrado
- Ajuda contextual
- Sugestões rápidas

### 7. PWA
- Instalável como app
- Service worker para offline
- Manifest configurado
`;

export function ExportSiteButton() {
  const [isExporting, setIsExporting] = useState(false);

  const exportSite = async () => {
    setIsExporting(true);
    
    try {
      // Fetch current data stats
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

      // Combine all documentation
      const fullExport = `${PROJECT_STRUCTURE}
${DATABASE_SCHEMA}
${FEATURES_DOC}
${dataStats}

---
Exportado de: Agenda Neury
Plataforma: Lovable.dev
`;

      // Create and download file
      const blob = new Blob([fullExport], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agenda-neury-export-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportSite}
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
  );
}
