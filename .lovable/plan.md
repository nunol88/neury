
# Plano: Interface Liquid Glass para Modal de Relatório

## Objetivo
Transformar o modal de geração de relatório de cliente numa interface elegante estilo "liquid glass" (glassmorphism), consistente com a página de login.

---

## Design Visual

A nova interface terá:

1. **Overlay com blur** - Fundo escuro com gradiente e efeito de desfoque
2. **Orbes animadas** - Círculos coloridos com blur e animação pulse no fundo
3. **Card translúcido** - Bordas suaves com múltiplas camadas de gradiente e transparência
4. **Efeitos de borda** - Bordas subtis brancas/transparentes para efeito de vidro
5. **Cores consistentes** - Uso de cores cyan, purple e blue como na página de login

```text
┌─────────────────────────────────────────────────────┐
│  ○ Orbe animada (blur)                              │
│           ┌────────────────────────────────┐        │
│           │  ╭─────────────────────────╮   │        │
│           │  │     Gerar Relatório     │   │        │
│           │  │     [Avatar cliente]    │   │        │
│           │  │     Nome do Cliente     │   │        │
│           │  │                         │   │        │
│           │  │  ┌───────────────────┐  │   │        │
│           │  │  │ 📅 Período...   ▼ │  │   │        │
│           │  │  └───────────────────┘  │   │        │
│           │  │                         │   │        │
│           │  │  ┌───────────────────┐  │   │        │
│           │  │  │ € Valor/hora      │  │   │        │
│           │  │  └───────────────────┘  │   │        │
│           │  │                         │   │        │
│           │  │  [Voltar] [Gerar PDF]   │   │        │
│           │  ╰─────────────────────────╯   │        │
│           └────────────────────────────────┘        │
│                                    ○ Orbe animada   │
└─────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Ficheiro a Modificar
- `src/pages/ClientesAdmin.tsx` (linhas 669-820)

### Alterações Específicas

1. **Overlay do Modal**
   - Gradiente escuro em vez de preto sólido
   - Adicionar orbes animadas no fundo

2. **Container do Card**
   - Múltiplas camadas com backdrop-blur
   - Gradientes de branco transparente
   - Bordas com white/20

3. **Header**
   - Remover gradiente sólido primário
   - Usar gradiente transparente com blur
   - Avatar do cliente no centro

4. **Inputs e Botões**
   - Inputs com fundo transparente e bordas subtis
   - Botões com efeito glass

5. **Select Compacto**
   - Substituir grelha de meses por dropdown elegante
   - Manter consistência visual com o estilo glass

### Classes CSS Utilizadas
```css
/* Background overlay */
bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-800/95

/* Card layers */
backdrop-blur-xl bg-white/10
bg-gradient-to-br from-white/20 via-white/5 to-transparent
border-white/20

/* Inputs */
bg-white/10 border-white/20 placeholder:text-white/40

/* Orbes animadas */
bg-blue-500/30 blur-3xl animate-pulse
bg-purple-500/20 blur-3xl animate-pulse
bg-cyan-400/20 blur-3xl animate-pulse
```

---

## Resultado Esperado

Um modal premium e moderno que:
- Se integra visualmente com a estética da aplicação
- Transmite qualidade e profissionalismo
- É agradável de usar com animações suaves
- Funciona bem tanto no tema claro como escuro
