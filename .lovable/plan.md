# Plano: melhorias UX completas

Vou implementar tudo em **3 fases sequenciais**, da maior fricção diária ao polimento. Cada fase fica funcional sozinha — podes testar entre fases.

---

## Fase 1 — Alta prioridade (fricção diária)

1. **Vista "Hoje" no topo de Agendamentos** — `TodaySummary` promovido a bloco fixo no topo (não enterrado), colapsável. Mostra: serviços de hoje com hora, cliente, morada (link Google Maps), total a receber, próximo serviço destacado. Botões inline: "Marcar pago".
2. **Botão WhatsApp em Pagamentos** — Em cada cliente com pendentes, botão "Lembrete WhatsApp" usando o `whatsappMessages.ts` que já existe. Inclui botão "Copiar resumo".
3. **Reorganizar sidebar** — Manter no topo: Agendamentos, Dashboard, Clientes, Pagamentos, Gestão Fiscal. Agrupar em secção "Mais": Utilizadores, Transportes, Sobre, **Definições** (nova).
4. **Página Definições** (`/admin/definicoes`) — Move "Login por email" e "Novos registos" da sidebar para aqui. Sidebar fica mais limpa.

## Fase 2 — Média prioridade (qualidade de vida)

5. **Badge pendências também no header mobile** — Badge `useOverduePayments` visível no header (não só na sidebar oculta em mobile).
6. **Busca global `Ctrl/Cmd+K`** — `Command` do shadcn no `AppLayout`. Pesquisa clientes + agendamentos, navega ao resultado.
7. **Folha do dia em PDF** — Reaproveita `dailyRoutePdf.ts` (já existe) e expõe botão "Imprimir dia" na vista Hoje.
8. **"Repetir próxima semana"** — Item no menu do `TaskCard.tsx` que clona o agendamento para +7 dias sem abrir modal de fixo.

## Fase 3 — Polimento

9. **Estados vazios com CTA** — Meses futuros vazios mostram "Copiar do mês anterior" ou "Adicionar primeiro serviço".
10. **Loading uniforme** — Padronizar skeletons (já existe `skeleton-loader.tsx`) nas páginas que ainda usam spinners ad-hoc.
11. **Indicador permanente em dias sobrecarregados** — Marca visual (ícone ⚠️) no `DayCard` quando >=3 fixos, sem depender do copiar.
12. **Ordenar por zona** — Toggle "Ordenar por morada" nos serviços do dia (agrupa por morada/zona em vez de hora de criação).

---

## Detalhes técnicos

| # | Ficheiros principais | Backend? |
|---|---|---|
| 1 | `ScheduleView.tsx`, `TodaySummary.tsx` | Não |
| 2 | `Pagamentos.tsx` + `whatsappMessages.ts` (já existe) | Não |
| 3 | `AppSidebar.tsx` (agrupar em `SidebarGroup`) | Não |
| 4 | Novo `Definicoes.tsx` + rota em `App.tsx` | Não |
| 5 | `AppLayout.tsx` (header) | Não |
| 6 | Novo `GlobalSearch.tsx` em `AppLayout` | Não |
| 7 | `dailyRoutePdf.ts` (existe) + botão | Não |
| 8 | `TaskCard.tsx` + `useAgendamentos` | Não |
| 9 | `DayCard.tsx` / `ScheduleView.tsx` | Não |
| 10 | Várias páginas | Não |
| 11 | `DayCard.tsx` + helper de contagem | Não |
| 12 | `DayCard.tsx` + util de ordenação | Não |

Sem alterações de base de dados nem novas dependências (`cmdk` já vem com shadcn).

---

Confirmas avançar com tudo nesta ordem? Posso fazer as 3 fases em sequência sem pausa, ou parar após a Fase 1 para validares.
