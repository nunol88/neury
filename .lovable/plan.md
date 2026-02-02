
# Plano: Gestão de Recibos Verdes (Segurança Social 2026)

## Resumo
Adicionar uma nova secção "Recibos Verdes" na sidebar para o admin gerir quais clientes requerem emissão de recibos verdes, com cálculo automático das contribuições para a Segurança Social segundo as regras portuguesas de 2026.

---

## Regras da Segurança Social 2026

### Taxa de Contribuição
- **Taxa**: 21,4% (trabalhadores independentes - prestação de serviços)
- **Base de incidência**: 70% do rendimento bruto
- **Taxa efetiva**: 21,4% × 70% = **14,98%** do valor faturado

### Fórmula de Cálculo
```
Contribuição SS = Valor Faturado × 0.70 × 0.214
```

**Exemplo prático:**
- Faturado: €1.000
- Base de incidência: €1.000 × 70% = €700
- Contribuição SS: €700 × 21,4% = €149,80
- Valor líquido: €1.000 - €149,80 = €850,20

---

## Funcionalidades

### 1. Nova Opção na Sidebar
- Item "Recibos Verdes" no menu de navegação do admin
- Ícone: Receipt (do Lucide)
- Rota: `/admin/recibos-verdes`

### 2. Página de Gestão
**Interface principal:**
- Lista de todos os clientes existentes
- Toggle para marcar cada cliente como "Recibo Verde"
- Visualização das taxas aplicadas (21,4% sobre 70%)

**Estatísticas visíveis:**
- Total de clientes a recibo verde
- Valor total faturado
- Base de incidência (70%)
- Contribuição SS estimada
- Valor líquido estimado

### 3. Filtros
- Filtro por mês/ano
- Pesquisa por nome de cliente
- Filtro: Todos / Apenas Recibos Verdes

### 4. Geração de Documento PDF
Relatório profissional contendo:
- Cabeçalho com logo MaysLimpo
- Período selecionado
- Tabela detalhada por cliente:
  - Nome do cliente
  - Total faturado
  - Base de incidência (70%)
  - Contribuição SS (21,4%)
  - Valor líquido
- Totais gerais
- Nota explicativa das taxas aplicadas

---

## Alterações Técnicas

### Base de Dados
Nova coluna na tabela `clients`:
```sql
ALTER TABLE clients 
ADD COLUMN recibo_verde BOOLEAN DEFAULT false;
```

### Novos Ficheiros

| Ficheiro | Descrição |
|----------|-----------|
| `src/pages/RecibosVerdes.tsx` | Página principal de gestão |
| `src/hooks/useRecibosVerdes.ts` | Hook com lógica de dados e cálculos |
| `src/utils/recibosVerdesPdf.ts` | Geração do documento PDF |

### Ficheiros a Modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/AppSidebar.tsx` | Adicionar item "Recibos Verdes" na navegação |
| `src/App.tsx` | Registar rota `/admin/recibos-verdes` |
| `src/hooks/useClients.ts` | Incluir campo `recibo_verde` no tipo Client |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente após migração |

---

## Design da Interface

```text
┌─────────────────────────────────────────────────────────┐
│  🧾 Recibos Verdes                       [Gerar PDF]    │
├─────────────────────────────────────────────────────────┤
│  [Janeiro ▼] [2026 ▼]  [🔍 Pesquisar cliente...]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────┐│
│  │  Clientes  │ │  Faturado  │ │ Contrib.SS │ │Líquido ││
│  │     5      │ │  €2.000    │ │   €299,60  │ │€1.700  ││
│  │  (a RV)    │ │            │ │  (14,98%)  │ │        ││
│  └────────────┘ └────────────┘ └────────────┘ └────────┘│
│                                                         │
│  Taxas: 21,4% SS sobre 70% do rendimento               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [✓] Maria Silva                    Recibo Verde     ││
│  │     Faturado: €800                                  ││
│  │     Base (70%): €560  →  SS: €119,84  →  Líq: €680 ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ [ ] João Santos                    Normal           ││
│  │     (Clique para marcar como recibo verde)          ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Constantes e Cálculos

```typescript
// Taxas Segurança Social 2026 - Prestação de Serviços
const TAXA_SS = 0.214;           // 21,4%
const BASE_INCIDENCIA = 0.70;    // 70% do rendimento

// Cálculos
const baseIncidencia = valorFaturado * BASE_INCIDENCIA;
const contribuicaoSS = baseIncidencia * TAXA_SS;
const valorLiquido = valorFaturado - contribuicaoSS;

// Taxa efetiva sobre o total faturado
const taxaEfetiva = TAXA_SS * BASE_INCIDENCIA; // 0.1498 = 14,98%
```

---

## Sequência de Implementação

1. **Migração BD** - Adicionar coluna `recibo_verde` à tabela clients
2. **Hook useClients** - Atualizar interface Client e fetch para incluir novo campo
3. **Hook useRecibosVerdes** - Criar lógica de cálculos SS e agregação de dados
4. **Página RecibosVerdes** - Interface com lista, toggles e cards de resumo
5. **PDF Generator** - Documento formatado com tabela e totais
6. **Sidebar** - Adicionar nova opção "Recibos Verdes" na navegação
7. **Rotas** - Registar `/admin/recibos-verdes` no App.tsx

---

## Notas Importantes

- As taxas de 21,4% sobre 70% são as taxas em vigor para 2026 em Portugal
- O cálculo real da SS é feito trimestralmente com base na média do ano anterior
- Este módulo fornece uma **estimativa** para ajudar na gestão financeira
- O admin pode alternar o estado de recibo verde de cada cliente a qualquer momento
- O PDF incluirá apenas clientes marcados como recibo verde no período selecionado
