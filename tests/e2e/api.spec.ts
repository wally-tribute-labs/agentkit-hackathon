import { expect, test } from "@playwright/test";
import { agentWeatherResponseSchema } from "../../src/core/schemas";

test("demo weather responses are byte-stable and ignore coordinate overrides", async ({ request }) => {
  const url = "/api/demo/weather?scenario=sf-rain-v1&lat=0&lon=0&radius=10000";
  const first = await request.get(url);
  const second = await request.get(url);

  expect(first.status()).toBe(200);
  const firstText = await first.text();
  expect(await second.text()).toBe(firstText);

  const body = JSON.parse(firstText);
  expect(agentWeatherResponseSchema.safeParse(body).success).toBe(true);
  expect(body.source).toEqual({ mode: "demo_scenario", scenarioId: "sf-rain-v1", simulated: true });
  expect(body.query).toMatchObject({ latitude: 37.7749, longitude: -122.4194, radiusMeters: 1_000 });
  expect(body.consensus).toMatchObject({ condition: "rain", tier: "ground_truth", reportCount: 12 });
  expect(body.model.attribution).toEqual({ name: "Open-Meteo", url: "https://open-meteo.com/" });
});

test("demo API returns typed errors", async ({ request }) => {
  const invalidStep = await request.get("/api/demo/weather?scenario=sf-rain-v1&step=-1");
  expect(invalidStep.status()).toBe(400);
  expect(await invalidStep.json()).toMatchObject({ error: { code: "INVALID_QUERY" } });

  const missing = await request.get("/api/demo/weather?scenario=missing-scenario");
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toMatchObject({ error: { code: "SCENARIO_NOT_FOUND" } });
});

test("paid API validates before reporting disabled x402", async ({ request }) => {
  const invalid = await request.get("/api/v1/weather?lat=91&lon=0");
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toMatchObject({ error: { code: "INVALID_QUERY" } });

  const disabled = await request.get("/api/v1/weather?lat=37.7749&lon=-122.4194&scenario=sf-rain-v1");
  expect(disabled.status()).toBe(503);
  expect(await disabled.json()).toMatchObject({ error: { code: "INTEGRATION_DISABLED" } });
});

test("demo mode refuses persistent observation APIs and exposes safe health metadata", async ({ request }) => {
  const submit = await request.post("/api/observations", { data: { latitude: 0, longitude: 0 } });
  expect(submit.status()).toBe(503);
  expect(await submit.json()).toMatchObject({ error: { code: "SQLITE_MODE_REQUIRED" } });

  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  const body = await health.json();
  expect(body).toMatchObject({ status: "ok", mode: "demo" });
  expect(JSON.stringify(body)).not.toMatch(/secret|private.?key|nullifier/i);
});

test("OpenAPI and scenario discovery are available without credentials", async ({ request }) => {
  const scenarios = await request.get("/api/demo/scenarios");
  expect(await scenarios.json()).toMatchObject({ scenarios: [{ id: "sf-rain-v1", featured: true }] });

  const openapi = await request.get("/api/v1/openapi");
  expect(openapi.status()).toBe(200);
  expect(await openapi.json()).toMatchObject({ openapi: "3.1.0", info: { title: "GroundSignal Agent API" } });
});
