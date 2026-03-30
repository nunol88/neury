

# Melhorias na Página Sobre

## O que existe hoje
A página tem: logo + nome + versão, changelog interativo com dialog de detalhes, e um rodapé simples. É funcional mas puramente focada no changelog — falta identidade e contexto sobre a app.

## O que vou adicionar

### 1. Hero Section com Identidade da App
Um bloco visual no topo com o logo maior, nome da app, tagline, e estatísticas rápidas (total de versões lançadas, meses desde o lançamento, total de funcionalidades). Fundo com gradiente subtil e estilo glassmorphism consistente com o resto da app.

### 2. Secção "O que é esta app?"
Um card com uma descrição curta e clara do que a app faz — gestão de agendamentos de limpeza, controlo de pagamentos, clientes, recibos verdes, dashboard de negócio. Com ícones representativos para cada funcionalidade principal (Agenda, Clientes, Pagamentos, Dashboard, Recibos Verdes, Utilizadores).

### 3. Timeline Visual no Changelog
Em vez de uma lista plana de botões, transformar o changelog numa timeline vertical com uma linha conectora e pontos/nós para cada versão — mais visual e intuitivo para "percorrer a história" da app.

### 4. Rodapé Melhorado
Incluir a versão atual, a data de lançamento inicial (Out 2025), e o texto "Desenvolvido com ❤️" mais estilizado.

## Ficheiro editado
- `src/pages/Sobre.tsx` — todas as mudanças ficam neste ficheiro

## Detalhes Técnicos
- Usar componentes shadcn/ui existentes (Card, Badge, Separator)
- Ícones do lucide-react (Calendar, Users, CreditCard, BarChart3, FileText, Shield)
- Calcular estatísticas dinamicamente a partir do array `changelog`
- Timeline com CSS (border-left + dots posicionados)
- Manter responsividade mobile

