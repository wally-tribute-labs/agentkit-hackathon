import type { OpenMeteoBaseline } from '@/types/weather';
import type { WeatherCondition } from '@/types/weather';

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

// WMO code → app WeatherCondition type
const WMO_TO_CONDITION: Record<number, WeatherCondition> = {
  0: 'clear', 1: 'clear', 2: 'cloudy', 3: 'cloudy',
  45: 'fog', 48: 'fog',
  51: 'rain', 53: 'rain', 55: 'rain',
  61: 'rain', 63: 'rain', 65: 'rain',
  71: 'snow', 73: 'snow', 75: 'snow',
  80: 'rain', 81: 'rain', 82: 'rain',
  95: 'storm', 96: 'storm', 99: 'storm',
};

export async function fetchOpenMeteoBaseline(lat: number, lon: number): Promise<OpenMeteoBaseline> {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  if (!res.ok) {
    throw new Error(`Open-Meteo error: ${res.status}`);
  }
  const data = await res.json();
  const current = data.current as {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };

  return {
    temperature: current.temperature_2m,
    condition: wmoCodeToDescription(current.weather_code),
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    weatherCode: current.weather_code,
  };
}

export function wmoCodeToDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? `code ${code}`;
}

export function wmoCodeToWeatherCondition(code: number): WeatherCondition {
  return WMO_TO_CONDITION[code] ?? 'cloudy';
}
