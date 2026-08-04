import { cookies } from "next/headers";
import { coordinatesToCell } from "@/core/geo";
import { observationSubmissionSchema } from "@/core/schemas";
import { floorToWindow } from "@/core/time";
import { getRuntimeMode } from "@/server/config";
import { apiError, parseJson } from "@/server/errors";
import { OBSERVER_COOKIE, readObserverSession } from "@/server/session";

export async function POST(request: Request) {
  if (getRuntimeMode() !== "sqlite") {
    return apiError(503, "SQLITE_MODE_REQUIRED", "Verified submissions are available only in SQLite mode.");
  }
  const cookieStore = await cookies();
  const session = readObserverSession(cookieStore.get(OBSERVER_COOKIE)?.value);
  if (!session) return apiError(401, "OBSERVER_SESSION_REQUIRED", "A valid World ID observer session is required.");
  const body = await parseJson(request);
  if (body instanceof Response) return body;
  const parsed = observationSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "INVALID_OBSERVATION", "The observation payload is invalid.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  const now = new Date();
  const observedAt = parsed.data.observedAt ? new Date(parsed.data.observedAt) : now;
  if (Math.abs(now.getTime() - observedAt.getTime()) > 15 * 60 * 1000) {
    return apiError(400, "STALE_OBSERVATION", "Observed time must be within fifteen minutes of server time.");
  }
  const input = {
    observerId: session.observerId,
    h3Index: coordinatesToCell(parsed.data.latitude, parsed.data.longitude),
    windowStart: floorToWindow(observedAt),
    observedAt: observedAt.toISOString(),
    receivedAt: now.toISOString(),
    condition: parsed.data.condition,
    intensity: parsed.data.intensity,
    feel: parsed.data.feel,
    note: parsed.data.note,
    locationAccuracyMeters: parsed.data.locationAccuracyMeters,
  };
  try {
    const { SQLiteObservationRepository } = await import("@/server/db/repositories");
    const observation = await new SQLiteObservationRepository().insert(input);
    return Response.json({ observation }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return apiError(409, "DUPLICATE_OBSERVATION", "This observer already reported in this cell and window.");
    }
    return apiError(500, "OBSERVATION_WRITE_FAILED", "The observation could not be saved.");
  }
}
