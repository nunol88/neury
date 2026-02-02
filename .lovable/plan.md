
# Plano de Melhoria da Experiência do Utilizador

## Diagnóstico do Problema

Após análise detalhada do código, identifiquei os principais problemas de usabilidade:

### Problemas Atuais

1. **Navegação fragmentada e inconsistente**
   - Cada página tem o seu próprio header com estilos diferentes
   - Botões de navegação repetidos (Dashboard, Clientes, Pagamentos) no header
   - O utilizador precisa sempre de clicar "Voltar" para mudar de secção

2. **Muitas ações escondidas no FAB (botão flutuante)**
   - O menu flutuante tem demasiadas opções (7+) escondidas
   - O admin precisa de clicar no "+" para descobrir opções importantes como "Apagar Mês" ou "Copiar do mês anterior"

3. **Falta de contexto visual**
   - Não há indicação clara de onde o utilizador está (rota ativa)
   - Headers diferentes em cada página criam confusão

4. **Experiência móvel confusa**
   - Menu dropdown no mobile com todas as opções compactadas
   - Difícil descobrir funcionalidades

---

## Solução Proposta: Sidebar de Navegação Lateral

Implementar uma sidebar que:
- Esteja sempre visível (desktop) ou acessível (mobile)
- Agrupe todas as secções principais num só lugar
- Mostre claramente a rota ativa
- Liberte espaço no header

---

## Estrutura da Nova Navegação

```text
+------------------------------------------+
|  SIDEBAR         |   CONTEÚDO PRINCIPAL  |
|                  |                       |
|  [Logo]          |   (página atual)      |
|                  |                       |
|  Agendamentos    |                       |
|  Dashboard       |                       |
|  Clientes        |                       |
|  Pagamentos      |                       |
|                  |                       |
|  ───────────     |                       |
|  [Tema] [Sair]   |                       |
+------------------------------------------+
```

---

## Tarefas de Implementação

### 1. Criar componente AppSidebar
- Nova sidebar usando os componentes `ui/sidebar.tsx` já existentes
- Links: Agendamentos, Dashboard, Clientes, Pagamentos
- Indicador visual da rota ativa
- Botão de toggle tema e logout no rodapé
- Collapsible em mobile (abre como drawer)

### 2. Criar Layout unificado
- Componente `AppLayout` que envolve todas as páginas admin
- Aplica `SidebarProvider` + `AppSidebar`
- Header simplificado apenas com informações contextuais

### 3. Simplificar headers das páginas
- Remover botões de navegação duplicados
- Manter apenas informações específicas da página (ex: título, filtros)

### 4. Reorganizar FloatingActionMenu
- Manter apenas ações de criação (Uma vez, Semanal, Quinzenal)
- Mover ações destrutivas/secundárias para dropdown no header
- Desfazer permanece flutuante mas mais proeminente

### 5. Adicionar breadcrumbs ou indicador de contexto
- Mostrar mês atual nos Agendamentos
- Indicar período selecionado no Dashboard

---

## Benefícios

| Antes | Depois |
|-------|--------|
| 4 headers diferentes | 1 layout consistente |
| Navegação escondida em dropdown | Sidebar sempre visível |
| FAB com 7+ opções | FAB focado em criar |
| Sem indicador de rota ativa | Rota destacada na sidebar |

---

## Detalhes Técnicos

### Ficheiros a criar
- `src/components/AppSidebar.tsx` - Sidebar de navegação
- `src/components/AppLayout.tsx` - Layout wrapper com sidebar

### Ficheiros a modificar
- `src/App.tsx` - Aplicar AppLayout às rotas admin
- `src/components/ScheduleView.tsx` - Simplificar header
- `src/pages/Dashboard.tsx` - Simplificar header
- `src/pages/ClientesAdmin.tsx` - Simplificar header
- `src/pages/Pagamentos.tsx` - Simplificar header
- `src/components/schedule/FloatingActionMenu.tsx` - Reduzir opções

### Componentes existentes a reutilizar
- `src/components/ui/sidebar.tsx` - Já está instalado
- `src/components/NavLink.tsx` - Para highlighting da rota ativa
