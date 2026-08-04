import Database from "better-sqlite3";
import path from "node:path";
import { SF_RAIN_SCENARIO } from "../src/core/scenario";

const databasePath = path.resolve(process.cwd(), process.env.GROUNDSIGNAL_DB_PATH ?? "./data/groundsignal.db");
const database = new Database(databasePath);
const migrated = database.prepare(
  "SELECT 1 FROM sqlite_master WHERE type='table' AND name='gs_schema_migrations'",
).get();
if (!migrated) {
  database.close();
  throw new Error("Database is not migrated. Run npm run db:migrate first.");
}

const insert = database.prepare(`
  INSERT OR IGNORE INTO gs_observations
    (id, observer_id, source, h3_index, window_start, observed_at, received_at,
     condition, intensity, feel, note, location_accuracy_meters)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

database.transaction(() => {
  for (const report of SF_RAIN_SCENARIO.observations) {
    insert.run(
      report.id, report.observerId, report.source, report.h3Index, report.windowStart,
      report.observedAt, report.receivedAt, report.condition, report.intensity, report.feel,
      report.note ?? null, report.locationAccuracyMeters ?? null,
    );
  }
})();
database.close();
console.log(`Seeded ${SF_RAIN_SCENARIO.observations.length} deterministic demo observations.`);
