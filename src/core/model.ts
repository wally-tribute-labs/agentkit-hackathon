import type { ModelBaseline, WeatherCondition } from "./types";

const WMO_CONDITIONS: ReadonlyArray<[readonly number[], WeatherCondition, string]> = [
  [[0], "clear", "Clear sky"],
  [[1, 2, 3], "cloudy", "Cloud cover"],
  [[45, 48], "fog", "Fog"],
  [[51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82], "rain", "Rain"],
  [[71, 73, 75, 77, 85, 86], "snow", "Snow"],
  [[95, 96, 99], "storm", "Thunderstorm"],
];

export function normalizeWmoCode(code: number): { condition: WeatherCondition; description: string } {
  const match = WMO_CONDITIONS.find(([codes]) => codes.includes(code));
  return match
    ? { condition: match[1], description: match[2] }
    : { condition: "cloudy", description: `Unmapped WMO code ${code}` };
}

export function createModelBaseline(input: {
  provider: ModelBaseline["provider"];
  fetchedAt: string;
  code: number;
  temperatureCelsius: number;
  humidityPercent: number;
  windSpeedKph: number;
}): ModelBaseline {
  const normalized = normalizeWmoCode(input.code);
  return {
    provider: input.provider,
    fetchedAt: input.fetchedAt,
    ...normalized,
    temperatureCelsius: input.temperatureCelsius,
    humidityPercent: input.humidityPercent,
    windSpeedKph: input.windSpeedKph,
    attribution: { name: "Open-Meteo", url: "https://open-meteo.com/" },
  };
}
