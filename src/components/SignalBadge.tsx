'use client';

import type { SignalStrength } from '@/types/weather';
import { SIGNAL_PRICES } from '@/types/weather';

const SIGNAL_COLORS: Record<SignalStrength, string> = {
  solo: 'bg-gray-200 text-gray-700',
  corroborated: 'bg-yellow-100 text-yellow-800',
  strong: 'bg-green-100 text-green-800',
  ground_truth: 'bg-blue-100 text-blue-800',
};

const SIGNAL_LABELS: Record<SignalStrength, string> = {
  solo: 'Solo',
  corroborated: 'Corroborated',
  strong: 'Strong',
  ground_truth: 'Ground Truth',
};

interface SignalBadgeProps {
  signal: SignalStrength;
  showPrice?: boolean;
}

export function SignalBadge({ signal, showPrice }: SignalBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${SIGNAL_COLORS[signal]}`}>
      {SIGNAL_LABELS[signal]}
      {showPrice && <span className="opacity-70">{SIGNAL_PRICES[signal]}</span>}
    </span>
  );
}
