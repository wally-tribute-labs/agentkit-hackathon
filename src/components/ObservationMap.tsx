'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { cellToBoundary } from 'h3-js';
import type { LatLngExpression } from 'leaflet';
import { SignalBadge } from '@/components/SignalBadge';
import type { SignalStrength, WeatherCondition } from '@/types/weather';

const SIGNAL_COLORS: Record<SignalStrength, string> = {
  solo: '#9CA3AF',
  corroborated: '#FBBF24',
  strong: '#34D399',
  ground_truth: '#60A5FA',
};

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  snow: '❄️',
  fog: '🌫️',
  storm: '⛈️',
  windy: '💨',
  haze: '🌫️',
};

export interface ConsensusMapCell {
  h3Index: string;
  lat: number;
  lon: number;
  condition: WeatherCondition;
  agreementRate: number;
  humanCount: number;
  signalStrength: SignalStrength;
  timeWindow: string;
}

function FitBounds({ cells }: { cells: ConsensusMapCell[] }) {
  const map = useMap();
  if (cells.length > 0) {
    const lats = cells.map((c) => c.lat);
    const lons = cells.map((c) => c.lon);
    map.fitBounds(
      [
        [Math.min(...lats) - 0.05, Math.min(...lons) - 0.05],
        [Math.max(...lats) + 0.05, Math.max(...lons) + 0.05],
      ],
      { maxZoom: 12 },
    );
  }
  return null;
}

interface ObservationMapProps {
  cells: ConsensusMapCell[];
}

export default function ObservationMap({ cells }: ObservationMapProps) {
  return (
    <MapContainer
      center={[39.8, -98.5]}
      zoom={4}
      style={{ height: '400px', width: '100%' }}
      className="rounded-xl overflow-hidden"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cells.length > 0 && <FitBounds cells={cells} />}
      {cells.map((cell) => {
        const boundary = cellToBoundary(cell.h3Index) as LatLngExpression[];
        const color = SIGNAL_COLORS[cell.signalStrength];
        return (
          <Polygon
            key={`${cell.h3Index}|${cell.timeWindow}`}
            positions={boundary}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 1 }}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[160px]">
                <div className="font-semibold text-base">
                  {CONDITION_EMOJI[cell.condition]} {cell.condition.charAt(0).toUpperCase() + cell.condition.slice(1)}
                </div>
                <div className="flex items-center gap-1">
                  <SignalBadge signal={cell.signalStrength} showPrice />
                </div>
                <div className="text-gray-600 text-xs">
                  {cell.humanCount} {cell.humanCount === 1 ? 'human' : 'humans'} ·{' '}
                  {Math.round(cell.agreementRate * 100)}% agreement
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
      {cells.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            background: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#6B7280',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          No observations yet. Run the seed script to populate demo data.
        </div>
      )}
    </MapContainer>
  );
}
