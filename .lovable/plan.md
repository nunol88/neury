# v3 — Redesign visual global do site

Refresh visual em toda a aplicação, mantendo 100% da funcionalidade. Sem novas features, sem migrations, sem mudanças de dados.

## Princípios

- Manter a estética **liquid glass** já existente, mas elevá-la: mais contraste, mais hierarquia, mais personalidade.
- Densidade equilibrada — informação relevante mais rápida de ler.
- Microinterações subtis (fade/slide stagger, hover glow), sem exageros.
- Consistência total: mesmos tokens, mesmos raios, mesmas sombras em todas as páginas.

## Tokens (base de tudo)

Atualizar `src/index.css` + `tailwind.config.ts`:
- Paleta refinada (HSL) com 2 accents (primário + secundário), surface levels (0/1/2/3) e tints coloridos para sombras.
- Border-radius escalonado: `sm 8 / md 12 / lg 16 / xl 20 / 2xl 28`.
- Sombras coloridas suaves (`shadow-glow`, `shadow-elevated`) usando tint do accent.
- Gradientes utilitários (`bg-gradient-hero`, `bg-gradient-card`).
- Tipografia: escala mais expressiva para números/headings (display font opcional via Google Fonts, mantendo Inter para corpo).

## Componentes globais

1. **Sidebar / Navegação**
   - Items com ícone + label, indicador ativo com pill colorida e glow.
   - Avatar do utilizador no topo com estado (admin/funcionária) e badge de notificações.
   - Versão colapsável em desktop intermédio.

2. **Headers de página**
   - Padrão único: título + subtítulo + ações à direita, com faixa de gradiente subtil.
   - Breadcrumb visual onde fizer sentido.

3. **Cards**
   - Glass refinado (`backdrop-blur-xl`, borders translúcidos, gradient overlay no top).
   - Hover: elevação + glow do accent + scale 1.01.

4. **Botões**
   - Variantes: `default`, `glass`, `glow`, `ghost`. Glow com gradient e shadow colorida.
   - Loading states com spinner integrado.

5. **Inputs / Selects / Dialogs**
   - Borders mais finos, focus ring colorido, dialogs com glass + entry animation.

6. **Empty states e skeletons**
   - Shimmer consistente em todas as listas (clientes, calendário, fiscal).
   - Empty states ilustrados (ícone grande + texto + CTA).

## Páginas a tocar (apenas visual)

- **Dashboard** — bento grid assimétrico, números grandes, sparklines onde já há dados.
- **ClientesAdmin** — conforme plano v3 anterior (cards horizontais densos, chips coloridos, modo lista/cartões/tabela).
- **Calendário / ScheduleView** — header sticky refinado, células com melhor estado vazio/ocupado, tooltips mais ricos.
- **Fiscal** — cards de KPI no topo, tabela com zebra + hover, badges de estado.
- **Sobre / Changelog** — timeline estilizada com versões marcadas, ícones por tipo de mudança.
- **Login** — manter liquid glass, refinar tipografia e espaçamento.
- **Transportes Lisboa** — header e cards alinhados ao novo sistema.

## Microinterações

- Stagger fade-in em listas (30ms).
- Page transition fade.
- Toasts com glass + accent border.
- FAB "Novo" em mobile nas páginas principais.

## Fora do âmbito

- Sem novas features, sem mudanças de lógica/negócio.
- Sem migrations.
- Sem alterar fluxos (cliques, navegação) — só aparência.

## Execução faseada

Para evitar uma PR gigante, sugiro 3 etapas:

1. **Fundação** — tokens, botões, cards base, sidebar. (impacto visível em tudo)
2. **Páginas pesadas** — Dashboard, ClientesAdmin, Calendário, Fiscal.
3. **Polish** — Login, Sobre, Transportes, empty states, microinterações finais.

## Versão

Bump global para **v3.0.0** quando as 3 fases estiverem concluídas. Cada fase intermédia: `v2.16.0`, `v2.17.0`.

---

**Antes de avançar, escolhe:**

a) Quero ver **3 direções visuais renderizadas** (paleta + tipografia + layout) lado a lado e escolho uma — caminho recomendado para "v3 global".
b) Avança já com a Fase 1 mantendo a paleta atual, só elevando o sistema.
c) Ajusta o plano — diz o que tirar/adicionar.
