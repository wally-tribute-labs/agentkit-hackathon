import { windowEnd } from "./time";
import type { ConsensusResult, ObservationEvidence, SignalTier, WeatherCondition } from "./types";

function deduplicate(reports: ObservationEvidence[]): ObservationEvidence[] {
  const latest = new Map<string, ObservationEvidence>();
  for (const report of reports) {
    const key = `${report.observerId}|${report.h3Index}|${report.windowStart}`;
    const existing = latest.get(key);
    if (!existing || existing.receivedAt < report.receivedAt) latest.set(key, report);
  }
  return [...latest.values()].sort((a, b) => a.receivedAt.localeCompare(b.receivedAt));
}

function tierFor(count: number, agreementRate: number, tied: boolean): SignalTier {
  if (tied) return "contested";
  if (count <= 2) return "sparse";
  if (count <= 4) return agreementRate >= 0.6 ? "corroborated" : "contested";
  if (count <= 9) return agreementRate >= 0.7 ? "strong" : "contested";
  return agreementRate >= 0.8 ? "ground_truth" : "contested";
}

export function calculateConsensus(
  reports: ObservationEvidence[],
  h3Index: string,
  windowStart: string,
): ConsensusResult {
  const relevant = deduplicate(
    reports.filter((report) => report.h3Index === h3Index && report.windowStart === windowStart),
  );

  if (relevant.length === 0) {
    return {
      status: "unavailable",
      condition: null,
      tier: null,
      agreementRate: null,
      reportCount: 0,
      uniqueObserverCount: 0,
      h3Index,
      windowStart,
      windowEnd: windowEnd(windowStart),
      contested: false,
    };
  }

  const counts = new Map<WeatherCondition, number>();
  for (const report of relevant) counts.set(report.condition, (counts.get(report.condition) ?? 0) + 1);
  const ranked = [...counts.entries()].sort(([aCondition, aCount], [bCondition, bCount]) =>
    bCount - aCount || aCondition.localeCompare(bCondition),
  );
  const topCount = ranked[0][1];
  const tied = ranked.length > 1 && ranked[1][1] === topCount;
  const agreementRate = topCount / relevant.length;
  const tier = tierFor(relevant.length, agreementRate, tied);

  return {
    status: "available",
    condition: tied ? null : ranked[0][0],
    tier,
    agreementRate,
    reportCount: relevant.length,
    uniqueObserverCount: relevant.length,
    h3Index,
    windowStart,
    windowEnd: windowEnd(windowStart),
    contested: tier === "contested",
  };
}
