import { useQuery } from '@tanstack/react-query';

const VEHICLE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vehicle-positions`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface VehiclePosition {
  vehicle_id: string;
  lat: number;
  lon: number;
  bearing: number;
  speed: number;
  route_id: string;
  trip_id: string;
  timestamp: number;
}

export function useVehiclePositions(routeId: string | null) {
  return useQuery({
    queryKey: ['vehicle-positions', routeId],
    queryFn: async (): Promise<VehiclePosition[]> => {
      if (!routeId) return [];
      const res = await fetch(`${VEHICLE_FN_URL}?route_id=${encodeURIComponent(routeId)}`, {
        headers: { 'Authorization': `Bearer ${ANON_KEY}` },
      });
      if (!res.ok) throw new Error('Failed to fetch vehicle positions');
      return res.json();
    },
    enabled: !!routeId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
