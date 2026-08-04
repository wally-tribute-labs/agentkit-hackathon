import { getIntegrationAvailability, getRuntimeMode } from "@/server/config";
import { apiError } from "@/server/errors";

export async function GET() {
  const mode = getRuntimeMode();
  let storage: "fixtures" | "ok" | "unavailable" = "fixtures";
  if (mode === "sqlite") {
    try {
      const { SQLiteObservationRepository } = await import("@/server/db/repositories");
      storage = await new SQLiteObservationRepository().health();
    } catch (error) {
      return apiError(503, "STORAGE_UNAVAILABLE", "SQLite is unavailable or migrations are missing.", {
        reason: error instanceof Error ? error.message : "Unknown storage error",
      });
    }
  }
  return Response.json({
    status: "ok",
    product: "GroundSignal",
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "development",
    mode,
    storage,
    integrations: getIntegrationAvailability(),
  }, { headers: { "Cache-Control": "no-store" } });
}
