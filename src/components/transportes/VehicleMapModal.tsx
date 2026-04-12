import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';
import type { VehiclePosition } from '@/hooks/useVehiclePositions';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const DEFAULT_CENTER: [number, number] = [38.7223, -9.1393];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidLatLon(lat: number, lon: number) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && (Math.abs(lat) > 0.0001 || Math.abs(lon) > 0.0001);
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

const userIcon = L.divIcon({
  className: 'transport-map-marker',
  html: `<div style="background:#3b82f6;border-radius:9999px;width:18px;height:18px;border:3px solid white;box-shadow:0 0 0 2px #3b82f6, 0 4px 12px rgba(59,130,246,0.4);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function syncMapContent({
  map,
  markersLayer,
  centerLat,
  centerLon,
  stopName,
  vehicles,
  metroPositions,
  allPositions,
  userLat,
  userLon,
}: {
  map: L.Map;
  markersLayer: L.LayerGroup;
  centerLat: number;
  centerLon: number;
  stopName?: string;
  vehicles: VehiclePosition[];
  metroPositions: MetroEstimatedPosition[];
  allPositions: [number, number][];
  userLat?: number;
  userLon?: number;
}) {
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

  // User location marker
  if (userLat != null && userLon != null && isValidLatLon(userLat, userLon)) {
    L.marker([userLat, userLon], { icon: userIcon })
      .bindPopup(`<div style="font-size:12px;line-height:1.4;color:hsl(var(--foreground));"><strong>A tua localização</strong></div>`)
      .addTo(markersLayer);
  }

  if (allPositions.length > 1) {
    map.fitBounds(L.latLngBounds(allPositions), {
      padding: [40, 40],
      maxZoom: 16,
    });
  } else if (allPositions.length === 1) {
    map.setView(allPositions[0], 15);
  } else {
    map.setView(DEFAULT_CENTER, 12);
  }

  window.requestAnimationFrame(() => {
    map.invalidateSize(true);
  });
}

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
  userLat?: number;
  userLon?: number;
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
  userLat,
  userLon,
}: VehicleMapModalProps) {
  const [mapContainerEl, setMapContainerEl] = useState<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const allPositions = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];

    if (isValidLatLon(centerLat, centerLon)) {
      points.push([centerLat, centerLon]);
    }

    if (userLat != null && userLon != null && isValidLatLon(userLat, userLon)) {
      points.push([userLat, userLon]);
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
  }, [centerLat, centerLon, vehicles, metroPositions, userLat, userLon]);

  useEffect(() => {
    if (!open || !mapContainerEl || mapRef.current) {
      return;
    }

    const container = mapContainerEl;
    let animationFrame = 0;
    let timerA = 0;
    let timerB = 0;
    let cancelled = false;

    const invalidateMap = (map: L.Map) => {
      window.requestAnimationFrame(() => {
        map.invalidateSize(true);
      });
    };

    const initializeMap = () => {
      if (cancelled || mapRef.current) {
        return;
      }

      if (container.clientWidth === 0 || container.clientHeight === 0) {
        animationFrame = window.requestAnimationFrame(initializeMap);
        return;
      }

      const initialCenter = isValidLatLon(centerLat, centerLon) ? [centerLat, centerLon] as [number, number] : DEFAULT_CENTER;
      const map = L.map(container, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
        attributionControl: true,
        fadeAnimation: false,
        zoomAnimation: false,
        markerZoomAnimation: false,
      });

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      syncMapContent({
        map,
        markersLayer: markersLayerRef.current,
        centerLat,
        centerLon,
        stopName,
        vehicles,
        metroPositions,
        allPositions,
        userLat,
        userLon,
      });

      invalidateMap(map);
      timerA = window.setTimeout(() => invalidateMap(map), 120);
      timerB = window.setTimeout(() => invalidateMap(map), 320);

      if (typeof ResizeObserver !== 'undefined') {
        resizeObserverRef.current = new ResizeObserver(() => {
          invalidateMap(map);
        });
        resizeObserverRef.current.observe(container);
      }
    };

    animationFrame = window.requestAnimationFrame(initializeMap);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(timerA);
      window.clearTimeout(timerB);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      markersLayerRef.current?.clearLayers();
      markersLayerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;

      if ('_leaflet_id' in container) {
        delete (container as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
      }
    };
  }, [open, mapContainerEl]);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!open || !map || !markersLayer) {
      return;
    }

    syncMapContent({
      map,
      markersLayer,
      centerLat,
      centerLon,
      stopName,
      vehicles,
      metroPositions,
      allPositions,
      userLat,
      userLon,
    });

    const timer = window.setTimeout(() => {
      map.invalidateSize(true);
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, centerLat, centerLon, stopName, vehicles, metroPositions, allPositions, userLat, userLon]);

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
          <DialogDescription className="sr-only">
            Mapa com a localização da paragem ou estação e as posições disponíveis em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="h-[60vh] w-full bg-muted/30">
          <div ref={setMapContainerEl} className="h-full w-full" />
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
