import "server-only";
import { calculateConsensus } from "@/core/consensus";
import { cellsForRadius, coordinatesToCell } from "@/core/geo";
import { createScenarioResponse, getScenario, SF_RAIN_SCENARIO } from "@/core/scenario";
import { floorToWindow, windowEnd } from "@/core/time";
import type { AgentWeatherResponse } from "@/core/types";
import type { GroundSignalMode } from "./config";

export async function resolveWeatherResponse(input: {
  mode: GroundSignalMode;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  scenarioId?: string;
}): Promise<AgentWeatherResponse | null> {
  if (input.mode === "demo") {
    const scenario = getScenario(input.scenarioId ?? SF_RAIN_SCENARIO.id);
    return scenario ? createScenarioResponse(scenario) : null;
  }

  const now = new Date();
  const currentWindow = floorToWindow(now);
  const cells = cellsForRadius(input.latitude, input.longitude, input.radiusMeters);
  const centerCell = coordinatesToCell(input.latitude, input.longitude);
  const [{ SQLiteObservationRepository }, { fetchOpenMeteo }] = await Promise.all([
    import("@/server/db/repositories"),
    import("@/server/open-meteo"),
  ]);
  const repository = new SQLiteObservationRepository();
  const [reports, model] = await Promise.all([
    repository.listWindow({ h3Indexes: cells, windowStart: currentWindow, windowEnd: windowEnd(currentWindow) }),
    fetchOpenMeteo(input.latitude, input.longitude),
  ]);
  const consensus = calculateConsensus(reports, centerCell, currentWindow);
  return {
    version: "1.0",
    source: { mode: "sqlite", simulated: false },
    query: {
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      queriedAt: now.toISOString(),
    },
    consensus,
    model,
    delta: {
      modelCondition: model.condition,
      humanCondition: consensus.condition,
      agrees: consensus.condition === null ? null : consensus.condition === model.condition,
      agreementRate: consensus.agreementRate,
    },
    provenance: {
      h3Resolution: 8,
      h3Index: centerCell,
      timeWindowMinutes: 30,
      reportCount: consensus.reportCount,
      uniqueObserverCount: consensus.uniqueObserverCount,
      demoObserverCount: 0,
    },
  };
}
