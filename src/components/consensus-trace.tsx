import type { ObservationEvidence, SignalTier } from "@/core/types";

const tierThresholds: Array<{ tier: SignalTier; position: number }> = [
  { tier: "sparse", position: 8 },
  { tier: "corroborated", position: 25 },
  { tier: "strong", position: 42 },
  { tier: "ground_truth", position: 84 },
];

export function ConsensusTrace({ observations }: { observations: ObservationEvidence[] }) {
  if (observations.length === 0) {
    return (
      <div className="trace trace-empty" role="region" aria-label="Consensus trace, no reports yet">
        <p>No reports yet. Play the field test, or step forward, to watch observers arrive and the tier climb.</p>
      </div>
    );
  }
  return (
    <div
      className="trace"
      role="region"
      tabIndex={0}
      aria-label={`Consensus trace with ${observations.length} reports`}
    >
      <div className="trace-labels" aria-hidden="true">
        {tierThresholds.map(({ tier, position }) => <span style={{ left: `${position}%` }} key={tier}>{tier.replace("_", " ")}</span>)}
      </div>
      <div className="trace-line" aria-hidden="true">
        {tierThresholds.map(({ tier, position }) => <i style={{ left: `${position}%` }} key={tier} />)}
        {observations.map((report, index) => (
          <b
            className={report.condition === "rain" ? "trace-rain" : "trace-dissent"}
            key={report.id}
            style={{ left: `${Math.max(3, (index / 11) * 94 + 3)}%` }}
            title={`Observer ${index + 1}: ${report.condition}`}
          >{index + 1}</b>
        ))}
      </div>
      <ol className="sr-only">
        {observations.map((report, index) => <li key={report.id}>Simulated observer {index + 1} reported {report.condition}.</li>)}
      </ol>
    </div>
  );
}
