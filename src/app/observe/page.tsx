import type { Metadata } from "next";
import { ObservationSandbox } from "@/components/observation-sandbox";
import { getIntegrationAvailability, getRuntimeMode } from "@/server/config";

export const metadata: Metadata = { title: "Observer sandbox" };

export default function ObservePage() {
  const mode = getRuntimeMode();
  const integrations = getIntegrationAvailability();
  return <main id="main-content" className="section-shell observe-page">
    <header className="page-heading"><p className="eyebrow">Mobile field sheet / {mode} mode</p><h1>Record what the model cannot see.</h1><p>Use the deterministic demo identity, or configure SQLite and World ID for a real proof-backed local submission.</p></header>
    <ObservationSandbox mode={mode} worldIdConfigured={integrations.worldId} />
  </main>;
}
