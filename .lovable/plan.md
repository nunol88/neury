## Objetivo
Expandir o card "Rentabilidade por Cliente" no Dashboard com muito mais métricas para a Mayara perceber rapidamente quem dá mais lucro real por hora investida.

## Métricas novas a adicionar

Por cada cliente, calcular e mostrar:

1. **€/hora real** (já existe) — preço total ÷ horas trabalhadas
2. **€/hora líquido** — desconta despesas associadas àquele dia/cliente quando existirem (usa tabela `extras` com `tipo='despesa'` no mesmo dia)
3. **Horas/mês médias** — total horas ÷ nº meses ativos
4. **Frequência** — média de dias entre serviços (ex: "a cada 8 dias")
5. **Total ano corrente** — receita acumulada YTD
6. **Total vida** — receita histórica total
7. **Tempo médio por serviço** — horas ÷ nº serviços (ajuda a ver quem leva sempre mais que o combinado)
8. **% pagos vs. em dívida** — quanto já foi pago vs. ainda por receber
9. **Tendência últimos 3 meses** — €/h subiu, desceu ou estável (seta + %)
10. **Score de rentabilidade** (0-100) — combina €/h, frequência e fiabilidade de pagamento numa nota única para ranking rápido
11. **Último serviço** — data + "há X dias"
12. **Tipo** — favorito / ocasional / perdido (sem serviço há 30+ dias)

## Layout proposto

Reformular `ClientProfitabilityCard.tsx` em **dois modos**:

**Modo compacto (default)** — lista atual melhorada:
- Nome + badge tipo (favorito/ocasional/perdido)
- €/h grande à direita + seta de tendência
- Linha secundária: `12 serviços · 36h · €/h líquido €6.80 · pago 85%`
- Score 0-100 como barra fininha por baixo

**Modo tabela expandida** (toggle "Ver tabela completa"):
- Tabela com todas as colunas: Cliente | Score | €/h | €/h líq | Horas/mês | Freq | Tempo médio | YTD | Vida | Pago % | Tendência | Último
- Ordenável por qualquer coluna (clique no header)
- Filtros: só favoritos, só com dívida, só ativos

**Filtros / ordenação no topo do card**:
- Período: mês atual / últimos 3 meses / ano / sempre
- Ordenar por: €/h asc, €/h desc, score, total receita, horas, último serviço

**Resumo no header** (já existe média €/h): adicionar
- Total clientes ativos
- €/h médio ponderado (já existe)
- Cliente mais rentável + menos rentável (nomes em destaque)

## Detalhes técnicos

**Ficheiros a alterar:**
- `src/components/admin/ClientProfitabilityCard.tsx` — reescrita do componente, adicionar todas as métricas, modo compacto + tabela, filtros, ordenação
- `src/pages/Dashboard.tsx` — passar `extras` e `clients` ao card (para tipo favorito e despesas líquidas)

**Sem migrations.** Toda a lógica é cálculo em memória sobre `allTasks`, `extras` e `clients` já carregados.

**Cálculos chave:**
- `scoreRentabilidade = 0.5 * normalizar(€/h) + 0.3 * normalizar(frequência) + 0.2 * (% pago)` (0–100)
- `tendência = (€/h últimos 3 meses) / (€/h 3 meses anteriores) - 1`, mostrado se ≥ 3 serviços em cada janela
- `frequênciaDias = (últimoServiço - primeiroServiço) / (nº serviços - 1)`
- `tipo`: favorito (flag em `clients`) · perdido (favorito sem serviço há 30+ dias) · ocasional (resto)

**Versão**: bump para `2.15.1` em `appVersion.ts` + entrada no changelog em `Sobre.tsx`.

## Fora de âmbito
- Não tocar em migrations nem schema.
- Não mexer noutros widgets do Dashboard.
- Sem exportação PDF deste card (pode ser pedido depois).
