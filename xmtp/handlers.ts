import { getConsensusWeather } from '../src/lib/weather/consensus';
import { fetchOpenMeteoBaseline, wmoCodeToWeatherCondition } from '../src/lib/weather/openmeteo';
import type { AgentQueryResponse } from '../src/types/weather';

type ParseResult =
  | { type: 'weather'; lat: number; lon: number }
  | { type: 'help' }
  | { type: 'error'; message: string };

const WEATHER_REGEX = /^weather\s+([-\d.]+)[,\s]+([-\d.]+)$/i;
const HELP_COMMANDS = new Set(['help', '/help', 'hi', 'hello', 'hey', 'start']);

export function parseWeatherQuery(text: string): ParseResult {
  const trimmed = text.trim();

  if (HELP_COMMANDS.has(trimmed.toLowerCase())) {
    return { type: 'help' };
  }

  const match = trimmed.match(WEATHER_REGEX);
  if (!match) {
    return {
      type: 'error',
      message: `Unknown command. Try:\n  weather 40.7128,-74.0060\n  help`,
    };
  }

  const lat = parseFloat(match[1]);
  const lon = parseFloat(match[2]);

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return { type: 'error', message: `Invalid latitude "${match[1]}". Must be between -90 and 90.` };
  }
  if (isNaN(lon) || lon < -180 || lon > 180) {
    return { type: 'error', message: `Invalid longitude "${match[2]}". Must be between -180 and 180.` };
  }

  return { type: 'weather', lat, lon };
}

export async function queryWeather(lat: number, lon: number): Promise<AgentQueryResponse> {
  const radius = 1000;
  const [consensus, modelBaseline] = await Promise.all([
    getConsensusWeather(lat, lon, radius),
    fetchOpenMeteoBaseline(lat, lon),
  ]);

  let delta: AgentQueryResponse['delta'] = null;
  if (consensus && modelBaseline) {
    const modelWeatherCondition = wmoCodeToWeatherCondition(modelBaseline.weatherCode);
    delta = {
      modelCondition: modelBaseline.condition,
      humanCondition: consensus.condition,
      agreementRate: consensus.agreementRate,
      modelAgrees: modelWeatherCondition === consensus.condition,
    };
  }

  return {
    consensus,
    modelBaseline,
    delta,
    signalStrength: consensus?.signalStrength ?? null,
    radius,
    queryLat: lat,
    queryLon: lon,
    timestamp: new Date().toISOString(),
  };
}

const SIGNAL_EMOJI: Record<string, string> = {
  solo: '👤',
  corroborated: '👥',
  strong: '🌐',
  ground_truth: '✅',
};

const CONDITION_EMOJI: Record<string, string> = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧',
  snow: '🌨',
  fog: '🌫',
  storm: '⛈',
  windy: '💨',
  haze: '🌁',
};

export function formatWeatherReport(response: AgentQueryResponse): string {
  const { consensus, modelBaseline, delta, queryLat, queryLon } = response;
  const latStr = queryLat.toFixed(4);
  const lonStr = queryLon.toFixed(4);
  const header = `Weather Report (${latStr}, ${lonStr})`;

  if (!modelBaseline) {
    return `${header}\n\nUnable to fetch weather data. Please try again.`;
  }

  const lines: string[] = [header, ''];

  if (consensus && delta) {
    const condEmoji = CONDITION_EMOJI[consensus.condition] ?? '🌡';
    const sigEmoji = SIGNAL_EMOJI[consensus.signalStrength] ?? '📡';
    const pct = Math.round(consensus.agreementRate * 100);
    lines.push(`${condEmoji} Human Consensus: ${consensus.condition} (${pct}% agreement)`);
    lines.push(`${sigEmoji} Signal: ${consensus.signalStrength} (${consensus.humanCount} verified human${consensus.humanCount === 1 ? '' : 's'})`);

    const modelAgreement = delta.modelAgrees ? 'agrees ✓' : `disagrees — model says ${delta.modelCondition}`;
    lines.push(`🤖 Model: ${modelAgreement}`);
  } else {
    lines.push(`📡 No human observations nearby yet.`);
    lines.push(`🤖 Model: ${modelBaseline.condition}`);
  }

  lines.push('');
  lines.push(`🌡 ${modelBaseline.temperature.toFixed(1)}°C  💧 ${modelBaseline.humidity}%  💨 ${modelBaseline.windSpeed.toFixed(1)} km/h`);

  if (!consensus) {
    lines.push('');
    lines.push(`Be the first to report! Open the World App mini app to submit a verified observation.`);
  }

  return lines.join('\n');
}

export function getHelpText(): string {
  return [
    'Human-Verified Weather Oracle 🌍',
    '',
    'Commands:',
    '  weather <lat>,<lon>   — get consensus weather for a location',
    '',
    'Example:',
    '  weather 40.7128,-74.0060',
    '  weather 51.5074, -0.1278',
    '',
    'Powered by World ID-verified human observations + Open-Meteo model data.',
    'Human reports are weighted by signal strength: solo → corroborated → strong → ground_truth.',
  ].join('\n');
}
