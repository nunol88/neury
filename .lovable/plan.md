

## Plan: Mapa em tempo real para autocarros e metro

### O que será construído

Um botão "Ver no mapa" em cada cartão de paragem (Carris Metropolitana e Carris) e no cartão do Metro que abre um modal com mapa Leaflet mostrando:

- **Autocarros CM**: posições GPS reais via API `/v2/vehicles` (filtrado por rota), proxy por edge function
- **Autocarros Carris**: a API Carris não expõe GPS de veículos, por isso mostra apenas a paragem no mapa com os próximos horários
- **Metro**: posição estimada dos comboios entre estações, interpolada com base no `timeLeft` da API existente

### Ficheiros a criar

1. **`supabase/functions/vehicle-positions/index.ts`** -- Edge function proxy para `https://api.carrismetropolitana.pt/v2/vehicles?route_id=X`. Devolve array de `{lat, lon, bearing, speed, route_id, vehicle_id}`. CORS incluído.

2. **`src/hooks/useVehiclePositions.ts`** -- Hook com `useQuery` que chama a edge function a cada 15s para uma rota específica.

3. **`src/components/transportes/VehicleMapModal.tsx`** -- Modal com mapa Leaflet (tiles OpenStreetMap) que recebe:
   - Localização da paragem/estação (pin central)
   - Veículos (autocarros com ícone de bus + bearing, metro com ícone de comboio)
   - Para metro: calcula posição interpolada entre estações usando coordenadas de `useMetroStations` e `timeLeft`
   - Popup em cada veículo com rota e tempo estimado

4. **`src/pages/Transportes.tsx`** -- Adicionar botão "Ver no mapa" (ícone `MapPin`) nos cartões de paragem CM e no cartão Metro, que abre o `VehicleMapModal`.

### Dependências a instalar

- `leaflet` + `react-leaflet` + `@types/leaflet`

### Detalhes técnicos

- A edge function `vehicle-positions` aceita `?route_id=XXXX` e faz fetch à API CM, devolvendo só os campos necessários
- Para o metro, a interpolação usa: `posição = estação_origem + (estação_destino - estação_origem) * (1 - timeLeft/totalTime)`, onde `totalTime` é estimado (~3min entre estações)
- O mapa centra-se na paragem/estação selecionada com zoom adequado
- Auto-refresh do mapa a cada 15s (autocarros) e 30s (metro)
- CSS do Leaflet importado no componente do mapa

