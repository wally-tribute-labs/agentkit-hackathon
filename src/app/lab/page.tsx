import type { Metadata } from "next";
import { IntegrationCard } from "@/components/integration-card";
import { getIntegrationAvailability, getRuntimeMode } from "@/server/config";

export const metadata: Metadata = { title: "Integration lab" };

export default function LabPage() {
  const mode = getRuntimeMode();
  const available = getIntegrationAvailability();
  const state = (configured: boolean) => configured ? "CONFIGURED" as const : mode === "demo" ? "SIMULATED" as const : "NOT RUN" as const;
  return <main id="main-content" className="section-shell lab-page">
    <header className="page-heading"><p className="eyebrow">Integration lab / evidence board</p><h1>Mocks are evidence. Live tests are a separate gate.</h1><p>This board never upgrades a configured adapter to verified without owner-run acceptance evidence.</p></header>
    <div className="lab-legend"><span>Runtime mode <b>{mode}</b></span><span>Live credentials <b>{Object.values(available).some(Boolean) ? "partially configured" : "none"}</b></span><span>Owner acceptance <b>NOT RUN</b></span></div>
    <div className="integration-grid">
      <IntegrationCard index="01" name="World ID" role="Observer identity" state={state(available.worldId)} detail="IDKit 4 browser and World App handoff, v4 server verification, then a short signed observer session." setup="Set WORLD_ID_APP_ID, WORLD_ID_RP_ID, WORLD_ID_RP_SIGNING_KEY, and OBSERVER_SESSION_SECRET in SQLite mode. Never expose the signing key." />
      <IntegrationCard index="02" name="x402" role="Testnet payment" state={state(available.x402)} detail="Dynamic signal pricing and post-success settlement through the Base Sepolia facilitator." setup="Set X402_FACILITATOR_URL=https://x402.org/facilitator, X402_NETWORK=eip155:84532, and a non-zero X402_PAY_TO address." />
      <IntegrationCard index="03" name="AgentKit" role="Human-backed agent" state={state(available.agentKit)} detail="Hooks-based verification with a three-request free trial and persistent SQLite usage and nonce storage." setup="Enable only in SQLite mode with AGENTKIT_ENABLED=true. A real test agent and World Chain access remain owner-gated." />
      <IntegrationCard index="04" name="XMTP" role="Messaging transport" state={state(available.xmtp)} detail="A standalone Node process parses commands and calls GroundSignal over its public API contract." setup="Set XMTP_WALLET_KEY and XMTP_DB_ENCRYPTION_KEY, then run npm run xmtp. Do not host the listener in Vercel functions." />
    </div>
    <section className="acceptance-ledger"><h2>Owner-gated evidence ledger</h2>{["World ID proof", "x402 settlement", "AgentKit free trial + nonce", "XMTP message round trip", "GitHub rename", "Vercel deployment"].map((item) => <div key={item}><span>{item}</span><b>NOT RUN</b><small>No owner credential or approval used.</small></div>)}</section>
  </main>;
}
