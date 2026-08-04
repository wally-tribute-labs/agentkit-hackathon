import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { coordinatesToCell } from "@/core/geo";
import { MIGRATIONS } from "./migrations";

vi.mock("server-only", () => ({}));

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "groundsignal-repository-test-"));
const databasePath = path.join(temporaryDirectory, "groundsignal.db");

beforeAll(() => {
  process.env.GROUNDSIGNAL_MODE = "sqlite";
  process.env.GROUNDSIGNAL_DB_PATH = databasePath;
  const database = new Database(databasePath);
  database.exec("CREATE TABLE observations (id TEXT); CREATE TABLE cell_revenue (id TEXT);");
  database.exec("CREATE TABLE gs_schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);");
  for (const migration of MIGRATIONS) {
    database.exec(migration.sql);
    database.prepare("INSERT INTO gs_schema_migrations VALUES (?, ?, ?)").run(migration.version, migration.name, new Date(0).toISOString());
  }
  database.close();
});

afterAll(async () => {
  const { getDatabase } = await import("./connection");
  getDatabase().close();
  delete process.env.GROUNDSIGNAL_MODE;
  delete process.env.GROUNDSIGNAL_DB_PATH;
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

describe("SQLite repositories", () => {
  it("preserves legacy tables and enables WAL and foreign keys", async () => {
    const { getDatabase } = await import("./connection");
    const database = getDatabase();
    const names = database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    expect(names.map((row) => row.name)).toEqual(expect.arrayContaining(["observations", "cell_revenue", "gs_observations"]));
    expect(database.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(database.pragma("foreign_keys", { simple: true })).toBe(1);
  });

  it("enforces one observation per observer, cell, and window", async () => {
    const { SQLiteObservationRepository } = await import("./repositories");
    const repository = new SQLiteObservationRepository();
    const input = {
      observerId: "world_observer_test",
      h3Index: coordinatesToCell(37.7749, -122.4194),
      windowStart: "2026-01-01T00:00:00.000Z",
      observedAt: "2026-01-01T00:01:00.000Z",
      receivedAt: "2026-01-01T00:01:01.000Z",
      condition: "rain" as const,
      intensity: "moderate" as const,
      feel: "cool" as const,
    };
    await repository.insert(input);
    await expect(repository.insert(input)).rejects.toThrow(/UNIQUE constraint failed/);
  });

  it("atomically limits free-trial usage and rejects nonce replay", async () => {
    const { SQLiteAgentKitUsageRepository } = await import("./repositories");
    const repository = new SQLiteAgentKitUsageRepository();
    expect(await repository.tryIncrementUsage("weather", "human-1", 3)).toBe(true);
    expect(await repository.tryIncrementUsage("weather", "human-1", 3)).toBe(true);
    expect(await repository.tryIncrementUsage("weather", "human-1", 3)).toBe(true);
    expect(await repository.tryIncrementUsage("weather", "human-1", 3)).toBe(false);
    expect(await repository.getUsageCount("weather", "human-1")).toBe(3);

    await repository.recordNonce("nonce-1");
    expect(await repository.hasUsedNonce("nonce-1")).toBe(true);
    await expect(repository.recordNonce("nonce-1")).rejects.toThrow(/UNIQUE constraint failed/);
  });
});
