

# Renomear "Neury" para "Mayara" + Melhorias Visuais v2.3.0

## Resumo

Duas grandes mudancas: (1) A partir de marco, a agenda passa a ser da Mayara - o nome "Neury" desaparece da interface e passa a mostrar "Funcionario" ou o nome real do utilizador; (2) Melhorias visuais em todas as paginas para um look mais moderno e profissional.

---

## 1. Renomear "Neury" para contexto correto

**O que muda:**
- O titulo "Agenda da Neury" passa a mostrar o nome real do utilizador logado (ex: "Agenda da Mayara" para admin, "A minha Agenda" para funcionarios)
- O role label "Neury" na sidebar e header passa a "Funcionario/a"
- O tooltip "Marcado pela Neury" no TaskCard passa a "Marcado pelo funcionario"
- A constante `NEURY_RATE = 7` mantem-se (logica de negocios), mas e renomeada para `EMPLOYEE_RATE`
- Na pagina de Login, a ajuda passa de "neury -- Agenda pessoal" para mostrar os nomes reais dos utilizadores ou texto generico
- As rotas `/neury/...` e o role `neury` na base de dados NAO mudam (para nao partir nada)

**Ficheiros afetados:**
- `src/components/ScheduleView.tsx` -- titulo e roleLabel
- `src/components/schedule/TaskCard.tsx` -- tooltip e constante NEURY_RATE
- `src/components/schedule/MonthSummaryBar.tsx` -- constante NEURY_RATE
- `src/components/AppSidebar.tsx` -- roleLabel
- `src/pages/Login.tsx` -- texto de ajuda
- `src/pages/NeuryAgendamentos.tsx` -- sem mudancas (apenas wrapper)
- `src/components/schedule/FloatingTotal.tsx` -- sem mudancas

## 2. Melhorias visuais globais

### 2a. Header dos agendamentos mais elegante
- Substituir o gradiente colorido do header por um estilo glass mais subtil que funciona bem em ambos os temas
- Tipografia mais limpa no titulo

### 2b. MonthSummaryBar mais compacta
- Reduzir o tamanho dos numeros de `text-2xl` para `text-xl`
- Labels mais legiveis (trocar `text-[10px]` por `text-xs`)
- Circulos de progresso ligeiramente menores (de 64px para 56px)

### 2c. Cards de pagamento (Pagamentos.tsx) mais modernos
- Adicionar hover states mais suaves
- Badges de status com cores mais consistentes

### 2d. Dashboard -- pequenos ajustes
- Garantir que os cards de estatisticas usam as variaveis de tema consistentemente

### 2e. Gestao de Utilizadores -- visual mais limpo
- Cards de utilizador com layout mais respiravel
- Badges de role e status mais elegantes

### 2f. Pagina Sobre atualizada
- Nova entrada v2.3.0 no changelog
- Explicacao em linguagem simples das mudancas

## 3. Login -- atualizar referencias

- Mudar "Agenda Mayara Godoi" -> manter (ja esta correto)
- Ajuda: trocar "neury -- Agenda pessoal" por texto generico "O seu nome de utilizador"
- Atualizar versao para 2.3.0

---

## Detalhes Tecnicos

### Ficheiros a editar (por ordem):

1. **`src/components/schedule/TaskCard.tsx`**
   - Renomear `NEURY_RATE` para `EMPLOYEE_RATE`
   - Tooltip: "Marcado pela Neury" -> "Marcado pelo funcionario"

2. **`src/components/schedule/MonthSummaryBar.tsx`**
   - Renomear `NEURY_RATE` para `EMPLOYEE_RATE`
   - Reduzir tamanhos de texto e circulos de progresso

3. **`src/components/ScheduleView.tsx`**
   - Titulo: usar nome do utilizador em vez de "Neury" hardcoded
   - roleLabel: "Neury" -> "Funcionario/a"
   - Renomear `NEURY_RATE` para `EMPLOYEE_RATE`
   - Header: estilo glass em vez de gradiente colorido forte

4. **`src/components/AppSidebar.tsx`**
   - roleLabel: "Neury" -> "Funcionario/a"

5. **`src/pages/Login.tsx`**
   - Versao 2.3.0
   - Ajuda: texto generico em vez de "neury"

6. **`src/pages/Sobre.tsx`**
   - Versao 2.3.0
   - Nova entrada no changelog

7. **`src/pages/GestaoUtilizadores.tsx`**
   - Pequenos ajustes visuais nos cards

### O que NAO muda:
- Rotas (`/neury/agendamentos`, `/neury/sobre`) -- mantem-se para nao partir URLs
- Role na base de dados (`neury`) -- mantem-se
- Logica de precos (funcionarios veem sempre 7 euros/hora)
- Estrutura de componentes

