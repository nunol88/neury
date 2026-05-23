## Objetivo
Avisar a Mayara, de forma passiva mas visível, sobre serviços cujo horário já terminou e que continuam por marcar como concluídos — sem usar notificações push.

## O que vai aparecer

### 1. Banner persistente no topo de Agendamentos
- Componente novo `PendingCompletionBanner` colocado em `ScheduleView`, acima do `TodaySummary`.
- Calcula serviços "esquecidos": `task.completed === false` E (`task.date < hoje` OU (`task.date === hoje` E `task.endTime` já passou)).
- Mostra contagem total + lista compacta (cliente + dia + hora) com botão "Marcar concluído" por item e "Marcar todos" no rodapé.
- Visível para admin e funcionária. Auto-some quando lista fica vazia. Dispensável por sessão (botão X que esconde até refresh).
- Se zero pendentes: não renderiza nada.

### 2. Destaque visual nos cards
- Em `TaskCard.tsx`, adicionar derivação `isOverdueUnmarked` com a mesma regra acima.
- Quando true e `!task.completed`:
  - Borda esquerda `border-l-4 border-l-destructive`
  - Pulso suave (`animate-pulse` no badge de hora)
  - Pequeno chip "Por marcar" ao lado do horário
- Em `DayCard.tsx`, badge numérico vermelho no header do dia com nº de pendentes em atraso (complementa o ⚠️ de sobrecarga já existente, mas com cor `destructive`).

## Detalhes técnicos

- Hook novo `usePendingCompletions(tasks)` em `src/hooks/usePendingCompletions.ts` — recebe lista de tasks, devolve `{ overdueTasks, count, isOverdue(task) }`. Memoizado por minuto (re-cálculo a cada 60s via `useEffect` com setInterval para apanhar o momento em que um serviço de hoje "vira" overdue).
- Banner reusa o handler `onToggleStatus` já existente em `ScheduleView`.
- Sem alterações de BD nem RLS — usa apenas campos existentes (`completed`, `date`, `endTime`).
- Bump `APP_VERSION` para `2.13.0` e nota em `Sobre.tsx`.

## Ficheiros
- novo: `src/hooks/usePendingCompletions.ts`
- novo: `src/components/schedule/PendingCompletionBanner.tsx`
- editar: `src/components/ScheduleView.tsx` (montar banner)
- editar: `src/components/schedule/TaskCard.tsx` (destaque)
- editar: `src/components/schedule/DayCard.tsx` (badge no header)
- editar: `src/utils/appVersion.ts`, `src/pages/Sobre.tsx`

## Fora do âmbito
- Notificações push do browser (não escolhido).
- Modal auto-prompt ao abrir (não escolhido).
- Alterações ao schema ou regras de pagamento.
