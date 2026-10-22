import { ImageResponse } from "next/og";

export const alt = "GroundSignal — When the model says clear, ask the ground.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The two station plots, at the one size where they have to carry the page alone. */
function Plot({ fill, colour, label, reading }: { fill: number; colour: string; label: string; reading: string }) {
  const radius = 42;
  const angle = fill * Math.PI * 2;
  const path = fill >= 1
    ? `M 50 8 A ${radius} ${radius} 0 1 1 49.99 8 Z`
    : `M 50 50 L 50 8 A ${radius} ${radius} 0 ${fill > 0.5 ? 1 : 0} 1 ${50 + Math.sin(angle) * radius} ${50 - Math.cos(angle) * radius} Z`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke={colour} strokeWidth="6" />
        {fill > 0 ? <path d={path} fill={colour} /> : null}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 20, letterSpacing: 4, color: "#4a585a", fontFamily: "monospace" }}>{label}</span>
        <span style={{ fontSize: 48, color: colour }}>{reading}</span>
      </div>
    </div>
  );
}

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
      background: "#dfe4e1", color: "#101d22", padding: 64, fontFamily: "sans-serif",
    }}>
      <div style={{ display: "flex", fontSize: 22, fontFamily: "monospace", letterSpacing: 6, color: "#23566b" }}>
        GROUNDSIGNAL · FIELD PROTOCOL 01
      </div>
      <div style={{ display: "flex", maxWidth: 940, fontSize: 74, lineHeight: 1.04, letterSpacing: -2 }}>
        When the model says clear, ask the ground.
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 52, borderTop: "2px solid #101d22", paddingTop: 30 }}>
        <Plot fill={0} colour="#23566b" label="MODEL" reading="Clear" />
        <span style={{ fontSize: 44, color: "#a63229" }}>≠</span>
        <Plot fill={0.9167} colour="#8a4e06" label="GROUND" reading="Rain" />
      </div>
    </div>,
    size,
  );
}
