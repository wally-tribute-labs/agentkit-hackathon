import type { NextRequest } from "next/server";
import { quoteSignal } from "@/core/pricing";
import { weatherQuerySchema } from "@/core/schemas";
import { getRuntimeMode } from "@/server/config";
import { apiError } from "@/server/errors";
import { resolveWeatherResponse } from "@/server/weather-response";

export async function GET(request: NextRequest) {
  const parsed = weatherQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return apiError(400, "INVALID_QUERY", "Latitude, longitude, or radius is invalid.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  const mode = getRuntimeMode();
  if (mode === "sqlite" && parsed.data.scenario) {
    return apiError(400, "SCENARIO_NOT_ALLOWED", "Scenario queries are available only in demo mode.");
  }
  let response;
  try {
    response = await resolveWeatherResponse({
      mode,
      latitude: parsed.data.lat,
      longitude: parsed.data.lon,
      radiusMeters: parsed.data.radius,
      scenarioId: parsed.data.scenario,
    });
  } catch {
    return apiError(502, "MODEL_PROVIDER_UNAVAILABLE", "The weather model provider is temporarily unavailable.");
  }
  if (!response) return apiError(404, "SCENARIO_NOT_FOUND", "The requested demo scenario does not exist.");
  if (!process.env.X402_FACILITATOR_URL || !process.env.X402_PAY_TO || !process.env.X402_NETWORK) {
    return apiError(503, "INTEGRATION_DISABLED", "x402 testnet payments are not configured.");
  }
  try {
    const { protectWeatherHandler } = await import("@/lib/x402/config");
    return await protectWeatherHandler(response, quoteSignal(response.consensus.tier), request);
  } catch (error) {
    return apiError(503, "X402_UNAVAILABLE", "The x402 testnet integration is unavailable.", {
      reason: error instanceof Error ? error.message : "Unknown x402 error",
    });
  }
}
