
# Melhorias Visuais - Pagamentos v2.3.1

## Resumo
Adicionar hover states suaves, badges mais consistentes e melhorar o aspeto geral dos cards na pagina de Pagamentos.

---

## Alteracoes em `src/pages/Pagamentos.tsx`

### 1. Summary Cards (Faturado / Recebido / Pendente)
- Adicionar `transition-all duration-200 hover:shadow-md` a cada card de resumo
- Adicionar um fundo subtil colorido: verde claro no "Recebido", laranja claro no "Pendente"
- Exemplo: card Recebido ganha `bg-green-50/50 dark:bg-green-950/20`, card Pendente ganha `bg-orange-50/50 dark:bg-orange-950/20`

### 2. Client Cards
- Adicionar `transition-all duration-200 hover:shadow-md hover:border-primary/20` aos cards de cliente
- Melhoria no header: badge de status com fundo preenchido em vez de apenas outline
  - "Falta: X" -> `bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800`
  - "Tudo pago" -> `bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800`

### 3. Service Rows (linhas individuais de cada servico)
- Adicionar `transition-all duration-150` para hover mais suave
- Hover state: `hover:shadow-sm` nas linhas nao pagas
- Linhas pagas: adicionar `line-through` subtil no horario ou opacity ligeira para distinguir melhor

### 4. Botao "Marcar todos como pago"
- Trocar de `variant="outline"` para estilo com fundo verde subtil: `bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:hover:bg-green-950/50 dark:text-green-400 dark:border-green-800`

### 5. Estado vazio
- Adicionar `transition-all duration-200` ao card vazio para consistencia

---

## Detalhes Tecnicos

Ficheiro unico a editar: **`src/pages/Pagamentos.tsx`**

Nenhuma dependencia nova. Apenas mudancas de classes CSS Tailwind nos elementos existentes.
