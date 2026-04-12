import React, { useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VehiclePosition } from '@/hooks/useVehiclePositions';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidLatLon(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

const busIcon = L.divIcon({
  className: 'transport-map-marker',
  html: `<div style="background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid hsl(var(--background));box-shadow:0 8px 20px hsl(var(--foreground) / 0.18);">🚌</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const trainIcon = L.divIcon({
  className: 'transport-map-marker',
  html: `<div style="background:hsl(var(--secondary));color:hsl(var(--secondary-foreground));border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid hsl(var(--background));box-shadow:0 8px 20px hsl(var(--foreground) / 0.18);">🚇</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stopIcon = L.divIcon({
  className: 'transport-map-marker',
  html: `<div style="background:hsl(var(--accent));color:hsl(var(--accent-foreground));border-radius:9999px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid hsl(var(--background));box-shadow:0 10px 24px hsl(var(--foreground) / 0.22);">📍</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export interface MetroEstimatedPosition {
  lat: number;
  lon: number;
  destination: string;
  timeLeft: string;
  live: boolean;
}

interface VehicleMapModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  centerLat: number;
  centerLon: number;
  stopName?: string;
  vehicles?: VehiclePosition[];
  metroPositions?: MetroEstimatedPosition[];
  isLoading?: boolean;
}

export default function VehicleMapModal({
  open,
  onClose,
  title,
  centerLat,
  centerLon,
  stopName,
  vehicles = [],
  metroPositions = [],
  isLoading,
}: VehicleMapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const allPositions = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];

    if (isValidLatLon(centerLat, centerLon)) {
      points.push([centerLat, centerLon]);
    }

    vehicles.forEach((vehicle) => {
      if (isValidLatLon(vehicle.lat, vehicle.lon)) {
        points.push([vehicle.lat, vehicle.lon]);
      }
    });

    metroPositions.forEach((metro) => {
      if (isValidLatLon(metro.lat, metro.lon)) {
        points.push([metro.lat, metro.lon]);
      }
    });

    return points;
  }, [centerLat, centerLon, vehicles, metroPositions]);

  useEffect(() => {
    if (!open || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      window.clearTimeout(timer);
      markersLayerRef.current?.clearLayers();
      markersLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!open || !map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();

    if (isValidLatLon(centerLat, centerLon)) {
      L.marker([centerLat, centerLon], { icon: stopIcon })
        .bindPopup(escapeHtml(stopName || 'Paragem'))
        .addTo(markersLayer);
    }

    vehicles.forEach((vehicle) => {
      if (!isValidLatLon(vehicle.lat, vehicle.lon)) {
        return;
      }

      const routeLabel = escapeHtml((vehicle.route_id || '—').replace(/_\d+$/, ''));
      const speedLabel = vehicle.speed > 0 ? `<br />Velocidade: ${Math.round(vehicle.speed)} km/h` : '';

      L.marker([vehicle.lat, vehicle.lon], { icon: busIcon })
        .bindPopup(`<div style="font-size:12px;line-height:1.4;color:hsl(var(--foreground));"><strong>Rota: ${routeLabel}</strong>${speedLabel}</div>`)
        .addTo(markersLayer);
    });

    metroPositions.forEach((metro) => {
      if (!isValidLatLon(metro.lat, metro.lon)) {
        return;
      }

      const destination = escapeHtml(metro.destination);
      const badge = metro.live ? '<br />Tempo real' : '';

      L.marker([metro.lat, metro.lon], { icon: trainIcon })
        .bindPopup(`<div style="font-size:12px;line-height:1.4;color:hsl(var(--foreground));"><strong>→ ${destination}</strong><br />${escapeHtml(metro.timeLeft)}${badge}</div>`)
        .addTo(markersLayer);
    });

    if (allPositions.length > 1) {
      map.fitBounds(L.latLngBounds(allPositions), {
        padding: [40, 40],
        maxZoom: 16,
      });
    } else if (allPositions.length === 1) {
      map.setView(allPositions[0], 15);
    } else {
      map.setView([38.7223, -9.1393], 12);
    }

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 180);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, centerLat, centerLon, stopName, vehicles, metroPositions, allPositions]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            {title}
            {vehicles.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {metroPositions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {metroPositions.length} comboio{metroPositions.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {isLoading && <span className="text-xs text-muted-foreground animate-pulse">A atualizar...</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="h-[60vh] w-full bg-muted/30">
          <div ref={mapContainerRef} className="h-full w-full" />
        </div>

        {!isLoading && vehicles.length === 0 && metroPositions.length === 0 && (
          <div className="border-t border-border bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            Sem posições live neste momento — a mostrar a localização da paragem/estação.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
