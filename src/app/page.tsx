'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Zap, Terminal, Bot, Globe, ArrowRight, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { VerifyButton } from '@/components/VerifyButton';
import { HeroScenario } from '@/components/HeroScenario';
import { SignalBadge } from '@/components/SignalBadge';
import { spring, buttonTap, buttonHover } from '@/lib/motion';
import { SIGNAL_PRICES } from '@/types/weather';
import type { SignalStrength } from '@/types/weather';

const WeatherGlobe = dynamic(
  () => import('@/components/WeatherGlobe').then((m) => m.WeatherGlobe),
  { ssr: false, loading: () => <div className="w-full h-full" /> },
);

const STEPS = [
  {
    step: '01', icon: Shield, title: 'Verify',
    desc: 'Prove your humanity with World ID — one human, one vote, no bots.',
    accent: 'var(--cyan)', accentRgb: '6,182,212',
  },
  {
    step: '02', icon: Eye, title: 'Report',
    desc: 'Step outside and describe current conditions at your exact location.',
    accent: 'var(--amber)', accentRgb: '245,158,11',
  },
  {
    step: '03', icon: Zap, title: 'Earn',
    desc: 'Collect micropayments every time an AI agent queries your verified data.',
    accent: 'var(--green)', accentRgb: '16,217,160',
  },
];

function fadeIn(delay: number) {
  return {
    initial: { opacity: 0, y: 14, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { ...spring, delay },
  };
}

// Shared glass cell class
const cell = 'glass rounded-2xl overflow-hidden';

export default function HomePage() {
  const router  = useRouter();
  const { verified } = useAuth();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <main className="relative">
      <div className="bento-home p-3 gap-3 max-w-[1600px] mx-auto w-full h-full">

        {/* ── GLOBE — col 2-3, row 1-3 ─────────────────────────────────── */}
        <motion.div
          className="relative md:col-start-2 md:col-span-2 md:row-start-1 md:row-span-3
                     w-full h-[300px] md:h-auto order-2 md:order-none rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(6,182,212,0.03)',
            border: '1px solid rgba(6,182,212,0.12)',
          }}
          {...fadeIn(0)}
        >
          <WeatherGlobe className="w-full h-full" />
          {/* Vignette edges so globe bleeds cleanly */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ boxShadow: 'inset 0 0 80px rgba(6,9,16,0.6)' }} />
        </motion.div>

        {/* ── TITLE — col 1, row 1 ─────────────────────────────────────── */}
        <motion.div
          className={`${cell} md:col-start-1 md:row-start-1 flex flex-col justify-between
                     order-1 md:order-none p-5`}
          style={{ background: 'rgba(6,182,212,0.04)' }}
          {...fadeIn(0.06)}
        >
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-4"
              style={{
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.25)',
                color: 'var(--cyan)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Globe size={10} strokeWidth={2.5} />
              Powered by World ID
            </div>
            <h1
              className="gradient-text leading-[1.05] mb-3"
              style={{
                fontSize: 'clamp(1.8rem, 3.2vw, 2.6rem)',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
              }}
            >
              Weather Oracle
            </h1>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Human-verified ground truth, monetized for AI agents via x402 micropayments.
            </p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 mt-4">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--green)' }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Live network · World Chain
            </span>
          </div>
        </motion.div>

        {/* ── HERO SCENARIO — col 4, row 1 ─────────────────────────────── */}
        <motion.div
          className="md:col-start-4 md:row-start-1 order-3 md:order-none"
          {...fadeIn(0.1)}
        >
          <HeroScenario compact />
        </motion.div>

        {/* ── STEPS 1 + 2 — col 1, row 2 ──────────────────────────────── */}
        <motion.div
          className={`${cell} md:col-start-1 md:row-start-2 flex flex-col order-4 md:order-none`}
          {...fadeIn(0.14)}
        >
          {STEPS.slice(0, 2).map((s, idx) => (
            <div
              key={s.step}
              className="flex-1 flex flex-col justify-between p-4"
              style={idx === 0 ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}
            >
              {/* Top row: icon + step number */}
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{
                    background: `rgba(${s.accentRgb},0.12)`,
                    border: `1px solid rgba(${s.accentRgb},0.3)`,
                  }}
                >
                  <s.icon size={15} strokeWidth={1.75} color={s.accent} />
                </div>
                <span
                  className="text-xl font-black leading-none"
                  style={{ color: s.accent, opacity: 0.15, fontFamily: 'var(--font-display)' }}
                >
                  {s.step}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  {s.title}
                </p>
                <p className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── STEP 3 (EARN) — col 4, row 2 ────────────────────────────── */}
        <motion.div
          className={`${cell} md:col-start-4 md:row-start-2 flex flex-col justify-between p-5 order-5 md:order-none`}
          style={{ background: 'rgba(16,217,160,0.04)' }}
          {...fadeIn(0.18)}
        >
          <div className="flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(16,217,160,0.15)',
                border: '1px solid rgba(16,217,160,0.3)',
                boxShadow: '0 0 20px rgba(16,217,160,0.15)',
              }}
            >
              <Zap size={20} strokeWidth={1.75} color="var(--green)" />
            </div>
            <span
              className="text-3xl font-black leading-none"
              style={{ color: 'var(--green)', opacity: 0.12, fontFamily: 'var(--font-display)' }}
            >
              03
            </span>
          </div>

          <div>
            <p className="text-lg font-bold mb-1.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              Earn
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-muted)' }}>
              Collect micropayments every time an AI agent queries your verified data.
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: 'rgba(16,217,160,0.1)',
                border: '1px solid rgba(16,217,160,0.25)',
                color: 'var(--green)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              up to $0.02 / query
            </div>
          </div>
        </motion.div>

        {/* ── CTA — col 1, row 3 ───────────────────────────────────────── */}
        <motion.div
          className={`${cell} md:col-start-1 md:row-start-3 flex flex-col justify-between p-5 order-6 md:order-none`}
          {...fadeIn(0.22)}
        >
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
            >
              Get started
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Verify once, report conditions, start earning.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {mounted && verified ? (
              <>
                <motion.button
                  onClick={() => router.push('/observe')}
                  className="w-full py-3 px-4 font-bold rounded-xl text-sm text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    boxShadow: '0 0 24px rgba(6,182,212,0.35)',
                    fontFamily: 'var(--font-display)',
                  }}
                  whileHover={{ scale: buttonHover.scale, boxShadow: '0 0 40px rgba(6,182,212,0.55)', y: -1 }}
                  whileTap={{ scale: buttonTap.scale }}
                  transition={spring}
                >
                  Submit Observation <ArrowRight size={14} />
                </motion.button>
                <motion.button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-2.5 px-4 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(6,182,212,0.2)',
                    color: 'var(--cyan)',
                    fontFamily: 'var(--font-display)',
                  }}
                  whileHover={{ scale: buttonHover.scale, background: 'rgba(6,182,212,0.08)' }}
                  whileTap={{ scale: buttonTap.scale }}
                  transition={spring}
                >
                  <BarChart3 size={14} /> View Dashboard
                </motion.button>
              </>
            ) : (
              <VerifyButton />
            )}
          </div>
        </motion.div>

        {/* ── AI AGENTS — col 4, row 3 ─────────────────────────────────── */}
        <motion.div
          className={`${cell} md:col-start-4 md:row-start-3 flex flex-col gap-3 p-4 order-7 md:order-none`}
          style={{
            borderTopWidth: '2px',
            borderTopStyle: 'solid',
            borderTopColor: 'var(--amber)',
            background: 'rgba(245,158,11,0.03)',
          }}
          {...fadeIn(0.26)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={13} strokeWidth={1.75} style={{ color: 'var(--amber)' }} />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}
              >
                For AI Agents
              </span>
            </div>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(245,158,11,0.12)',
                color: 'var(--amber)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              x402
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {(Object.entries(SIGNAL_PRICES) as [SignalStrength, string][]).map(([tier, price]) => (
              <div key={tier} className="flex items-center justify-between">
                <SignalBadge signal={tier} />
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {price} USDC
                </span>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl p-2.5 flex items-start gap-2 mt-auto"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Terminal size={11} strokeWidth={2} style={{ color: 'var(--cyan)', marginTop: 1, flexShrink: 0 }} />
            <code
              className="text-xs break-all leading-snug"
              style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
            >
              GET /api/v1/weather?lat=&#123;lat&#125;&amp;lon=&#123;lon&#125;
            </code>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
