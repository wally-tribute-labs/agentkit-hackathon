import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { initSchema } from '@/lib/db/schema';

initSchema();

const insert = db.prepare(`
  INSERT INTO observations
    (nullifier_hash, lat, lon, h3_index, timestamp, condition, intensity, feel,
     confirms_model, note, model_temp, model_condition, model_humidity, model_wind_speed)
  VALUES
    (@nullifier_hash, @lat, @lon, @h3_index, @timestamp, @condition, @intensity, @feel,
     @confirms_model, @note, @model_temp, @model_condition, @model_humidity, @model_wind_speed)
`);

// POST /api/observations
// Submits a new weather observation from a verified human.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const required = ['nullifier_hash', 'lat', 'lon', 'h3_index', 'timestamp', 'condition', 'intensity', 'feel'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return NextResponse.json({ success: false, error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const result = insert.run({
      nullifier_hash: body.nullifier_hash,
      lat: body.lat,
      lon: body.lon,
      h3_index: body.h3_index,
      timestamp: body.timestamp,
      condition: body.condition,
      intensity: body.intensity,
      feel: body.feel,
      confirms_model: body.confirms_model ?? 0,
      note: body.note ?? null,
      model_temp: body.model_temp ?? null,
      model_condition: body.model_condition ?? null,
      model_humidity: body.model_humidity ?? null,
      model_wind_speed: body.model_wind_speed ?? null,
    });

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    console.error('observations POST error:', e);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}

// GET /api/observations?nullifier_hash=0x...
// Returns observations for a user (for dashboard).
export async function GET(req: NextRequest) {
  const nullifierHash = req.nextUrl.searchParams.get('nullifier_hash');
  if (!nullifierHash) {
    return NextResponse.json({ success: false, error: 'Missing nullifier_hash' }, { status: 400 });
  }

  const rows = db
    .prepare(
      `SELECT * FROM observations WHERE nullifier_hash = ? ORDER BY timestamp DESC LIMIT 100`,
    )
    .all(nullifierHash) as import('@/types/weather').ObservationRow[];

  // For each unique (h3_index, time_window) this user contributed to,
  // count distinct humans to derive signal strength and estimated earnings.
  const { getTimeWindow, getSignalStrength } = await import('@/lib/weather/consensus');
  const { SIGNAL_PRICES } = await import('@/types/weather');

  // Build set of (h3_index, time_window) pairs from user's observations
  const userCells = new Map<string, { h3Index: string; timeWindow: string }>();
  for (const row of rows) {
    const tw = getTimeWindow(row.timestamp);
    const key = `${row.h3_index}|${tw}`;
    if (!userCells.has(key)) {
      userCells.set(key, { h3Index: row.h3_index, timeWindow: tw });
    }
  }

  // For each cell the user contributed to, count distinct humans
  const cellContributions: {
    h3Index: string;
    signalStrength: import('@/types/weather').SignalStrength;
    humanCount: number;
    pricePerQuery: string;
  }[] = [];
  let totalEarningsCents = 0; // in micro-USDC to avoid float issues

  for (const { h3Index, timeWindow } of userCells.values()) {
    const countRow = db
      .prepare(
        `SELECT COUNT(DISTINCT nullifier_hash) as human_count
         FROM observations
         WHERE h3_index = ? AND timestamp >= ? AND timestamp < ?`,
      )
      .get(
        h3Index,
        timeWindow,
        new Date(new Date(timeWindow).getTime() + 30 * 60 * 1000).toISOString(),
      ) as { human_count: number };

    const humanCount = countRow.human_count;
    const signalStrength = getSignalStrength(humanCount);
    const price = SIGNAL_PRICES[signalStrength]; // e.g. "$0.005"
    const priceNum = parseFloat(price.replace('$', ''));

    cellContributions.push({ h3Index, signalStrength, humanCount, pricePerQuery: price });
    totalEarningsCents += priceNum;
  }

  const estimatedEarnings = `$${totalEarningsCents.toFixed(3)}`;

  return NextResponse.json({
    observations: rows.map((r) => ({
      id: r.id,
      nullifierHash: r.nullifier_hash,
      lat: r.lat,
      lon: r.lon,
      h3Index: r.h3_index,
      timestamp: r.timestamp,
      condition: r.condition,
      intensity: r.intensity,
      feel: r.feel,
      confirmsModel: !!r.confirms_model,
      note: r.note,
      modelTemp: r.model_temp,
      modelCondition: r.model_condition,
      modelHumidity: r.model_humidity,
      modelWindSpeed: r.model_wind_speed,
      createdAt: r.created_at,
    })),
    totalObservations: rows.length,
    estimatedEarnings,
    cellContributions,
  });
}
