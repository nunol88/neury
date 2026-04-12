import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bus, Search, Star, StarOff, Clock, MapPin,
  RefreshCw, Train, Loader2, AlertCircle, Navigation, LocateFixed, WifiOff, CalendarDays
} from 'lucide-react';
import CarrisTimetableModal from '@/components/schedule/CarrisTimetableModal';
import {
  useSearchStops,
  useCMArrivals,
  useCarrisSchedule,
  useMetroStatus,
  useNearestMetroStation,
  useMetroWaitTimes,
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

const providerBadgeClass: Record<TransportProvider, string> = {
  cm: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  carris: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

/* ── Arrival sub-components ── */

function CMStopArrivals({ stopId }: { stopId: string }) {
  const { data: arrivals, isLoading, isError } = useCMArrivals(stopId);
  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState />;
  if (!arrivals || arrivals.length === 0) return <EmptyState />;
  return (
    <div className="space-y-1.5">
      {arrivals.map((a, i) => {
        const time = a.estimated_arrival_unix || a.scheduled_arrival_unix;
        const route = a.route_id?.replace(/_\d+$/, '') || '—';
        return (
          <div key={`${a.pattern_id}-${i}`} className="flex items-center justify-between text-sm py-1">
            <Badge variant="secondary" className="text-xs font-mono px-1.5">{route}</Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="font-medium text-foreground">{formatMinutesUntil(time)}</span>
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

function StopCard({ stop, onAdd, onRemove, isFav, onOpenTimetable }: {
  stop: TransportStop; onAdd?: () => void; onRemove?: () => void; isFav?: boolean;
  onOpenTimetable?: () => void;
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
        {stop.provider === 'cm' ? <CMStopArrivals stopId={stop.id} /> : <CarrisStopSchedule stopId={stop.id} />}
      </CardContent>
    </Card>
  );
}

/* ── Metro ── */

function MetroStatusCard({ position }: { position: GeoPosition | null }) {
  const { data: lines, isLoading: statusLoading } = useMetroStatus();
  const { data: nearestStation } = useNearestMetroStation(position);
  const { data: waitTimes, isLoading: waitLoading } = useMetroWaitTimes(nearestStation?.id || null);
  const [expanded, setExpanded] = useState(false);

  const hasStatus = lines && lines.length > 0;
  const hasWait = waitTimes && waitTimes.length > 0;

  if (!hasStatus && !hasWait && !statusLoading && !waitLoading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Train className="h-4 w-4" /> Metro de Lisboa
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Line status */}
        {statusLoading ? <LoadingState /> : hasStatus && (
          <div className="space-y-1.5">
            {lines?.map(line => (
              <div key={line.nome} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${metroColors[line.nome] || 'bg-muted'}`} />
                  <span>{line.nome}</span>
                </div>
                <Badge variant={line.estado.toLowerCase().includes('ok') || line.estado === 'Aberta' ? 'default' : 'destructive'} className="text-xs">{line.estado}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Nearest station wait times */}
        {nearestStation && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium">
                  Estação mais próxima: <span className="text-foreground">{nearestStation.name}</span>
                </span>
                {(nearestStation as any).distance != null && (
                  <span className="text-[10px] text-muted-foreground">
                    ({((nearestStation as any).distance * 1000).toFixed(0)}m)
                  </span>
                )}
              </div>
              {waitLoading ? <LoadingState /> : hasWait ? (
                <div className="space-y-2">
                  {waitTimes!.map((wt, i) => (
                    <div key={`${wt.destination.id}-${i}`}>
                      <div className="flex items-center justify-between text-sm py-0.5">
                        <span className="text-xs text-muted-foreground">→ {wt.destination.name}</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {wt.arrivalTimes?.[0] ? formatMetroTimeLeft(wt.arrivalTimes[0].timeLeft) : '—'}
                          </span>
                          {wt.live && <span className="text-[9px] text-green-500">●</span>}
                        </div>
                      </div>
                      {expanded && wt.arrivalTimes?.slice(1).map((at, j) => (
                        <div key={j} className="flex justify-end text-xs text-muted-foreground py-0.5">
                          {formatMetroTimeLeft(at.timeLeft)}
                        </div>
                      ))}
                    </div>
                  ))}
                  {waitTimes!.some(wt => wt.arrivalTimes?.length > 1) && (
                    <button
                      onClick={() => setExpanded(!expanded)}
                      className="text-xs text-primary hover:underline w-full text-center py-1"
                    >
                      {expanded ? 'Mostrar menos ▲' : 'Ver mais horários ▼'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sem tempos de espera disponíveis</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Section for a provider's nearby stops ── */

function NearbySection({ title, badgeLabel, badgeClass, stops, isLoading, isFavorite, addFavorite, removeFavorite, cacheStop, onOpenTimetable }: {
  title: string; badgeLabel: string; badgeClass: string;
  stops: TransportStop[] | undefined; isLoading: boolean;
  isFavorite: (id: string, p: TransportProvider) => boolean;
  addFavorite: (id: string, p: TransportProvider) => void;
  removeFavorite: (id: string, p: TransportProvider) => void;
  cacheStop: (s: TransportStop) => void;
  onOpenTimetable: (stop: TransportStop) => void;
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

export default function Transportes() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useSearchStops(searchQuery);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoriteStops();
  const { position, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const { data: nearbyCM, isLoading: cmLoading } = useNearbyCMStops(position);
  const { data: nearbyCarris, isLoading: carrisLoading } = useNearbyCarrisStops(position);
  const isOnline = useIsOnline();
  const [stopNameCache, setStopNameCache] = useState<Record<string, { name: string; provider: TransportProvider }>>({});
  const [timetableStop, setTimetableStop] = useState<{ id: string; name: string } | null>(null);

  const cacheStop = (stop: TransportStop) =>
    setStopNameCache(prev => ({ ...prev, [`${stop.provider}-${stop.id}`]: { name: stop.name, provider: stop.provider } }));

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

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Pesquisar paragem por nome ou ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          {searching && <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3"><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>A pesquisar...</span></div>}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map(stop => (
                <button
                  key={`${stop.provider}-${stop.id}`}
                  onClick={() => { addFavorite(stop.id, stop.provider); cacheStop(stop); setSearchQuery(''); }}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stop.id}{stop.locality ? ` · ${stop.locality}` : ''}
                      <Badge className={`ml-1.5 text-[10px] px-1 py-0 ${providerBadgeClass[stop.provider]}`}>
                        {stop.provider === 'carris' ? 'Carris' : 'CM'}
                      </Badge>
                    </p>
                  </div>
                  {isFavorite(stop.id, stop.provider) ? (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                  ) : (
                    <Star className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults && searchResults.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground mt-3">Nenhuma paragem encontrada</p>
          )}
        </CardContent>
      </Card>

      {/* Metro */}
      <MetroStatusCard position={position} />

      {/* Nearby — separated by provider */}
      {position && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
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
          />
        </>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Paragens favoritas</h2>
            <Badge variant="secondary" className="text-xs">{favorites.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map(fav => {
              const cached = stopNameCache[`${fav.provider}-${fav.id}`];
              const stop: TransportStop = { id: fav.id, name: cached?.name || fav.id, lat: 0, lon: 0, provider: fav.provider };
              return (
                <StopCard
                  key={`fav-${fav.provider}-${fav.id}`}
                  stop={stop}
                  isFav
                  onRemove={() => removeFavorite(fav.id, fav.provider)}
                  onOpenTimetable={() => openTimetable(stop)}
                />
              );
            })}
          </div>
        </>
      )}

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
        CM: tempo real (30s) · Carris: horário previsto (GTFS)
      </p>

      {timetableStop && (
        <CarrisTimetableModal
          open={!!timetableStop}
          onClose={() => setTimetableStop(null)}
          stopId={timetableStop.id}
          stopName={timetableStop.name}
        />
      )}
    </div>
  );
}
