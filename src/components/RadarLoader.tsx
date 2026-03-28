'use client';

interface RadarLoaderProps {
  size?: number;
  label?: string;
}

export function RadarLoader({ size = 56, label = 'Loading...' }: RadarLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: '1px solid rgba(6,182,212,0.2)' }}
        />
        {/* Second ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: size * 0.15,
            border: '1px solid rgba(6,182,212,0.12)',
          }}
        />
        {/* Sweep */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(6,182,212,0.5) 35%, transparent 45%)',
            animation: 'radar-sweep 1.8s linear infinite',
          }}
        />
        {/* Center dot */}
        <div
          className="absolute rounded-full bg-cyan-400"
          style={{
            width: size * 0.12,
            height: size * 0.12,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 8px rgba(6,182,212,0.8)',
          }}
        />
      </div>
      {label && (
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      )}
    </div>
  );
}
