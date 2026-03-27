# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**World Hack: Human-Verified Weather Oracle** — a World Chain hackathon submission (deadline: Sunday March 29, 2026, 7:30 AM PT).

A Next.js 15 Mini App where World ID-verified humans report local weather conditions. AI agents query consensus-scored observations via x402 HTTP-native micropayments. The core value proposition: the delta between Open-Meteo model predictions and human ground truth.

**Required hackathon integrations**: Coinbase x402 + World ID (AgentKit or IDKit). XMTP is an optional $5K bounty.

## Development Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run build        # production build
npm run lint         # ESLint
npx tsx scripts/seed.ts       # seed SQLite with demo observations (Phase 2+)
npx tsx xmtp/agent.ts         # run XMTP agent process (Phase 5+)
```

Copy `.env.example` to `.env.local` and fill in values before running.

## Architecture

Next.js 15 App Router with three main surfaces:

1. **User-facing Mini App** (`src/app/(protected)/observe/`) — observation submission UI. Runs in World App WebView (MiniKit), Coinbase Wallet dapp browser, or regular browser (IDKit fallback).

2. **Agent-facing API** (`src/app/api/v1/weather/`) — x402-gated endpoint returning consensus-scored observations. Priced dynamically by signal strength tier: solo ($0.001), corroborated ($0.005), strong ($0.01), ground truth ($0.02).

3. **Consensus engine** (`src/lib/weather/consensus.ts`) — groups observations by H3 hex cell (~500m) + 30-min time window, computes agreement rate and signal strength tier.

### Key data flows

- **Submit observation**: User verifies World ID → GPS captured → Open-Meteo baseline fetched → observation stored in SQLite with model delta
- **Agent query**: Agent sends x402 payment → `withX402` middleware validates → consensus aggregator queries SQLite → returns scored response
- **World ID verification**: Always completes in World App; initiated via QR/deep link from other clients. `POST /api/verify-proof` validates the proof server-side.

### x402 pattern

Use `@x402/next` (NOT `x402-next`) with `withX402` wrapper on individual route handlers. Requires a server setup in `src/lib/x402/config.ts` with `x402ResourceServer`, `HTTPFacilitatorClient` from `@x402/core/server`, and `ExactEvmScheme` from `@x402/evm/exact/server`. Route configs specify `{ scheme: 'exact', price: '$0.001', network: 'eip155:84532', payTo: EVM_ADDRESS }`. See coinbase/x402 repo `examples/typescript/fullstack/next/` for the reference implementation.

### World ID pattern

- In World App: use `@worldcoin/minikit-js` — `MiniKit.commandsAsync.verify()`
- In browser/Coinbase Wallet: use `@worldcoin/idkit` — `IDKitWidget` component
- `VerifyButton.tsx` detects environment and renders appropriate flow
- Server verifies proof at `POST /api/verify-proof` using World Developer Portal app ID

## Environment Variables

See `.env.example` for the full documented template. Key vars:

```
NEXT_PUBLIC_APP_ID=app_...     # World Developer Portal app ID
EVM_ADDRESS=0x...              # USDC receiving address for x402 payments
FACILITATOR_URL=https://...    # x402 CDP facilitator URL
X402_NETWORK=eip155:84532      # base-sepolia testnet
NEXT_PUBLIC_DEV_SKIP_VERIFY=true  # bypass World ID locally (dev only)
```

## Key Dependencies

- `@worldcoin/minikit-js` + `@worldcoin/idkit` — World ID verification
- `@x402/next` + `@x402/core` + `@x402/evm` — x402 HTTP payment gating
- `@worldcoin/agentkit` — AgentKit extension for human-backed agents (install in Phase 2)
- `wagmi` + `viem` — wallet connection and chain interactions
- `better-sqlite3` — SQLite observation storage
- `h3-js` — H3 hex cell geofencing for consensus grouping
- `leaflet` + `react-leaflet` — map visualization (use dynamic import, SSR disabled)
- Open-Meteo API — free weather baseline, no API key required

## Phased Development

See `PHASES.md` for the full development roadmap with goals, integration details, and "done" criteria for each phase. Each phase is designed as an independent implementation session.
