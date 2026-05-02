# Melhorias para a vida da Admin

Olhei a app por inteiro (Agendamentos, Clientes, Pagamentos, Dashboard, Gestão Fiscal) e identifiquei melhorias **práticas** — coisas que poupam tempo e cliques no dia-a-dia, sem inflar a app. Estão ordenadas por impacto.

## 1. Cobranças por WhatsApp (alto impacto)

Atualmente há **3 serviços passados sem pagamento** mas não há forma rápida de cobrar. Proponho:

- Em **Pagamentos**, junto a cada cliente com pendentes, um botão **"Enviar lembrete WhatsApp"**.
- Abre o WhatsApp (`wa.me/...`) com mensagem pronta tipo:
  > Olá [Nome], só a lembrar a limpeza de [data] — total €[valor]. MB Way: 933 474 736. Obrigada! 🌸
- Funciona desktop e telemóvel (sem custos, sem API).
- Botão extra: **"Copiar resumo"** para colar onde quiser.

## 2. Página inicial = "Hoje" em vez de Agendamentos do mês

Quando a admin abre a app, gasta tempo a procurar **o que tem hoje**. Proponho um pequeno **dashboard "Hoje"** no topo da página de Agendamentos (colapsável), com:

- Serviços de hoje (cliente, hora, morada com link Google Maps).
- Total a receber hoje.
- Próximo serviço destacado.
- Botão "Marcar concluído" e "Marcar pago" inline.

Sem mudar a navegação principal — apenas mais visível à chegada.

## 3. Busca global (atalho)

Uma barra de busca no topo (ou tecla `/`) que pesquisa em **clientes + agendamentos** simultaneamente. Resultado: clica e vai direto para o cliente / dia. Hoje a busca é por página.

## 4. Notificações de pagamentos atrasados

Pequeno **badge vermelho** no item "Pagamentos" da sidebar com nº de serviços vencidos (passaram >7 dias e não foram pagos). Visível em todas as páginas — a admin nunca esquece.

## 5. Aniversários / datas especiais de clientes

Adicionar campo opcional **"Data de aniversário"** ao cliente. No dashboard "Hoje", mostrar:
> 🎂 Hoje faz anos: Maria Silva
Permite enviar uma mensagem rápida — pequeno detalhe de fidelização.

## 6. Estatísticas rápidas no card do cliente

Na página **Clientes**, sem ter de abrir o histórico, mostrar inline:
- Última visita ("há 12 dias")
- Total faturado este ano
- Indicador visual se está **em atraso** com pagamentos

## 7. Modo "Folha do dia" para imprimir / partilhar

Botão para gerar um **PDF/imagem de 1 dia** (não o mês inteiro) com a rota do dia: cliente, hora, morada, telefone. Ideal para enviar à funcionária de manhã ou imprimir.

## 8. Duplicar agendamento rápido

No menu de cada agendamento, opção **"Repetir na próxima semana"** com 1 clique (atalho para o caso comum sem ter de abrir o modal de "fixo").

## 9. Backup / Export anual

Na **Gestão Fiscal**, botão **"Exportar tudo do ano (Excel)"** — todas as faturas, pagamentos, extras num único ficheiro. Útil para contabilista/IRS.

## 10. Pequenos polimentos

- **Login**: a switch "Login por email" e "Novos registos" estão na sidebar — convém mover para um menu de **Definições** (estão escondidas e raramente usadas).
- **Sidebar**: items "Sobre" e "Utilizadores" raramente usados — agrupar em submenu para reduzir ruído.
- **Dashboard**: 1150 linhas num só ficheiro — refactor para componentes menores (técnico, não muda funcionalidade).

---

## Detalhes técnicos

| # | Ficheiros principais | Backend? |
|---|---|---|
| 1 | `Pagamentos.tsx`, novo helper `whatsappMessages.ts` | Não |
| 2 | `ScheduleView.tsx` (componente `TodayDashboard`) | Não |
| 3 | Novo `GlobalSearch.tsx` em `AppLayout` | Não |
| 4 | `AppSidebar.tsx` + hook `usePaymentsBadge` | Não |
| 5 | Migration: `clients.aniversario date`; UI em `ClientesAdmin` + `Dashboard` | Sim (1 coluna) |
| 6 | `ClientesAdmin.tsx` usando `useClientStats` (já existe) | Não |
| 7 | Novo `dailyRoutePdf.ts` (jsPDF, padrão atual) | Não |
| 8 | Menu em `TaskCard.tsx` + `useAgendamentos.addTask` | Não |
| 9 | `RecibosVerdes.tsx` + `xlsx` (já há export XML) | Não |
| 10 | `AppSidebar.tsx`, novo `Definicoes.tsx` | Não |

---

## Como queres avançar?

Não vou fazer tudo de uma vez. Recomendo começar pelas **#1 (WhatsApp)** e **#2 (Hoje)** — são as que dão retorno imediato. Diz-me quais queres e em que ordem (ou aprovar todas).
