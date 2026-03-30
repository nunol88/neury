

## Plan: Último Login e Registo de Atividade na Gestão de Utilizadores

### Objetivo
Mostrar o último login de cada utilizador e um histórico de ações realizadas (ex: agendamentos criados, tarefas concluídas, etc.) na página de Gestão de Utilizadores.

### O que muda

**1. Criar tabela `user_activity_logs` na base de dados**
- Campos: `id`, `user_id`, `action` (texto descritivo como "Concluiu agendamento", "Criou agendamento"), `details` (JSON opcional com metadata), `created_at`
- RLS: admins podem ver tudo, utilizadores podem ver os seus próprios
- Esta tabela regista automaticamente ações importantes feitas por cada utilizador

**2. Atualizar a Edge Function `manage-users`**
- Na ação `list`, incluir o campo `last_sign_in_at` que já existe nos dados do utilizador (vem do sistema de autenticação, sem necessidade de tracking extra)
- Também buscar os últimos logs de atividade de cada utilizador da nova tabela

**3. Registar atividade automaticamente no código**
- Quando um utilizador conclui/cancela um agendamento, gravar um log
- Quando o admin cria/elimina agendamentos, gravar um log
- Inserir na tabela `user_activity_logs` em pontos-chave do código existente (hooks de agendamentos)

**4. Atualizar a UI da Gestão de Utilizadores**
- Mostrar "Último login: há X horas" por baixo do email de cada utilizador
- Adicionar um botão/expansor para ver o histórico de atividade recente (últimas 10 ações)
- Cada entrada mostra: ação, data/hora relativa

### Detalhes Técnicos

- **Último login**: campo `last_sign_in_at` já disponível via `adminClient.auth.admin.listUsers()` -- zero custo adicional
- **Logs de atividade**: nova tabela `user_activity_logs` com inserção via código client-side (RLS permite inserção do próprio user) ou via Edge Function para ações admin
- **Migração SQL**: criar tabela + políticas RLS + índice em `user_id` e `created_at`

### Ficheiros afetados
- Nova migração SQL (tabela `user_activity_logs`)
- `supabase/functions/manage-users/index.ts` (adicionar `last_sign_in_at` + logs recentes)
- `src/pages/GestaoUtilizadores.tsx` (UI expandida com último login e atividade)
- `src/hooks/useAgendamentos.ts` (registar ações na nova tabela)
- `src/components/ScheduleView.tsx` (registar ações relevantes)

