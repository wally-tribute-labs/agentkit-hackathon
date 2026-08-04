"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateConsensus } from "@/core/consensus";
import { observationsAtStep, type DemoScenario } from "@/core/scenario";
import type { ObservationEvidence, WeatherCondition } from "@/core/types";
import { ConsensusTrace } from "./consensus-trace";
import { FieldMap } from "./field-map";
import { SignalStamp, StatusStamp } from "./status-stamp";

const STORAGE_KEY = "groundsignal.demo.v1";

interface DemoState {
  observerId: string;
  scenarioId: string;
  cursor: number;
  visitorReport: ObservationEvidence | null;
  reducedMotion: boolean;
}

function initialState(scenario: DemoScenario): DemoState {
  return {
    observerId: "demo_observer_visitor",
    scenarioId: scenario.id,
    cursor: 0,
    visitorReport: null,
    reducedMotion: false,
  };
}

function readState(scenario: DemoScenario): DemoState {
  if (typeof window === "undefined") return initialState(scenario);
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<DemoState> | null;
    if (!parsed || parsed.scenarioId !== scenario.id) return initialState(scenario);
    return { ...initialState(scenario), ...parsed, cursor: Math.min(parsed.cursor ?? 0, scenario.events.length - 1) };
  } catch {
    return initialState(scenario);
  }
}

export function DemoExperience({ scenario }: { scenario: DemoScenario }) {
  const [state, setState] = useState(() => initialState(scenario));
  const [hydrated, setHydrated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [condition, setCondition] = useState<WeatherCondition>("rain");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setState(readState(scenario));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scenario]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    if (!playing || state.cursor >= scenario.events.length - 1) return;
    const timer = window.setTimeout(() => {
      setState((current) => ({ ...current, cursor: current.cursor + 1 }));
    }, state.reducedMotion ? 900 : 2_500);
    return () => window.clearTimeout(timer);
  }, [playing, scenario.events.length, state.cursor, state.reducedMotion]);

  const fixtureReports = useMemo(() => observationsAtStep(scenario, state.cursor), [scenario, state.cursor]);
  const reports = state.visitorReport ? [...fixtureReports, state.visitorReport] : fixtureReports;
  const consensus = calculateConsensus(reports, scenario.h3Index, scenario.windowStart);
  const event = scenario.events[state.cursor];

  function contribute() {
    const report: ObservationEvidence = {
      id: "visitor_demo_report",
      observerId: state.observerId,
      source: "visitor_demo",
      h3Index: scenario.h3Index,
      windowStart: scenario.windowStart,
      observedAt: "2026-02-07T18:17:00.000Z",
      receivedAt: "2026-02-07T18:17:01.000Z",
      condition,
      intensity: "moderate",
      feel: "cool",
      note: "Browser-local demo contribution.",
    };
    setState((current) => ({ ...current, visitorReport: report }));
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    setPlaying(false);
    setCondition("rain");
    setState(initialState(scenario));
  }

  return (
    <div className="demo-shell">
      <section className="demo-heading">
        <div><p className="eyebrow">Guided field test / {scenario.id}</p><h1>The forecast missed the rain.</h1></div>
        <div className="simulation-disclosure"><StatusStamp tone="orange">SIMULATED SCENARIO</StatusStamp><p>Every observer, timestamp, receipt, and credit in this replay is deterministic demo data.</p></div>
      </section>

      <div className="demo-grid">
        <section className="demo-map-panel sheet-panel">
          <div className="panel-heading"><span>FIELD SHEET A</span><strong>{scenario.locationLabel}</strong></div>
          <FieldMap observations={reports} />
          <div className="evidence-key"><span><i className="key-rain" />rain report</span><span><i className="key-dissent" />dissent</span><span><i className="key-model" />model</span></div>
        </section>

        <aside className="demo-evidence sheet-panel" id="evidence">
          <div className="panel-heading"><span>CONSENSUS LOG</span><strong>Step {state.cursor + 1} / {scenario.events.length}</strong></div>
          <div className="current-event" aria-live="polite"><small>{String(event.atMs / 1000).padStart(2, "0")} SEC</small><h2>{event.title}</h2><p>{event.detail}</p></div>
          <div className="metric-ledger">
            <div><span>Model baseline</span><b>clear</b></div>
            <div><span>Human condition</span><b>{consensus.condition ?? "—"}</b></div>
            <div><span>Agreement</span><b>{consensus.agreementRate === null ? "—" : `${Math.round(consensus.agreementRate * 100)}%`}</b></div>
            <div><span>Unique observers</span><b>{consensus.uniqueObserverCount}</b></div>
          </div>
          <SignalStamp tier={consensus.tier} />
        </aside>

        <section className="trace-panel sheet-panel">
          <div className="panel-heading"><span>CONSENSUS TRACE</span><strong>One vote / observer / cell / window</strong></div>
          <ConsensusTrace observations={reports} />
        </section>

        <section className="replay-controls sheet-panel" aria-label="Replay controls">
          <div className="control-row">
            <button className="button button-primary" disabled={!hydrated || state.cursor === scenario.events.length - 1} onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play field test"}</button>
            <button className="button button-quiet" disabled={!hydrated || state.cursor === 0} onClick={() => { setPlaying(false); setState((current) => ({ ...current, cursor: current.cursor - 1 })); }}>Previous</button>
            <button className="button button-quiet" disabled={!hydrated || state.cursor === scenario.events.length - 1} onClick={() => setState((current) => ({ ...current, cursor: current.cursor + 1 }))}>Next</button>
            <button className="button button-quiet" disabled={!hydrated} onClick={() => { setPlaying(false); setState((current) => ({ ...current, cursor: 0 })); }}>Restart</button>
            <button className="text-button" disabled={!hydrated} onClick={resetDemoData}>Reset demo data</button>
          </div>
          <div className="segmented" aria-label="Motion preference">
            <button aria-pressed={!state.reducedMotion} onClick={() => setState((current) => ({ ...current, reducedMotion: false }))}>Standard motion</button>
            <button aria-pressed={state.reducedMotion} onClick={() => setState((current) => ({ ...current, reducedMotion: true }))}>Reduced motion</button>
          </div>
        </section>

        <section className="visitor-panel sheet-panel">
          <div><p className="eyebrow">Browser-local sandbox</p><h2>Add one observation to this copy.</h2><p>Your contribution stays in this browser and never changes the public demo API fixture.</p></div>
          <div className="visitor-form">
            <div className="segmented" aria-label="Observed condition">
              {(["rain", "cloudy", "clear"] as WeatherCondition[]).map((item) => <button aria-pressed={condition === item} key={item} onClick={() => setCondition(item)}>{item}</button>)}
            </div>
            <button className="button button-primary" disabled={!hydrated} onClick={contribute}>{state.visitorReport ? "Replace local report" : "Add local report"}</button>
            {state.visitorReport ? <button className="text-button" onClick={() => setState((current) => ({ ...current, visitorReport: null }))}>Reset local contribution</button> : null}
          </div>
        </section>

        <section className="receipt-panel sheet-panel">
          <div><p className="eyebrow">Simulated agent docket</p><h2>Result delivered</h2></div>
          <dl><div><dt>Receipt</dt><dd>demo_receipt_sf-rain-v1_final</dd></div><div><dt>Scenario score</dt><dd>20 signal credits</dd></div><div><dt>Payment status</dt><dd>simulated · nonredeemable</dd></div></dl>
          <p>No fake transaction hash. Testnet receipts appear only after a real owner-gated x402 test.</p>
        </section>
      </div>
    </div>
  );
}
