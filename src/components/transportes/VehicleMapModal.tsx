import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VehiclePosition } from '@/hooks/useVehiclePositions';

// Fix default marker icons in bundled environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = L.divIcon({
  className: '',
  html: `<div style="background:#2563eb;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">🚌</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const trainIcon = L.divIcon({
  className: '',
  html: `<div style="background:#dc2626;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">🚇</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const stopIcon = L.divIcon({
  className: '',
  html: `<div style="background:#f59e0b;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);">📍</div>`,
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

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length > 1) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);
  return null;
}

export default function VehicleMapModal({
  open, onClose, title, centerLat, centerLon, stopName,
  vehicles = [], metroPositions = [], isLoading,
}: VehicleMapModalProps) {
  const allPositions = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [[centerLat, centerLon]];
    vehicles.forEach(v => { if (v.lat && v.lon) pts.push([v.lat, v.lon]); });
    metroPositions.forEach(m => { if (m.lat && m.lon) pts.push([m.lat, m.lon]); });
    return pts;
  }, [centerLat, centerLon, vehicles, metroPositions]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-base flex items-center gap-2">
            {title}
            {vehicles.length > 0 && (
              <Badge variant="secondary" className="text-xs">{vehicles.length} veículo{vehicles.length !== 1 ? 's' : ''}</Badge>
            )}
            {metroPositions.length > 0 && (
              <Badge variant="secondary" className="text-xs">{metroPositions.length} comboio{metroPositions.length !== 1 ? 's' : ''}</Badge>
            )}
            {isLoading && <span className="text-xs text-muted-foreground animate-pulse">A atualizar...</span>}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] w-full">
          <MapContainer
            center={[centerLat, centerLon]}
            zoom={15}
            className="h-full w-full"
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds positions={allPositions} />

            {/* Stop/station marker */}
            <Marker position={[centerLat, centerLon]} icon={stopIcon}>
              <Popup>{stopName || 'Paragem'}</Popup>
            </Marker>

            {/* Bus markers */}
            {vehicles.map((v) => (
              <Marker key={v.vehicle_id} position={[v.lat, v.lon]} icon={busIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>Rota: {v.route_id?.replace(/_\d+$/, '')}</strong>
                    <br />
                    {v.speed > 0 && <span>Velocidade: {Math.round(v.speed)} km/h</span>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Metro estimated markers */}
            {metroPositions.map((m, i) => (
              <Marker key={`metro-${i}`} position={[m.lat, m.lon]} icon={trainIcon}>
                <Popup>
                  <div className="text-sm">
                    <strong>→ {m.destination}</strong>
                    <br />
                    <span>{m.timeLeft}</span>
                    {m.live && <span className="ml-1 text-green-600">(tempo real)</span>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
