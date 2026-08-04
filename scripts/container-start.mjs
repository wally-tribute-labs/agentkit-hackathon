import fs from "node:fs";
import path from "node:path";

const mode = process.env.GROUNDSIGNAL_MODE ?? "demo";
if (mode !== "demo" && mode !== "sqlite") {
  throw new Error("Invalid GROUNDSIGNAL_MODE. Expected 'demo' or 'sqlite'.");
}

if (mode === "sqlite") {
  const { default: Database } = await import("better-sqlite3");
  const databasePath = path.resolve(process.cwd(), process.env.GROUNDSIGNAL_DB_PATH ?? "./data/groundsignal.db");
  if (!fs.existsSync(databasePath)) {
    throw new Error(`GroundSignal database is missing at ${databasePath}. Run the explicit container migration command first.`);
  }
  const database = new Database(databasePath, { readonly: true, fileMustExist: true });
  const migrationTable = database.prepare(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='gs_schema_migrations'",
  ).get();
  database.close();
  if (!migrationTable) throw new Error("GroundSignal database is not migrated. Run the explicit container migration command first.");
}

await import("./server.js");
