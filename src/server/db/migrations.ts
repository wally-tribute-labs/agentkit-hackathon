export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "groundsignal_core",
    sql: `
      CREATE TABLE IF NOT EXISTS gs_observations (
        id TEXT PRIMARY KEY,
        observer_id TEXT NOT NULL,
        source TEXT NOT NULL CHECK(source IN ('demo_fixture', 'visitor_demo', 'world_id')),
        h3_index TEXT NOT NULL,
        window_start TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        received_at TEXT NOT NULL,
        condition TEXT NOT NULL,
        intensity TEXT NOT NULL,
        feel TEXT NOT NULL,
        note TEXT,
        location_accuracy_meters INTEGER,
        UNIQUE(observer_id, h3_index, window_start)
      );
      CREATE INDEX IF NOT EXISTS gs_observations_window
        ON gs_observations(h3_index, window_start, received_at);
      CREATE INDEX IF NOT EXISTS gs_observations_observer
        ON gs_observations(observer_id, received_at DESC);
      CREATE TABLE IF NOT EXISTS gs_agentkit_usage (
        endpoint TEXT NOT NULL,
        human_id TEXT NOT NULL,
        use_count INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        PRIMARY KEY(endpoint, human_id)
      );
      CREATE TABLE IF NOT EXISTS gs_agentkit_nonces (
        nonce TEXT PRIMARY KEY,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS gs_agentkit_nonces_expiry ON gs_agentkit_nonces(expires_at);
    `,
  },
];
