import { latLngToCell, gridDisk } from 'h3-js';
import db from '@/lib/db';
import { initSchema } from '@/lib/db/schema';
import type { ConsensusCell, ObservationRow, SignalStrength, WeatherCondition } from '@/types/weather';
import { SIGNAL_THRESHOLDS } from '@/types/weather';

initSchema();

const H3_RESOLUTION = 7;
const H3_EDGE_LENGTH_M = 1220; // approximate edge length at res 7

// Round a timestamp down to the nearest 30-minute window
export function getTimeWindow(timestamp: string): string {
  const d = new Date(timestamp);
  d.setMinutes(Math.floor(d.getMinutes() / 30) * 30, 0, 0);
  return d.toISOString();
}

// Determine signal strength from unique human count
export function getSignalStrength(humanCount: number): SignalStrength {
  if (humanCount >= SIGNAL_THRESHOLDS.ground_truth) return 'ground_truth';
  if (humanCount >= SIGNAL_THRESHOLDS.strong) return 'strong';
  if (humanCount >= SIGNAL_THRESHOLDS.corroborated) return 'corroborated';
  return 'solo';
}

// Query consensus for a lat/lon area
export async function getConsensusWeather(
  lat: number,
  lon: number,
  radiusMeters: number = 1000,
): Promise<ConsensusCell | null> {
  // Convert lat/lon to H3 cell and compute disk of neighbors
  const centerCell = latLngToCell(lat, lon, H3_RESOLUTION);
  const k = Math.max(1, Math.ceil(radiusMeters / H3_EDGE_LENGTH_M));
  const cells = gridDisk(centerCell, k);

  // Current 30-min window and the previous one (edge-case: query right after rollover)
  const now = new Date();
  const currentWindow = getTimeWindow(now.toISOString());
  const prevWindow = new Date(new Date(currentWindow).getTime() - 30 * 60 * 1000).toISOString();

  // Query observations in these cells since the previous window started
  const placeholders = cells.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT * FROM observations
       WHERE h3_index IN (${placeholders})
         AND timestamp >= ?
       ORDER BY timestamp DESC`,
    )
    .all([...cells, prevWindow]) as ObservationRow[];

  if (rows.length === 0) return null;

  // Group by time window
  const byWindow = new Map<string, ObservationRow[]>();
  for (const row of rows) {
    const w = getTimeWindow(row.timestamp);
    if (!byWindow.has(w)) byWindow.set(w, []);
    byWindow.get(w)!.push(row);
  }

  // Pick the window with the most observations; prefer current over previous
  let bestWindow = currentWindow;
  let bestRows = byWindow.get(currentWindow) ?? [];
  if (bestRows.length === 0) {
    bestWindow = prevWindow;
    bestRows = byWindow.get(prevWindow) ?? [];
  }
  if (bestRows.length === 0) return null;

  // Count unique humans by nullifier_hash (sybil-resistant)
  const uniqueHumans = new Set(bestRows.map(r => r.nullifier_hash));
  const humanCount = uniqueHumans.size;

  // Find the dominant WeatherCondition
  const conditionCounts = new Map<string, number>();
  for (const row of bestRows) {
    conditionCounts.set(row.condition, (conditionCounts.get(row.condition) ?? 0) + 1);
  }
  let dominantCondition: WeatherCondition = 'clear';
  let maxCount = 0;
  for (const [cond, count] of conditionCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominantCondition = cond as WeatherCondition;
    }
  }

  // Agreement rate = fraction of observations reporting dominant condition
  const agreementRate = Math.round((maxCount / bestRows.length) * 100) / 100;

  // h3Index = cell with the most observations in the disk (most representative)
  const cellCounts = new Map<string, number>();
  for (const row of bestRows) {
    cellCounts.set(row.h3_index, (cellCounts.get(row.h3_index) ?? 0) + 1);
  }
  let bestCell = centerCell;
  let bestCellCount = 0;
  for (const [cell, count] of cellCounts) {
    if (count > bestCellCount) {
      bestCellCount = count;
      bestCell = cell;
    }
  }

  return {
    h3Index: bestCell,
    timeWindow: bestWindow,
    condition: dominantCondition,
    agreementRate,
    humanCount,
    signalStrength: getSignalStrength(humanCount),
  };
}
