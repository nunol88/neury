import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CM_API = 'https://api.carrismetropolitana.pt/v2';
const FAVORITES_KEY = 'transportes_paragens_favoritas';

export type TransportProvider = 'cm' | 'carris';

export interface TransportStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locality?: string;
  municipality_name?: string;
  distance?: number;
  provider: TransportProvider;
}

export interface Arrival {
  estimated_arrival: string;
  estimated_arrival_unix: number;
  scheduled_arrival: string;
  scheduled_arrival_unix: number;
  route_id: string;
  pattern_id: string;
  stop_sequence: number;
}

export interface CarrisDeparture {
  t: string; // HH:MM
  r: string; // route number
  s: string; // service type
}

export interface MetroLine {
  nome: string;
  estado: string;
}

export interface GeoPosition {
  lat: number;
  lon: number;
}

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

// Carris stops cache
let carrisStopsCache: TransportStop[] | null = null;
let carrisFetchPromise: Promise<TransportStop[]> | null = null;

async function fetchCarrisStops(): Promise<TransportStop[]> {
  if (carrisStopsCache) return carrisStopsCache;
  if (carrisFetchPromise) return carrisFetchPromise;
  carrisFetchPromise = supabase.functions.invoke('carris-schedule', {
    body: null,
    headers: {},
  }).then(({ data, error }) => {
    if (error) throw error;
    const stops = (Array.isArray(data) ? data : []).map((s: any) => ({
      ...s, provider: 'carris' as TransportProvider
    }));
    carrisStopsCache = stops;
    return stops;
  }).catch(() => {
    // Fallback: try with query param
    return fetch(`${window.location.origin}/functions/v1/carris-schedule?action=stops`)
      .then(r => r.json())
      .then(data => {
        const stops = (Array.isArray(data) ? data : []).map((s: any) => ({
          ...s, provider: 'carris' as TransportProvider
        }));
        carrisStopsCache = stops;
        return stops;
      }).catch(() => []);
  }).finally(() => { carrisFetchPromise = null; });
  return carrisFetchPromise;
}

// All stops (both providers)
async function fetchAllStops(): Promise<TransportStop[]> {
  const [cm, carris] = await Promise.all([fetchCMStops().catch(() => []), fetchCarrisStops().catch(() => [])]);
  return [...cm, ...carris];
}

// Nearby stops
export function useNearbyStops(position: GeoPosition | null, maxResults = 10) {
  return useQuery({
    queryKey: ['all-nearby', position?.lat, position?.lon],
    queryFn: async (): Promise<TransportStop[]> => {
      if (!position) return [];
      const stops = await fetchAllStops();
      return stops
        .map(s => ({ ...s, distance: haversine(position.lat, position.lon, s.lat, s.lon) }))
        .sort((a, b) => a.distance! - b.distance!)
        .slice(0, maxResults);
    },
    enabled: !!position,
    staleTime: 60_000,
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

// Search stops (both providers)
export function useSearchStops(query: string) {
  return useQuery({
    queryKey: ['all-stops-search', query],
    queryFn: async (): Promise<TransportStop[]> => {
      if (!query || query.length < 2) return [];
      const stops = await fetchAllStops();
      const q = query.toLowerCase();
      return stops
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

// Carris Schedule (static GTFS)
export function useCarrisSchedule(stopId: string | null) {
  return useQuery({
    queryKey: ['carris-schedule', stopId],
    queryFn: async (): Promise<{ stop: any; departures: CarrisDeparture[] }> => {
      if (!stopId) return { stop: null, departures: [] };
      const { data, error } = await supabase.functions.invoke('carris-schedule', {
        headers: {},
        body: null,
      });
      // Need to call with query params - use fetch directly
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/carris-schedule?action=schedule&stop_id=${stopId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }
      });
      if (!res.ok) throw new Error('Erro');
      return res.json();
    },
    enabled: !!stopId,
    refetchInterval: 5 * 60_000, // 5 min - it's static data
    staleTime: 60_000,
  });
}

// Metro status
export function useMetroStatus() {
  return useQuery({
    queryKey: ['metro-status'],
    queryFn: async (): Promise<MetroLine[]> => {
      try {
        const { data, error } = await supabase.functions.invoke('metro-status');
        if (error) throw error;
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
