# Development Phases

Human-Verified Weather Oracle — hackathon build roadmap.
**Deadline: Sunday March 29, 2026, 7:30 AM PT**

Each phase has its own planning session and implementation. Start a new Claude Code session for each phase and reference this document + `CLAUDE.md` for context.

---

## Phase 0: Project Scaffold ✅
**Status**: Complete

Set up the running Next.js 15 app skeleton with all dependencies, directory structure, TypeScript types, and database schema. No features, just the foundation.

**Done**: `npm run dev` and `npm run build` work. SQLite schema in place. All route stubs return 501.

---

## Phase 1: World ID Verification + Observation Submission
**Status**: Pending
**Est. effort**: 4-5 hours
**Depends on**: Phase 0

### Goal
A verified human can open the app, prove personhood with World ID, see GPS + Open-Meteo baseline, select conditions, and submit an observation to SQLite.

### What to build
- `src/lib/providers.tsx` — MiniKitProvider + WagmiProvider + QueryClientProvider
- `src/app/layout.tsx` — wrap with Providers
- `src/components/VerifyButton.tsx` — MiniKit in World App, IDKit widget in browser
- `src/app/api/verify-proof/route.ts` — `verifyCloudProof()` from `@worldcoin/minikit-js`
- `src/lib/weather/openmeteo.ts` — `fetchOpenMeteoBaseline(lat, lon)`
- `src/components/WeatherObserver.tsx` — condition/intensity/feel quick-select
- `src/app/api/observations/route.ts` (POST) — validate + store to SQLite
- `src/app/page.tsx` — landing: verify → redirect to /observe
- `src/app/(protected)/observe/page.tsx` — GPS + baseline + observer form

### Key integration details
- **MiniKit detection**: `MiniKit.isInstalled()` from `@worldcoin/minikit-js`
- **Verify (World App)**: `MiniKit.commandsAsync.verify({ action: 'submit-observation', verification_level: 'orb' })`
- **Verify (browser)**: `<IDKitWidget>` from `@worldcoin/idkit` with QR modal
- **Server verify**: `verifyCloudProof(payload, process.env.NEXT_PUBLIC_APP_ID, action)`
- **Dev bypass**: `if (process.env.NEXT_PUBLIC_DEV_SKIP_VERIFY === 'true') { skip verify }` for local testing
- **Open-Meteo**: `GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`

### Done when
Open app → click verify → World ID proof accepted → GPS shown + Open-Meteo data displayed → tap condition buttons → submit → observation in SQLite.

---

## Phase 2: x402 Agent API + Consensus Engine
**Status**: Pending
**Est. effort**: 4-5 hours
**Depends on**: Phase 0 (Phase 1 seed data helps but not required)

### Goal
AI agents can query `GET /api/v1/weather?lat=...&lon=...` with x402 payment and receive consensus-scored observations.

### What to build
- `src/lib/weather/consensus.ts` — H3 hex grouping, 30-min windows, agreement rate, signal tiers
- `src/lib/x402/config.ts` — x402ResourceServer, HTTPFacilitatorClient, ExactEvmScheme, withX402
- `src/app/api/v1/weather/route.ts` — `withX402(handler, routeConfig, server)` wrapper
- `src/app/api/v1/openapi/route.ts` — OpenAPI 3.0 spec
- `scripts/seed.ts` — generate mock observations for demo density
- AgentKit extension (`@worldcoin/agentkit`) on the x402 server for human-backed agent detection

### Key integration details
- **x402 packages**: `@x402/next`, `@x402/core`, `@x402/evm` (see official example at `examples/typescript/fullstack/next/` in coinbase/x402 repo)
- **withX402 signature**: `withX402(handler, { accepts: [{ scheme: 'exact', price: '$0.001', network: 'eip155:84532', payTo: evmAddress }] }, server)`
- **Network**: `eip155:84532` (base-sepolia testnet)
- **H3 resolution**: 7 (~500m cells) — import `latLngToCell` from `h3-js`
- **Time window**: round timestamp down to nearest 30 minutes
- **Dynamic pricing**: compute signal strength first, then pick price from `SIGNAL_PRICES` in `src/types/weather.ts`
- **AgentKit**: `npm install @worldcoin/agentkit`, use `declareAgentkitExtension` and `agentkitResourceServerExtension`

### Done when
`curl` weather endpoint → 402 response. Use test x402 client → pay → receive JSON consensus response. Seed script populates demo data. AgentKit extension registered.

---

## Phase 3: Map Visualization + Dashboard
**Status**: Pending
**Est. effort**: 3-4 hours
**Depends on**: Phases 1 & 2

### Goal
Visual map of observation density + earnings dashboard for verified human contributors.

### What to build
- `src/components/ObservationMap.tsx` — Leaflet map, hex cells colored by signal strength
  - solo: gray, corroborated: yellow, strong: green, ground_truth: blue
- `src/components/SignalBadge.tsx` — pill component for signal tier
- `src/app/(protected)/dashboard/page.tsx` — map + user history + earnings
- `src/app/api/observations/route.ts` (GET) — user's own observations by nullifier hash

### Key integration details
- **Leaflet + Next.js**: must use `dynamic(() => import(...), { ssr: false })` for map component (Leaflet requires browser)
- **H3 to polygon**: `cellToBoundary(h3Index)` from `h3-js` for drawing hex shapes
- **Color by signal**: map `signalStrength` to Tailwind/hex color class

### Done when
Map shows colored hex cells from seeded data. Clicking cell shows consensus details. Dashboard shows observation history.

---

## Phase 4: Demo Polish + End-to-End Testing
**Status**: Pending
**Est. effort**: 3-4 hours
**Depends on**: Phases 1-3

### Goal
Demo-ready. The 2-minute demo script from `project.md` runs without breaking.

### What to build
- Mobile-first styling pass (World App WebView)
- `src/components/SkyPhoto.tsx` — camera capture (optional but demo wow factor)
- `scripts/demo-seed.ts` — curated scenarios: "model says clear, 8 humans say rain, 92% confidence"
- Landing page polish: value prop, how-it-works, screenshots
- Error states and loading skeletons
- Full E2E flow test

### Done when
Run through 2-minute demo script: verify → observe → consensus on map → agent pays → earnings. Everything works on mobile.

---

## Phase 5: XMTP Agent (Bonus — $5K bounty)
**Status**: Pending
**Est. effort**: 2-3 hours
**Depends on**: Phase 2

### Goal
Standalone XMTP agent that responds to weather queries via encrypted messaging. Qualifies for the XMTP $5K bounty.

### What to build
- `xmtp/agent.ts` — `@xmtp/agent-sdk` agent
  - Listens for messages like `weather 40.7128,-74.0060`
  - Queries consensus engine
  - Replies with formatted weather report
- `xmtp/handlers.ts` — message parsing and routing

### Key integration details
- **Package**: `npm install @xmtp/agent-sdk`
- **Required env**: `XMTP_ENV`, `XMTP_WALLET_KEY`, `XMTP_DB_ENCRYPTION_KEY` (64 hex chars)
- **Run separately**: `npx tsx xmtp/agent.ts` alongside `npm run dev`
- **Test**: send message to agent address from xmtp.chat

### Done when
Message agent from xmtp.chat → receive weather report with consensus data.

---

## Time Budget Summary

| Phase | Hours | Cumulative | Priority |
|-------|-------|------------|----------|
| 0: Scaffold | 2-3 | 2-3 | Must have ✅ |
| 1: World ID + Observations | 4-5 | 6-8 | Must have |
| 2: x402 + Consensus | 4-5 | 10-13 | Must have |
| 3: Map + Dashboard | 3-4 | 13-17 | Should have |
| 4: Demo Polish | 3-4 | 16-21 | Should have |
| 5: XMTP Bonus | 2-3 | 18-24 | Nice to have |
