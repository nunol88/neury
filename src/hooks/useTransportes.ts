import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

const CARRIS_API = 'https://api.carrismetropolitana.pt/v2';
const METRO_API = 'http://app.metrolisboa.pt/status/getLinhas.php';
const FAVORITES_KEY = 'transportes_paragens_favoritas';

export interface CarrisStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  locality?: string;
  municipality_name?: string;
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

// Favorites management
export function useFavoriteStops() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (stopId: string) => {
    setFavorites(prev => prev.includes(stopId) ? prev : [...prev, stopId]);
  };

  const removeFavorite = (stopId: string) => {
    setFavorites(prev => prev.filter(id => id !== stopId));
  };

  const isFavorite = (stopId: string) => favorites.includes(stopId);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}

// Search stops
export function useSearchStops(query: string) {
  return useQuery({
    queryKey: ['carris-stops-search', query],
    queryFn: async (): Promise<CarrisStop[]> => {
      if (!query || query.length < 2) return [];
      const res = await fetch(`${CARRIS_API}/stops`);
      if (!res.ok) throw new Error('Erro ao buscar paragens');
      const json = await res.json();
      const stops: CarrisStop[] = Array.isArray(json) ? json : json.data || [];
      const q = query.toLowerCase();
      return stops
        .filter((s: CarrisStop) => 
          s.name?.toLowerCase().includes(q) || 
          s.id?.toLowerCase().includes(q) ||
          s.locality?.toLowerCase().includes(q)
        )
        .slice(0, 20);
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // cache stops for 5 min
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

// Metro status
export function useMetroStatus() {
  return useQuery({
    queryKey: ['metro-status'],
    queryFn: async (): Promise<MetroLine[]> => {
      try {
        const res = await fetch(METRO_API);
        if (!res.ok) throw new Error('Erro');
        const data = await res.json();
        return Array.isArray(data?.resposta) ? data.resposta : [];
      } catch {
        // Fallback: return empty if CORS blocked
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
