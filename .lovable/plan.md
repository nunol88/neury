
# Melhorias Globais do App - v2.4.0

## Resumo
Implementar 6 melhorias em ficheiros diferentes: pagina 404 com branding, selects nativos do Dashboard substituidos por shadcn, hover states nos Recibos Verdes e Clientes, avatar na sidebar, scroll-to-top na navegacao, e atualizacao de versao.

---

## 1. Pagina 404 em Portugues com Branding
**Ficheiro:** `src/pages/NotFound.tsx`

- Traduzir todo o conteudo para portugues ("Pagina nao encontrada", "Voltar ao inicio")
- Adicionar logo Mayslimpo no topo
- Animacao de entrada com classes CSS (fade-in)
- Botao estilizado em vez de link simples
- Fundo mais elegante com gradiente subtil

## 2. Selects Nativos do Dashboard -> Shadcn Select
**Ficheiro:** `src/pages/Dashboard.tsx`

- Importar `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` de `@/components/ui/select`
- Substituir os 5 `<select>` nativos (ano, mes, semana, trimestre, semestre) por componentes shadcn Select
- Manter a mesma logica de visibilidade condicional
- Corrigir tambem a constante `REMEMBER_USER_KEY` no Login (ja feito na centralizacao anterior)

## 3. Hover States nos Recibos Verdes
**Ficheiro:** `src/pages/RecibosVerdes.tsx`

- Adicionar `transition-all duration-200 hover:shadow-md` aos 4 stats cards
- Adicionar `transition-all duration-200 hover:shadow-md hover:border-primary/20` aos client cards
- Substituir o spinner basico por skeleton loading (usando o pattern existente no projeto)
- Adicionar icones com backgrounds coloridos nos stats cards (consistente com Clientes e Pagamentos)

## 4. Hover States nos Cards de Clientes
**Ficheiro:** `src/pages/ClientesAdmin.tsx`

- Adicionar `transition-all duration-200 hover:shadow-md` aos 4 summary stats cards (linhas ~406-464)
- As classes dos summary cards usam `bg-card rounded-xl shadow-sm` - adicionar hover states consistentes

## 5. Avatar com Iniciais na Sidebar
**Ficheiro:** `src/components/AppSidebar.tsx`

- Importar `ClientAvatar` de `@/components/ui/client-avatar`
- Adicionar avatar com iniciais do username no footer, ao lado do nome
- Substituir o texto simples por layout com avatar + nome + badge

## 6. Scroll-to-Top na Navegacao
**Ficheiro:** `src/components/AppLayout.tsx`

- Adicionar um efeito que faz scroll-to-top quando a rota muda
- Usar `useLocation` do react-router-dom para detetar mudancas de rota
- Fazer `window.scrollTo(0, 0)` ou scroll do container principal

## 7. Atualizar Versao para 2.4.0
**Ficheiro:** `src/utils/appVersion.ts`

- Atualizar `APP_VERSION` para `'2.4.0'`

**Ficheiro:** `src/pages/Sobre.tsx`

- Adicionar entrada no changelog para v2.4.0 com todas as melhorias

---

## Detalhes Tecnicos

**Ficheiros a editar (7):**
1. `src/pages/NotFound.tsx` - reescrever com branding
2. `src/pages/Dashboard.tsx` - substituir selects nativos por shadcn
3. `src/pages/RecibosVerdes.tsx` - hover states + skeleton loading
4. `src/pages/ClientesAdmin.tsx` - hover states nos summary cards
5. `src/components/AppSidebar.tsx` - avatar com iniciais
6. `src/components/AppLayout.tsx` - scroll-to-top
7. `src/utils/appVersion.ts` - versao 2.4.0
8. `src/pages/Sobre.tsx` - changelog v2.4.0

**Dependencias:** Nenhuma nova. Usa apenas componentes e utilitarios ja existentes no projeto (shadcn Select, ClientAvatar, etc).

**Login:** Corrigir `REMEMBER_USER_KEY` de `'agenda_neury_remembered_user'` para `'agenda_mayslimpo_remembered_user'` para consistencia com o branding.
