'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Loader2 } from 'lucide-react';
import { WeatherIcon } from '@/components/WeatherIcon';
import { spring, buttonTap, staggerContainer, staggerItem } from '@/lib/motion';
import type { WeatherCondition, Intensity, FeelCategory, OpenMeteoBaseline } from '@/types/weather';

interface ObservationInput { condition: WeatherCondition; intensity: Intensity; feel: FeelCategory; note: string; }
interface WeatherObserverProps { baseline: OpenMeteoBaseline | null; onSubmit: (i: ObservationInput) => void; submitting?: boolean; }

const CONDITIONS: { value: WeatherCondition; label: string }[] = [
  { value: 'clear',  label: 'Clear'  }, { value: 'cloudy', label: 'Cloudy' },
  { value: 'rain',   label: 'Rain'   }, { value: 'snow',   label: 'Snow'   },
  { value: 'fog',    label: 'Fog'    }, { value: 'storm',  label: 'Storm'  },
  { value: 'windy',  label: 'Windy'  }, { value: 'haze',   label: 'Haze'   },
];

const INTENSITIES: { value: Intensity; label: string; desc: string }[] = [
  { value: 'light',    label: 'Light',    desc: 'Barely noticeable' },
  { value: 'moderate', label: 'Moderate', desc: 'Normal'            },
  { value: 'heavy',    label: 'Heavy',    desc: 'Intense'           },
];

const FEELS: { value: FeelCategory; label: string; tempHint: string }[] = [
  { value: 'freezing', label: 'Freezing', tempHint: '< 0°' },
  { value: 'cold',     label: 'Cold',     tempHint: '0–10°' },
  { value: 'cool',     label: 'Cool',     tempHint: '10–18°' },
  { value: 'mild',     label: 'Mild',     tempHint: '18–24°' },
  { value: 'warm',     label: 'Warm',     tempHint: '24–30°' },
  { value: 'hot',      label: 'Hot',      tempHint: '> 30°'  },
];

const FEEL_ICON_COLORS: Record<FeelCategory, string> = {
  freezing: '#93c5fd', cold: '#7dd3fc', cool: '#a5f3fc',
  mild:     '#bbf7d0', warm: '#fde68a', hot: '#fca5a5',
};

const SECTION_LABEL = "text-xs font-bold uppercase tracking-widest mb-3";

export function WeatherObserver({ baseline, onSubmit, submitting }: WeatherObserverProps) {
  const [condition, setCondition] = useState<WeatherCondition | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [feel,      setFeel]      = useState<FeelCategory | null>(null);
  const [note,      setNote]      = useState('');

  const canSubmit = condition && intensity && feel && !submitting;

  return (
    <div className="flex flex-col gap-7">

      {/* Baseline reference */}
      <AnimatePresence>
        {baseline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-xl text-sm overflow-hidden"
            style={{
              background: 'rgba(245,158,11,0.06)',
              borderLeftWidth: '2px', borderLeftStyle: 'solid', borderLeftColor: 'var(--amber)',
              border: '1px solid rgba(245,158,11,0.12)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span className="font-semibold" style={{ color: 'var(--amber)' }}>AI Model: </span>
            {baseline.condition} · {Math.round(baseline.temperature)}°C · {baseline.humidity}% humidity · {Math.round(baseline.windSpeed)} km/h
          </motion.div>
        )}
      </AnimatePresence>

      {/* Condition picker */}
      <div>
        <p className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
          What do you see?
        </p>
        <motion.div
          className="grid grid-cols-4 gap-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {CONDITIONS.map((c) => {
            const selected = condition === c.value;
            return (
              <motion.button
                key={c.value}
                variants={staggerItem}
                onClick={() => setCondition(c.value)}
                className="flex flex-col items-center gap-2 py-3 px-1 rounded-xl text-xs font-medium"
                whileHover={{ scale: 1.04, borderColor: 'rgba(6,182,212,0.4)' }}
                whileTap={{ scale: buttonTap.scale }}
                animate={{
                  background: selected ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
                  borderColor: selected ? 'rgba(6,182,212,0.45)' : 'var(--border-glass)',
                  color: selected ? 'var(--cyan-light)' : 'var(--text-secondary)',
                  boxShadow: selected ? '0 0 14px rgba(6,182,212,0.18)' : 'none',
                  scale: selected ? 1.02 : 1,
                }}
                transition={spring}
                style={{ border: '1px solid var(--border-glass)', fontFamily: 'var(--font-display)' }}
              >
                <WeatherIcon condition={c.value} size={20} strokeWidth={1.5}
                  color={selected ? 'var(--cyan-light)' : 'var(--text-secondary)'} />
                {c.label}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Intensity */}
      <div>
        <p className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Intensity</p>
        <div className="flex gap-2">
          {INTENSITIES.map((i) => {
            const selected = intensity === i.value;
            return (
              <motion.button
                key={i.value}
                onClick={() => setIntensity(i.value)}
                className="flex-1 py-3 rounded-xl text-sm font-medium flex flex-col items-center gap-0.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: buttonTap.scale }}
                animate={{
                  background: selected ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
                  borderColor: selected ? 'rgba(6,182,212,0.45)' : 'var(--border-glass)',
                  color: selected ? 'var(--cyan-light)' : 'var(--text-secondary)',
                }}
                transition={spring}
                style={{ border: '1px solid var(--border-glass)', fontFamily: 'var(--font-display)' }}
              >
                <span>{i.label}</span>
                <span className="text-xs opacity-45">{i.desc}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Feel */}
      <div>
        <p className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>How does it feel?</p>
        <div className="grid grid-cols-3 gap-2">
          {FEELS.map((f) => {
            const selected = feel === f.value;
            const iconColor = selected ? FEEL_ICON_COLORS[f.value] : 'var(--text-secondary)';
            return (
              <motion.button
                key={f.value}
                onClick={() => setFeel(f.value)}
                className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: buttonTap.scale }}
                animate={{
                  background: selected ? 'rgba(6,182,212,0.12)' : 'var(--bg-card)',
                  borderColor: selected ? 'rgba(6,182,212,0.4)' : 'var(--border-glass)',
                  color: selected ? 'var(--cyan-light)' : 'var(--text-secondary)',
                }}
                transition={spring}
                style={{ border: '1px solid var(--border-glass)', fontFamily: 'var(--font-display)' }}
              >
                <Thermometer size={14} strokeWidth={2} color={iconColor} />
                <div className="flex flex-col items-start">
                  <span>{f.label}</span>
                  <span className="text-xs opacity-40">{f.tempHint}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div>
        <p className={SECTION_LABEL} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Note (optional)</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything unusual? Flooding, hail, visibility..."
          rows={2}
          className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none transition-all duration-200"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'; }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
        />
      </div>

      {/* Submit */}
      <motion.button
        onClick={() => {
          if (!condition || !intensity || !feel) return;
          onSubmit({ condition, intensity, feel, note });
        }}
        disabled={!canSubmit}
        className="w-full py-3.5 font-bold rounded-2xl text-base text-white flex items-center justify-center gap-2"
        style={{
          background: canSubmit
            ? 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
            : 'rgba(255,255,255,0.06)',
          boxShadow: canSubmit ? 'var(--shadow-glow-cyan)' : 'none',
          color: canSubmit ? 'white' : 'var(--text-muted)',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontFamily: 'var(--font-display)',
        }}
        whileHover={canSubmit ? { scale: 1.01, boxShadow: '0 0 40px rgba(6,182,212,0.45)' } : {}}
        whileTap={canSubmit ? { scale: 0.98 } : {}}
        transition={spring}
      >
        {submitting
          ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={18} strokeWidth={2} /></motion.span> Submitting...</>
          : 'Submit Observation'
        }
      </motion.button>
    </div>
  );
}
