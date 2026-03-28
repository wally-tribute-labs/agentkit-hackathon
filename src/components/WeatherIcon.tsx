'use client';

import {
  Sun, Cloud, CloudRain, Snowflake, CloudFog, CloudLightning, Wind, Cloudy,
  type LucideProps,
} from 'lucide-react';
import type { WeatherCondition } from '@/types/weather';

const CONDITION_ICONS: Record<WeatherCondition, React.FC<LucideProps>> = {
  clear:   Sun,
  cloudy:  Cloud,
  rain:    CloudRain,
  snow:    Snowflake,
  fog:     CloudFog,
  storm:   CloudLightning,
  windy:   Wind,
  haze:    Cloudy,
};

const CONDITION_COLORS: Record<WeatherCondition, string> = {
  clear:  '#fbbf24',
  cloudy: '#94a3b8',
  rain:   '#60a5fa',
  snow:   '#bae6fd',
  fog:    '#94a3b8',
  storm:  '#c084fc',
  windy:  '#67e8f9',
  haze:   '#a8a29e',
};

interface WeatherIconProps extends LucideProps {
  condition: WeatherCondition;
  /** Use semantic color for the condition (default: false, inherits text color) */
  colorized?: boolean;
}

export function WeatherIcon({ condition, colorized = false, size = 24, strokeWidth = 1.5, color, ...props }: WeatherIconProps) {
  const Icon = CONDITION_ICONS[condition];
  const resolvedColor = color ?? (colorized ? CONDITION_COLORS[condition] : undefined);
  return <Icon size={size} strokeWidth={strokeWidth} color={resolvedColor} {...props} />;
}

export function getWeatherColor(condition: WeatherCondition): string {
  return CONDITION_COLORS[condition];
}
