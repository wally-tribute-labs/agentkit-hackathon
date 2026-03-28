'use client';

import { useState } from 'react';
import type { WeatherCondition, Intensity, FeelCategory, OpenMeteoBaseline } from '@/types/weather';

interface ObservationInput {
  condition: WeatherCondition;
  intensity: Intensity;
  feel: FeelCategory;
  note: string;
}

interface WeatherObserverProps {
  baseline: OpenMeteoBaseline | null;
  onSubmit: (input: ObservationInput) => void;
  submitting?: boolean;
}

const CONDITIONS: { value: WeatherCondition; label: string; emoji: string }[] = [
  { value: 'clear', label: 'Clear', emoji: '☀️' },
  { value: 'cloudy', label: 'Cloudy', emoji: '☁️' },
  { value: 'rain', label: 'Rain', emoji: '🌧️' },
  { value: 'snow', label: 'Snow', emoji: '❄️' },
  { value: 'fog', label: 'Fog', emoji: '🌫️' },
  { value: 'storm', label: 'Storm', emoji: '⛈️' },
  { value: 'windy', label: 'Windy', emoji: '💨' },
  { value: 'haze', label: 'Haze', emoji: '🌁' },
];

const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'heavy', label: 'Heavy' },
];

const FEELS: { value: FeelCategory; label: string; emoji: string }[] = [
  { value: 'freezing', label: 'Freezing', emoji: '🥶' },
  { value: 'cold', label: 'Cold', emoji: '🧥' },
  { value: 'cool', label: 'Cool', emoji: '😌' },
  { value: 'mild', label: 'Mild', emoji: '🙂' },
  { value: 'warm', label: 'Warm', emoji: '😊' },
  { value: 'hot', label: 'Hot', emoji: '🥵' },
];

export function WeatherObserver({ baseline, onSubmit, submitting }: WeatherObserverProps) {
  const [condition, setCondition] = useState<WeatherCondition | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [feel, setFeel] = useState<FeelCategory | null>(null);
  const [note, setNote] = useState('');

  const canSubmit = condition && intensity && feel && !submitting;

  function handleSubmit() {
    if (!condition || !intensity || !feel) return;
    onSubmit({ condition, intensity, feel, note });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Baseline reference */}
      {baseline && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          <span className="font-medium">Model says:</span> {baseline.condition}, {Math.round(baseline.temperature)}°C,
          {' '}{baseline.humidity}% humidity, {Math.round(baseline.windSpeed)} km/h wind
        </div>
      )}

      {/* Condition */}
      <div>
        <p className="font-semibold text-sm text-gray-700 mb-2">What do you see?</p>
        <div className="grid grid-cols-4 gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCondition(c.value)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-colors ${
                condition === c.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <p className="font-semibold text-sm text-gray-700 mb-2">Intensity</p>
        <div className="flex gap-2">
          {INTENSITIES.map((i) => (
            <button
              key={i.value}
              onClick={() => setIntensity(i.value)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                intensity === i.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feel */}
      <div>
        <p className="font-semibold text-sm text-gray-700 mb-2">How does it feel?</p>
        <div className="grid grid-cols-3 gap-2">
          {FEELS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFeel(f.value)}
              className={`flex items-center gap-1 py-2 px-2 rounded-xl border text-sm font-medium transition-colors ${
                feel === f.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              <span>{f.emoji}</span> {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional note */}
      <div>
        <p className="font-semibold text-sm text-gray-700 mb-2">Note (optional)</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything unusual? Flooding, hail, visibility..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-400"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 bg-black text-white font-semibold rounded-xl text-base disabled:opacity-40"
      >
        {submitting ? 'Submitting...' : 'Submit Observation'}
      </button>
    </div>
  );
}
