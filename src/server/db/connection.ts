import "server-only";
import path from "node:path";
import Database from "better-sqlite3";
import { getDatabasePath, getRuntimeMode } from "@/server/config";

let database: Database.Database | undefined;

export function getDatabase(): Database.Database {
  if (getRuntimeMode() !== "sqlite") throw new Error("SQLite is disabled in demo mode.");
  if (!database) {
    database = new Database(path.resolve(/* turbopackIgnore: true */ process.cwd(), getDatabasePath()));
    database.pragma("journal_mode = WAL");
    database.pragma("foreign_keys = ON");
    const table = database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='gs_schema_migrations'",
    ).get();
    if (!table) {
      database.close();
      database = undefined;
      throw new Error("GroundSignal database is not migrated. Run npm run db:migrate before startup.");
    }
  }
  return database;
}
