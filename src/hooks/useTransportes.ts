import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import carrisStopsRaw from '@/data/carrisStops.json';

const CM_API = 'https://api.carrismetropolitana.pt/v2';
const CARRIS_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carris-schedule`;
const METRO_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/metro-status`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const FAVORITES_KEY = 'transportes_paragens_favoritas';

export type TransportProvider = 'cm' | 'carris';

export interface TransportStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locality?: string;
  distance?: number;
  provider: TransportProvider;
}

export interface Arrival {
  estimated_arrival_unix: number;
  scheduled_arrival_unix: number;
  route_id: string;
  pattern_id: string;
}

export interface CarrisDeparture {
  t: string;
  r: string;
  s: string;
}

export interface MetroLine {
  nome: string;
  estado: string;
}

export interface GeoPosition {
  lat: number;
  lon: number;
}

// Pre-parsed Carris stops (embedded, instant)
const carrisStops: TransportStop[] = (carrisStopsRaw as any[]).map(
  (s: [string, string, number, number]) => ({
    id: s[0], name: s[1], lat: s[2], lon: s[3], provider: 'carris' as TransportProvider
  })
);

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geolocation
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocalização não suportada'); return; }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLoading(false); },
      (err) => { setError(err.code === 1 ? 'Permissão negada' : 'Erro ao obter localização'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);
  return { position, error, loading, requestLocation };
}

// CM Stops cache
let cmStopsCache: TransportStop[] | null = null;
let cmFetchPromise: Promise<TransportStop[]> | null = null;

async function fetchCMStops(): Promise<TransportStop[]> {
  if (cmStopsCache) return cmStopsCache;
  if (cmFetchPromise) return cmFetchPromise;
  cmFetchPromise = fetch(`${CM_API}/stops`).then(async (res) => {
    if (!res.ok) throw new Error('Erro');
    const json = await res.json();
    const stops = (Array.isArray(json) ? json : json.data || []).map((s: any) => ({
      ...s, provider: 'cm' as TransportProvider
    }));
    cmStopsCache = stops;
    return stops;
  }).finally(() => { cmFetchPromise = null; });
  return cmFetchPromise;
}

function addDistanceAndSort(stops: TransportStop[], position: GeoPosition, max: number): TransportStop[] {
  return stops
    .map(s => ({ ...s, distance: haversine(position.lat, position.lon, s.lat, s.lon) }))
    .sort((a, b) => a.distance! - b.distance!)
    .slice(0, max);
}

// Nearby CM stops
export function useNearbyCMStops(position: GeoPosition | null, max = 6) {
  return useQuery({
    queryKey: ['cm-nearby', position?.lat, position?.lon],
    queryFn: async () => {
      if (!position) return [];
      const stops = await fetchCMStops();
      return addDistanceAndSort(stops, position, max);
    },
    enabled: !!position,
    staleTime: 60_000,
  });
}

// Nearby Carris stops (INSTANT - embedded data)
export function useNearbyCarrisStops(position: GeoPosition | null, max = 6) {
  return useQuery({
    queryKey: ['carris-nearby', position?.lat, position?.lon],
    queryFn: () => {
      if (!position) return [];
      return addDistanceAndSort(carrisStops, position, max);
    },
    enabled: !!position,
    staleTime: Infinity, // static data, never stale
  });
}

// Favorites
export function useFavoriteStops() {
  const [favorites, setFavorites] = useState<{ id: string; provider: TransportProvider }[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);

  const addFavorite = (stopId: string, provider: TransportProvider) =>
    setFavorites(prev => prev.some(f => f.id === stopId && f.provider === provider) ? prev : [...prev, { id: stopId, provider }]);
  const removeFavorite = (stopId: string, provider: TransportProvider) =>
    setFavorites(prev => prev.filter(f => !(f.id === stopId && f.provider === provider)));
  const isFavorite = (stopId: string, provider: TransportProvider) =>
    favorites.some(f => f.id === stopId && f.provider === provider);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}

// Search stops (both)
export function useSearchStops(query: string) {
  return useQuery({
    queryKey: ['all-stops-search', query],
    queryFn: async (): Promise<TransportStop[]> => {
      if (!query || query.length < 2) return [];
      const cm = await fetchCMStops().catch(() => [] as TransportStop[]);
      const all = [...carrisStops, ...cm];
      const q = query.toLowerCase();
      return all
        .filter(s => s.name?.toLowerCase().includes(q) || s.id?.toLowerCase().includes(q) || s.locality?.toLowerCase().includes(q))
        .slice(0, 25);
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

// CM Arrivals (real-time)
export function useCMArrivals(stopId: string | null) {
  return useQuery({
    queryKey: ['cm-arrivals', stopId],
    queryFn: async (): Promise<Arrival[]> => {
      if (!stopId) return [];
      const res = await fetch(`${CM_API}/arrivals/by_stop/${stopId}`);
      if (!res.ok) throw new Error('Erro');
      const json = await res.json();
      const arrivals: Arrival[] = Array.isArray(json) ? json : json.data || [];
      const now = Math.floor(Date.now() / 1000);
      return arrivals
        .filter(a => (a.estimated_arrival_unix || a.scheduled_arrival_unix) > now)
        .sort((a, b) => (a.estimated_arrival_unix || a.scheduled_arrival_unix) - (b.estimated_arrival_unix || b.scheduled_arrival_unix))
        .slice(0, 10);
    },
    enabled: !!stopId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// Carris Schedule (GTFS via edge function)
export function useCarrisSchedule(stopId: string | null) {
  return useQuery({
    queryKey: ['carris-schedule', stopId],
    queryFn: async (): Promise<{ stop: any; departures: CarrisDeparture[] }> => {
      if (!stopId) return { stop: null, departures: [] };
      const res = await fetch(`${CARRIS_FN_URL}?action=schedule&stop_id=${stopId}`, {
        headers: { 'Authorization': `Bearer ${ANON_KEY}` }
      });
      if (!res.ok) throw new Error('Erro');
      return res.json();
    },
    enabled: !!stopId,
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
    retry: 2,
  });
}

// Metro status
export function useMetroStatus() {
  return useQuery({
    queryKey: ['metro-status'],
    queryFn: async (): Promise<MetroLine[]> => {
      try {
        const res = await fetch(METRO_FN_URL, {
          headers: { 'Authorization': `Bearer ${ANON_KEY}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return Array.isArray(parsed?.resposta) ? parsed.resposta : [];
      } catch { return []; }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function formatMinutesUntil(unixTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, Math.round((unixTimestamp - now) / 60));
  if (diff === 0) return 'A chegar';
  if (diff === 1) return '1 min';
  return `${diff} min`;
}

export function formatTimeUntil(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diff = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60000));
  if (diff === 0) return 'A chegar';
  if (diff === 1) return '1 min';
  if (diff > 60) return timeStr;
  return `${diff} min`;
}
