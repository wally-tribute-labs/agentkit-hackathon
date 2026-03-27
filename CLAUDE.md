# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**World Hack: Human-Verified Weather Oracle** — a World Chain hackathon submission (deadline: Sunday March 29, 2026, 7:30 AM PT).

A Next.js 15 Mini App where World ID-verified humans report local weather conditions. AI agents query consensus-scored observations via x402 HTTP-native micropayments. The core value proposition: the delta between Open-Meteo model predictions and human ground truth.

**Required hackathon integrations**: Coinbase x402 + World ID (AgentKit or IDKit). XMTP is an optional $5K bounty.

## Development Commands

This project does not exist yet — it needs to be scaffolded. Use the file structure in `project.md` as the blueprint. Expected commands once scaffolded:

```bash
npx create-next-app@latest world-hack --typescript --tailwind --app
cd world-hack
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
```

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

Use `x402-next` middleware with `withX402` wrapper on the agent API route. Route configs live in `src/lib/x402/config.ts`. Payment address configured via `X402_PAY_TO` env var. Use base-sepolia for hackathon, base mainnet for production.

### World ID pattern

- In World App: use `@worldcoin/minikit-js` — `MiniKit.commandsAsync.verify()`
- In browser/Coinbase Wallet: use `@worldcoin/idkit` — `IDKitWidget` component
- `VerifyButton.tsx` detects environment and renders appropriate flow
- Server verifies proof at `POST /api/verify-proof` using World Developer Portal app ID

## Environment Variables

```
NEXT_PUBLIC_APP_ID=app_...          # World Developer Portal app ID
AUTH_SECRET=...                     # NextAuth secret
HMAC_SECRET_KEY=...                 # Wallet nonce HMAC
AUTH_URL=https://...                # Public URL
X402_PAY_TO=0x...                   # USDC receiving address
X402_NETWORK=base-sepolia           # base-sepolia for hackathon
```

## Key Dependencies

- `@worldcoin/minikit-js` + `@worldcoin/idkit` — World ID verification
- `x402-next` + `viem` — HTTP-native micropayment gating
- `wagmi` — wallet connection (worldApp + coinbaseWallet connectors)
- `better-sqlite3` — observation storage (SQLite, sufficient for hackathon)
- Open-Meteo API — free weather baseline, no API key required
- `h3-js` — H3 hex cell geofencing for consensus grouping

## Hackathon Scope

Phase 1 (submission): core observation flow, World ID, x402 API, consensus aggregation, map visualization, testnet payments, SQLite storage. Seed with mock observations for demo density.

Phase 2 (post-hackathon): Postgres/Drizzle, push notifications, photo AI processing, native app (barometer access), mainnet payments.
