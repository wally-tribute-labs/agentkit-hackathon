'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Zap, Terminal, Globe, Bot } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { VerifyButton } from '@/components/VerifyButton';
import { HeroScenario } from '@/components/HeroScenario';
import { SignalBadge } from '@/components/SignalBadge';
import { GlassCard } from '@/components/GlassCard';
import { StaggerContainer } from '@/components/motion/StaggerContainer';
import { StaggerItem } from '@/components/motion/StaggerItem';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { spring, buttonTap, buttonHover, fadeUp } from '@/lib/motion';
import { SIGNAL_PRICES } from '@/types/weather';
import type { SignalStrength } from '@/types/weather';

const WeatherGlobe = dynamic(
  () => import('@/components/WeatherGlobe').then((m) => m.WeatherGlobe),
  { ssr: false, loading: () => <div style={{ height: 400 }} /> },
);

const HOW_IT_WORKS = [
  { step: '01', icon: Shield, title: 'Verify', desc: 'Prove your humanity with World ID — one human, one vote, no bots.', accent: 'var(--cyan)',  accentBg: 'rgba(6,182,212,0.07)',  accentBorder: 'rgba(6,182,212,0.2)' },
  { step: '02', icon: Eye,    title: 'Report', desc: 'Step outside and describe current conditions at your location.',    accent: 'var(--amber)', accentBg: 'rgba(245,158,11,0.07)', accentBorder: 'rgba(245,158,11,0.2)' },
  { step: '03', icon: Zap,    title: 'Earn',   desc: 'Collect micropayments when AI agents query your verified data.',     accent: 'var(--green)', accentBg: 'rgba(16,217,160,0.07)', accentBorder: 'rgba(16,217,160,0.2)' },
];

export default function HomePage() {
  const router   = useRouter();
  const { verified } = useAuth();
  // Prevent hydration mismatch — auth state only exists client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="relative min-h-screen overflow-hidden">

      {/* ── Globe hero (full-width, bleeds to edges) ──────────────────── */}
      <div className="relative w-full" style={{ marginBottom: '-80px' }}>
        {/* Gradient fade at bottom so globe bleeds into content */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--bg-primary), transparent)' }}
        />
        <WeatherGlobe height={420} />
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pb-16 flex flex-col gap-10">

        {/* Title block */}
        <StaggerContainer className="flex flex-col items-center text-center gap-3">
          <StaggerItem>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(6,182,212,0.1)',
                border: '1px solid rgba(6,182,212,0.2)',
                color: 'var(--cyan)',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Globe size={12} strokeWidth={2} />
              Powered by World ID
            </div>
          </StaggerItem>

          <StaggerItem>
            <h1
              className="gradient-text leading-none"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}
            >
              Weather Oracle
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="text-base max-w-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              Human-verified ground truth, monetized for AI agents via x402 micropayments.
            </p>
          </StaggerItem>
        </StaggerContainer>

        {/* Hero scenario card */}
        <ScrollReveal delay={0.1}>
          <HeroScenario />
        </ScrollReveal>

        {/* How it works */}
        <ScrollReveal delay={0.15}>
          <p
            className="text-xs font-bold uppercase tracking-widest text-center mb-4"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
          >
            How it works
          </p>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-3" delay={0.05}>
            {HOW_IT_WORKS.map((s) => (
              <StaggerItem key={s.step}>
                <GlassCard
                  interactive
                  padding="p-5"
                  className="flex flex-col gap-3 h-full"
                  style={{
                    borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: s.accent,
                    borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: s.accentBorder,
                    borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: s.accentBorder,
                    borderLeftWidth: '1px', borderLeftStyle: 'solid', borderLeftColor: s.accentBorder,
                    background: s.accentBg,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.accent}18`, border: `1px solid ${s.accent}35` }}
                    >
                      <s.icon size={18} strokeWidth={1.75} color={s.accent} />
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: s.accent, opacity: 0.5, fontFamily: 'var(--font-mono)' }}
                    >
                      {s.step}
                    </span>
                  </div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                    {s.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {s.desc}
                  </p>
                </GlassCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay={0.05}>
          {mounted && verified ? (
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={() => router.push('/observe')}
                className="w-full py-3.5 px-6 font-bold rounded-2xl text-base text-white"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  boxShadow: 'var(--shadow-glow-cyan)',
                  fontFamily: 'var(--font-display)',
                }}
                whileHover={{ scale: buttonHover.scale, boxShadow: '0 0 48px rgba(6,182,212,0.5)', y: -1 }}
                whileTap={{ scale: buttonTap.scale }}
                transition={spring}
              >
                Submit Observation →
              </motion.button>
              <motion.button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3.5 px-6 font-semibold rounded-2xl text-base"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(6,182,212,0.25)',
                  color: 'var(--cyan)',
                  fontFamily: 'var(--font-display)',
                }}
                whileHover={{ scale: buttonHover.scale, background: 'rgba(6,182,212,0.08)' }}
                whileTap={{ scale: buttonTap.scale }}
                transition={spring}
              >
                View Dashboard
              </motion.button>
            </div>
          ) : (
            <VerifyButton />
          )}
        </ScrollReveal>

        {/* For AI Agents */}
        <ScrollReveal>
          <motion.div
            className="glass p-5 flex flex-col gap-4"
            style={{
              borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: 'var(--amber)',
            }}
            variants={fadeUp}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={15} strokeWidth={1.75} style={{ color: 'var(--amber)' }} />
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--amber)', fontFamily: 'var(--font-display)' }}
                >
                  For AI Agents
                </p>
              </div>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                x402
              </span>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Query consensus-scored human observations via HTTP-native micropayments. Priced dynamically by signal strength:
            </p>

            <div className="flex flex-col gap-2">
              {(Object.entries(SIGNAL_PRICES) as [SignalStrength, string][]).map(([tier, price]) => (
                <div key={tier} className="flex items-center justify-between">
                  <SignalBadge signal={tier} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {price} USDC / query
                  </span>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-glass)' }}
            >
              <Terminal size={13} strokeWidth={2} style={{ color: 'var(--cyan)', marginTop: 1, flexShrink: 0 }} />
              <code
                className="text-xs break-all"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
              >
                GET /api/v1/weather?lat=&#123;lat&#125;&amp;lon=&#123;lon&#125;
              </code>
            </div>
          </motion.div>
        </ScrollReveal>

      </div>
    </main>
  );
}
