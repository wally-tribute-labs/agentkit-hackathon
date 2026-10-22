import type { ObservationEvidence, WeatherCondition } from "@/core/types";
import { skyCoverPath } from "./sky-cover";

/** Sky cover implied by a reported condition, in the meteorological sense. */
function coverFor(condition: WeatherCondition): number {
  if (condition === "clear") return 0;
  if (condition === "haze" || condition === "windy") return 0.25;
  if (condition === "cloudy" || condition === "fog") return 0.5;
  return 1;
}

const isobars = [0, 1, 2, 3, 4];
const streetsDown = [160, 205, 250, 295, 340, 385, 430, 475, 520];
const streetsAcross = [110, 155, 200, 245, 290, 335, 380];

export function FieldMap({ observations }: { observations: ObservationEvidence[] }) {
  const dissenting = observations.filter((report) => report.condition !== "rain").length;
  return (
    <div
      className="field-map"
      role="img"
      aria-label={`Field map of the San Francisco query cell: ${observations.length} observers reporting, ${dissenting} of them dissenting from the majority.`}
    >
      <svg viewBox="0 0 720 460" aria-hidden="true">
        <path className="map-land" d="M0 35 C155 80 119 156 247 202 C315 226 289 289 396 313 C505 338 529 420 720 439 L720 0 L0 0Z" />

        <g className="map-grid">
          {streetsDown.map((x) => <path key={`x${x}`} d={`M${x} 80 L${x - 100} 420`} />)}
          {streetsAcross.map((y) => <path key={`y${y}`} d={`M100 ${y} L650 ${y + 80}`} />)}
        </g>

        {isobars.map((line) => (
          <path
            className="map-isobar"
            key={line}
            d={`M${55 + line * 18} ${390 - line * 33} C210 ${310 - line * 22} 245 ${400 - line * 31} 370 ${300 - line * 18} S560 ${240 - line * 16} 700 ${170 - line * 12}`}
          />
        ))}

        <circle className="map-cell" cx="232" cy="196" r="100" />

        {observations.map((report, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          const radius = 42 + (index % 3) * 20;
          const x = 232 + Math.cos(angle) * radius;
          const y = 196 + Math.sin(angle) * radius;
          return (
            <g
              className={`map-station ${report.condition === "rain" ? "" : "dissent"}`}
              key={report.id}
              transform={`translate(${x - 12} ${y - 12})`}
            >
              <circle className="sky-cover-ring" cx="12" cy="12" r="8" />
              <path className="sky-cover-fill" d={skyCoverPath(coverFor(report.condition), 12, 8)} />
            </g>
          );
        })}

        {/* The model's estimate, tethered to the cell it claims to describe. */}
        <g className="map-model">
          <path className="map-leader" d="M500 122 L332 169" />
          <circle className="map-leader-end" cx="332" cy="169" r="2.5" />
          <rect x="500" y="103" width="112" height="30" />
          <text x="556" y="122" textAnchor="middle">MODEL · CLEAR</text>
        </g>
      </svg>
      <span className="map-note map-note-left">37.7749° N / 122.4194° W</span>
      <span className="map-note map-note-right">H3 RES 8 · 1 KM QUERY</span>
    </div>
  );
}
