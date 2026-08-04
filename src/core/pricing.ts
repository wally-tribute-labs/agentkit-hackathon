import type { SignalTier } from "./types";

export const SIGNAL_PRICE_MICRO_USDC: Record<SignalTier, number> = {
  sparse: 1_000,
  contested: 1_000,
  corroborated: 5_000,
  strong: 10_000,
  ground_truth: 20_000,
};

export function quoteSignal(tier: SignalTier | null): number {
  return SIGNAL_PRICE_MICRO_USDC[tier ?? "sparse"];
}

export function formatTestUsdc(microUsdc: number): string {
  return `$${(microUsdc / 1_000_000).toFixed(3)} test USDC`;
}
