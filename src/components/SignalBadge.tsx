'use client';

import { motion } from 'framer-motion';
import { Signal, Radio, Layers, Globe } from 'lucide-react';
import type { SignalStrength } from '@/types/weather';
import { SIGNAL_PRICES } from '@/types/weather';
import { spring } from '@/lib/motion';

const SIGNAL_STYLES: Record<SignalStrength, string> = {
  solo:          'bg-slate-500/15 text-slate-300 border border-slate-500/25',
  corroborated:  'bg-amber-500/15 text-amber-300 border border-amber-500/25',
  strong:        'bg-green-500/15 text-green-300 border border-green-500/25',
  ground_truth:  'bg-cyan-500/15 text-cyan-300 border border-cyan-500/35',
};

const SIGNAL_LABELS: Record<SignalStrength, string> = {
  solo:         'Solo',
  corroborated: 'Corroborated',
  strong:       'Strong',
  ground_truth: 'Ground Truth',
};

const SIGNAL_ICONS: Record<SignalStrength, React.FC<{ size?: number; strokeWidth?: number; className?: string }>> = {
  solo:         Signal,
  corroborated: Radio,
  strong:       Layers,
  ground_truth: Globe,
};

interface SignalBadgeProps {
  signal: SignalStrength;
  showPrice?: boolean;
}

export function SignalBadge({ signal, showPrice }: SignalBadgeProps) {
  const Icon = SIGNAL_ICONS[signal];
  const isGroundTruth = signal === 'ground_truth';

  return (
    <motion.span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${SIGNAL_STYLES[signal]}`}
      whileHover={{ scale: 1.05 }}
      transition={spring}
      style={isGroundTruth ? { boxShadow: '0 0 10px rgba(6,182,212,0.2)' } : undefined}
    >
      <Icon size={10} strokeWidth={2} />
      {SIGNAL_LABELS[signal]}
      {showPrice && (
        <span className="opacity-55 font-mono ml-0.5">{SIGNAL_PRICES[signal]}</span>
      )}
    </motion.span>
  );
}
