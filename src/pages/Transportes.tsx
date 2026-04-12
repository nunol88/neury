import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bus, Search, Star, StarOff, Clock, MapPin, Map as MapIcon,
  RefreshCw, Train, Loader2, AlertCircle, Navigation, LocateFixed, WifiOff, CalendarDays, GripVertical
} from 'lucide-react';
import CarrisTimetableModal from '@/components/schedule/CarrisTimetableModal';
import VehicleMapModal, { type MetroEstimatedPosition } from '@/components/transportes/VehicleMapModal';
import { useVehiclePositions } from '@/hooks/useVehiclePositions';
import {
  useSearchStops,
  useCMArrivals,
  useCarrisSchedule,
  useMetroStatus,
  useNearestMetroStation,
  useMetroWaitTimes,
  useMetroStations,
  formatMetroTimeLeft,
  useFavoriteStops,
  useNearbyCMStops,
  useNearbyCarrisStops,
  useGeolocation,
  formatMinutesUntil,
  formatTimeUntil,
  useIsOnline,
  type TransportStop,
  type TransportProvider,
  type GeoPosition,
} from '@/hooks/useTransportes';

const metroColors: Record<string, string> = {
  Azul: 'bg-blue-500', Amarela: 'bg-yellow-400', Verde: 'bg-green-500', Vermelha: 'bg-red-500',
};
const metroTextColors: Record<string, string> = {
  Azul: 'text-blue-500', Amarela: 'text-yellow-500', Verde: 'text-green-500', Vermelha: 'text-red-500',
};
const metroBorderColors: Record<string, string> = {
  Azul: 'border-blue-500', Amarela: 'border-yellow-400', Verde: 'border-green-500', Vermelha: 'border-red-500',
};

const providerBadgeClass: Record<TransportProvider, string> = {
  cm: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  carris: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

/* ── Arrival sub-components ── */

function CMStopArrivals({
  stopId,
  onOpenMap,
}: {
  stopId: string;
  onOpenMap?: (routeId: string, routeLabel: string) => void;
}) {
  const { data: arrivals, isLoading, isError } = useCMArrivals(stopId);
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (!arrivals || arrivals.length === 0) return <EmptyState />;
  return (
    <div className="space-y-1.5">
      {arrivals.map((a, i) => {
        const time = a.estimated_arrival_unix || a.scheduled_arrival_unix;
        const routeId = a.route_id || '';
        const route = routeId.replace(/_\d+$/, '') || '—';
        const canOpenMap = !!onOpenMap && !!routeId;

        return (
          <div key={`${a.pattern_id}-${i}`} className="flex items-center justify-between gap-2 py-1 text-sm">
            <Badge variant="secondary" className="text-xs font-mono px-1.5">{route}</Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-medium text-foreground">{formatMinutesUntil(time)}</span>
              {canOpenMap && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onOpenMap(routeId, route)}
                  title={`Ver autocarro ${route} no mapa`}
                >
                  <MapIcon className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CarrisStopSchedule({ stopId }: { stopId: string }) {
  const { data, isLoading, isError } = useCarrisSchedule(stopId);
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 3;

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (!data?.departures || data.departures.length === 0) return <EmptyState />;

  const shown = expanded ? data.departures : data.departures.slice(0, COLLAPSED_COUNT);
  const hasMore = data.departures.length > COLLAPSED_COUNT;

  return (
    <div className="space-y-1">
      {shown.map((dep, i) => (
        <div key={`${dep.r}-${dep.t}-${i}`} className="flex items-center justify-between text-sm py-1 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Badge variant="secondary" className="text-xs font-mono px-1.5 shrink-0">{dep.r}</Badge>
            {dep.d && <span className="text-xs text-muted-foreground truncate">→ {dep.d}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
            <Clock className="h-3 w-3" />
            <span className="font-medium text-foreground">{formatTimeUntil(dep.t)}</span>
            <span className="text-xs">({dep.t})</span>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary hover:underline w-full text-center py-1"
        >
          {expanded ? 'Mostrar menos ▲' : `Ver mais (${data.departures.length - COLLAPSED_COUNT}) ▼`}
        </button>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">⏱ Horário previsto (GTFS)</p>
    </div>
  );
}

function LoadingState() {
  return <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>A carregar...</span></div>;
}
function ErrorState() {
  return <div className="flex items-center gap-2 text-sm text-destructive py-2"><AlertCircle className="h-3.5 w-3.5" /><span>Erro ao carregar</span></div>;
}
function EmptyState() {
  return <p className="text-sm text-muted-foreground py-2">Sem próximas partidas</p>;
}

/* ── Stop card ── */

function StopCard({ stop, onAdd, onRemove, isFav, onOpenTimetable, onOpenMap }: {
  stop: TransportStop; onAdd?: () => void; onRemove?: () => void; isFav?: boolean;
  onOpenTimetable?: () => void; onOpenMap?: (routeId?: string, routeLabel?: string) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">{stop.name}</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">{stop.id}</span>
              {stop.distance != null && (
                <span className="text-xs text-muted-foreground">
                  · {stop.distance < 1 ? `${Math.round(stop.distance * 1000)}m` : `${stop.distance.toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {stop.provider === 'carris' && onOpenTimetable && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onOpenTimetable} title="Ver horário completo">
              <CalendarDays className="h-3.5 w-3.5" />
            </Button>
          )}
          {onAdd && !isFav && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdd}><Star className="h-3.5 w-3.5" /></Button>}
          {onRemove && isFav && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}><StarOff className="h-3.5 w-3.5" /></Button>}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {stop.provider === 'cm' ? (
          <CMStopArrivals stopId={stop.id} onOpenMap={onOpenMap} />
        ) : (
          <CarrisStopSchedule stopId={stop.id} />
        )}
      </CardContent>
    </Card>
  );
}

/* ── Metro ── */

function MetroStatusCard({
  position,
  onOpenMap,
}: {
  position: GeoPosition | null;
  onOpenMap?: (selection: {
    stationId: string;
    stationName: string;
    stationLat: number;
    stationLon: number;
    destinationId: string;
    destinationName: string;
    timeLeft: string;
    live: boolean;
  }) => void;
}) {
  const { data: lines, isLoading: statusLoading } = useMetroStatus();
  const { data: nearestStation } = useNearestMetroStation(position);
  const { data: waitTimes, isLoading: waitLoading } = useMetroWaitTimes(nearestStation?.id || null);
  const [expanded, setExpanded] = useState(false);

  const hasStatus = lines && lines.length > 0;
  const hasWait = waitTimes && waitTimes.length > 0;
  const hasLiveWaitTimes = waitTimes?.some((wt) => wt.live) ?? false;
  const stationLines = (nearestStation as any)?.lines as string[] | undefined;
  const stationLineName = stationLines?.[0] ? stationLines[0].charAt(0).toUpperCase() + stationLines[0].slice(1) : null;

  if (!hasStatus && !hasWait && !statusLoading && !waitLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Train className="h-4 w-4" /> Metro de Lisboa
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Nearest station - prominent display */}
        {nearestStation && (
          <div className={`rounded-lg border-2 ${stationLineName ? metroBorderColors[stationLineName] || 'border-muted' : 'border-muted'} p-3`}>
            <div className="flex items-center gap-2 mb-1">
              {stationLineName && <div className={`w-3.5 h-3.5 rounded-full ${metroColors[stationLineName] || 'bg-muted'}`} />}
              <span className="text-xs font-medium text-muted-foreground">
                {stationLineName ? `Linha ${stationLineName}` : 'Estação próxima'}
              </span>
              {(nearestStation as any).distance != null && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  📍 {((nearestStation as any).distance * 1000).toFixed(0)}m
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="text-lg font-bold text-foreground">{nearestStation.name}</div>
              {hasLiveWaitTimes && (
                <Badge
                  variant="secondary"
                  className="h-5 whitespace-nowrap border border-primary/20 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                >
                  Tempo real
                </Badge>
              )}
            </div>

            {waitLoading ? <LoadingState /> : hasWait ? (
              <div className="space-y-2">
                {waitTimes!.map((wt, i) => {
                  const nextTime = wt.arrivalTimes?.[0]?.timeLeft;
                  const nextMin = nextTime ? formatMetroTimeLeft(nextTime) : '—';
                  const canOpenMap = !!onOpenMap && !!nearestStation && !!nextTime;

                  return (
                    <div key={`${wt.destination.id}-${i}`} className="bg-background/50 rounded-md p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm">→</span>
                          <span className="text-sm font-medium text-foreground">{wt.destination.name}</span>
                          {wt.live && (
                            <Badge
                              variant="secondary"
                              className="h-5 whitespace-nowrap border border-primary/20 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
                            >
                              Em tempo real
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-bold text-primary">{nextMin}</span>
                          {canOpenMap && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => onOpenMap({
                                stationId: nearestStation.id,
                                stationName: nearestStation.name,
                                stationLat: parseFloat(nearestStation.lat),
                                stationLon: parseFloat(nearestStation.lon),
                                destinationId: wt.destination.id,
                                destinationName: wt.destination.name,
                                timeLeft: nextTime,
                                live: wt.live,
                              })}
                              title={`Ver comboio para ${wt.destination.name} no mapa`}
                            >
                              <MapIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {expanded && wt.arrivalTimes?.slice(1).map((at, j) => (
                        <div key={j} className="flex justify-between text-xs text-muted-foreground mt-1 pl-5">
                          <span>Seguinte</span>
                          <span>{formatMetroTimeLeft(at.timeLeft)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {waitTimes!.some(wt => wt.arrivalTimes?.length > 1) && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-primary hover:underline w-full text-center py-1"
                  >
                    {expanded ? 'Mostrar menos ▲' : 'Ver próximos comboios ▼'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sem tempos de espera disponíveis</p>
            )}
          </div>
        )}

        {/* All lines status - compact */}
        {statusLoading ? <LoadingState /> : hasStatus && (
          <div className="flex flex-wrap gap-2">
            {lines?.map(line => {
              const isOk = line.estado.toLowerCase().includes('ok') || line.estado === 'Aberta';
              return (
                <div key={line.nome} className="flex items-center gap-1.5 text-xs">
                  <div className={`w-2.5 h-2.5 rounded-full ${metroColors[line.nome] || 'bg-muted'}`} />
                  <span className="text-muted-foreground">{line.nome}</span>
                  <span className={isOk ? 'text-green-500' : 'text-destructive font-medium'}>{isOk ? '✓' : line.estado}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Section for a provider's nearby stops ── */

function NearbySection({ title, badgeLabel, badgeClass, stops, isLoading, isFavorite, addFavorite, removeFavorite, cacheStop, onOpenTimetable, onOpenMap }: {
  title: string; badgeLabel: string; badgeClass: string;
  stops: TransportStop[] | undefined; isLoading: boolean;
  isFavorite: (id: string, p: TransportProvider) => boolean;
  addFavorite: (id: string, p: TransportProvider) => void;
  removeFavorite: (id: string, p: TransportProvider) => void;
  cacheStop: (s: TransportStop) => void;
  onOpenTimetable: (stop: TransportStop) => void;
  onOpenMap: (stop: TransportStop, routeId?: string, routeLabel?: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bus className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <Badge className={`text-[10px] px-1.5 py-0 ${badgeClass}`}>{badgeLabel}</Badge>
      </div>
      {isLoading && <LoadingState />}
      {stops && stops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stops.map(stop => (
            <StopCard
              key={`${stop.provider}-${stop.id}`}
              stop={stop}
              isFav={isFavorite(stop.id, stop.provider)}
              onAdd={() => { addFavorite(stop.id, stop.provider); cacheStop(stop); }}
              onRemove={() => removeFavorite(stop.id, stop.provider)}
              onOpenTimetable={() => onOpenTimetable(stop)}
              onOpenMap={(routeId, routeLabel) => onOpenMap(stop, routeId, routeLabel)}
            />
          ))}
        </div>
      )}
      {stops && stops.length === 0 && !isLoading && (
        <p className="text-sm text-muted-foreground">Nenhuma paragem encontrada por perto.</p>
      )}
    </div>
  );
}

/* ── Main page ── */

/* ── CM Stop Map Wrapper (fetches arrivals + vehicle positions) ── */
function CMStopMapWrapper({
  stop,
  routeId,
  routeLabel,
  onClose,
  userLat,
  userLon,
}: {
  stop: TransportStop;
  routeId: string;
  routeLabel?: string;
  onClose: () => void;
  userLat?: number;
  userLon?: number;
}) {
  const { data: vehicles, isLoading } = useVehiclePositions(routeId);

  return (
    <VehicleMapModal
      open
      onClose={onClose}
      title={`${stop.name} — Autocarro ${routeLabel || routeId.replace(/_\d+$/, '')}`}
      centerLat={stop.lat || 38.7223}
      centerLon={stop.lon || -9.1393}
      stopName={stop.name}
      vehicles={vehicles || []}
      isLoading={isLoading}
      userLat={userLat}
      userLon={userLon}
    />
  );
}

export default function Transportes() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useSearchStops(searchQuery);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoriteStops();
  const { position, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const { data: nearbyCM, isLoading: cmLoading } = useNearbyCMStops(position);
  const { data: nearbyCarris, isLoading: carrisLoading } = useNearbyCarrisStops(position);
  const isOnline = useIsOnline();
  const [stopNameCache, setStopNameCache] = useState<Record<string, { name: string; provider: TransportProvider; lat: number; lon: number }>>({});
  const [timetableStop, setTimetableStop] = useState<{ id: string; name: string } | null>(null);
  const [mapTarget, setMapTarget] = useState<{
    type: 'stop' | 'metro';
    stop?: TransportStop;
    routeId?: string;
    routeLabel?: string;
    stationId?: string;
    stationName?: string;
    stationLat?: number;
    stationLon?: number;
    destinationId?: string;
    destinationName?: string;
  } | null>(null);

  // Metro data for map
  const { data: metroStations } = useMetroStations();
  const { data: nearestStation } = useNearestMetroStation(position);
  const { data: metroWaitForMap } = useMetroWaitTimes(
    mapTarget?.type === 'metro' ? (mapTarget.stationId || null) : null
  );

  // Tick every 3s to animate metro position on map
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (mapTarget?.type !== 'metro') return;
    const interval = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, [mapTarget?.type]);

  const metroMapPositions = useMemo<MetroEstimatedPosition[]>(() => {
    // tick is used to force recalculation
    void tick;
    if (mapTarget?.type !== 'metro' || !metroWaitForMap || !metroStations || !mapTarget.destinationId) return [];

    const stationLat = mapTarget.stationLat || 0;
    const stationLon = mapTarget.stationLon || 0;

    const selectedWait = metroWaitForMap.find(
      (wt) =>
        wt.destination.id === mapTarget.destinationId ||
        wt.destination.name.toLowerCase() === mapTarget.destinationName?.toLowerCase()
    );

    if (!selectedWait?.arrivalTimes?.[0]) return [];

    const destStation = metroStations.find(
      (station) =>
        station.id === selectedWait.destination.id ||
        station.name.toLowerCase() === selectedWait.destination.name.toLowerCase()
    );

    if (!destStation) return [];

    const timeLeft = selectedWait.arrivalTimes[0].timeLeft;
    const [m = 0, s = 0] = timeLeft.split(':').map(Number);
    const totalSec = (Number.isFinite(m) ? m : 0) * 60 + (Number.isFinite(s) ? s : 0);
    // Subtract elapsed time since data was fetched (tick * 3s)
    const adjustedSec = Math.max(0, totalSec - (tick * 3 % totalSec));
    const progress = Math.max(0, Math.min(1, 1 - adjustedSec / 180));
    const lat = stationLat + (parseFloat(destStation.lat) - stationLat) * progress;
    const lon = stationLon + (parseFloat(destStation.lon) - stationLon) * progress;

    return [{
      lat,
      lon,
      destination: selectedWait.destination.name,
      timeLeft: formatMetroTimeLeft(timeLeft),
      live: selectedWait.live,
    }];
  }, [mapTarget, metroWaitForMap, metroStations, tick]);

  const openStopMap = (stop: TransportStop, routeId?: string, routeLabel?: string) => {
    if (!routeId) return;

    setMapTarget({ type: 'stop', stop, routeId, routeLabel });
  };

  const openMetroMap = (selection: {
    stationId: string;
    stationName: string;
    stationLat: number;
    stationLon: number;
    destinationId: string;
    destinationName: string;
  }) => {
    setMapTarget({
      type: 'metro',
      stationId: selection.stationId,
      stationName: selection.stationName,
      stationLat: selection.stationLat,
      stationLon: selection.stationLon,
      destinationId: selection.destinationId,
      destinationName: selection.destinationName,
    });
  };

  // Section ordering (persisted in localStorage)
  type SectionId = 'favorites' | 'metro' | 'nearby';
  const defaultOrder: SectionId[] = ['favorites', 'metro', 'nearby'];
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(() => {
    try {
      const saved = localStorage.getItem('transport-section-order');
      if (saved) {
        const parsed = JSON.parse(saved) as SectionId[];
        if (Array.isArray(parsed) && parsed.length === 3) return parsed;
      }
    } catch {}
    return defaultOrder;
  });
  const [draggedSection, setDraggedSection] = useState<SectionId | null>(null);
  const [dragOverSection, setDragOverSection] = useState<SectionId | null>(null);

  const handleDrop = useCallback((targetId: SectionId) => {
    if (!draggedSection || draggedSection === targetId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }
    setSectionOrder(prev => {
      const newOrder = [...prev];
      const fromIdx = newOrder.indexOf(draggedSection);
      const toIdx = newOrder.indexOf(targetId);
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, draggedSection);
      localStorage.setItem('transport-section-order', JSON.stringify(newOrder));
      return newOrder;
    });
    setDraggedSection(null);
    setDragOverSection(null);
  }, [draggedSection]);

  const cacheStop = (stop: TransportStop) =>
    setStopNameCache(prev => ({
      ...prev,
      [`${stop.provider}-${stop.id}`]: { name: stop.name, provider: stop.provider, lat: stop.lat, lon: stop.lon },
    }));

  const openTimetable = (stop: TransportStop) => setTimetableStop({ id: stop.id, name: stop.name });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transportes</h1>
            <p className="text-sm text-muted-foreground">Carris · Carris Metropolitana · Metro</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={requestLocation} disabled={geoLoading}>
          {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">Localização</span>
        </Button>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 text-sm bg-muted rounded-lg p-3">
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>Sem internet — a mostrar dados guardados das favoritas.</span>
        </div>
      )}

      {geoError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{geoError}. Pode pesquisar paragens manualmente.</span>
        </div>
      )}

      {/* Reorderable sections */}
      {sectionOrder.map((sectionId, idx) => {
        const isDragging = draggedSection === sectionId;
        const isDragOver = dragOverSection === sectionId;

        const dragHandleProps = {
          draggable: true,
          onDragStart: (e: React.DragEvent) => { e.dataTransfer.effectAllowed = 'move'; setDraggedSection(sectionId); },
          onDragEnd: () => { setDraggedSection(null); setDragOverSection(null); },
          onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverSection(sectionId); },
          onDragLeave: () => setDragOverSection(null),
          onDrop: (e: React.DragEvent) => { e.preventDefault(); handleDrop(sectionId); },
        };

        const wrapperClass = `transition-all duration-200 ${isDragging ? 'opacity-40 scale-[0.98]' : ''} ${isDragOver && !isDragging ? 'ring-2 ring-primary/30 rounded-lg' : ''}`;

        if (sectionId === 'favorites' && favorites.length > 0) {
          return (
            <div key="favorites" className={wrapperClass} {...dragHandleProps}>
              <div className="flex items-center gap-2 mb-4 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <h2 className="text-lg font-semibold text-foreground">Paragens favoritas</h2>
                <Badge variant="secondary" className="text-xs">{favorites.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map(fav => {
                  const cached = stopNameCache[`${fav.provider}-${fav.id}`];
                  const stop: TransportStop = {
                    id: fav.id,
                    name: cached?.name || fav.id,
                    lat: cached?.lat || 0,
                    lon: cached?.lon || 0,
                    provider: fav.provider,
                  };
                  return (
                    <StopCard
                      key={`fav-${fav.provider}-${fav.id}`}
                      stop={stop}
                      isFav
                      onRemove={() => removeFavorite(fav.id, fav.provider)}
                      onOpenTimetable={() => openTimetable(stop)}
                      onOpenMap={(routeId, routeLabel) => openStopMap(stop, routeId, routeLabel)}
                    />
                  );
                })}
              </div>
              {idx < sectionOrder.length - 1 && <Separator className="mt-6" />}
            </div>
          );
        }

        if (sectionId === 'metro') {
          return (
            <div key="metro" className={wrapperClass} {...dragHandleProps}>
              <div className="flex items-center gap-2 mb-4 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <Train className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Metro</h2>
              </div>
              <MetroStatusCard position={position} onOpenMap={openMetroMap} />
              {idx < sectionOrder.length - 1 && <Separator className="mt-6" />}
            </div>
          );
        }

        if (sectionId === 'nearby' && position) {
          return (
            <div key="nearby" className={wrapperClass} {...dragHandleProps}>
              <div className="flex items-center gap-2 mb-4 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <Navigation className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Paragens próximas</h2>
              </div>

              <NearbySection
                title="Carris"
                badgeLabel="Lisboa"
                badgeClass={providerBadgeClass.carris}
                stops={nearbyCarris}
                isLoading={carrisLoading}
                isFavorite={isFavorite}
                addFavorite={addFavorite}
                removeFavorite={removeFavorite}
                cacheStop={cacheStop}
                onOpenTimetable={openTimetable}
                onOpenMap={openStopMap}
              />

              <NearbySection
                title="Carris Metropolitana"
                badgeLabel="Área Metropolitana"
                badgeClass={providerBadgeClass.cm}
                stops={nearbyCM}
                isLoading={cmLoading}
                isFavorite={isFavorite}
                addFavorite={addFavorite}
                removeFavorite={removeFavorite}
                cacheStop={cacheStop}
                onOpenTimetable={openTimetable}
                onOpenMap={openStopMap}
              />
              {idx < sectionOrder.length - 1 && <Separator className="mt-6" />}
            </div>
          );
        }

        return null;
      })}

      {favorites.length === 0 && !position && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Bus className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Ative a localização para ver paragens próximas, ou pesquise manualmente.</p>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <RefreshCw className="h-3 w-3" />
        CM: tempo real (30s) · Metro: tempo real · Carris: horário previsto (GTFS)
      </p>

      {timetableStop && (
        <CarrisTimetableModal
          open={!!timetableStop}
          onClose={() => setTimetableStop(null)}
          stopId={timetableStop.id}
          stopName={timetableStop.name}
        />
      )}

      {mapTarget && mapTarget.type === 'metro' && (
        <VehicleMapModal
          open
          onClose={() => { setMapTarget(null); setTick(0); }}
          title={`Metro — ${mapTarget.stationName}${mapTarget.destinationName ? ` → ${mapTarget.destinationName}` : ''}`}
          centerLat={mapTarget.stationLat || 38.7223}
          centerLon={mapTarget.stationLon || -9.1393}
          stopName={mapTarget.stationName}
          metroPositions={metroMapPositions}
          userLat={position?.lat}
          userLon={position?.lon}
        />
      )}

      {mapTarget && mapTarget.type === 'stop' && mapTarget.stop && mapTarget.routeId && (
        <CMStopMapWrapper
          stop={mapTarget.stop}
          routeId={mapTarget.routeId}
          routeLabel={mapTarget.routeLabel}
          onClose={() => setMapTarget(null)}
          userLat={position?.lat}
          userLon={position?.lon}
        />
      )}
    </div>
  );
}
