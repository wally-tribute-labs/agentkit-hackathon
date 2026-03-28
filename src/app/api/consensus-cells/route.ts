import { NextResponse } from 'next/server';
import { cellToLatLng } from 'h3-js';
import db from '@/lib/db';
import { initSchema } from '@/lib/db/schema';
import { getTimeWindow, getSignalStrength } from '@/lib/weather/consensus';
import type { ObservationRow, WeatherCondition, SignalStrength } from '@/types/weather';

initSchema();

// GET /api/consensus-cells
// Returns all active consensus cells (last 24h) for map visualization.
// Public endpoint — not x402-gated.
export async function GET() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare(`SELECT * FROM observations WHERE timestamp >= ? ORDER BY timestamp DESC`)
    .all(since) as ObservationRow[];

  // Group by (h3_index, time_window)
  const groups = new Map<
    string,
    { h3Index: string; timeWindow: string; rows: ObservationRow[] }
  >();

  for (const row of rows) {
    const tw = getTimeWindow(row.timestamp);
    const key = `${row.h3_index}|${tw}`;
    if (!groups.has(key)) {
      groups.set(key, { h3Index: row.h3_index, timeWindow: tw, rows: [] });
    }
    groups.get(key)!.rows.push(row);
  }

  const cells = [];
  for (const { h3Index, timeWindow, rows: groupRows } of groups.values()) {
    // Count unique humans (sybil-resistant)
    const uniqueHumans = new Set(groupRows.map((r) => r.nullifier_hash));
    const humanCount = uniqueHumans.size;

    // Find dominant human condition
    const conditionCounts = new Map<string, number>();
    for (const r of groupRows) {
      conditionCounts.set(r.condition, (conditionCounts.get(r.condition) ?? 0) + 1);
    }
    let dominantCondition: WeatherCondition = 'clear';
    let maxCount = 0;
    for (const [cond, count] of conditionCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantCondition = cond as WeatherCondition;
      }
    }

    // Find dominant model condition (what the weather model predicted)
    const modelConditionCounts = new Map<string, number>();
    for (const r of groupRows) {
      if (r.model_condition) {
        modelConditionCounts.set(r.model_condition, (modelConditionCounts.get(r.model_condition) ?? 0) + 1);
      }
    }
    let dominantModelCondition: WeatherCondition | null = null;
    let maxModelCount = 0;
    for (const [cond, count] of modelConditionCounts) {
      if (count > maxModelCount) {
        maxModelCount = count;
        dominantModelCondition = cond as WeatherCondition;
      }
    }

    const agreementRate = Math.round((maxCount / groupRows.length) * 100) / 100;
    const signalStrength: SignalStrength = getSignalStrength(humanCount);
    const [lat, lon] = cellToLatLng(h3Index);

    cells.push({
      h3Index,
      lat,
      lon,
      condition: dominantCondition,
      modelCondition: dominantModelCondition,
      agreementRate,
      humanCount,
      signalStrength,
      timeWindow,
    });
  }

  return NextResponse.json({ cells });
}
