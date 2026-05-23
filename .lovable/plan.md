## Objetivo
Implementar todas as 16 melhorias propostas para apoiar a Mayara no dia-a-dia, em 4 fases. Algumas ideias foram simplificadas para evitar setups externos (Drive OAuth, número WhatsApp fixo) — notado em cada uma.

## Fase 1 — Operacional diário (alto retorno, baixo risco)

### 1. Botão "Cheguei / Saí" no card do serviço
- Dois botões pequenos no `TaskCard` (apenas no dia de hoje).
- "Cheguei" regista `arrivedAt`, "Saí" regista `leftAt` E marca como concluído.
- Mostra hora real vs. planeada em pequeno texto.
- Novos campos no `agendamentos`: `arrived_at`, `left_at` (timestamptz nullable).

### 2. Botão de chamada grande
- Já existe link `tel:`; aumentar para botão CTA bem visível no card hoje + no widget "Próximo serviço" (#4).

### 4. Widget "Próximo serviço"
- Card destacado no topo do `TodaySummary` com o serviço seguinte: nome do cliente, hora, morada, **botão grande Maps + telefone**.
- Refresh a cada minuto para passar ao serviço seguinte.

### 14. Atalho rápido para chamada
- Coberto por #2.

## Fase 2 — Financeiro e clientes

### 7. Despesas do dia
- Reutilizar tabela `extras` adicionando coluna `tipo` ('receita' | 'despesa').
- `ExtraValueModal` ganha toggle "Receita extra" / "Despesa".
- Cálculos do mês descontam despesas no líquido.

### 5. Cliente devedor com idade da dívida
- Em `ClientesAdmin`, badge "Devedor 14 dias" calculado do agendamento não-pago mais antigo.
- Ordenar lista por dívida mais antiga primeiro (toggle).

### 6. Histórico do cliente num clique
- Modal/aside ao clicar num cliente: lista de últimos 12 meses de serviços, total horas, total recebido, média €/hora.

### 9. Rentabilidade por cliente
- Nova secção na Dashboard: tabela `Cliente | €/h médio | Horas/mês | Total ano | Frequência`, ordenada por €/h ascendente (mostra os menos rentáveis primeiro).

### 12. Projeção mensal
- Card na Dashboard: "Projeção do mês: 1.840€" — soma do que já está marcado + média histórica dos dias úteis restantes.

## Fase 3 — Prevenção e fidelização

### 10. Cliente "perdido"
- Hook `useInactiveFavorites`: clientes `favorito=true` sem serviço há 30+ dias.
- Banner discreto na Dashboard com lista clicável.

### 11. Aniversários de clientes
- Novo campo `data_nascimento` em `clients` (opcional).
- Card "Aniversários este mês" na Dashboard com botão "Mensagem WhatsApp" pré-preenchida.

### 3. Resumo diário "preparado para enviar" (simplificado)
- **Não automático** (evita edge function agendada + necessidade de número fixo).
- Botão no `TodaySummary` ao fim do dia: "Copiar resumo" → texto pronto: "Hoje: 3 serviços (Ana 8h-11h ✓, Maria 14h-17h ✓...), 84€, 9h trabalhadas". Abre `wa.me` ou copia para clipboard.

## Fase 4 — Qualidade & robustez

### 8. Foto antes/depois
- Storage bucket `service-photos` (privado, RLS por user).
- Campo `photos` (text[] de paths) em `agendamentos`.
- Botão "Anexar foto" no `TaskCard` ao concluir; preview compacto.

### 15. Lista de compras de produtos
- Tabela nova `shopping_list` (id, item, qty, done, created_at, user_id).
- Página `/admin/compras` com checklist simples. Botão "Adicionar item" rápido.

### 13. Modo offline melhorado
- Reforçar `public/sw.js` para cachear `allTasks` e permitir leitura offline.
- Banner "Sem ligação — a mostrar dados de [hora]".
- Mutações offline ficam fora do âmbito (complexidade alta vs. retorno — Mayara tem rede na maior parte dos sítios).

### 16. Backup mensal por email
- **Simplificado**: botão "Enviar backup do mês por email" via edge function (usa Resend ou similar). Não automático no início — manual.
- Drive OAuth descartado (setup pesado para um único utilizador).

## Cortados desta ronda (custo/benefício desfavorável)

- **#1 GPS auto-complete**: requer permissões persistentes de geolocalização, polling em background — caro em bateria e falha em modo PWA fechado. O botão "Saí" do #1 (Fase 1) cobre 90% do valor.

## Detalhes técnicos

**Migrations necessárias** (uma por fase):
- F1: `ALTER TABLE agendamentos ADD COLUMN arrived_at timestamptz, ADD COLUMN left_at timestamptz;`
- F2: `ALTER TABLE extras ADD COLUMN tipo text DEFAULT 'receita' CHECK (tipo IN ('receita', 'despesa'));`
- F3: `ALTER TABLE clients ADD COLUMN data_nascimento date;`
- F4: `CREATE TABLE shopping_list (...)` + bucket `service-photos` + coluna `photos text[]` em `agendamentos`.

**Bumps de versão**: 2.13.1 (F1), 2.14.0 (F2), 2.15.0 (F3), 2.16.0 (F4).

## Ordem sugerida
Fase 1 primeiro (impacto diário imediato). Depois confirmas se queres seguir para Fase 2, ou se reordenamos baseado no que sentires usar mais.
