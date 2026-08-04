import type { IntegrationState, SignalTier } from "@/core/types";

export function StatusStamp({ children, tone = "green" }: {
  children: React.ReactNode;
  tone?: "green" | "orange" | "blue" | "red" | "ink";
}) {
  return <span className={`stamp stamp-${tone}`}>{children}</span>;
}

export function SignalStamp({ tier }: { tier: SignalTier | null }) {
  const tone = tier === "ground_truth" || tier === "strong" ? "green" : tier === "contested" ? "red" : "orange";
  return <StatusStamp tone={tone}>{tier?.replace("_", " ") ?? "no signal"}</StatusStamp>;
}

export function IntegrationStamp({ state }: { state: IntegrationState }) {
  const tone = state === "VERIFIED" ? "green" : state === "FAILED" ? "red" : state === "CONFIGURED" ? "blue" : "orange";
  return <StatusStamp tone={tone}>{state}</StatusStamp>;
}
