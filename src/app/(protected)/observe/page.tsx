'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { latLngToCell } from 'h3-js';
import { useAuth } from '@/lib/auth-context';
import { WeatherObserver } from '@/components/WeatherObserver';
import { fetchOpenMeteoBaseline, wmoCodeToWeatherCondition } from '@/lib/weather/openmeteo';
import type { OpenMeteoBaseline, WeatherCondition } from '@/types/weather';

type GpsState =
  | { status: 'pending' }
  | { status: 'acquired'; lat: number; lon: number }
  | { status: 'error'; message: string };

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ObservePage() {
  const router = useRouter();
  const { verified, nullifierHash } = useAuth();

  const [gps, setGps] = useState<GpsState>({ status: 'pending' });
  const [baseline, setBaseline] = useState<OpenMeteoBaseline | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [observationId, setObservationId] = useState<number | null>(null);

  // Redirect if not verified
  useEffect(() => {
    if (!verified) {
      router.replace('/');
    }
  }, [verified, router]);

  // Request GPS
  useEffect(() => {
    if (!verified) return;
    const isDevMode = process.env.NEXT_PUBLIC_DEV_SKIP_VERIFY === 'true';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ status: 'acquired', lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        if (isDevMode) {
          // Dev fallback: use SF Financial District coords for demo
          setGps({ status: 'acquired', lat: 37.7749, lon: -122.4194 });
        } else {
          setGps({ status: 'error', message: err.message });
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [verified]);

  // Fetch baseline once GPS is acquired
  useEffect(() => {
    if (gps.status !== 'acquired') return;
    fetchOpenMeteoBaseline(gps.lat, gps.lon)
      .then(setBaseline)
      .catch((e) => console.error('Open-Meteo error:', e));
  }, [gps]);

  async function handleSubmit({
    condition,
    intensity,
    feel,
    note,
  }: {
    condition: WeatherCondition;
    intensity: string;
    feel: string;
    note: string;
  }) {
    if (gps.status !== 'acquired' || !nullifierHash) return;

    setSubmitState('submitting');
    setSubmitError(null);

    const h3Index = latLngToCell(gps.lat, gps.lon, 7);
    const timestamp = new Date().toISOString();

    // Compare human condition to model baseline
    const modelCondition = baseline ? wmoCodeToWeatherCondition(baseline.weatherCode) : null;
    const confirmsModel = modelCondition ? condition === modelCondition : false;

    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nullifier_hash: nullifierHash,
          lat: gps.lat,
          lon: gps.lon,
          h3_index: h3Index,
          timestamp,
          condition,
          intensity,
          feel,
          confirms_model: confirmsModel ? 1 : 0,
          note: note || null,
          model_temp: baseline?.temperature ?? null,
          model_condition: baseline?.condition ?? null,
          model_humidity: baseline?.humidity ?? null,
          model_wind_speed: baseline?.windSpeed ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Submission failed');
      }

      setObservationId(data.id);
      setSubmitState('success');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
      setSubmitState('error');
    }
  }

  if (!verified) return null;

  if (submitState === 'success') {
    return (
      <main className="min-h-screen p-6 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-4 pt-16 text-center">
          <div className="text-5xl animate-fade-in-up">✅</div>
          <h1 className="text-2xl font-bold animate-fade-in-up-delay">Observation submitted!</h1>
          <p className="text-gray-500 text-sm animate-fade-in-up-delay">
            Observation #{observationId} recorded. Your verified weather data will contribute to the consensus.
          </p>
          <div className="flex flex-col gap-2 w-full mt-4 animate-fade-in-up-delay-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 px-6 bg-black text-white font-semibold rounded-xl"
            >
              View Dashboard →
            </button>
            <button
              onClick={() => {
                setSubmitState('idle');
                setObservationId(null);
              }}
              className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl border border-gray-200"
            >
              Submit another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600">
          ←
        </button>
        <h1 className="text-xl font-bold">Report Weather</h1>
      </div>

      {/* GPS status */}
      <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
        {gps.status === 'pending' && <p className="text-gray-500">Acquiring GPS location...</p>}
        {gps.status === 'error' && (
          <p className="text-red-500">GPS error: {gps.message}. Please enable location access.</p>
        )}
        {gps.status === 'acquired' && (
          <p className="text-gray-700">
            📍 {gps.lat.toFixed(4)}°, {gps.lon.toFixed(4)}°
            {baseline && (
              <span className="text-gray-500"> · {Math.round(baseline.temperature)}°C</span>
            )}
          </p>
        )}
      </div>

      {gps.status === 'acquired' ? (
        <>
          <WeatherObserver
            baseline={baseline}
            onSubmit={handleSubmit}
            submitting={submitState === 'submitting'}
          />
          {submitState === 'error' && submitError && (
            <p className="mt-3 text-red-500 text-sm text-center">{submitError}</p>
          )}
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          {gps.status === 'pending' ? 'Waiting for GPS...' : 'Cannot load form without location.'}
        </div>
      )}
    </main>
  );
}
