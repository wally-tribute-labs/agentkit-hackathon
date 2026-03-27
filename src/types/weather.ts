// Observation input types
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'storm' | 'windy' | 'haze';
export type Intensity = 'light' | 'moderate' | 'heavy';
export type FeelCategory = 'freezing' | 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
export type SignalStrength = 'solo' | 'corroborated' | 'strong' | 'ground_truth';

// Signal strength thresholds (unique human count per cell/window)
export const SIGNAL_THRESHOLDS = {
  solo: 1,          // exactly 1 human
  corroborated: 3,  // 3-4 humans
  strong: 5,        // 5-9 humans
  ground_truth: 10, // 10+ humans
} as const;

// x402 pricing by signal strength (USDC)
export const SIGNAL_PRICES: Record<SignalStrength, string> = {
  solo: '$0.001',
  corroborated: '$0.005',
  strong: '$0.01',
  ground_truth: '$0.02',
};

// A single human-submitted weather observation
export interface Observation {
  id: number;
  nullifierHash: string;   // World ID nullifier (unique per human per action)
  lat: number;
  lon: number;
  h3Index: string;         // H3 hex cell at resolution 7 (~500m)
  timestamp: string;       // ISO 8601
  condition: WeatherCondition;
  intensity: Intensity;
  feel: FeelCategory;
  confirmsModel: boolean;  // Does human report match Open-Meteo prediction?
  note: string | null;
  photoPath: string | null;
  // Open-Meteo baseline at time of submission
  modelTemp: number | null;        // celsius
  modelCondition: string | null;
  modelHumidity: number | null;    // percentage
  modelWindSpeed: number | null;   // km/h
  createdAt: string;               // ISO 8601
}

// Consensus aggregation for a hex cell + time window
export interface ConsensusCell {
  h3Index: string;
  timeWindow: string;        // ISO 8601 start of 30-minute window
  condition: WeatherCondition;
  agreementRate: number;     // 0-1, fraction of humans reporting dominant condition
  humanCount: number;        // unique nullifier hashes in this cell+window
  signalStrength: SignalStrength;
  observations?: Observation[];
}

// Open-Meteo API response (simplified)
export interface OpenMeteoBaseline {
  temperature: number;       // celsius
  condition: string;         // WMO weather code description
  humidity: number;          // percentage
  windSpeed: number;         // km/h
  weatherCode: number;       // WMO code
}

// Response from the x402-gated agent API endpoint
export interface AgentQueryResponse {
  consensus: ConsensusCell | null;
  modelBaseline: OpenMeteoBaseline | null;
  delta: {
    modelCondition: string | null;
    humanCondition: WeatherCondition | null;
    agreementRate: number | null;
    modelAgrees: boolean | null;
  } | null;
  signalStrength: SignalStrength | null;
  radius: number;            // meters queried
  queryLat: number;
  queryLon: number;
  timestamp: string;
}

// Row shape coming out of SQLite (snake_case)
export interface ObservationRow {
  id: number;
  nullifier_hash: string;
  lat: number;
  lon: number;
  h3_index: string;
  timestamp: string;
  condition: string;
  intensity: string;
  feel: string;
  confirms_model: number;    // SQLite boolean (0/1)
  note: string | null;
  photo_path: string | null;
  model_temp: number | null;
  model_condition: string | null;
  model_humidity: number | null;
  model_wind_speed: number | null;
  created_at: string;
}
