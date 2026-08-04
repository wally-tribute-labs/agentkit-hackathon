import { describe, expect, it, vi } from "vitest";
import { formatWeatherReport, parseCommand, queryGroundSignal } from "./handlers";
import { createScenarioResponse, SF_RAIN_SCENARIO } from "../src/core/scenario";

describe("XMTP commands", () => {
  it("parses weather, scenario, and help commands", () => {
    expect(parseCommand("weather 37.7,-122.4")).toEqual({ type: "weather", lat: 37.7, lon: -122.4 });
    expect(parseCommand("scenario sf-rain-v1")).toEqual({ type: "scenario", scenarioId: "sf-rain-v1" });
    expect(parseCommand("help")).toEqual({ type: "help" });
  });

  it("rejects invalid coordinates", () => expect(parseCommand("weather 91,0").type).toBe("error"));

  it("calls the public API rather than a database", async () => {
    const mockFetch = vi.fn(async () => new Response(JSON.stringify(createScenarioResponse(SF_RAIN_SCENARIO)), { status: 200 }));
    const result = await queryGroundSignal({ type: "scenario", scenarioId: "sf-rain-v1" }, mockFetch);
    expect(result.consensus.condition).toBe("rain");
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/demo/weather"), expect.anything());
  });

  it("labels simulated reports", () => expect(formatWeatherReport(createScenarioResponse(SF_RAIN_SCENARIO))).toContain("SIMULATED"));

  it.each([402, 503])("surfaces API status %s without fabricating a report", async (status) => {
    const mockFetch = vi.fn(async () => new Response(JSON.stringify({ error: "unavailable" }), { status }));
    await expect(queryGroundSignal({ type: "weather", lat: 37.7, lon: -122.4 }, mockFetch)).rejects.toThrow(
      `GroundSignal API returned ${status}`,
    );
  });
});
