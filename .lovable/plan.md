

# Transportes Lisboa — Widget no Sidebar

Adicionar uma secção no sidebar (e opcionalmente uma página dedicada) que mostra tempos de espera em tempo real para os transportes públicos de Lisboa.

## APIs Disponíveis (gratuitas, sem chave)

- **Carris Metropolitana**: `https://api.carrismetropolitana.pt/v2/` — paragens, chegadas em tempo real, veículos
- **Metro de Lisboa**: `http://app.metrolisboa.pt/status/getLinhas.php` — estado das linhas

## O que vou construir

### 1. Página "Transportes" (`/admin/transportes` e `/neury/transportes`)
- Campo de pesquisa de paragens por nome ou ID
- Lista de paragens favoritas (guardadas em `localStorage`)
- Para cada paragem favorita, mostrar os próximos autocarros/metros com tempo estimado de chegada em tempo real (ex: "3 min", "12 min")
- Estado das linhas do Metro (Azul, Amarela, Verde, Vermelha) — se há perturbações
- Auto-refresh a cada 30 segundos

### 2. Sidebar — novo item de navegação
- Ícone `Bus` do lucide-react
- Link "Transportes" para admin e neury

### 3. Implementação técnica
- **Chamadas diretas do frontend** — as APIs são públicas e suportam CORS, não precisam de edge function
- Hook `useTransportes.ts` com:
  - `useQuery` para buscar chegadas por paragem (`/v2/arrivals/by_stop/:id`)
  - `useQuery` para estado do metro
  - Refetch automático a cada 30s
- Paragens favoritas em `localStorage`
- Pesquisa de paragens via `/v2/stops` (filtrado client-side ou com query param)

### Ficheiros a criar/editar
- `src/pages/Transportes.tsx` — página principal
- `src/hooks/useTransportes.ts` — hook com queries
- `src/components/AppSidebar.tsx` — adicionar item "Transportes"
- `src/App.tsx` — adicionar rotas

