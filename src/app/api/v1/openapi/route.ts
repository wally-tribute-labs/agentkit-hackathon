const conditions = ["clear", "cloudy", "rain", "snow", "fog", "storm", "windy", "haze"];

const consensusSchema = {
  type: "object",
  required: ["status", "condition", "tier", "agreementRate", "reportCount", "uniqueObserverCount", "h3Index", "windowStart", "windowEnd", "contested"],
  properties: {
    status: { enum: ["available", "unavailable"] },
    condition: { oneOf: [{ enum: conditions }, { type: "null" }] },
    tier: { oneOf: [{ enum: ["sparse", "contested", "corroborated", "strong", "ground_truth"] }, { type: "null" }] },
    agreementRate: { oneOf: [{ type: "number", minimum: 0, maximum: 1 }, { type: "null" }] },
    reportCount: { type: "integer", minimum: 0 },
    uniqueObserverCount: { type: "integer", minimum: 0 },
    h3Index: { type: "string" }, windowStart: { type: "string", format: "date-time" },
    windowEnd: { type: "string", format: "date-time" }, contested: { type: "boolean" },
  },
};

const agentWeatherSchema = {
  type: "object",
  required: ["version", "source", "query", "consensus", "model", "delta", "provenance"],
  properties: {
    version: { const: "1.0" },
    source: { type: "object", required: ["mode", "simulated"], properties: { mode: { enum: ["demo_scenario", "sqlite"] }, scenarioId: { type: "string" }, simulated: { type: "boolean" } } },
    query: { type: "object", required: ["latitude", "longitude", "radiusMeters", "queriedAt"], properties: { latitude: { type: "number" }, longitude: { type: "number" }, radiusMeters: { type: "integer" }, queriedAt: { type: "string", format: "date-time" } } },
    consensus: consensusSchema,
    model: { type: "object", required: ["provider", "fetchedAt", "condition", "description", "temperatureCelsius", "humidityPercent", "windSpeedKph", "attribution"], properties: { provider: { enum: ["open-meteo", "demo_fixture"] }, fetchedAt: { type: "string" }, condition: { enum: conditions }, description: { type: "string" }, temperatureCelsius: { type: "number" }, humidityPercent: { type: "number" }, windSpeedKph: { type: "number" }, attribution: { type: "object" } } },
    delta: { type: "object" }, provenance: { type: "object" },
  },
};

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return Response.json({
    openapi: "3.1.0",
    info: { title: "GroundSignal Agent API", version: "1.0.0", description: "Consensus-scored physical-world weather observations. Open-Meteo data is attributed under its applicable license." },
    servers: [{ url: origin }],
    paths: {
      "/api/demo/scenarios": { get: { summary: "List deterministic demo scenarios", responses: { "200": { description: "Scenario metadata" } } } },
      "/api/demo/weather": { get: { summary: "Query an immutable demo scenario", parameters: [{ name: "scenario", in: "query", required: true, schema: { type: "string" } }, { name: "step", in: "query", schema: { type: "integer", minimum: 0 } }], responses: { "200": { description: "Deterministic weather response", content: { "application/json": { schema: { $ref: "#/components/schemas/AgentWeatherResponse" } } } }, "400": { $ref: "#/components/responses/Error" }, "404": { $ref: "#/components/responses/Error" } } } },
      "/api/v1/weather": { get: { summary: "Purchase a consensus weather signal using x402 testnet", parameters: [{ name: "lat", in: "query", required: true, schema: { type: "number", minimum: -90, maximum: 90 } }, { name: "lon", in: "query", required: true, schema: { type: "number", minimum: -180, maximum: 180 } }, { name: "radius", in: "query", schema: { type: "integer", minimum: 100, maximum: 10000, default: 1000 } }, { name: "scenario", in: "query", schema: { type: "string" } }], responses: { "200": { description: "Settled weather response", content: { "application/json": { schema: { $ref: "#/components/schemas/AgentWeatherResponse" } } } }, "402": { description: "x402 payment challenge" }, "503": { $ref: "#/components/responses/Error" } } } },
      "/api/health": { get: { summary: "Runtime and integration health", responses: { "200": { description: "Healthy" }, "503": { $ref: "#/components/responses/Error" } } } },
    },
    components: {
      schemas: {
        AgentWeatherResponse: agentWeatherSchema,
        ApiError: { type: "object", required: ["error", "requestId"], properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string" }, message: { type: "string" }, details: { type: "object" } } }, requestId: { type: "string" } } },
      },
      responses: { Error: { description: "Typed API error", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } } },
    },
  });
}
