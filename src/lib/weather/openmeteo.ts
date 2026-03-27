import type { OpenMeteoBaseline } from '@/types/weather';

// Open-Meteo free API — no API key required
// Docs: https://open-meteo.com/en/docs
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO weather code → human-readable description
// Full table: https://open-meteo.com/en/docs#weathervariables
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'clear',
  1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'fog', 48: 'freezing fog',
  51: 'light drizzle', 53: 'moderate drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'moderate rain', 65: 'heavy rain',
  71: 'light snow', 73: 'moderate snow', 75: 'heavy snow',
  80: 'light showers', 81: 'moderate showers', 82: 'heavy showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'severe thunderstorm',
};

// Phase 1: Fetch current weather conditions from Open-Meteo for a lat/lon
export async function fetchOpenMeteoBaseline(lat: number, lon: number): Promise<OpenMeteoBaseline> {
  // TODO: Implement in Phase 1
  throw new Error('fetchOpenMeteoBaseline not yet implemented');
}

export function wmoCodeToDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? `code ${code}`;
}
