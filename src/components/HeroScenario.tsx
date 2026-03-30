'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Users, TrendingUp } from 'lucide-react';
import { SignalBadge } from '@/components/SignalBadge';
import { WeatherIcon, getWeatherColor } from '@/components/WeatherIcon';
import { spring, staggerContainer, staggerItem } from '@/lib/motion';
import type { WeatherCondition, SignalStrength } from '@/types/weather';

interface CellData {
  condition: WeatherCondition;
  modelCondition: WeatherCondition | null;
  humanCount: number;
  agreementRate: number;
  signalStrength: SignalStrength;
}

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear', cloudy: 'Cloudy', rain: 'Rain', snow: 'Snow',
  fog: 'Fog', storm: 'Storm', windy: 'Windy', haze: 'Haze',
};

const DEMO: CellData = {
  condition: 'rain', modelCondition: 'clear',
  humanCount: 12, agreementRate: 0.92, signalStrength: 'ground_truth',
};

export function HeroScenario({ compact = false }: { compact?: boolean }) {
  const [cell, setCell] = useState<CellData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/consensus-cells')
      .then((r) => r.json())
      .then((data) => {
        const cells: CellData[] = data.cells ?? [];
        const disagreeing = cells
          .filter((c) => c.modelCondition && c.modelCondition !== c.condition)
          .sort((a, b) => b.humanCount - a.humanCount);
        setCell(disagreeing[0] ?? (cells.length ? cells.sort((a, b) => b.humanCount - a.humanCount)[0] : null));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const display = cell ?? (loaded ? DEMO : null);

  if (!display) {
    return <div className={`w-full shimmer-skeleton rounded-2xl ${compact ? 'h-24' : 'h-36'}`} />;
  }

  const modelCond   = display.modelCondition;
  const humanCond   = display.condition;
  const agreePct    = Math.round(display.agreementRate * 100);
  const humanColor  = getWeatherColor(humanCond);
  const modelColor  = modelCond ? getWeatherColor(modelCond) : 'var(--amber)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 }}
      className="w-full overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid var(--border-glass)',
        borderRadius: compact ? '16px' : '20px',
      }}
    >
      {/* Header */}
      <div className={`${compact ? 'px-3 py-2' : 'px-4 py-2.5'} flex items-center gap-2`}
        style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
        <TrendingUp size={14} strokeWidth={2} style={{ color: 'var(--cyan)' }} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
          Live Consensus Delta
        </span>
      </div>

      <motion.div className="grid grid-cols-2" variants={staggerContainer} initial="hidden" animate="show">
        {/* AI Model side */}
        <motion.div
          variants={staggerItem}
          className={`${compact ? 'p-3' : 'p-5'} flex flex-col items-center gap-2.5`}
          style={{ background: 'rgba(245,158,11,0.03)', borderRight: '1px solid var(--border-glass)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--amber)', opacity: 0.7 }} />
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--amber)', opacity: 0.85, fontFamily: 'var(--font-display)' }}>
              <Bot size={11} strokeWidth={2} /> AI Model
            </span>
          </div>
          {modelCond ? (
            <WeatherIcon condition={modelCond} size={compact ? 24 : 38} strokeWidth={1.25} color={modelColor} />
          ) : (
            <Bot size={compact ? 24 : 38} strokeWidth={1.25} style={{ color: 'var(--amber)' }} />
          )}
          <p className="text-sm font-bold" style={{ color: 'var(--amber-light)', fontFamily: 'var(--font-display)' }}>
            {modelCond ? CONDITION_LABEL[modelCond] : 'Unknown'}
          </p>
          {!compact && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>prediction</p>}
        </motion.div>

        {/* Humans side */}
        <motion.div
          variants={staggerItem}
          className={`${compact ? 'p-3' : 'p-5'} flex flex-col items-center gap-2.5`}
          style={{ background: 'rgba(6,182,212,0.03)' }}
        >
          <div className="flex items-center gap-1.5">
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--cyan)' }}
              animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest"
              style={{ color: 'var(--cyan)', opacity: 0.85, fontFamily: 'var(--font-display)' }}>
              <Users size={11} strokeWidth={2} /> {display.humanCount} {display.humanCount === 1 ? 'Human' : 'Humans'}
            </span>
          </div>
          <WeatherIcon condition={humanCond} size={compact ? 24 : 38} strokeWidth={1.25} color={humanColor} />
          <p className="text-sm font-bold" style={{ color: 'var(--cyan-light)', fontFamily: 'var(--font-display)' }}>
            {CONDITION_LABEL[humanCond]}
          </p>
          <SignalBadge signal={display.signalStrength} />
        </motion.div>
      </motion.div>

      {/* Agreement bar */}
      <div className={`${compact ? 'px-3 py-2.5' : 'px-5 py-4'}`} style={{ borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.12)' }}>
        <div className={`flex items-center justify-between ${compact ? 'mb-1.5' : 'mb-2.5'}`}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Human agreement</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {agreePct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${agreePct}%` }}
            transition={{ duration: 1, delay: 0.4, ease: [0, 0, 0.2, 1] }}
            style={{
              background: 'linear-gradient(90deg, var(--amber), var(--cyan))',
              boxShadow: '0 0 8px rgba(6,182,212,0.4)',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
