import { cookies } from "next/headers";
import { getRuntimeMode } from "@/server/config";
import { apiError } from "@/server/errors";
import { OBSERVER_COOKIE, readObserverSession } from "@/server/session";

export async function GET() {
  if (getRuntimeMode() !== "sqlite") {
    return apiError(503, "SQLITE_MODE_REQUIRED", "Observer history is available only in SQLite mode.");
  }
  const cookieStore = await cookies();
  const session = readObserverSession(cookieStore.get(OBSERVER_COOKIE)?.value);
  if (!session) return apiError(401, "OBSERVER_SESSION_REQUIRED", "A valid observer session is required.");
  const { SQLiteObservationRepository } = await import("@/server/db/repositories");
  const observations = await new SQLiteObservationRepository().listObserver(session.observerId);
  return Response.json({ observations, total: observations.length }, { headers: { "Cache-Control": "no-store" } });
}
