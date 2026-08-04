import type { AgentWeatherResponse } from "../src/core/types";

export type ParseResult =
  | { type: "weather"; lat: number; lon: number }
  | { type: "scenario"; scenarioId: string }
  | { type: "help" }
  | { type: "error"; message: string };

const WEATHER_REGEX = /^weather\s+([-\d.]+)[,\s]+([-\d.]+)$/i;
const SCENARIO_REGEX = /^scenario\s+([a-z0-9-]+)$/i;
const HELP_COMMANDS = new Set(["help", "/help", "hi", "hello", "hey", "start"]);

export function parseCommand(text: string): ParseResult {
  const trimmed = text.trim();
  if (HELP_COMMANDS.has(trimmed.toLowerCase())) return { type: "help" };
  const scenario = trimmed.match(SCENARIO_REGEX);
  if (scenario) return { type: "scenario", scenarioId: scenario[1] };
  const weather = trimmed.match(WEATHER_REGEX);
  if (!weather) return { type: "error", message: "Unknown command. Try `weather 37.7749,-122.4194`, `scenario sf-rain-v1`, or `help`." };
  const lat = Number(weather[1]);
  const lon = Number(weather[2]);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return { type: "error", message: "Latitude must be between -90 and 90." };
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { type: "error", message: "Longitude must be between -180 and 180." };
  return { type: "weather", lat, lon };
}

export async function queryGroundSignal(command: Exclude<ParseResult, { type: "help" | "error" }>, request = fetch): Promise<AgentWeatherResponse> {
  const origin = process.env.GROUNDSIGNAL_API_URL ?? "http://localhost:3000";
  const mode = process.env.GROUNDSIGNAL_XMTP_MODE ?? "demo";
  const path = command.type === "scenario" || mode === "demo"
    ? `/api/demo/weather?scenario=${encodeURIComponent(command.type === "scenario" ? command.scenarioId : "sf-rain-v1")}`
    : `/api/v1/weather?lat=${command.lat}&lon=${command.lon}&radius=1000`;
  const response = await request(`${origin}${path}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`GroundSignal API returned ${response.status}`);
  return response.json() as Promise<AgentWeatherResponse>;
}

export function formatWeatherReport(response: AgentWeatherResponse): string {
  const consensus = response.consensus;
  const title = response.source.simulated ? "GroundSignal demo field report" : "GroundSignal field report";
  if (consensus.status === "unavailable") {
    return `${title}\n\nNo human signal is available.\nModel: ${response.model.description}\n\nSource: ${response.model.attribution.name}`;
  }
  return [
    title,
    response.source.simulated ? "SIMULATED — no live observers or payment" : "VERIFIED INTEGRATION MODE",
    "",
    `Human consensus: ${consensus.condition} (${Math.round((consensus.agreementRate ?? 0) * 100)}% agreement)`,
    `Signal: ${consensus.tier} · ${consensus.uniqueObserverCount} unique observers`,
    `Model: ${response.model.condition} — ${response.delta.agrees ? "agrees" : "disagrees"}`,
    "",
    `${response.model.temperatureCelsius.toFixed(1)}°C · ${response.model.humidityPercent}% humidity · ${response.model.windSpeedKph.toFixed(1)} km/h wind`,
    `Weather data: ${response.model.attribution.name}`,
  ].join("\n");
}

export function getHelpText(): string {
  return [
    "GroundSignal — human witness data for agents",
    "",
    "Commands:",
    "  weather <lat>,<lon>      query a location",
    "  scenario <scenario-id>   replay a deterministic fixture",
    "  help                     show this guide",
    "",
    "Default demo mode is explicitly simulated and never makes a payment.",
  ].join("\n");
}
