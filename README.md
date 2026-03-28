# World Hack: Human-Verified Weather Oracle

A World Chain hackathon submission — a World Mini App where verified humans report local weather conditions, and AI agents query consensus-scored observations via x402 micropayments.

**The core value prop**: the delta between Open-Meteo model predictions and human ground truth. "Model said clear. 8 verified humans say rain. Confidence: 92%."

---

## How it works

1. **Human reports**: A World ID-verified human opens the app, GPS is captured, Open-Meteo baseline is fetched, they tap their observed conditions, and submit.
2. **Consensus builds**: Observations are grouped by H3 hex cell (~500m) and 30-minute time window. Agreement rate and signal strength are computed.
3. **Agents query**: AI agents send an x402 micropayment to `GET /api/v1/weather` and receive consensus-scored observations with model delta.
4. **Humans earn**: Query fees are distributed to contributors in the queried cell/window.

## Architecture

```
User Clients (World App / Coinbase Wallet / Browser)
    |
    v
Next.js 15 App
    ├── POST /api/verify-proof      -- World ID proof validation
    ├── POST /api/observations      -- store observation + model baseline
    ├── GET  /api/v1/weather        -- x402-gated consensus response
    └── GET  /api/v1/openapi        -- OpenAPI spec
    |
    ├── SQLite (observations)
    ├── Open-Meteo API (free baseline)
    └── Consensus engine (H3 hex + time window aggregation)
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router + TypeScript + Tailwind |
| World ID | `@worldcoin/minikit-js` (World App) + `@worldcoin/idkit` (browser) |
| Payments | `@x402/next` + `@x402/core` + `@x402/evm` (x402 on Base Sepolia) |
| AgentKit | `@worldcoin/agentkit` extension for human-backed agent detection |
| Geofencing | `h3-js` H3 hex cells at resolution 7 (~500m) |
| Storage | `better-sqlite3` SQLite |
| Map | `leaflet` + `react-leaflet` |
| Wallet | `wagmi` + `viem` |
| XMTP | `@xmtp/agent-sdk` messaging agent (bonus bounty) |

## Hackathon integrations

- **World ID** — zero-knowledge proof of personhood. MiniKit in World App, IDKit widget in browser/Coinbase Wallet.
- **Coinbase x402** — HTTP-native micropayments. `withX402` middleware gates the agent API. Dynamic pricing by signal strength tier.
- **XMTP** — optional $5K bounty. Standalone agent that responds to weather queries via encrypted messages.

## Signal strength tiers + pricing

| Tier | Reporters | Agreement | Price |
|------|-----------|-----------|-------|
| solo | 1 | any | $0.001 |
| corroborated | 3–5 | ≥60% | $0.005 |
| strong | 5–10 | ≥70% | $0.01 |
| ground_truth | 10+ | ≥80% | $0.02 |

## Setup

```bash
cp .env.example .env.local
# fill in values (see below)
npm install
npm run dev
```

## Environment variables

```env
# World ID
NEXT_PUBLIC_APP_ID=app_...         # World Developer Portal app ID

# x402 payments
EVM_ADDRESS=0x...                  # USDC receiving address
FACILITATOR_URL=https://...        # CDP facilitator URL
X402_NETWORK=eip155:84532          # base-sepolia testnet

# Dev only
NEXT_PUBLIC_DEV_SKIP_VERIFY=true   # bypass World ID locally
```

See `.env.example` for the full documented template.

## Commands

```bash
npm run dev                         # start dev server (localhost:3000)
npm run build                       # production build
npm run lint                        # ESLint

npx tsx scripts/seed.ts             # seed SQLite with demo observations
npx tsx xmtp/agent.ts               # run XMTP agent (Phase 5+)
```

## Agent API

```
GET /api/v1/weather?lat={lat}&lon={lon}&radius={meters}
```

Requires x402 payment. Returns:

```json
{
  "consensus": {
    "condition": "Rain",
    "agreementRate": 0.92,
    "reporterCount": 8,
    "signalStrength": "ground_truth",
    "modelDelta": "Model predicted Clear"
  },
  "h3Cell": "872a100...",
  "windowStart": "2026-03-27T14:00:00Z"
}
```

OpenAPI spec available at `GET /api/v1/openapi`.

## Project structure

```
src/
  app/
    layout.tsx                    # MiniKit + wagmi + query providers
    page.tsx                      # landing + verify
    (protected)/
      observe/page.tsx            # GPS + baseline + observation form
      dashboard/page.tsx          # map + earnings history
    api/
      verify-proof/route.ts       # World ID server verification
      observations/route.ts       # submit observation
      v1/
        weather/route.ts          # x402-gated agent API
        openapi/route.ts          # OpenAPI spec
  lib/
    x402/config.ts                # x402 server + route configs
    weather/openmeteo.ts          # Open-Meteo client
    weather/consensus.ts          # H3 grouping + signal scoring
    db/index.ts                   # SQLite connection
    db/schema.ts                  # tables + migrations
    providers.tsx                 # client-side provider tree
  components/
    VerifyButton.tsx              # MiniKit vs IDKit detection
    WeatherObserver.tsx           # condition quick-select UI
    ObservationMap.tsx            # Leaflet hex map
    SignalBadge.tsx               # signal tier pill
  types/
    weather.ts                    # shared types + signal prices
xmtp/
  agent.ts                        # XMTP messaging agent
  handlers.ts                     # message parsing + routing
scripts/
  seed.ts                         # populate demo observations
```

## Development phases

See `PHASES.md` for the full build roadmap.

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Scaffold + schema + stubs | Done |
| 1 | World ID + observation submission | Pending |
| 2 | x402 agent API + consensus engine | Pending |
| 3 | Map visualization + earnings dashboard | Pending |
| 4 | Demo polish + E2E testing | Pending |
| 5 | XMTP agent (bonus) | Pending |

## Demo script (2 min)

1. Open in World App — verified, GPS locked, model baseline displayed
2. Quick-tap conditions — 5 seconds to submit
3. Multiple humans submit same area — consensus builds on the map
4. Agent queries API — x402 payment, consensus response with signal strength
5. Side-by-side: "Model said clear. 8 verified humans say rain. Confidence: 92%."
6. Earnings dashboard — humans earning from agent queries

---

Hackathon deadline: **Sunday March 29, 2026, 7:30 AM PT**
