import { describe, expect, it } from "vitest";
import { calculateConsensus } from "./consensus";
import { coordinatesToCell, H3_RESOLUTION } from "./geo";
import { normalizeWmoCode } from "./model";
import { SIGNAL_PRICE_MICRO_USDC } from "./pricing";
import { agentWeatherResponseSchema } from "./schemas";
import { SF_RAIN_SCENARIO, createScenarioResponse } from "./scenario";
import { floorToWindow } from "./time";
import type { ObservationEvidence, WeatherCondition } from "./types";
import { getResolution } from "h3-js";

function reports(conditions: WeatherCondition[]): ObservationEvidence[] {
  const h3Index = coordinatesToCell(37.7749, -122.4194);
  return conditions.map((condition, index) => ({
    id: `r${index}`,
    observerId: `o${index}`,
    source: "demo_fixture",
    h3Index,
    windowStart: "2026-01-01T00:00:00.000Z",
    observedAt: `2026-01-01T00:${String(index).padStart(2, "0")}:00.000Z`,
    receivedAt: `2026-01-01T00:${String(index).padStart(2, "0")}:01.000Z`,
    condition,
    intensity: "light",
    feel: "cool",
  }));
}

describe("consensus engine", () => {
  it.each([
    [[], null],
    [["rain"], "sparse"],
    [["rain", "rain", "cloudy"], "corroborated"],
    [["rain", "rain", "rain", "rain", "cloudy"], "strong"],
    [[...Array(8).fill("rain"), ...Array(2).fill("cloudy")], "ground_truth"],
    [["rain", "cloudy"], "contested"],
  ] as [WeatherCondition[], string | null][])("classifies %j as %s", (conditions, tier) => {
    const items = reports(conditions);
    const result = calculateConsensus(items, coordinatesToCell(37.7749, -122.4194), "2026-01-01T00:00:00.000Z");
    expect(result.tier).toBe(tier);
  });

  it("keeps only the latest report per observer, cell, and window", () => {
    const items = reports(["clear", "rain"]);
    items[1].observerId = items[0].observerId;
    const result = calculateConsensus(items, items[0].h3Index, items[0].windowStart);
    expect(result.reportCount).toBe(1);
    expect(result.condition).toBe("rain");
  });

  it.each([
    [["rain", "cloudy", "clear"], "contested"],
    [["rain", "rain", "cloudy", "clear"], "contested"],
    [["rain", "rain", "rain", "cloudy", "cloudy"], "contested"],
    [[...Array(6).fill("rain"), ...Array(3).fill("cloudy")], "contested"],
    [[...Array(7).fill("rain"), ...Array(2).fill("cloudy")], "strong"],
    [[...Array(7).fill("rain"), ...Array(3).fill("cloudy")], "contested"],
    [[...Array(8).fill("rain"), ...Array(2).fill("cloudy")], "ground_truth"],
  ] as [WeatherCondition[], string][])('applies the population threshold to %j', (conditions, tier) => {
    const items = reports(conditions);
    expect(calculateConsensus(items, items[0].h3Index, items[0].windowStart).tier).toBe(tier);
  });

  it("returns an unavailable result for an empty window", () => {
    const result = calculateConsensus([], coordinatesToCell(37.7749, -122.4194), "2026-01-01T00:00:00.000Z");
    expect(result).toMatchObject({
      status: "unavailable",
      condition: null,
      tier: null,
      agreementRate: null,
      reportCount: 0,
      uniqueObserverCount: 0,
      contested: false,
    });
  });

  it("produces the locked featured result", () => {
    const result = createScenarioResponse(SF_RAIN_SCENARIO);
    expect(result.consensus).toMatchObject({
      condition: "rain",
      tier: "ground_truth",
      reportCount: 12,
      uniqueObserverCount: 12,
    });
    expect(result.consensus.agreementRate).toBeCloseTo(11 / 12, 10);
  });

  it("serializes the featured scenario byte-for-byte across replays", () => {
    const first = JSON.stringify(createScenarioResponse(SF_RAIN_SCENARIO));
    const second = JSON.stringify(createScenarioResponse(SF_RAIN_SCENARIO));
    expect(second).toBe(first);
  });

  it("matches the public runtime response schema", () => {
    expect(agentWeatherResponseSchema.safeParse(createScenarioResponse(SF_RAIN_SCENARIO)).success).toBe(true);
  });
});

describe("domain utilities", () => {
  it.each([
    ["2026-01-01T10:00:00.000Z", "2026-01-01T10:00:00.000Z"],
    ["2026-01-01T10:29:59.999Z", "2026-01-01T10:00:00.000Z"],
    ["2026-01-01T10:30:00.000Z", "2026-01-01T10:30:00.000Z"],
    ["2026-01-01T10:59:59.999Z", "2026-01-01T10:30:00.000Z"],
  ])("floors %s", (input, expected) => expect(floorToWindow(input)).toBe(expected));

  it("derives resolution-eight cells", () => expect(getResolution(coordinatesToCell(0, 0))).toBe(H3_RESOLUTION));

  it.each([
    [0, "clear"], [3, "cloudy"], [48, "fog"], [65, "rain"], [75, "snow"], [99, "storm"],
  ] as [number, WeatherCondition][])("normalizes WMO %s", (code, expected) => {
    expect(normalizeWmoCode(code).condition).toBe(expected);
  });

  it("uses integer micro-USDC pricing", () => {
    expect(Object.values(SIGNAL_PRICE_MICRO_USDC).every(Number.isInteger)).toBe(true);
    expect(SIGNAL_PRICE_MICRO_USDC.ground_truth).toBe(20_000);
  });
});
