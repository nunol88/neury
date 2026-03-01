

# Melhorias Visuais - App Mais Moderna e Limpa

## Resumo

A app ja tem uma base solida com glassmorphism e animacoes. O problema principal e que ha demasiados efeitos visuais a competir pela atencao (confetti, pings, glows, gradientes, pulses, sparkles). O objetivo e simplificar para um look mais limpo e profissional.

---

## 1. Reduzir "ruido visual" nos DayCards e TaskCards

**Problema:** Cada card tem gradientes, rings, glows, confetti, estrelas douradas, badges com ping, medalhas - tudo ao mesmo tempo.

**Solucao:**
- Remover a medalha dourada (Star com ping) dos dias completos - basta um check subtil ou uma borda verde suave
- Remover a animacao confetti ao marcar tarefa como completa - substituir por um simples scale + fade
- Simplificar o badge "Hoje" - remover o Sparkles animado e o glow, manter apenas um indicador de cor solida
- Reduzir o numero de ring/shadow layers nos cards - um unico border colorido basta
- Cards vazios com opacity reduzida ficam bem, manter
- Remover `hover:scale` dos DayCards (causa instabilidade visual em grelha)

## 2. Tipografia e espacamento mais limpos

**Problema:** Muitos tamanhos de texto diferentes (text-[10px], text-xs, text-sm, text-lg, text-2xl) criam falta de hierarquia.

**Solucao:**
- Usar apenas 3-4 tamanhos de texto consistentes
- Aumentar ligeiramente o padding interno dos cards para dar mais "ar"
- Separador entre info e acoes no TaskCard: trocar de `border-dashed` para `border-solid` mais subtil

## 3. Sidebar mais limpa

**Problema:** A sidebar esta OK mas pode ser mais elegante.

**Solucao:**
- Remover o texto "Gestao de Limpezas" do header da sidebar - so o nome "Mayslimpo" basta
- Botoes "Tema" e "Sair" no footer: trocar de texto para apenas icones com tooltip, ocupando menos espaco

## 4. MonthTabs simplificados

**Problema:** Cada tab tem Calendar icon + Sparkles animado + ping dot + badge "Atual" + hover glow. E demasiado.

**Solucao:**
- Remover o icone Calendar de cada tab (o texto do mes ja e suficiente)
- Remover Sparkles do tab ativo
- Manter o dot verde no mes atual mas sem a animacao ping
- Sliding indicator na base e suficiente como indicador ativo

## 5. FloatingActionMenu mais discreto

**Problema:** O FAB de 64px com gradiente e bastante grande.

**Solucao:**
- Reduzir para 56px (w-14 h-14)
- Usar cor solida (primary) em vez de gradiente
- Backdrop blur mais subtil quando expandido

## 6. Paleta de cores mais coerente

**Problema:** Mistura de cores hardcoded (violet, amber, sky, yellow, cyan) com variaveis CSS.

**Solucao:**
- Unificar badges de pagamento e notas para usar as variaveis de tema (success, warning, muted)
- Reduzir o numero de cores distintas visiveis em simultaneo

## 7. Login page - pequenas melhorias

A pagina de login ja esta bem feita. Apenas:
- Reduzir o tamanho do logo de 96px para 80px
- Remover os orbs animados do background (sao distracao)

---

## Detalhes Tecnicos

### Ficheiros a editar:
1. **`src/components/schedule/TaskCard.tsx`** - Simplificar confetti, badges, borders
2. **`src/components/schedule/DayCard.tsx`** - Remover medalha Star, simplificar today badge, remover hover:scale
3. **`src/components/schedule/MonthTabs.tsx`** - Remover Calendar icons, Sparkles, simplificar ping
4. **`src/components/schedule/FloatingActionMenu.tsx`** - Reduzir tamanho do FAB
5. **`src/components/schedule/FloatingTotal.tsx`** - Simplificar glass effect
6. **`src/components/AppSidebar.tsx`** - Remover subtitulo, simplificar footer
7. **`src/pages/Login.tsx`** - Remover orbs, reduzir logo
8. **`src/index.css`** - Limpar animacoes nao usadas
9. **`src/pages/Sobre.tsx`** - Atualizar changelog com v2.2.0

### Principio geral:
Menos animacoes simultaneas, menos layers de sombra/glow, mais espaco em branco, tipografia mais consistente. A app vai parecer mais profissional sem perder personalidade.
