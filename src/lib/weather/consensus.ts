import type { ConsensusCell, SignalStrength, WeatherCondition } from '@/types/weather';
import { SIGNAL_THRESHOLDS } from '@/types/weather';

// Phase 2: Consensus aggregation engine
// Groups observations by H3 hex cell + 30-minute time window,
// computes agreement rate and signal strength tier.

// Round a timestamp down to the nearest 30-minute window
export function getTimeWindow(timestamp: string): string {
  // TODO: Implement in Phase 2
  throw new Error('getTimeWindow not yet implemented');
}

// Determine signal strength from unique human count
export function getSignalStrength(humanCount: number): SignalStrength {
  if (humanCount >= SIGNAL_THRESHOLDS.ground_truth) return 'ground_truth';
  if (humanCount >= SIGNAL_THRESHOLDS.strong) return 'strong';
  if (humanCount >= SIGNAL_THRESHOLDS.corroborated) return 'corroborated';
  return 'solo';
}

// Query consensus for a lat/lon bounding area
export async function getConsensusWeather(
  lat: number,
  lon: number,
  radiusMeters: number = 1000,
): Promise<ConsensusCell | null> {
  // TODO: Implement in Phase 2
  throw new Error('getConsensusWeather not yet implemented');
}
