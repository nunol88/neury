import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CARRIS_API = 'https://api.carrismetropolitana.pt/v2';
const FAVORITES_KEY = 'transportes_paragens_favoritas';

export interface CarrisStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locality?: string;
  municipality_name?: string;
  distance?: number; // km from user
}

export interface Arrival {
  estimated_arrival: string;
  estimated_arrival_unix: number;
  scheduled_arrival: string;
  scheduled_arrival_unix: number;
  observed_arrival?: string;
  observed_arrival_unix?: number;
  route_id: string;
  pattern_id: string;
  trip_id?: string;
  stop_sequence: number;
  line_id?: string;
}

export interface MetroLine {
  nome: string;
  estado: string;
  tempo?: string;
}

export interface GeoPosition {
  lat: number;
  lon: number;
}

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geolocation hook
export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.code === 1 ? 'Permissão negada' : 'Erro ao obter localização');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { position, error, loading, requestLocation };
}

// All stops cache (for nearby + search)
let stopsCache: CarrisStop[] | null = null;
let stopsFetchPromise: Promise<CarrisStop[]> | null = null;

async function fetchAllStops(): Promise<CarrisStop[]> {
  if (stopsCache) return stopsCache;
  if (stopsFetchPromise) return stopsFetchPromise;
  
  stopsFetchPromise = fetch(`${CARRIS_API}/stops`)
    .then(async (res) => {
      if (!res.ok) throw new Error('Erro ao buscar paragens');
      const json = await res.json();
      const stops: CarrisStop[] = Array.isArray(json) ? json : json.data || [];
      stopsCache = stops;
      return stops;
    })
    .finally(() => { stopsFetchPromise = null; });
  
  return stopsFetchPromise;
}

// Nearby stops based on geolocation
export function useNearbyStops(position: GeoPosition | null, maxResults = 8) {
  return useQuery({
    queryKey: ['carris-nearby', position?.lat, position?.lon],
    queryFn: async (): Promise<CarrisStop[]> => {
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

// Favorites management
export function useFavoriteStops() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (stopId: string) =>
    setFavorites(prev => prev.includes(stopId) ? prev : [...prev, stopId]);
  const removeFavorite = (stopId: string) =>
    setFavorites(prev => prev.filter(id => id !== stopId));
  const isFavorite = (stopId: string) => favorites.includes(stopId);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}

// Search stops
export function useSearchStops(query: string) {
  return useQuery({
    queryKey: ['carris-stops-search', query],
    queryFn: async (): Promise<CarrisStop[]> => {
      if (!query || query.length < 2) return [];
      const stops = await fetchAllStops();
      const q = query.toLowerCase();
      return stops
        .filter(s =>
          s.name?.toLowerCase().includes(q) ||
          s.id?.toLowerCase().includes(q) ||
          s.locality?.toLowerCase().includes(q)
        )
        .slice(0, 20);
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

// Get stop info
export function useStopInfo(stopId: string | null) {
  return useQuery({
    queryKey: ['carris-stop', stopId],
    queryFn: async (): Promise<CarrisStop | null> => {
      if (!stopId) return null;
      const res = await fetch(`${CARRIS_API}/stops/${stopId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || json;
    },
    enabled: !!stopId,
    staleTime: 10 * 60 * 1000,
  });
}

// Get arrivals for a stop
export function useStopArrivals(stopId: string | null) {
  return useQuery({
    queryKey: ['carris-arrivals', stopId],
    queryFn: async (): Promise<Arrival[]> => {
      if (!stopId) return [];
      const res = await fetch(`${CARRIS_API}/arrivals/by_stop/${stopId}`);
      if (!res.ok) throw new Error('Erro ao buscar chegadas');
      const json = await res.json();
      const arrivals: Arrival[] = Array.isArray(json) ? json : json.data || [];
      const now = Math.floor(Date.now() / 1000);
      return arrivals
        .filter(a => (a.estimated_arrival_unix || a.scheduled_arrival_unix) > now)
        .sort((a, b) =>
          (a.estimated_arrival_unix || a.scheduled_arrival_unix) -
          (b.estimated_arrival_unix || b.scheduled_arrival_unix)
        )
        .slice(0, 10);
    },
    enabled: !!stopId,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

// Metro status via edge function proxy
export function useMetroStatus() {
  return useQuery({
    queryKey: ['metro-status'],
    queryFn: async (): Promise<MetroLine[]> => {
      try {
        const { data, error } = await supabase.functions.invoke('metro-status');
        if (error) throw error;
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return Array.isArray(parsed?.resposta) ? parsed.resposta : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// Helper to format minutes until arrival
export function formatMinutesUntil(unixTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = Math.max(0, Math.round((unixTimestamp - now) / 60));
  if (diff === 0) return 'A chegar';
  if (diff === 1) return '1 min';
  return `${diff} min`;
}
