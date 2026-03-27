import db from './index';

// Run once on import to ensure tables/indexes exist
export function initSchema() {
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

    -- Track x402 payment revenue per hex cell/window for earnings distribution
    CREATE TABLE IF NOT EXISTS cell_revenue (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      h3_index        TEXT NOT NULL,
      time_window     TEXT NOT NULL,
      amount_usdc     REAL NOT NULL,
      payer_address   TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cell_revenue_h3_time
      ON cell_revenue (h3_index, time_window);
  `);
}
