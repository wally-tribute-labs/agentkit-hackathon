'use client';

interface ParticleFieldProps {
  count?: number;
  color?: 'cyan' | 'green' | 'amber';
}

const COLOR_MAP = {
  cyan: 'rgba(6,182,212,',
  green: 'rgba(52,211,153,',
  amber: 'rgba(245,158,11,',
};

// Deterministic "random" values seeded by index to avoid hydration mismatch
function seed(i: number, offset: number) {
  return ((i * 1327 + offset * 317) % 1000) / 1000;
}

export function ParticleField({ count = 18, color = 'cyan' }: ParticleFieldProps) {
  const base = COLOR_MAP[color];
  const particles = Array.from({ length: count }, (_, i) => {
    const left = seed(i, 1) * 100;
    const duration = 10 + seed(i, 2) * 12;
    const delay = -(seed(i, 3) * duration);
    const opacity = 0.08 + seed(i, 4) * 0.18;
    const size = 2 + Math.floor(seed(i, 5) * 3);
    return { left, duration, delay, opacity, size };
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: '-4px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `${base}${p.opacity})`,
            animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
