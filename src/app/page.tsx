import Link from "next/link";
import { FieldMap } from "@/components/field-map";
import { SignalStamp, StatusStamp } from "@/components/status-stamp";
import { SF_RAIN_SCENARIO, createScenarioResponse } from "@/core/scenario";

export default function Home() {
  const response = createScenarioResponse(SF_RAIN_SCENARIO);
  return (
    <main id="main-content">
      <section className="hero section-shell">
        <div className="hero-copy reveal-1">
          <p className="eyebrow">Field protocol / reference implementation 01</p>
          <h1>When the model says clear, <em>ask the ground.</em></h1>
          <p className="hero-lede">GroundSignal shows how an AI agent can request consensus-scored, proof-of-human observations about the physical world—without pretending this demo is a live network.</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/demo">Run the field test <span aria-hidden="true">→</span></Link>
            <Link className="button button-quiet" href="/developers">Inspect the API</Link>
          </div>
          <div className="truth-note"><StatusStamp tone="orange">SIMULATED</StatusStamp><span>Deterministic observers, receipt, and credits. Real protocol logic.</span></div>
        </div>
        <div className="hero-map reveal-2">
          <div className="sheet-label"><span>CASE GS–SF–001</span><span>07 FEB 2026 / 18:00Z</span></div>
          <FieldMap observations={SF_RAIN_SCENARIO.observations} />
          <div className="map-verdict">
            <div><span>Model</span><strong>Clear</strong></div>
            <div className="verdict-arrow" aria-hidden="true">≠</div>
            <div><span>Human signal</span><strong>Rain · 92%</strong></div>
            <SignalStamp tier={response.consensus.tier} />
          </div>
        </div>
      </section>

      <section className="manifesto-band">
        <p>Models estimate.</p><p>Witnesses observe.</p><p>Consensus makes the difference legible.</p>
      </section>

      <section className="section-shell narrative-grid">
        <div className="section-intro">
          <p className="eyebrow">The thirty-second brief</p>
          <h2>A reusable witness layer, demonstrated through weather.</h2>
        </div>
        <div className="protocol-steps">
          {[
            ["01", "Observe", "A human reports a local condition. In v1, the public reports are explicitly simulated."],
            ["02", "Corroborate", "Reports are deduplicated by observer, H3 cell, and thirty-minute window."],
            ["03", "Classify", "Agreement and population produce a sparse, contested, corroborated, strong, or ground-truth signal."],
            ["04", "Deliver", "Agents receive one typed response comparing the model baseline with human consensus."],
          ].map(([number, title, body]) => <article className="protocol-step" key={number}>
            <span>{number}</span><div><h3>{title}</h3><p>{body}</p></div>
          </article>)}
        </div>
      </section>

      <section className="section-shell proof-section">
        <div>
          <p className="eyebrow">Inspectable by design</p>
          <h2>The interesting part is not a weather app. It is the protocol seam.</h2>
          <p>One pure engine feeds the replay, local sandbox, free API, SQLite self-host, and optional x402 route. The public demo works with every integration disabled.</p>
        </div>
        <div className="system-diagram" aria-label="GroundSignal system flow">
          <div><b>Versioned fixtures</b><small>deterministic evidence</small></div><i aria-hidden="true">→</i>
          <div className="diagram-core"><b>Consensus engine</b><small>pure TypeScript</small></div><i aria-hidden="true">→</i>
          <div><b>Agent response</b><small>free or x402 testnet</small></div>
        </div>
      </section>

      <section className="section-shell limits-section">
        <div><p className="eyebrow">Truth in labeling</p><h2>Built to explain what is real.</h2></div>
        <div className="limits-grid">
          <article><StatusStamp tone="green">WORKING</StatusStamp><h3>Consensus and APIs</h3><p>Deterministic calculation, browser-local contribution, schema validation, and a free endpoint.</p></article>
          <article><StatusStamp tone="blue">OPTIONAL</StatusStamp><h3>Integration mode</h3><p>World ID, x402, AgentKit, and XMTP are isolated, credential-gated adapters.</p></article>
          <article><StatusStamp tone="orange">NOT CLAIMED</StatusStamp><h3>A live network</h3><p>No real users, income, mainnet payments, or production fraud resistance.</p></article>
        </div>
      </section>
    </main>
  );
}
