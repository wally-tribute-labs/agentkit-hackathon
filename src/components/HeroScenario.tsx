'use client';

import { useEffect, useState } from 'react';
import { SignalBadge } from '@/components/SignalBadge';
import type { WeatherCondition, SignalStrength } from '@/types/weather';

interface CellData {
  condition: WeatherCondition;
  modelCondition: WeatherCondition | null;
  humanCount: number;
  agreementRate: number;
  signalStrength: SignalStrength;
}

const CONDITION_EMOJI: Record<WeatherCondition, string> = {
  clear: '☀️',
  cloudy: '☁️',
  rain: '🌧️',
  snow: '❄️',
  fog: '🌫️',
  storm: '⛈️',
  windy: '💨',
  haze: '🌁',
};

const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
  fog: 'Fog',
  storm: 'Storm',
  windy: 'Windy',
  haze: 'Haze',
};

// Static fallback for when no live data exists yet
const DEMO_FALLBACK: CellData = {
  condition: 'rain',
  modelCondition: 'clear',
  humanCount: 12,
  agreementRate: 0.92,
  signalStrength: 'ground_truth',
};

export function HeroScenario() {
  const [cell, setCell] = useState<CellData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/consensus-cells')
      .then((r) => r.json())
      .then((data) => {
        const cells: (CellData & { modelCondition: WeatherCondition | null })[] =
          data.cells ?? [];
        // Find the most interesting cell: highest humanCount where model disagrees
        const disagreeing = cells
          .filter((c) => c.modelCondition && c.modelCondition !== c.condition)
          .sort((a, b) => b.humanCount - a.humanCount);
        if (disagreeing.length > 0) {
          setCell(disagreeing[0]);
        } else if (cells.length > 0) {
          // Fall back to highest humanCount cell
          setCell(cells.sort((a, b) => b.humanCount - a.humanCount)[0]);
        }
      })
      .catch(() => {/* silently fall back to demo values */})
      .finally(() => setLoaded(true));
  }, []);

  const display = cell ?? (loaded ? DEMO_FALLBACK : null);

  if (!display) {
    return (
      <div className="w-full h-24 bg-gray-50 rounded-2xl animate-pulse" />
    );
  }

  const modelCond = display.modelCondition;
  const humanCond = display.condition;
  const modelDisagrees = modelCond && modelCond !== humanCond;
  const agreePct = Math.round(display.agreementRate * 100);

  return (
    <div className="w-full rounded-2xl border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-2">
        {/* Model side */}
        <div className="bg-gray-50 p-4 flex flex-col items-center gap-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Model says</p>
          <div className="text-3xl">{modelCond ? CONDITION_EMOJI[modelCond] : '🤔'}</div>
          <p className="text-sm font-semibold text-gray-500">
            {modelCond ? CONDITION_LABEL[modelCond] : 'Unknown'}
          </p>
          {modelDisagrees && (
            <span className="text-xs text-gray-400 mt-0.5">AI prediction</span>
          )}
        </div>

        {/* Humans side */}
        <div className="bg-blue-50 p-4 flex flex-col items-center gap-1">
          <p className="text-xs font-medium text-blue-500 uppercase tracking-wide">
            {display.humanCount} {display.humanCount === 1 ? 'human' : 'humans'} say
          </p>
          <div className="text-3xl">{CONDITION_EMOJI[humanCond]}</div>
          <p className="text-sm font-bold text-blue-900">{CONDITION_LABEL[humanCond]}</p>
          <SignalBadge signal={display.signalStrength} />
        </div>
      </div>

      {/* Agreement bar */}
      <div className="bg-white px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Human agreement</span>
          <span className="text-xs font-bold text-gray-800">{agreePct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${agreePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
