'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { SignalBadge } from '@/components/SignalBadge';
import type { ConsensusMapCell } from '@/components/ObservationMap';
import type { SignalStrength, WeatherCondition } from '@/types/weather';

const ObservationMap = dynamic(() => import('@/components/ObservationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Loading map...
    </div>
  ),
});

const SIGNAL_LEGEND: { signal: SignalStrength; label: string; color: string }[] = [
  { signal: 'solo', label: 'Solo (1 human)', color: '#9CA3AF' },
  { signal: 'corroborated', label: 'Corroborated (3+)', color: '#FBBF24' },
  { signal: 'strong', label: 'Strong (5+)', color: '#34D399' },
  { signal: 'ground_truth', label: 'Ground Truth (10+)', color: '#60A5FA' },
];

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  clear: '☀️', cloudy: '☁️', rain: '🌧️', snow: '❄️',
  fog: '🌫️', storm: '⛈️', windy: '💨', haze: '🌫️',
};

interface UserObservation {
  id: number;
  condition: WeatherCondition;
  intensity: string;
  feel: string;
  timestamp: string;
  confirmsModel: boolean;
  h3Index: string;
}

interface CellContribution {
  h3Index: string;
  signalStrength: SignalStrength;
  humanCount: number;
  pricePerQuery: string;
}

interface DashboardData {
  observations: UserObservation[];
  totalObservations: number;
  estimatedEarnings: string;
  cellContributions: CellContribution[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { verified, nullifierHash } = useAuth();
  const [cells, setCells] = useState<ConsensusMapCell[]>([]);
  const [userData, setUserData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!verified) {
      router.replace('/');
    }
  }, [verified, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const cellsRes = await fetch('/api/consensus-cells');
        const cellsData = await cellsRes.json();
        setCells(cellsData.cells ?? []);

        if (nullifierHash) {
          const obsRes = await fetch(
            `/api/observations?nullifier_hash=${encodeURIComponent(nullifierHash)}`,
          );
          const obsData = await obsRes.json();
          setUserData(obsData);
        }
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
    if (verified) {
      fetchData();
    }
  }, [verified, nullifierHash]);

  if (!verified) return null;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h1 className="text-xl font-bold flex-1">Dashboard</h1>
        <button
          onClick={() => router.push('/observe')}
          className="py-1.5 px-4 bg-black text-white text-sm font-semibold rounded-xl"
        >
          + Report
        </button>
      </div>

      {/* Earnings summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6 grid grid-cols-3 gap-4 text-center">
        {userData ? (
          <>
            <div>
              <div className="text-2xl font-bold">{userData.totalObservations}</div>
              <div className="text-xs text-gray-500 mt-0.5">Observations</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{userData.estimatedEarnings}</div>
              <div className="text-xs text-gray-500 mt-0.5">Est. Earnings</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{userData.cellContributions.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Cells Contributed</div>
            </div>
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          ))
        )}
      </div>

      {/* Map */}
      <div className="mb-4">
        <ObservationMap cells={cells} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {SIGNAL_LEGEND.map(({ signal, label, color }) => (
          <div key={signal} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="inline-block w-3 h-3 rounded-sm opacity-70"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>

      {/* Observation history */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : userData && userData.observations.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Observations
          </h2>
          <div className="space-y-2">
            {userData.observations.map((obs) => {
              const contrib = userData.cellContributions.find((c) => c.h3Index === obs.h3Index);
              return (
                <div
                  key={obs.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{CONDITION_EMOJI[obs.condition]}</span>
                    <div>
                      <div className="text-sm font-medium capitalize">
                        {obs.intensity} {obs.condition} · {obs.feel}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(obs.timestamp).toLocaleString()}
                        {obs.confirmsModel && (
                          <span className="ml-2 text-green-600">✓ model confirmed</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {contrib && <SignalBadge signal={contrib.signalStrength} />}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No observations yet.{' '}
            <button
              onClick={() => router.push('/observe')}
              className="text-black underline underline-offset-2"
            >
              Submit your first report
            </button>
          </div>
        )
      )}
    </main>
  );
}
