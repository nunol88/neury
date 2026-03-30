import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bus, Search, Star, StarOff, Clock, MapPin, 
  RefreshCw, Train, Loader2, AlertCircle 
} from 'lucide-react';
import {
  useSearchStops,
  useStopArrivals,
  useStopInfo,
  useMetroStatus,
  useFavoriteStops,
  formatMinutesUntil,
  type CarrisStop,
} from '@/hooks/useTransportes';

// Metro line colors
const metroColors: Record<string, string> = {
  Azul: 'bg-blue-500',
  Amarela: 'bg-yellow-400',
  Verde: 'bg-green-500',
  Vermelha: 'bg-red-500',
};

function StopArrivals({ stopId, stopName, onRemove }: { stopId: string; stopName?: string; onRemove?: () => void }) {
  const { data: arrivals, isLoading, isError } = useStopArrivals(stopId);
  const { data: stopInfo } = useStopInfo(stopId);
  
  const name = stopName || stopInfo?.name || stopId;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <CardTitle className="text-sm font-medium truncate">{name}</CardTitle>
            <p className="text-xs text-muted-foreground">{stopId}</p>
          </div>
        </div>
        {onRemove && (
          <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onRemove}>
            <StarOff className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>A carregar...</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-2 text-sm text-destructive py-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Erro ao carregar</span>
          </div>
        )}
        {arrivals && arrivals.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground py-2">Sem próximas chegadas</p>
        )}
        {arrivals && arrivals.length > 0 && (
          <div className="space-y-1.5">
            {arrivals.map((arrival, idx) => {
              const time = arrival.estimated_arrival_unix || arrival.scheduled_arrival_unix;
              const routeLabel = arrival.route_id?.replace(/_\d+$/, '') || '—';
              return (
                <div key={`${arrival.pattern_id}-${idx}`} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-mono px-1.5">
                      {routeLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium text-foreground">{formatMinutesUntil(time)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetroStatusCard() {
  const { data: lines, isLoading, isError } = useMetroStatus();

  if (isError || (!isLoading && (!lines || lines.length === 0))) {
    return null; // Don't show metro card if API is unavailable (CORS)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Train className="h-4 w-4" />
          Metro de Lisboa
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>A carregar...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {lines?.map((line) => (
              <div key={line.nome} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${metroColors[line.nome] || 'bg-muted'}`} />
                  <span>{line.nome}</span>
                </div>
                <Badge variant={line.estado === 'Aberta' ? 'default' : 'destructive'} className="text-xs">
                  {line.estado}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Transportes() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults, isLoading: searching } = useSearchStops(searchQuery);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavoriteStops();
  const [stopNames, setStopNames] = useState<Record<string, string>>({});

  const handleAddFavorite = (stop: CarrisStop) => {
    addFavorite(stop.id);
    setStopNames(prev => ({ ...prev, [stop.id]: stop.name }));
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bus className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transportes</h1>
          <p className="text-sm text-muted-foreground">
            Tempos de espera em tempo real — Carris Metropolitana
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar paragem por nome ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {searching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>A pesquisar...</span>
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="mt-3 space-y-1 max-h-60 overflow-y-auto">
              {searchResults.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => handleAddFavorite(stop)}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stop.id} {stop.locality ? `· ${stop.locality}` : ''}
                    </p>
                  </div>
                  {isFavorite(stop.id) ? (
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

      {/* Metro Status */}
      <MetroStatusCard />

      {/* Favorite stops with arrivals */}
      {favorites.length > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h2 className="text-lg font-semibold text-foreground">Paragens favoritas</h2>
            <Badge variant="secondary" className="text-xs">{favorites.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((stopId) => (
              <StopArrivals 
                key={stopId} 
                stopId={stopId} 
                stopName={stopNames[stopId]}
                onRemove={() => removeFavorite(stopId)} 
              />
            ))}
          </div>
        </>
      )}

      {favorites.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Bus className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Pesquise e adicione paragens favoritas para ver os tempos de espera em tempo real.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
        <RefreshCw className="h-3 w-3" />
        Atualiza automaticamente a cada 30 segundos
      </p>
    </div>
  );
}
