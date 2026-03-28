'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
import { cellToBoundary } from 'h3-js';
import type { LatLngExpression } from 'leaflet';
import { SignalBadge } from '@/components/SignalBadge';
import { WeatherIcon } from '@/components/WeatherIcon';
import { MapPin } from 'lucide-react';
import type { SignalStrength, WeatherCondition } from '@/types/weather';

const SIGNAL_COLORS: Record<SignalStrength, string> = {
  solo:         '#94a3b8',
  corroborated: '#fbbf24',
  strong:       '#34d399',
  ground_truth: '#22d3ee',
};

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow',
  fog: 'Fog', storm: 'Storm', windy: 'Windy', haze: 'Haze',
};

const SIGNAL_LEGEND: { signal: SignalStrength; label: string }[] = [
  { signal: 'solo',         label: 'Solo'         },
  { signal: 'corroborated', label: 'Corroborated' },
  { signal: 'strong',       label: 'Strong'       },
  { signal: 'ground_truth', label: 'Ground Truth' },
];

export interface ConsensusMapCell {
  h3Index: string; lat: number; lon: number;
  condition: WeatherCondition; agreementRate: number;
  humanCount: number; signalStrength: SignalStrength; timeWindow: string;
}

function FitBounds({ cells }: { cells: ConsensusMapCell[] }) {
  const map = useMap();
  if (cells.length > 0) {
    const lats = cells.map((c) => c.lat);
    const lons = cells.map((c) => c.lon);
    map.fitBounds(
      [[Math.min(...lats) - 0.05, Math.min(...lons) - 0.05],
       [Math.max(...lats) + 0.05, Math.max(...lons) + 0.05]],
      { maxZoom: 12 },
    );
  }
  return null;
}

export default function ObservationMap({ cells }: { cells: ConsensusMapCell[] }) {
  return (
    <div className="relative overflow-hidden" style={{ height: 480, borderRadius: 20, border: '1px solid var(--border-glass)' }}>
      <MapContainer center={[39.8, -98.5]} zoom={4} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {cells.length > 0 && <FitBounds cells={cells} />}
        {cells.map((cell) => {
          const boundary = cellToBoundary(cell.h3Index) as LatLngExpression[];
          const color    = SIGNAL_COLORS[cell.signalStrength];
          return (
            <Polygon
              key={`${cell.h3Index}|${cell.timeWindow}`}
              positions={boundary}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.65, weight: 1.5 }}
            >
              <Popup>
                <div className="text-sm space-y-1.5 min-w-[170px]">
                  <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    <WeatherIcon condition={cell.condition} size={16} strokeWidth={2} colorized />
                    {CONDITION_LABEL[cell.condition]}
                  </div>
                  <div><SignalBadge signal={cell.signalStrength} showPrice /></div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {cell.humanCount} {cell.humanCount === 1 ? 'human' : 'humans'} · {Math.round(cell.agreementRate * 100)}% agreement
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 z-[1000] flex flex-wrap gap-2.5 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(6,9,16,0.88)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)' }}
      >
        {SIGNAL_LEGEND.map(({ signal, label }) => (
          <div key={signal} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SIGNAL_COLORS[signal], opacity: 0.85 }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {cells.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
          <div
            className="px-6 py-5 rounded-2xl text-center flex flex-col items-center gap-2"
            style={{ background: 'rgba(6,9,16,0.92)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass-bright)' }}
          >
            <MapPin size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No observations yet.</p>
            <p className="text-xs opacity-50" style={{ color: 'var(--text-muted)' }}>Run the seed script to populate demo data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
