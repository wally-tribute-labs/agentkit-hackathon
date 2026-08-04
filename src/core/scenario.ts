import { calculateConsensus } from "./consensus";
import { coordinatesToCell } from "./geo";
import { createModelBaseline } from "./model";
import { floorToWindow } from "./time";
import type { AgentWeatherResponse, ObservationEvidence } from "./types";

export type ScenarioEventKind =
  | "model"
  | "observations"
  | "agent_query"
  | "payment_challenge"
  | "result";

export interface ScenarioEvent {
  id: string;
  kind: ScenarioEventKind;
  atMs: number;
  title: string;
  detail: string;
  observationIds?: string[];
}

export interface DemoScenario {
  id: string;
  version: string;
  seed: string;
  title: string;
  summary: string;
  locationLabel: string;
  featured: boolean;
  durationMs: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  queriedAt: string;
  windowStart: string;
  h3Index: string;
  model: AgentWeatherResponse["model"];
  observations: ObservationEvidence[];
  events: ScenarioEvent[];
}

const latitude = 37.7749;
const longitude = -122.4194;
const h3Index = coordinatesToCell(latitude, longitude);
const windowStart = floorToWindow("2026-02-07T18:04:00.000Z");

function observation(index: number, condition: "rain" | "cloudy", minute: number): ObservationEvidence {
  const observedAt = `2026-02-07T18:${String(minute).padStart(2, "0")}:00.000Z`;
  return {
    id: `sf-rain-v1_report_${String(index).padStart(2, "0")}`,
    observerId: `demo_observer_${String(index).padStart(2, "0")}`,
    source: "demo_fixture",
    h3Index,
    windowStart,
    observedAt,
    receivedAt: observedAt,
    condition,
    intensity: condition === "rain" ? "moderate" : "light",
    feel: "cool",
    note: condition === "rain" ? "Steady rain visible on the pavement." : "Low cloud cover from the west.",
    locationAccuracyMeters: 24 + index,
  };
}

const observations = [
  observation(1, "rain", 5),
  observation(2, "rain", 6),
  observation(3, "rain", 7),
  observation(4, "rain", 8),
  observation(5, "rain", 9),
  observation(6, "cloudy", 10),
  observation(7, "rain", 11),
  observation(8, "rain", 12),
  observation(9, "rain", 13),
  observation(10, "rain", 14),
  observation(11, "rain", 15),
  observation(12, "rain", 16),
];

export const SF_RAIN_SCENARIO: DemoScenario = {
  id: "sf-rain-v1",
  version: "1.0.0",
  seed: "groundsignal:sf-rain-v1:1.0.0",
  title: "The forecast missed the rain",
  summary: "A clear-sky model meets twelve simulated field reports from San Francisco.",
  locationLabel: "San Francisco, California",
  featured: true,
  durationMs: 32_000,
  latitude,
  longitude,
  radiusMeters: 1_000,
  queriedAt: "2026-02-07T18:18:00.000Z",
  windowStart,
  h3Index,
  model: createModelBaseline({
    provider: "demo_fixture",
    fetchedAt: "2026-02-07T18:04:00.000Z",
    code: 0,
    temperatureCelsius: 12.8,
    humidityPercent: 84,
    windSpeedKph: 15.3,
  }),
  observations,
  events: [
    { id: "baseline", kind: "model", atMs: 0, title: "Model baseline", detail: "Open-Meteo fixture predicts clear sky." },
    { id: "sparse", kind: "observations", atMs: 4_000, title: "Sparse signal", detail: "One simulated observer reports rain.", observationIds: [observations[0].id] },
    { id: "corroborated", kind: "observations", atMs: 8_000, title: "Corroborated", detail: "Three independent demo observers agree.", observationIds: [observations[1].id, observations[2].id] },
    { id: "strong", kind: "observations", atMs: 12_000, title: "Strong signal", detail: "Five unique reports cross the strong threshold.", observationIds: [observations[3].id, observations[4].id] },
    { id: "dissent", kind: "observations", atMs: 16_000, title: "Dissent recorded", detail: "One observer reports cloudy. The trace keeps it visible.", observationIds: [observations[5].id] },
    { id: "ground-truth", kind: "observations", atMs: 20_000, title: "Ground truth", detail: "Twelve reports: eleven rain, one cloudy, 91.67% agreement.", observationIds: observations.slice(6).map((item) => item.id) },
    { id: "query", kind: "agent_query", atMs: 24_000, title: "Agent query", detail: "An agent asks for consensus weather within one kilometre." },
    { id: "payment", kind: "payment_challenge", atMs: 28_000, title: "Simulated receipt", detail: "20 signal credits · demo_receipt_sf-rain-v1_final" },
    { id: "delivered", kind: "result", atMs: 32_000, title: "Result delivered", detail: "Model says clear. Verified demo observers report rain." },
  ],
};

export const DEMO_SCENARIOS = [SF_RAIN_SCENARIO] as const;

export function getScenario(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((scenario) => scenario.id === id);
}

export function observationsAtStep(scenario: DemoScenario, step: number): ObservationEvidence[] {
  const visibleIds = new Set(
    scenario.events
      .slice(0, Math.min(step + 1, scenario.events.length))
      .flatMap((event) => event.observationIds ?? []),
  );
  return scenario.observations.filter((item) => visibleIds.has(item.id));
}

export function createScenarioResponse(
  scenario: DemoScenario,
  requestedStep = scenario.events.length - 1,
  extraObservations: ObservationEvidence[] = [],
): AgentWeatherResponse {
  const step = Math.min(requestedStep, scenario.events.length - 1);
  const reports = [...observationsAtStep(scenario, step), ...extraObservations];
  const consensus = calculateConsensus(reports, scenario.h3Index, scenario.windowStart);
  return {
    version: "1.0",
    source: { mode: "demo_scenario", scenarioId: scenario.id, simulated: true },
    query: {
      latitude: scenario.latitude,
      longitude: scenario.longitude,
      radiusMeters: scenario.radiusMeters,
      queriedAt: scenario.queriedAt,
    },
    consensus,
    model: scenario.model,
    delta: {
      modelCondition: scenario.model.condition,
      humanCondition: consensus.condition,
      agrees: consensus.condition === null ? null : consensus.condition === scenario.model.condition,
      agreementRate: consensus.agreementRate,
    },
    provenance: {
      h3Resolution: 8,
      h3Index: scenario.h3Index,
      timeWindowMinutes: 30,
      reportCount: consensus.reportCount,
      uniqueObserverCount: consensus.uniqueObserverCount,
      demoObserverCount: reports.filter((report) => report.source !== "world_id").length,
    },
  };
}
