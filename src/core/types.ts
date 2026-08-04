export const WEATHER_CONDITIONS = [
  "clear",
  "cloudy",
  "rain",
  "snow",
  "fog",
  "storm",
  "windy",
  "haze",
] as const;

export type WeatherCondition = (typeof WEATHER_CONDITIONS)[number];
export type ObservationSource = "demo_fixture" | "visitor_demo" | "world_id";
export type SignalTier =
  | "sparse"
  | "contested"
  | "corroborated"
  | "strong"
  | "ground_truth";
export type Intensity = "light" | "moderate" | "heavy";
export type Feel = "freezing" | "cold" | "cool" | "mild" | "warm" | "hot";

export interface ObservationEvidence {
  id: string;
  observerId: string;
  source: ObservationSource;
  h3Index: string;
  windowStart: string;
  observedAt: string;
  receivedAt: string;
  condition: WeatherCondition;
  intensity: Intensity;
  feel: Feel;
  note?: string;
  locationAccuracyMeters?: number;
}

export interface ConsensusResult {
  status: "available" | "unavailable";
  condition: WeatherCondition | null;
  tier: SignalTier | null;
  agreementRate: number | null;
  reportCount: number;
  uniqueObserverCount: number;
  h3Index: string;
  windowStart: string;
  windowEnd: string;
  contested: boolean;
}

export interface ModelBaseline {
  provider: "open-meteo" | "demo_fixture";
  fetchedAt: string;
  condition: WeatherCondition;
  description: string;
  temperatureCelsius: number;
  humidityPercent: number;
  windSpeedKph: number;
  attribution: {
    name: "Open-Meteo";
    url: "https://open-meteo.com/";
  };
}

export interface ModelDelta {
  modelCondition: WeatherCondition;
  humanCondition: WeatherCondition | null;
  agrees: boolean | null;
  agreementRate: number | null;
}

export interface AgentWeatherResponse {
  version: "1.0";
  source: {
    mode: "demo_scenario" | "sqlite";
    scenarioId?: string;
    simulated: boolean;
  };
  query: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    queriedAt: string;
  };
  consensus: ConsensusResult;
  model: ModelBaseline;
  delta: ModelDelta;
  provenance: {
    h3Resolution: 8;
    h3Index: string;
    timeWindowMinutes: 30;
    reportCount: number;
    uniqueObserverCount: number;
    demoObserverCount: number;
  };
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

export interface ValidatedObservationInput {
  observerId: string;
  h3Index: string;
  windowStart: string;
  observedAt: string;
  receivedAt: string;
  condition: WeatherCondition;
  intensity: Intensity;
  feel: Feel;
  note?: string;
  locationAccuracyMeters?: number;
}

export interface ObservationWindowQuery {
  h3Indexes: string[];
  windowStart: string;
  windowEnd: string;
}

export interface ObservationRepository {
  insert(input: ValidatedObservationInput): Promise<ObservationEvidence>;
  listWindow(query: ObservationWindowQuery): Promise<ObservationEvidence[]>;
  listObserver(observerId: string): Promise<ObservationEvidence[]>;
  health(): Promise<"ok">;
}

export interface AgentKitUsageRepository {
  getUsageCount(endpoint: string, humanId: string): Promise<number>;
  incrementUsage(endpoint: string, humanId: string): Promise<void>;
  hasUsedNonce(nonce: string): Promise<boolean>;
  recordNonce(nonce: string): Promise<void>;
}

export type IntegrationState = "SIMULATED" | "CONFIGURED" | "VERIFIED" | "FAILED" | "NOT RUN";
