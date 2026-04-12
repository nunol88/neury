import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, WifiOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TIMETABLE_CACHE_KEY = 'transportes_timetable_cache';

interface TimetableEntry {
  time: string;
  route: string;
}

interface GroupedTimetable {
  w: Record<string, string[]>; // weekday: route -> times
  s: Record<string, string[]>; // saturday
  u: Record<string, string[]>; // sunday
}

function saveTimetableCache(stopId: string, entries: string[]) {
  try {
    const cache = JSON.parse(localStorage.getItem(TIMETABLE_CACHE_KEY) || '{}');
    cache[stopId] = { entries, ts: Date.now() };
    localStorage.setItem(TIMETABLE_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

function getTimetableCache(stopId: string): string[] | null {
  try {
    const cache = JSON.parse(localStorage.getItem(TIMETABLE_CACHE_KEY) || '{}');
    return cache[stopId]?.entries ?? null;
  } catch { return null; }
}

function useFullTimetable(stopId: string | null) {
  return useQuery({
    queryKey: ['carris-timetable', stopId],
    queryFn: async (): Promise<string[]> => {
      if (!stopId) return [];
      try {
        const { data, error } = await supabase
          .from('carris_schedules')
          .select('entries')
          .eq('stop_id', stopId)
          .maybeSingle();
        if (error) throw error;
        const entries: string[] = (data as any)?.entries || [];
        saveTimetableCache(stopId, entries);
        return entries;
      } catch {
        const cached = getTimetableCache(stopId);
        if (cached) return cached;
        throw new Error('Offline sem cache');
      }
    },
    enabled: !!stopId,
    staleTime: 24 * 60 * 60 * 1000, // 24h - static data
  });
}

function groupEntries(entries: string[]): GroupedTimetable {
  const result: GroupedTimetable = { w: {}, s: {}, u: {} };
  for (const entry of entries) {
    const [time, route, dayType] = entry.split('|');
    const dt = dayType as 'w' | 's' | 'u';
    if (!result[dt]) continue;
    const routeKey = route;
    if (!result[dt][routeKey]) result[dt][routeKey] = [];
    result[dt][routeKey].push(time);
  }
  // Sort times within each route
  for (const dt of ['w', 's', 'u'] as const) {
    for (const route in result[dt]) {
      result[dt][route].sort();
    }
  }
  return result;
}

const dayTypeLabels: Record<string, string> = {
  w: 'Dias Úteis',
  s: 'Sábados',
  u: 'Domingos e Feriados',
};

function RouteTimesGrid({ times, route }: { times: Record<string, string[]>; route?: string }) {
  const routes = route ? [route] : Object.keys(times).sort();
  if (routes.length === 0) return <p className="text-sm text-muted-foreground py-4 text-center">Sem horários disponíveis</p>;

  return (
    <div className="space-y-4">
      {routes.map(r => {
        const routeTimes = times[r] || [];
        if (routeTimes.length === 0) return null;
        // Group by hour
        const byHour: Record<string, string[]> = {};
        for (const t of routeTimes) {
          const h = t.substring(0, 2);
          if (!byHour[h]) byHour[h] = [];
          byHour[h].push(t.substring(3));
        }
        const hours = Object.keys(byHour).sort();

        return (
          <div key={r}>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="font-mono text-xs px-1.5">{r}</Badge>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-1 px-2 font-medium text-muted-foreground w-12">Hora</th>
                    <th className="text-left py-1 px-2 font-medium text-muted-foreground">Minutos</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map(h => (
                    <tr key={h} className="border-t border-border/50">
                      <td className="py-1 px-2 font-mono font-semibold text-foreground align-top">{h}</td>
                      <td className="py-1 px-2 font-mono text-muted-foreground">
                        {byHour[h].join('  ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CarrisTimetableModalProps {
  open: boolean;
  onClose: () => void;
  stopId: string;
  stopName: string;
}

export default function CarrisTimetableModal({ open, onClose, stopId, stopName }: CarrisTimetableModalProps) {
  const { data: entries, isLoading, isError } = useFullTimetable(open ? stopId : null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const grouped = useMemo(() => entries ? groupEntries(entries) : null, [entries]);

  const allRoutes = useMemo(() => {
    if (!grouped) return [];
    const set = new Set<string>();
    for (const dt of ['w', 's', 'u'] as const) {
      for (const r in grouped[dt]) set.add(r);
    }
    return Array.from(set).sort();
  }, [grouped]);

  const isOffline = !navigator.onLine;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Horário Completo
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{stopName} <span className="text-xs">({stopId})</span></p>
        </DialogHeader>

        {isOffline && (
          <div className="flex items-center gap-2 text-xs bg-muted rounded-md p-2">
            <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Modo offline — dados guardados localmente</span>
          </div>
        )}

        {/* Route filter */}
        {allRoutes.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant={selectedRoute === null ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedRoute(null)}
            >
              Todas
            </Badge>
            {allRoutes.map(r => (
              <Badge
                key={r}
                variant={selectedRoute === r ? 'default' : 'outline'}
                className="cursor-pointer text-xs font-mono"
                onClick={() => setSelectedRoute(r)}
              >
                {r}
              </Badge>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Clock className="h-4 w-4 animate-pulse" />
            A carregar horário...
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive py-4 text-center">Erro ao carregar. Adicione aos favoritos com internet para guardar offline.</p>
        )}

        {grouped && (
          <Tabs defaultValue="w" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="w" className="text-xs">Dias Úteis</TabsTrigger>
              <TabsTrigger value="s" className="text-xs">Sábados</TabsTrigger>
              <TabsTrigger value="u" className="text-xs">Dom/Feriados</TabsTrigger>
            </TabsList>
            {(['w', 's', 'u'] as const).map(dt => (
              <TabsContent key={dt} value={dt} className="mt-3">
                <RouteTimesGrid
                  times={selectedRoute ? { [selectedRoute]: grouped[dt][selectedRoute] || [] } : grouped[dt]}
                  route={selectedRoute || undefined}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Dados GTFS da Carris · Disponíveis offline após primeira consulta
        </p>
      </DialogContent>
    </Dialog>
  );
}
