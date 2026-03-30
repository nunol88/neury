

## Plano: Exportar agendamentos do mês para calendário (ficheiro .ics)

### O que faz
Adiciona um botão no menu flutuante (FAB) e/ou no menu de ações (3 pontos) que gera um ficheiro `.ics` com todos os agendamentos do mês ativo. O utilizador descarrega o ficheiro e ao abri-lo no iPhone, os eventos são adicionados automaticamente ao Calendário.

### Como funciona
1. **Gerar ficheiro .ics** — Criar uma função utilitária (`src/utils/exportCalendar.ts`) que recebe a lista de tasks do mês e gera uma string no formato iCalendar (RFC 5545) com:
   - Nome do evento: nome do cliente
   - Data/hora início e fim
   - Localização: morada do cliente
   - Notas: observações do agendamento

2. **Botão no FloatingActionMenu** — Adicionar uma nova opção "Exportar Calendário" com ícone de smartphone/calendário no menu flutuante, disponível para todos os utilizadores (admin e neury).

3. **Botão no ScheduleActionsMenu** — Adicionar também a opção no menu de 3 pontos do header para acesso alternativo.

4. **Download automático** — Ao clicar, o ficheiro `.ics` é descarregado. No iPhone, basta abrir o ficheiro para adicionar todos os eventos ao calendário nativo.

### Ficheiros afetados
- `src/utils/exportCalendar.ts` — **novo** — função que converte tasks em formato .ics
- `src/components/schedule/FloatingActionMenu.tsx` — adicionar botão de exportar
- `src/components/schedule/ScheduleActionsMenu.tsx` — adicionar opção de exportar
- `src/components/ScheduleView.tsx` — passar callback de exportação aos componentes

### Detalhes técnicos
- Formato iCalendar padrão (VCALENDAR/VEVENT), compatível com iOS, Google Calendar e Outlook
- Datas convertidas para formato UTC (DTSTART/DTEND)
- Ficheiro nomeado como `agendamentos-{mes}-{ano}.ics`
- Sem dependências externas — geração pura em string

