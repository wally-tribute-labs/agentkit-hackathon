import { z } from "zod";
import { WEATHER_CONDITIONS } from "./types";

export const demoWeatherQuerySchema = z.object({
  scenario: z.string().min(1),
  step: z.coerce.number().int().nonnegative().optional(),
});

export const weatherQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(100).max(10_000).default(1_000),
  scenario: z.string().min(1).optional(),
});

export const observationSubmissionSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    locationAccuracyMeters: z.number().nonnegative().max(2_000).optional(),
    condition: z.enum(WEATHER_CONDITIONS),
    intensity: z.enum(["light", "moderate", "heavy"]),
    feel: z.enum(["freezing", "cold", "cool", "mild", "warm", "hot"]),
    note: z.string().trim().max(280).optional(),
    observedAt: z.iso.datetime().optional(),
  })
  .strict();

export const worldIdProofSchema = z.object({
  rp_id: z.string().startsWith("rp_"),
  idkitResponse: z.record(z.string(), z.unknown()).and(
    z.object({ action: z.literal("groundsignal-observation") }).passthrough(),
  ),
}).strict();

const nullableCondition = z.enum(WEATHER_CONDITIONS).nullable();
const signalTierSchema = z.enum(["sparse", "contested", "corroborated", "strong", "ground_truth"]);

export const agentWeatherResponseSchema = z.object({
  version: z.literal("1.0"),
  source: z.object({
    mode: z.enum(["demo_scenario", "sqlite"]),
    scenarioId: z.string().optional(),
    simulated: z.boolean(),
  }).strict(),
  query: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMeters: z.number().int().min(100).max(10_000),
    queriedAt: z.iso.datetime(),
  }).strict(),
  consensus: z.object({
    status: z.enum(["available", "unavailable"]),
    condition: nullableCondition,
    tier: signalTierSchema.nullable(),
    agreementRate: z.number().min(0).max(1).nullable(),
    reportCount: z.number().int().nonnegative(),
    uniqueObserverCount: z.number().int().nonnegative(),
    h3Index: z.string().min(1),
    windowStart: z.iso.datetime(),
    windowEnd: z.iso.datetime(),
    contested: z.boolean(),
  }).strict(),
  model: z.object({
    provider: z.enum(["open-meteo", "demo_fixture"]),
    fetchedAt: z.string().min(1),
    condition: z.enum(WEATHER_CONDITIONS),
    description: z.string(),
    temperatureCelsius: z.number().finite(),
    humidityPercent: z.number().min(0).max(100),
    windSpeedKph: z.number().nonnegative(),
    attribution: z.object({
      name: z.literal("Open-Meteo"),
      url: z.literal("https://open-meteo.com/"),
    }).strict(),
  }).strict(),
  delta: z.object({
    modelCondition: z.enum(WEATHER_CONDITIONS),
    humanCondition: nullableCondition,
    agrees: z.boolean().nullable(),
    agreementRate: z.number().min(0).max(1).nullable(),
  }).strict(),
  provenance: z.object({
    h3Resolution: z.literal(8),
    h3Index: z.string().min(1),
    timeWindowMinutes: z.literal(30),
    reportCount: z.number().int().nonnegative(),
    uniqueObserverCount: z.number().int().nonnegative(),
    demoObserverCount: z.number().int().nonnegative(),
  }).strict(),
}).strict();
