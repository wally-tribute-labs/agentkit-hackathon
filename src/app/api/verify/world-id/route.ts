import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { worldIdProofSchema } from "@/core/schemas";
import { getRuntimeMode } from "@/server/config";
import { apiError, parseJson } from "@/server/errors";
import { createObserverSession, OBSERVER_COOKIE, observerCookieOptions } from "@/server/session";

function pseudonymize(nullifier: string): string {
  const key = process.env.OBSERVER_SESSION_SECRET;
  if (!key) throw new Error("Missing observer session secret");
  return `observer_${createHmac("sha256", key).update(nullifier).digest("hex").slice(0, 24)}`;
}

export async function POST(request: Request) {
  if (getRuntimeMode() !== "sqlite") {
    return apiError(503, "SQLITE_MODE_REQUIRED", "World ID sessions are available only in SQLite mode.");
  }
  if (!process.env.WORLD_ID_RP_ID || !process.env.OBSERVER_SESSION_SECRET) {
    return apiError(503, "INTEGRATION_DISABLED", "World ID is not fully configured for this environment.");
  }
  const body = await parseJson(request);
  if (body instanceof Response) return body;
  const parsed = worldIdProofSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "INVALID_WORLD_ID_PROOF", "The World ID response is invalid.");
  if (parsed.data.rp_id !== process.env.WORLD_ID_RP_ID) {
    return apiError(400, "RP_ID_MISMATCH", "The proof was issued for a different relying party.");
  }

  let verification: Record<string, unknown>;
  try {
    const response = await fetch(`https://developer.world.org/api/v4/verify/${parsed.data.rp_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data.idkitResponse),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    verification = await response.json() as Record<string, unknown>;
    if (!response.ok || verification.success === false) {
      return apiError(400, "WORLD_ID_VERIFICATION_FAILED", "World ID could not verify this proof.");
    }
  } catch {
    return apiError(502, "WORLD_ID_UNAVAILABLE", "World ID verification is temporarily unavailable.");
  }

  const responseItems = Array.isArray(verification.responses) ? verification.responses : [];
  const firstResponse = responseItems[0] as Record<string, unknown> | undefined;
  const nullifier = verification.nullifier ?? firstResponse?.nullifier;
  if (typeof nullifier !== "string" || !nullifier) {
    return apiError(502, "WORLD_ID_INVALID_RESPONSE", "World ID returned no observer identifier.");
  }
  const observerId = pseudonymize(nullifier);
  const cookieStore = await cookies();
  cookieStore.set(OBSERVER_COOKIE, createObserverSession(observerId), observerCookieOptions);
  return Response.json({ verified: true, observer: { id: observerId, label: "World ID observer" } }, {
    headers: { "Cache-Control": "no-store" },
  });
}
