

## Plano: Copiar agendamentos de outro dia (com pré-visualização)

### O que faz
Ao fazer **long press** (ou clicar num botão de contexto) num dia, abre um modal que lista todos os dias do mês que já têm agendamentos. Cada dia mostra os seus agendamentos (cliente, hora, etc.) para o admin decidir qual copiar. Ao selecionar um dia, todos os agendamentos desse dia são copiados para o dia de destino.

### Como funciona

1. **Novo componente `CopyDayModal`** (`src/components/schedule/CopyDayModal.tsx`)
   - Recebe: lista de tasks do mês, data de destino, callback para copiar
   - Agrupa tasks por data e mostra uma lista de dias com agendamentos
   - Cada dia é um card expandido mostrando: data formatada, número de agendamentos, e lista com cliente + horário
   - Ao clicar num dia, confirma e copia todos os seus agendamentos para o dia de destino

2. **Long press no DayCard** (`src/components/schedule/DayCard.tsx`)
   - Adicionar handler de long press (touchstart/touchend com timeout de ~500ms, ou botão de contexto visível no header do dia para desktop)
   - Ao ativar, passa a data do dia como destino e abre o `CopyDayModal`
   - Apenas disponível para admins

3. **Integração no ScheduleView** (`src/components/ScheduleView.tsx`)
   - Adicionar estado para controlar o modal (open + targetDate)
   - Passar as tasks do mês ativo ao modal
   - Implementar a função de cópia que cria os novos agendamentos na data de destino (reutilizando `addTask`)

### UI do Modal
- Header: "Copiar agendamentos para {dia destino}"
- Lista scrollável de dias com agendamentos, cada um mostrando:
  - Nome do dia + data formatada
  - Mini-cards dos agendamentos (cliente, hora início-fim)
  - Botão "Copiar este dia" ou clique direto
- Se não houver dias com agendamentos, mensagem vazia

### Ficheiros afetados
- `src/components/schedule/CopyDayModal.tsx` — **novo**
- `src/components/schedule/DayCard.tsx` — adicionar long press / botão de copiar dia
- `src/components/ScheduleView.tsx` — estado do modal + lógica de cópia
- `src/components/schedule/index.ts` — exportar novo componente

