
# Plano: Melhorias de Layout e Relatório de Cliente

## Resumo
Este plano aborda três melhorias solicitadas:
1. **Botões flutuantes**: Não sobrepor a sidebar quando aberta
2. **Cabeçalho tapado**: O título "Agenda da Neury" e o mês estão a ser cobertos pelos tabs de meses
3. **Relatório de cliente**: Gerar PDF por cliente na aba Clientes, mostrando apenas serviços e horas (sem valores €)

---

## 1. Botões Flutuantes - Não Sobrepor a Sidebar

### Problema
O `FloatingActionMenu` está fixo em `left-6` e `bottom-6`, ignorando a posição da sidebar. Quando a sidebar está aberta no desktop, os botões ficam por baixo dela.

### Solução
- Usar o hook `useSidebar()` para detetar se a sidebar está aberta
- Ajustar dinamicamente a posição `left` dos botões flutuantes
- No desktop com sidebar aberta: `left: 16rem + 1.5rem` (largura da sidebar + margem)
- No mobile ou sidebar fechada: manter `left-6`

### Ficheiros a Modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/components/schedule/FloatingActionMenu.tsx` | Importar `useSidebar` e ajustar posição dinamicamente |
| `src/components/schedule/FloatingTotal.tsx` | Mesma correção (se houver sobreposição) |

---

## 2. Cabeçalho Tapado pelos Tabs de Meses

### Problema
Os tabs de meses (`MonthTabs`) têm `sticky top-[52px]` e ficam por cima do cabeçalho "Agenda da Neury" quando o utilizador faz scroll.

### Solução
- Reorganizar a hierarquia visual com z-index adequados
- O cabeçalho da header (AppLayout) está a `z-40`
- MonthTabs está a `z-20` - conflito resolvido
- O verdadeiro problema é que o cabeçalho colorido (com "Agenda da Neury") não está sticky, então quando se faz scroll, os MonthTabs cobrem-no

**Abordagem**: Adicionar um `top` offset maior ao MonthTabs ou tornar o header colorido também sticky. A melhor solução é garantir que o MonthTabs fica abaixo do header do AppLayout sem cobrir o título do ScheduleView.

### Ficheiros a Modificar
| Ficheiro | Alteração |
|----------|-----------|
| `src/components/schedule/MonthTabs.tsx` | Ajustar z-index e espaçamento para não cobrir o conteúdo abaixo |

---

## 3. Relatório PDF por Cliente (Só Serviços e Horas)

### Requisito
Na página de Clientes, adicionar um botão para gerar um relatório PDF por cliente que mostre:
- Nome do cliente
- Lista de serviços realizados (data, dia da semana)
- Horas trabalhadas em cada serviço
- Total de serviços
- Total de horas

**NÃO deve mostrar:**
- Valor por hora (€/hora)
- Valor de cada serviço
- Valor acumulado

### Design do PDF

```text
┌─────────────────────────────────────────────────────────┐
│  [Logo] MaysLimpo    Relatório de Serviços              │
│         Limpeza Profissional     Cliente: Maria Silva   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ Data       │ Dia      │ Horário       │ Horas    │  │
│  │────────────┼──────────┼───────────────┼──────────│  │
│  │ 15/01/2026 │ Quinta   │ 08:00 - 12:00 │ 4.0h     │  │
│  │ 22/01/2026 │ Quinta   │ 08:00 - 12:00 │ 4.0h     │  │
│  │ 29/01/2026 │ Quinta   │ 09:00 - 13:00 │ 4.0h     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Total de Serviços: 3                                   │
│  Total de Horas: 12.0h                                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  [Logo] Documento gerado por MaysLimpo    www.mayslimpo │
└─────────────────────────────────────────────────────────┘
```

### Implementação

**Novos ficheiros:**
| Ficheiro | Descrição |
|----------|-----------|
| `src/utils/clientReportPdf.ts` | Função para gerar PDF do relatório de cliente |

**Ficheiros a modificar:**
| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/ClientesAdmin.tsx` | Adicionar botão "Relatório" (ícone FileText) na lista de ações de cada cliente |

### Código do Gerador PDF

```typescript
// src/utils/clientReportPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addProfessionalHeader, addProfessionalFooter, getContentStartY } from './pdfHelpers';
import { ClientHistory } from '@/hooks/useClientStats';

export const generateClientReportPdf = async (
  clientName: string,
  history: ClientHistory[],
  selectedMonth?: string | null
) => {
  const doc = new jsPDF();
  
  // Filtrar apenas serviços concluídos
  const completedServices = history.filter(h => h.completed);
  
  // Header
  const subtitle = selectedMonth || 'Todos os períodos';
  await addProfessionalHeader(doc, 'Relatório de Serviços', clientName);
  
  let yPos = getContentStartY();
  
  // Info do cliente
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Cliente: ${clientName}`, 14, yPos);
  doc.text(`Período: ${subtitle}`, 14, yPos + 7);
  
  // Tabela de serviços (SEM VALORES)
  const tableData = completedServices.map(service => {
    const date = new Date(service.date);
    const dayName = date.toLocaleDateString('pt-PT', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('pt-PT');
    
    const start = new Date(`1970-01-01T${service.startTime}`);
    const end = new Date(`1970-01-01T${service.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return [
      formattedDate,
      dayName.charAt(0).toUpperCase() + dayName.slice(1),
      `${service.startTime} - ${service.endTime}`,
      `${hours.toFixed(1)}h`
    ];
  });
  
  autoTable(doc, {
    head: [['Data', 'Dia', 'Horário', 'Horas']],
    body: tableData,
    startY: yPos + 14,
    // ... estilos
  });
  
  // Totais
  const totalHours = completedServices.reduce((sum, s) => {
    const start = new Date(`1970-01-01T${s.startTime}`);
    const end = new Date(`1970-01-01T${s.endTime}`);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  doc.text(`Total de Serviços: ${completedServices.length}`, 14, finalY + 10);
  doc.text(`Total de Horas: ${totalHours.toFixed(1)}h`, 14, finalY + 17);
  
  // Footer
  await addProfessionalFooter(doc, finalY + 25);
  
  doc.save(`Relatorio_${clientName.replace(/\s+/g, '_')}.pdf`);
};
```

### Interface (Botão na Lista de Clientes)

Adicionar um novo botão na linha de ações de cada cliente:

```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => handleGenerateReport(client.nome)}
  className="text-primary hover:text-primary hover:bg-primary/10"
  title="Gerar relatório de serviços"
>
  <FileText size={14} />
</Button>
```

---

## Sequência de Implementação

1. **FloatingActionMenu** - Ajustar posição dinâmica com base no estado da sidebar
2. **MonthTabs** - Corrigir z-index e espaçamentos para não cobrir o título
3. **clientReportPdf.ts** - Criar função de geração de PDF sem valores monetários
4. **ClientesAdmin.tsx** - Adicionar botão e handler para gerar relatório por cliente

---

## Detalhes Técnicos

### Ajuste do Floating Action Menu

```tsx
// FloatingActionMenu.tsx
import { useSidebar } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

const FloatingActionMenu = ({ ... }) => {
  const { open } = useSidebar();
  const isMobile = useIsMobile();
  
  // Calcular offset baseado na sidebar
  const leftOffset = !isMobile && open ? 'left-[calc(16rem+1.5rem)]' : 'left-6';
  
  return (
    <div className={`fixed bottom-6 ${leftOffset} z-50 ...`}>
      ...
    </div>
  );
};
```

### Correção do MonthTabs

O problema atual é que o `top-[52px]` do MonthTabs está correto (abaixo do header de 48px), mas o z-index de 20 pode estar a causar conflitos visuais. A solução é verificar se há sobreposição com o header colorido do ScheduleView e ajustar conforme necessário.

---

## Notas

- O relatório PDF do cliente é propositalmente simples, mostrando apenas serviços e horas
- Nenhum valor monetário é incluído no PDF (conforme solicitado)
- A posição dos botões flutuantes será responsiva ao estado da sidebar
- Todas as alterações mantêm compatibilidade com o tema claro e escuro
