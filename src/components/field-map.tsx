import type { ObservationEvidence } from "@/core/types";

export function FieldMap({ observations, active = true }: { observations: ObservationEvidence[]; active?: boolean }) {
  return (
    <div className="field-map" role="img" aria-label={`Abstract San Francisco field map with ${observations.length} observation markers`}>
      <svg viewBox="0 0 720 460" aria-hidden="true">
        <path className="coast" d="M0 35 C155 80 119 156 247 202 C315 226 289 289 396 313 C505 338 529 420 720 439 L720 0 L0 0Z" />
        {[0, 1, 2, 3, 4].map((line) => (
          <path className="contour" key={line} d={`M${55 + line * 18} ${390 - line * 33} C210 ${310 - line * 22} 245 ${400 - line * 31} 370 ${300 - line * 18} S560 ${240 - line * 16} 700 ${170 - line * 12}`} />
        ))}
        <g className="street-grid">
          {[160, 205, 250, 295, 340, 385, 430, 475, 520].map((x) => <path key={`x${x}`} d={`M${x} 80 L${x - 100} 420`} />)}
          {[110, 155, 200, 245, 290, 335, 380].map((y) => <path key={`y${y}`} d={`M100 ${y} L650 ${y + 80}`} />)}
        </g>
        <path className="radius-ring" d="M262 229 m-104 0 a104 104 0 1 0 208 0 a104 104 0 1 0-208 0" />
        {observations.map((report, index) => {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          const radius = 42 + (index % 3) * 21;
          const x = 262 + Math.cos(angle) * radius;
          const y = 229 + Math.sin(angle) * radius;
          return <g className={`map-pin ${report.condition === "rain" ? "rain" : "dissent"}`} key={report.id} transform={`translate(${x} ${y})`}>
            <circle r="10" /><text x="0" y="4">{index + 1}</text>
          </g>;
        })}
        <g className={`model-pin ${active ? "active" : ""}`} transform="translate(520 130)">
          <rect x="-54" y="-20" width="108" height="40" /><text textAnchor="middle" y="5">MODEL · CLEAR</text>
        </g>
      </svg>
      <span className="map-coordinate">37.7749° N / 122.4194° W</span>
      <span className="map-scale">H3 RES 8 · 1 KM QUERY</span>
    </div>
  );
}
