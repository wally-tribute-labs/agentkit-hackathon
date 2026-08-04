import { ImageResponse } from "next/og";

export const alt = "GroundSignal — When the model says clear, ask the ground.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F1EBDD", color: "#171713", padding: 64, fontFamily: "serif", backgroundImage: "radial-gradient(circle at 70% 40%, transparent 0 120px, #B9B09F 121px 123px, transparent 124px 180px, #B9B09F 181px 183px, transparent 184px)" }}><div style={{ display: "flex", fontSize: 24, fontFamily: "monospace", letterSpacing: 4 }}>GROUNDSIGNAL / FIELD PROTOCOL 01</div><div style={{ display: "flex", maxWidth: 900, fontSize: 82, lineHeight: 0.95 }}>When the model says clear, ask the ground.</div><div style={{ display: "flex", gap: 24, alignItems: "center", fontSize: 26 }}><span style={{ background: "#F05A28", color: "#F1EBDD", padding: "10px 18px", fontFamily: "monospace" }}>OPEN SOURCE</span><span>Consensus-scored human witness data for agents.</span></div></div>, size);
}
