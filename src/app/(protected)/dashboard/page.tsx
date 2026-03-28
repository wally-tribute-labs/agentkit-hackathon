'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Radio, Zap, Hexagon, CheckCircle2, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { SignalBadge } from '@/components/SignalBadge';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { WeatherIcon } from '@/components/WeatherIcon';
import { GlassCard } from '@/components/GlassCard';
import { StaggerContainer } from '@/components/motion/StaggerContainer';
import { StaggerItem } from '@/components/motion/StaggerItem';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { spring, buttonTap, buttonHover } from '@/lib/motion';
import type { ConsensusMapCell } from '@/components/ObservationMap';
import type { SignalStrength, WeatherCondition } from '@/types/weather';

const ObservationMap = dynamic(() => import('@/components/ObservationMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-2xl"
      style={{ height: 480, background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
    >
      <motion.div
        className="w-14 h-14 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(6,182,212,0.5) 30%, transparent 45%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  ),
});

interface UserObservation {
  id: number; condition: WeatherCondition; intensity: string; feel: string;
  timestamp: string; confirmsModel: boolean; h3Index: string;
}
interface CellContribution { h3Index: string; signalStrength: SignalStrength; humanCount: number; pricePerQuery: string; }
interface DashboardData { observations: UserObservation[]; totalObservations: number; estimatedEarnings: string; cellContributions: CellContribution[]; }

const STAT_CARDS = [
  { key: 'observations' as const, label: 'Observations',      Icon: Radio,   accent: 'var(--cyan)',  accentBg: 'rgba(6,182,212,0.07)',  accentBorder: 'rgba(6,182,212,0.18)'  },
  { key: 'earnings'     as const, label: 'Est. Earnings',     Icon: Zap,     accent: 'var(--green)', accentBg: 'rgba(16,217,160,0.07)', accentBorder: 'rgba(16,217,160,0.18)' },
  { key: 'cells'        as const, label: 'Cells Contributed', Icon: Hexagon, accent: 'var(--amber)', accentBg: 'rgba(245,158,11,0.07)', accentBorder: 'rgba(245,158,11,0.18)' },
];

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow',
  fog: 'Fog', storm: 'Storm', windy: 'Windy', haze: 'Haze',
};

export default function DashboardPage() {
  const router = useRouter();
  const { verified, nullifierHash } = useAuth();
  const [cells,    setCells]    = useState<ConsensusMapCell[]>([]);
  const [userData, setUserData] = useState<DashboardData | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { if (!verified) router.replace('/'); }, [verified, router]);

  useEffect(() => {
    if (!verified) return;
    (async () => {
      try {
        const cr = await fetch('/api/consensus-cells');
        const cd = await cr.json();
        setCells(cd.cells ?? []);
        if (nullifierHash) {
          const or = await fetch(`/api/observations?nullifier_hash=${encodeURIComponent(nullifierHash)}`);
          setUserData(await or.json());
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [verified, nullifierHash]);

  if (!verified) return null;

  const earningsNum = userData ? parseFloat(userData.estimatedEarnings.replace(/[^0-9.]/g, '')) || 0 : 0;

  return (
    <motion.main
      className="min-h-screen pb-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 py-5">
          <motion.button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}
            whileHover={{ scale: 1.05, background: 'var(--bg-card-hover)', color: 'var(--text-primary)' }}
            whileTap={{ scale: buttonTap.scale }}
            transition={spring}
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </motion.button>
          <h1 className="flex-1 text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <motion.button
            onClick={() => router.push('/observe')}
            className="flex items-center gap-1.5 py-2 px-4 text-sm font-bold rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: 'var(--shadow-glow-cyan)', fontFamily: 'var(--font-display)' }}
            whileHover={{ scale: buttonHover.scale, boxShadow: '0 0 28px rgba(6,182,212,0.5)', y: -1 }}
            whileTap={{ scale: buttonTap.scale }}
            transition={spring}
          >
            <Plus size={15} strokeWidth={2.5} />
            Report
          </motion.button>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <StaggerContainer className="grid grid-cols-3 gap-3 mb-6" delay={0.05}>
          {STAT_CARDS.map((card) => {
            let value = 0, prefix = '', decimals = 0;
            if (card.key === 'observations') value = userData?.totalObservations ?? 0;
            if (card.key === 'earnings')     { value = earningsNum; prefix = '$'; decimals = 4; }
            if (card.key === 'cells')        value = userData?.cellContributions.length ?? 0;

            return (
              <StaggerItem key={card.key}>
                <GlassCard
                  interactive={false}
                  padding="p-4"
                  className="flex flex-col gap-2"
                  style={{
                    borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: card.accent,
                    borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: card.accentBorder,
                    borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: card.accentBorder,
                    borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: card.accentBorder,
                    background: card.accentBg,
                  }}
                >
                  <card.Icon size={16} strokeWidth={1.75} color={card.accent} />
                  {loading ? (
                    <>
                      <div className="shimmer-skeleton h-8 w-16 rounded mt-1" />
                      <div className="shimmer-skeleton h-3 w-20 rounded" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-extrabold leading-none" style={{ color: card.accent, fontFamily: 'var(--font-mono)' }}>
                        <AnimatedCounter target={value} prefix={prefix} decimals={decimals} duration={1400} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                        {card.label}
                      </p>
                    </>
                  )}
                </GlassCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* ── Map ────────────────────────────────────────────────────── */}
        <ScrollReveal delay={0.05} className="mb-6">
          <ObservationMap cells={cells} />
        </ScrollReveal>

        {/* ── History ────────────────────────────────────────────────── */}
        <ScrollReveal delay={0.1}>
          <div
            className="flex items-center gap-3 mb-4"
            style={{ borderLeft: '2px solid var(--cyan)', paddingLeft: 12 }}
          >
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
              Your Observations
            </h2>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shimmer-skeleton h-16 rounded-xl" style={{ border: '1px solid var(--border-glass)' }} />
              ))}
            </div>
          ) : userData && userData.observations.length > 0 ? (
            <StaggerContainer className="space-y-2">
              {userData.observations.map((obs) => {
                const contrib = userData.cellContributions.find((c) => c.h3Index === obs.h3Index);
                return (
                  <StaggerItem key={obs.id}>
                    <GlassCard interactive padding="px-4 py-3.5" className="flex items-center justify-between" glowColor="none">
                      <div className="flex items-center gap-3">
                        <WeatherIcon condition={obs.condition} size={22} strokeWidth={1.5} colorized />
                        <div>
                          <div className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                            {obs.intensity} {CONDITION_LABEL[obs.condition]} · {obs.feel}
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {new Date(obs.timestamp).toLocaleString()}
                            </span>
                            {obs.confirmsModel && (
                              <span className="flex items-center gap-1" style={{ color: 'var(--green)' }}>
                                <CheckCircle2 size={11} strokeWidth={2} />
                                confirmed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {contrib && <SignalBadge signal={contrib.signalStrength} />}
                    </GlassCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          ) : (
            !loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="text-center py-16 rounded-2xl flex flex-col items-center gap-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}
              >
                <MapPin size={28} strokeWidth={1.5} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                <p className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>No observations yet.</p>
                <motion.button
                  onClick={() => router.push('/observe')}
                  className="text-sm font-semibold"
                  style={{ color: 'var(--cyan)', fontFamily: 'var(--font-display)' }}
                  whileHover={{ color: 'var(--cyan-light)' }}
                  transition={{ duration: 0.15 }}
                >
                  Submit your first report →
                </motion.button>
              </motion.div>
            )
          )}
        </ScrollReveal>

      </div>
    </motion.main>
  );
}
