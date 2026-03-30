

## Plano: Melhorar Visual da Página de Login

### O que muda

**1. Fundo animado com partículas/formas geométricas**
- Adicionar círculos/bolhas semi-transparentes animados a flutuar no fundo (CSS puro)
- Gradiente mais rico com mais camadas de cor (azul/teal/purple)

**2. Botões de login com identidade visual dos providers**
- **Google**: fundo branco, texto escuro, sombra suave (como o botão oficial)
- **Apple**: fundo preto sólido, texto branco (como o botão oficial)
- Hover com elevação (shadow + translateY)

**3. Card com glassmorphism mais pronunciado**
- Aumentar blur e opacidade do vidro
- Adicionar borda com gradiente subtil (shimmer na borda)
- Animação de entrada slide-up com bounce suave

**4. Logo com glow animado**
- Adicionar um halo/glow pulsante à volta do logo
- Escala ligeiramente maior (24x24 → ring mais visível)

**5. Tipografia e espaçamento**
- Título maior e com peso mais forte
- Maior espaçamento entre elementos para respirar
- Greeting com estilo mais elegante

**6. Versão e ajuda mais discretos**
- Versão mais pequena e translúcida
- Link de ajuda com estilo mais minimalista

### Ficheiros afetados
- `src/pages/Login.tsx` — reestruturar layout e estilos
- `src/index.css` — adicionar keyframes para partículas flutuantes e glow pulsante

