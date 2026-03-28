#!/usr/bin/env tsx
// Demo seed script — run right before the demo for fresh timestamps
//
// Usage:
//   npx tsx scripts/demo-seed.ts
//
// Seeds 4 locations covering all 4 signal strength tiers.
// Hero scenario: model says clear, 12 humans say rain (92% agreement, ground_truth tier).

import Database from 'better-sqlite3';
import path from 'path';
import { latLngToCell } from 'h3-js';

const DB_PATH = path.join(process.cwd(), 'data', 'weather.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure schema exists
db.exec(`
  CREATE TABLE IF NOT EXISTS observations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nullifier_hash  TEXT NOT NULL,
    lat             REAL NOT NULL,
    lon             REAL NOT NULL,
    h3_index        TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    condition       TEXT NOT NULL,
    intensity       TEXT NOT NULL,
    feel            TEXT NOT NULL,
    confirms_model  INTEGER NOT NULL DEFAULT 0,
    note            TEXT,
    photo_path      TEXT,
    model_temp      REAL,
    model_condition TEXT,
    model_humidity  REAL,
    model_wind_speed REAL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_observations_h3_time
    ON observations (h3_index, timestamp);

  CREATE INDEX IF NOT EXISTS idx_observations_nullifier
    ON observations (nullifier_hash);

  CREATE INDEX IF NOT EXISTS idx_observations_latlon
    ON observations (lat, lon);
`);

const H3_RES = 7;

// Floor timestamp to nearest 30-minute window
function getTimeWindow(date: Date): string {
  const d = new Date(date);
  d.setMinutes(Math.floor(d.getMinutes() / 30) * 30, 0, 0);
  return d.toISOString();
}

// Small GPS jitter within the same H3 cell
function jitter(): number {
  return (Math.random() - 0.5) * 0.001;
}

const insert = db.prepare(`
  INSERT INTO observations
    (nullifier_hash, lat, lon, h3_index, timestamp, condition, intensity, feel,
     confirms_model, note, model_temp, model_condition, model_humidity, model_wind_speed)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let nullifierCounter = 1;
function nextNullifier(): string {
  return `0xdemo_${String(nullifierCounter++).padStart(4, '0')}`;
}

// Use current time so timestamps are always within the active 30-min window
const now = new Date();
const timestamp = getTimeWindow(now);

const seedAll = db.transaction(() => {
  // ─── Location 1: SF Financial District ── GROUND TRUTH ───────────────────
  // Hero scenario: model says CLEAR, 12 humans say RAIN (11 rain + 1 cloudy)
  // agreementRate = 11/12 ≈ 0.92, signalStrength = ground_truth
  const SF_LAT = 37.7749;
  const SF_LON = -122.4194;
  const sfCell = latLngToCell(SF_LAT, SF_LON, H3_RES);

  for (let i = 0; i < 11; i++) {
    insert.run(
      nextNullifier(),
      SF_LAT + jitter(), SF_LON + jitter(),
      sfCell, timestamp,
      'rain', i < 6 ? 'moderate' : 'light', 'cool',
      0, null,
      18.5, 'clear', 72, 8.5,
    );
  }
  // One dissenter reporting cloudy
  insert.run(
    nextNullifier(),
    SF_LAT + jitter(), SF_LON + jitter(),
    sfCell, timestamp,
    'cloudy', 'moderate', 'cool',
    0, null,
    18.5, 'clear', 72, 8.5,
  );
  console.log(`✅ SF (ground_truth):   h3=${sfCell} — 12 humans, 11 rain + 1 cloudy, model=clear, 92% agreement`);

  // ─── Location 2: NYC Times Square ── CORROBORATED ────────────────────────
  // 4 observers: 3 snow + 1 cloudy → corroborated tier
  const NYC_LAT = 40.7580;
  const NYC_LON = -73.9855;
  const nycCell = latLngToCell(NYC_LAT, NYC_LON, H3_RES);

  for (let i = 0; i < 3; i++) {
    insert.run(
      nextNullifier(),
      NYC_LAT + jitter(), NYC_LON + jitter(),
      nycCell, timestamp,
      'snow', 'light', 'freezing',
      0, null,
      -2.0, 'cloudy', 85, 12.0,
    );
  }
  insert.run(
    nextNullifier(),
    NYC_LAT + jitter(), NYC_LON + jitter(),
    nycCell, timestamp,
    'cloudy', 'moderate', 'cold',
    1, null,
    -2.0, 'cloudy', 85, 12.0,
  );
  console.log(`✅ NYC (corroborated):  h3=${nycCell} — 4 humans, 3 snow + 1 cloudy, model=cloudy`);

  // ─── Location 3: LA Downtown ── STRONG ───────────────────────────────────
  // 6 observers: 5 clear + 1 cloudy → strong tier
  const LA_LAT = 34.0522;
  const LA_LON = -118.2437;
  const laCell = latLngToCell(LA_LAT, LA_LON, H3_RES);

  for (let i = 0; i < 5; i++) {
    insert.run(
      nextNullifier(),
      LA_LAT + jitter(), LA_LON + jitter(),
      laCell, timestamp,
      'clear', 'light', 'warm',
      1, null,
      24.0, 'clear', 45, 6.0,
    );
  }
  insert.run(
    nextNullifier(),
    LA_LAT + jitter(), LA_LON + jitter(),
    laCell, timestamp,
    'cloudy', 'light', 'mild',
    0, null,
    24.0, 'clear', 45, 6.0,
  );
  console.log(`✅ LA (strong):         h3=${laCell} — 6 humans, 5 clear + 1 cloudy, model=clear`);

  // ─── Location 4: Chicago Loop ── SOLO ────────────────────────────────────
  // 1 observer: fog → solo tier
  const CHI_LAT = 41.8781;
  const CHI_LON = -87.6298;
  const chiCell = latLngToCell(CHI_LAT, CHI_LON, H3_RES);

  insert.run(
    nextNullifier(),
    CHI_LAT + jitter(), CHI_LON + jitter(),
    chiCell, timestamp,
    'fog', 'moderate', 'cool',
    0, null,
    10.0, 'clear', 95, 5.0,
  );
  console.log(`✅ Chicago (solo):      h3=${chiCell} — 1 human, fog, model=clear`);
});

// Clear existing demo observations first (idempotent re-runs)
const deleted = db.prepare(`DELETE FROM observations WHERE nullifier_hash LIKE '0xdemo_%'`).run();
if (deleted.changes > 0) {
  console.log(`🗑️  Cleared ${deleted.changes} previous demo observations`);
}

seedAll();

const total = nullifierCounter - 1;
console.log(`\n📊 Seeded ${total} observations across 4 cities`);
console.log(`⏰ Time window: ${timestamp}`);
console.log(`\n──────────────────────────────────────────`);
console.log(`DEMO CHEAT SHEET`);
console.log(`──────────────────────────────────────────`);
console.log(`\n1. Landing page hero:`);
console.log(`   "Model says Clear, 12 humans say Rain, 92% agreement"`);
console.log(`\n2. Map shows 4 signal tiers:`);
console.log(`   🔵 SF = Ground Truth  (blue hex)`);
console.log(`   🟡 NYC = Corroborated (yellow hex)`);
console.log(`   🟢 LA = Strong        (green hex)`);
console.log(`   ⚪ Chicago = Solo     (gray hex)`);
console.log(`\n3. Agent API queries (returns 402 without payment):`);
console.log(`   curl "http://localhost:3000/api/v1/weather?lat=37.7749&lon=-122.4194"`);
console.log(`   curl "http://localhost:3000/api/v1/weather?lat=40.7580&lon=-73.9855"`);
console.log(`\n4. Public consensus cells:`);
console.log(`   curl "http://localhost:3000/api/consensus-cells" | jq '.cells | length'`);
console.log(`\n⚠️  Re-run this script if >30 min has passed before the demo`);
console.log(`──────────────────────────────────────────\n`);
