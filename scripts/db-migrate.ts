import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { MIGRATIONS } from "../src/server/db/migrations";

const databasePath = path.resolve(process.cwd(), process.env.GROUNDSIGNAL_DB_PATH ?? "./data/groundsignal.db");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS gs_schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  )
`);

const applied = database.prepare("SELECT 1 FROM gs_schema_migrations WHERE version = ?");
const record = database.prepare(
  "INSERT INTO gs_schema_migrations(version, name, applied_at) VALUES (?, ?, ?)",
);

for (const migration of MIGRATIONS) {
  if (applied.get(migration.version)) continue;
  database.transaction(() => {
    database.exec(migration.sql);
    record.run(migration.version, migration.name, new Date().toISOString());
  })();
  console.log(`Applied migration ${migration.version}: ${migration.name}`);
}

database.close();
console.log(`GroundSignal database ready at ${databasePath}`);
