import "server-only";
import { randomUUID } from "node:crypto";
import type {
  AgentKitUsageRepository,
  ObservationEvidence,
  ObservationRepository,
  ObservationWindowQuery,
  ValidatedObservationInput,
} from "@/core/types";
import { getDatabase } from "./connection";

interface ObservationRow {
  id: string;
  observer_id: string;
  source: "world_id";
  h3_index: string;
  window_start: string;
  observed_at: string;
  received_at: string;
  condition: ObservationEvidence["condition"];
  intensity: ObservationEvidence["intensity"];
  feel: ObservationEvidence["feel"];
  note: string | null;
  location_accuracy_meters: number | null;
}

function mapObservation(row: ObservationRow): ObservationEvidence {
  return {
    id: row.id,
    observerId: row.observer_id,
    source: row.source,
    h3Index: row.h3_index,
    windowStart: row.window_start,
    observedAt: row.observed_at,
    receivedAt: row.received_at,
    condition: row.condition,
    intensity: row.intensity,
    feel: row.feel,
    ...(row.note ? { note: row.note } : {}),
    ...(row.location_accuracy_meters === null ? {} : { locationAccuracyMeters: row.location_accuracy_meters }),
  };
}

export class SQLiteObservationRepository implements ObservationRepository {
  async insert(input: ValidatedObservationInput): Promise<ObservationEvidence> {
    const id = randomUUID();
    getDatabase().prepare(`
      INSERT INTO gs_observations
        (id, observer_id, source, h3_index, window_start, observed_at, received_at,
         condition, intensity, feel, note, location_accuracy_meters)
      VALUES (?, ?, 'world_id', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, input.observerId, input.h3Index, input.windowStart, input.observedAt, input.receivedAt,
      input.condition, input.intensity, input.feel, input.note ?? null, input.locationAccuracyMeters ?? null,
    );
    return { id, source: "world_id", ...input };
  }

  async listWindow(query: ObservationWindowQuery): Promise<ObservationEvidence[]> {
    if (query.h3Indexes.length === 0) return [];
    const placeholders = query.h3Indexes.map(() => "?").join(",");
    const rows = getDatabase().prepare(`
      SELECT * FROM gs_observations
      WHERE h3_index IN (${placeholders}) AND window_start >= ? AND window_start < ?
      ORDER BY received_at ASC
    `).all(...query.h3Indexes, query.windowStart, query.windowEnd) as ObservationRow[];
    return rows.map(mapObservation);
  }

  async listObserver(observerId: string): Promise<ObservationEvidence[]> {
    const rows = getDatabase().prepare(
      "SELECT * FROM gs_observations WHERE observer_id = ? ORDER BY received_at DESC LIMIT 100",
    ).all(observerId) as ObservationRow[];
    return rows.map(mapObservation);
  }

  async health(): Promise<"ok"> {
    getDatabase().prepare("SELECT 1").get();
    return "ok";
  }
}

export class SQLiteAgentKitUsageRepository implements AgentKitUsageRepository {
  async tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean> {
    return getDatabase().transaction(() => {
      const current = getDatabase().prepare(
        "SELECT use_count FROM gs_agentkit_usage WHERE endpoint = ? AND human_id = ?",
      ).get(endpoint, humanId) as { use_count: number } | undefined;
      if ((current?.use_count ?? 0) >= limit) return false;
      getDatabase().prepare(`
        INSERT INTO gs_agentkit_usage(endpoint, human_id, use_count, updated_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(endpoint, human_id) DO UPDATE SET
          use_count = use_count + 1,
          updated_at = excluded.updated_at
      `).run(endpoint, humanId, new Date().toISOString());
      return true;
    })();
  }

  async getUsageCount(endpoint: string, humanId: string): Promise<number> {
    const row = getDatabase().prepare(
      "SELECT use_count FROM gs_agentkit_usage WHERE endpoint = ? AND human_id = ?",
    ).get(endpoint, humanId) as { use_count: number } | undefined;
    return row?.use_count ?? 0;
  }

  async incrementUsage(endpoint: string, humanId: string): Promise<void> {
    getDatabase().prepare(`
      INSERT INTO gs_agentkit_usage(endpoint, human_id, use_count, updated_at)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(endpoint, human_id) DO UPDATE SET
        use_count = use_count + 1,
        updated_at = excluded.updated_at
    `).run(endpoint, humanId, new Date().toISOString());
  }

  async hasUsedNonce(nonce: string): Promise<boolean> {
    const now = new Date().toISOString();
    getDatabase().prepare("DELETE FROM gs_agentkit_nonces WHERE expires_at <= ?").run(now);
    return Boolean(getDatabase().prepare("SELECT 1 FROM gs_agentkit_nonces WHERE nonce = ?").get(nonce));
  }

  async recordNonce(nonce: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    getDatabase().prepare(
      "INSERT INTO gs_agentkit_nonces(nonce, expires_at, created_at) VALUES (?, ?, ?)",
    ).run(nonce, expiresAt, now.toISOString());
  }
}
