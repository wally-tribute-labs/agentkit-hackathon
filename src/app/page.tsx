import Link from "next/link";
import { FieldMap } from "@/components/field-map";
import { StationPlot } from "@/components/sky-cover";
import { SignalStamp, StatusStamp } from "@/components/status-stamp";
import { SF_RAIN_SCENARIO, createScenarioResponse } from "@/core/scenario";

const protocolSteps = [
  ["01", "Observe", "A person reports the condition where they are standing. In v1 every public report is explicitly simulated."],
  ["02", "Corroborate", "Reports are deduplicated by observer, H3 cell, and thirty-minute window. One vote each."],
  ["03", "Classify", "Agreement and observer count produce one tier: sparse, contested, corroborated, strong, or ground truth."],
  ["04", "Deliver", "The agent gets a single typed response that sets the model baseline against the human reading."],
] as const;

export default function Home() {
  const response = createScenarioResponse(SF_RAIN_SCENARIO);
  const agreement = response.consensus.agreementRate ?? 0;
  const rainCount = SF_RAIN_SCENARIO.observations.filter((report) => report.condition === "rain").length;
  const dissentCount = SF_RAIN_SCENARIO.observations.length - rainCount;

  return (
    <main id="main-content">
      <section className="hero section-shell">
        <div className="hero-copy reveal-1">
          <p className="eyebrow">Field protocol · reference implementation 01</p>
          <h1>When the model says clear,<br /><span className="underscored">ask the ground.</span></h1>
          <p className="lede">
            GroundSignal is a working protocol for asking people what the weather is actually doing, scoring
            their agreement, and handing an agent one answer it can act on.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/demo">Run the field test <span aria-hidden="true">→</span></Link>
            <Link className="button button-quiet" href="/developers">Inspect the API</Link>
          </div>
          <p className="hero-note">
            <StatusStamp tone="orange">Simulated</StatusStamp>
            <span>Every observer, receipt, and credit below is deterministic demo data. The protocol logic is real.</span>
          </p>
        </div>

        <div className="instrument reveal-2">
          <div className="instrument-head">
            <span>Case GS–SF–001 · San Francisco</span>
            <strong>07 Feb 2026 · 18:00Z</strong>
          </div>
          <FieldMap observations={SF_RAIN_SCENARIO.observations} />
          <div className="map-key">
            <span><i className="key-swatch key-rain" aria-hidden="true" />rain · full cover</span>
            <span><i className="key-swatch key-dissent" aria-hidden="true" />cloudy · dissent</span>
            <span><i className="key-swatch key-cell" aria-hidden="true" />query cell</span>
          </div>
          <div className="divergence">
            <StationPlot
              tone="model"
              fraction={0}
              source="Model"
              reading="Clear"
              detail="Open-Meteo · 18:04Z"
            />
            <div className="divergence-gap" aria-hidden="true">
              <b>≠</b>
              <small>no agreement</small>
            </div>
            <StationPlot
              tone="ground"
              fraction={agreement}
              source="Ground"
              reading="Rain"
              detail={`${SF_RAIN_SCENARIO.observations.length} observers · 18:16Z`}
            />
            <div className="divergence-tier">
              <p>Agreement {(agreement * 100).toFixed(2)}% · {rainCount} rain, {dissentCount} cloudy</p>
              <SignalStamp tier={response.consensus.tier} />
            </div>
          </div>
        </div>
      </section>

      <section className="readout-strip" aria-label="Scenario reading">
        <dl className="readout-grid section-shell">
          <div><dt>Observers</dt><dd>{SF_RAIN_SCENARIO.observations.length}<small>one vote each, deduplicated</small></dd></div>
          <div><dt>Reporting rain</dt><dd>{rainCount}<small>{dissentCount} reported cloudy</small></dd></div>
          <div><dt>Agreement</dt><dd>{(agreement * 100).toFixed(2)}%<small>within one H3 cell and window</small></dd></div>
          <div><dt>Signal tier</dt><dd>Ground truth<small>the highest tier the engine issues</small></dd></div>
        </dl>
        <p className="readout-caption section-shell">
          <span>Models estimate. <em>Witnesses observe.</em></span>
          <span>Scenario sf-rain-v1 · H3 resolution 8 · 30-minute window</span>
        </p>
      </section>

      <section className="section-shell band band-split">
        <div className="band-head">
          <p className="eyebrow">The thirty-second brief</p>
          <h2>A reusable witness layer, demonstrated through weather.</h2>
          <p className="lede">Weather is the v1 adapter because it is easy to check. The engine underneath does not know what it is scoring.</p>
        </div>
        <div className="protocol-steps">
          {protocolSteps.map(([number, title, body]) => (
            <article className="protocol-step" key={number}>
              <span>{number}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell band band-split">
        <div className="band-head">
          <p className="eyebrow">Inspectable by design</p>
          <h2>The interesting part is not a weather app. It is the seam.</h2>
          <p className="lede">One pure engine feeds the replay, the browser sandbox, the free API, the SQLite self-host, and the optional x402 route. The public demo runs with every integration switched off.</p>
        </div>
        <div className="signal-path" aria-label="How a request moves through GroundSignal">
          <article><b>Versioned fixtures</b><small>deterministic evidence</small></article>
          <i aria-hidden="true">→</i>
          <article className="signal-core"><b>Consensus engine</b><small>pure TypeScript</small></article>
          <i aria-hidden="true">→</i>
          <article><b>Agent response</b><small>free or x402 testnet</small></article>
        </div>
      </section>

      <section className="section-shell band">
        <div className="limits-head">
          <div>
            <p className="eyebrow">Truth in labeling</p>
            <h2>Built to say what is real.</h2>
          </div>
          <p className="lede">Three categories, kept apart on purpose. Nothing here is upgraded without owner-run evidence.</p>
        </div>
        <div className="limits-grid">
          <article>
            <StatusStamp tone="green">Working</StatusStamp>
            <h3>Consensus and APIs</h3>
            <p>Deterministic scoring, a browser-local contribution, schema validation, and a free endpoint anyone can call.</p>
          </article>
          <article>
            <StatusStamp tone="blue">Optional</StatusStamp>
            <h3>Integration mode</h3>
            <p>World ID, x402, AgentKit, and XMTP are isolated adapters. Each stays off until its credentials are set.</p>
          </article>
          <article>
            <StatusStamp tone="orange">Not claimed</StatusStamp>
            <h3>A live network</h3>
            <p>No real users, no contributor income, no mainnet settlement, no production geolocation fraud resistance.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
