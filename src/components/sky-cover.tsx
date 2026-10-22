/**
 * The station-plot ring: the surface-observation symbol meteorologists draw at
 * every reporting station, where the filled fraction of the circle is sky cover.
 * GroundSignal reuses it for consensus — the fill is the share of observers who
 * agree. An empty ring is a lone model estimate; a full ring is ground truth.
 */

const TAU = Math.PI * 2;

export function skyCoverPath(fraction: number, centre: number, radius: number): string {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  if (clamped <= 0) return "";
  if (clamped >= 1) {
    return `M ${centre} ${centre - radius} A ${radius} ${radius} 0 1 1 ${centre - 0.01} ${centre - radius} Z`;
  }
  const angle = clamped * TAU;
  const x = centre + Math.sin(angle) * radius;
  const y = centre - Math.cos(angle) * radius;
  return `M ${centre} ${centre} L ${centre} ${centre - radius} A ${radius} ${radius} 0 ${clamped > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
}

export function SkyCover({ fraction, size = 20, tone = "ground", label }: {
  /** Share of the sky — or of the observers — that is covered, from 0 to 1. */
  fraction: number;
  size?: number;
  tone?: "ground" | "model" | "dissent" | "muted";
  /** Accessible description. Omit to hide the ring from assistive technology. */
  label?: string;
}) {
  const centre = 12;
  const radius = 9.4;
  return (
    <svg
      className={`sky-cover sky-cover-${tone}`}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle className="sky-cover-ring" cx={centre} cy={centre} r={radius} />
      <path className="sky-cover-fill" d={skyCoverPath(fraction, centre, radius)} />
    </svg>
  );
}

/**
 * A full station plot: the ring, the reading it stands for, and the provenance
 * of that reading. Used wherever a model estimate is set against a human one.
 */
export function StationPlot({ source, reading, detail, fraction, tone, size = 62 }: {
  source: string;
  reading: string;
  detail: string;
  fraction: number;
  tone: "ground" | "model";
  size?: number;
}) {
  return (
    <div className={`station-plot station-plot-${tone}`}>
      <SkyCover fraction={fraction} size={size} tone={tone} />
      <div>
        <p className="station-plot-source">{source}</p>
        <p className="station-plot-reading">{reading}</p>
        <p className="station-plot-detail">{detail}</p>
      </div>
    </div>
  );
}
