import "server-only";
import { z } from "zod";
import { createModelBaseline } from "@/core/model";
import type { ModelBaseline } from "@/core/types";

const openMeteoResponseSchema = z.object({
  current: z.object({
    time: z.string().min(1),
    temperature_2m: z.number().finite(),
    relative_humidity_2m: z.number().finite().min(0).max(100),
    weather_code: z.number().int(),
    wind_speed_10m: z.number().finite().nonnegative(),
  }),
});

export async function fetchOpenMeteo(latitude: number, longitude: number): Promise<ModelBaseline> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m");
  const response = await fetch(url, { next: { revalidate: 300 }, signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
  const data = openMeteoResponseSchema.parse(await response.json());
  return createModelBaseline({
    provider: "open-meteo",
    fetchedAt: data.current.time,
    code: data.current.weather_code,
    temperatureCelsius: data.current.temperature_2m,
    humidityPercent: data.current.relative_humidity_2m,
    windSpeedKph: data.current.wind_speed_10m,
  });
}
