'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { latLngToCell } from 'h3-js';
import { useAuth } from '@/lib/auth-context';
import { WeatherObserver } from '@/components/WeatherObserver';
import { spring, buttonTap, buttonHover, scaleIn, staggerContainer, staggerItem } from '@/lib/motion';
import { fetchOpenMeteoBaseline, wmoCodeToWeatherCondition } from '@/lib/weather/openmeteo';
import type { OpenMeteoBaseline, WeatherCondition } from '@/types/weather';

type GpsState = { status: 'pending' } | { status: 'acquired'; lat: number; lon: number } | { status: 'error'; message: string };
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export default function ObservePage() {
  const router = useRouter();
  const { verified, nullifierHash } = useAuth();

  const [gps,         setGps]         = useState<GpsState>({ status: 'pending' });
  const [baseline,    setBaseline]    = useState<OpenMeteoBaseline | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [obsId,       setObsId]       = useState<number | null>(null);

  useEffect(() => { if (!verified) router.replace('/'); }, [verified, router]);

  useEffect(() => {
    if (!verified) return;
    const isDev = process.env.NEXT_PUBLIC_DEV_SKIP_VERIFY === 'true';
    navigator.geolocation.getCurrentPosition(
      (p) => setGps({ status: 'acquired', lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => isDev ? setGps({ status: 'acquired', lat: 37.7749, lon: -122.4194 }) : setGps({ status: 'error', message: e.message }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [verified]);

  useEffect(() => {
    if (gps.status !== 'acquired') return;
    fetchOpenMeteoBaseline(gps.lat, gps.lon).then(setBaseline).catch(console.error);
  }, [gps]);

  async function handleSubmit({ condition, intensity, feel, note }: { condition: WeatherCondition; intensity: string; feel: string; note: string }) {
    if (gps.status !== 'acquired' || !nullifierHash) return;
    setSubmitState('submitting');
    setSubmitError(null);

    const h3Index        = latLngToCell(gps.lat, gps.lon, 7);
    const modelCondition = baseline ? wmoCodeToWeatherCondition(baseline.weatherCode) : null;
    const confirmsModel  = modelCondition ? condition === modelCondition : false;

    try {
      const res  = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nullifier_hash: nullifierHash, lat: gps.lat, lon: gps.lon, h3_index: h3Index,
          timestamp: new Date().toISOString(), condition, intensity, feel,
          confirms_model: confirmsModel ? 1 : 0, note: note || null,
          model_temp: baseline?.temperature ?? null, model_condition: baseline?.condition ?? null,
          model_humidity: baseline?.humidity ?? null, model_wind_speed: baseline?.windSpeed ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Submission failed');
      setObsId(data.id);
      setSubmitState('success');
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Submission failed');
      setSubmitState('error');
    }
  }

  if (!verified) return null;

  /* ── Success ─────────────────────────────────────────────────────────── */
  if (submitState === 'success') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          className="flex flex-col items-center gap-5 text-center max-w-sm w-full"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={scaleIn}
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(16,217,160,0.2) 0%, rgba(16,217,160,0.04) 70%)',
              border: '1px solid rgba(16,217,160,0.3)',
              boxShadow: 'var(--shadow-glow-green)',
            }}
          >
            <CheckCircle2 size={44} strokeWidth={1.5} style={{ color: 'var(--green)' }} />
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="text-2xl font-extrabold"
            style={{ color: 'var(--green-light)', fontFamily: 'var(--font-display)' }}
          >
            Observation submitted!
          </motion.h1>

          {obsId && (
            <motion.div
              variants={staggerItem}
              className="px-4 py-2.5 rounded-xl font-mono text-sm"
              style={{ background: 'rgba(16,217,160,0.08)', border: '1px solid rgba(16,217,160,0.2)', color: 'var(--text-secondary)' }}
            >
              ID: <span style={{ color: 'var(--green)' }}>#{obsId}</span>
            </motion.div>
          )}

          <motion.p
            variants={staggerItem}
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Your verified ground truth contributes to the consensus. AI agents will pay for it.
          </motion.p>

          <motion.div variants={staggerItem} className="flex flex-col gap-3 w-full mt-2">
            <motion.button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3.5 font-bold rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #10d9a0, #059669)', boxShadow: 'var(--shadow-glow-green)', fontFamily: 'var(--font-display)' }}
              whileHover={{ scale: buttonHover.scale, boxShadow: '0 0 40px rgba(16,217,160,0.5)', y: -1 }}
              whileTap={{ scale: buttonTap.scale }}
              transition={spring}
            >
              View Dashboard →
            </motion.button>
            <motion.button
              onClick={() => { setSubmitState('idle'); setObsId(null); }}
              className="w-full py-3.5 font-semibold rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid rgba(16,217,160,0.2)', color: 'var(--green)', fontFamily: 'var(--font-display)' }}
              whileHover={{ scale: buttonHover.scale, background: 'rgba(16,217,160,0.08)' }}
              whileTap={{ scale: buttonTap.scale }}
              transition={spring}
            >
              Submit another
            </motion.button>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  /* ── Main form ────────────────────────────────────────────────────────── */
  return (
    <motion.main
      className="min-h-screen p-4 max-w-md mx-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <motion.button
          onClick={() => router.push('/')}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}
          whileHover={{ scale: 1.05, background: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
          whileTap={{ scale: buttonTap.scale }}
          transition={spring}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </motion.button>
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
          Report Weather
        </h1>
      </div>

      {/* GPS status */}
      <motion.div
        className="rounded-xl p-3.5 mb-5 text-sm flex items-center gap-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {gps.status === 'pending' && (
          <>
            <motion.span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--amber)' }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>Acquiring GPS location...</span>
          </>
        )}
        {gps.status === 'error' && (
          <>
            <AlertCircle size={16} strokeWidth={2} style={{ color: 'var(--error)', flexShrink: 0 }} />
            <span style={{ color: 'var(--error)' }}>GPS error: {gps.message}</span>
          </>
        )}
        {gps.status === 'acquired' && (
          <>
            <motion.span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--cyan)' }}
              animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin size={13} strokeWidth={2} style={{ color: 'var(--cyan)', flexShrink: 0 }} />
              <span className="font-mono text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                {gps.lat.toFixed(4)}°, {gps.lon.toFixed(4)}°
                {baseline && <span style={{ color: 'var(--cyan)', marginLeft: 8 }}>{Math.round(baseline.temperature)}°C</span>}
              </span>
            </div>
          </>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {gps.status === 'acquired' ? (
          <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <WeatherObserver baseline={baseline} onSubmit={handleSubmit} submitting={submitState === 'submitting'} />
            {submitState === 'error' && submitError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl text-sm text-center flex items-center justify-center gap-2"
                style={{ background: 'var(--error-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--error)' }}
              >
                <AlertCircle size={14} strokeWidth={2} />
                {submitError}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 flex flex-col items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <Loader2 size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} className="animate-spin" />
            <p className="text-sm">{gps.status === 'pending' ? 'Waiting for GPS...' : 'Cannot load form without location access.'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
