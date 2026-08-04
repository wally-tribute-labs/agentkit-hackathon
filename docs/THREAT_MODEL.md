# Threat model

## Assets

- Observer unlinkability and approximate location privacy.
- One-observer-one-vote consensus integrity.
- World ID RP signing key, x402 buyer/seller keys, and XMTP credentials.
- Correct payment challenge and post-success settlement behavior.
- Deterministic public-demo truthfulness.

## Trust boundaries

The browser is untrusted. Submitted H3 cells, timestamps, model data, prices, tiers, identity values, and proof outcomes are ignored; the server derives them. World ID and x402 facilitators are external trust boundaries. SQLite is trusted only within a single-instance self-host.

## Primary threats and controls

| Threat | Control | Residual risk |
| --- | --- | --- |
| Duplicate observer votes | signed session, server-derived observer ID, unique database index, defensive engine dedupe | World ID does not prove physical presence |
| Precise location disclosure | coordinates used transiently; only H3 and optional accuracy band persist; no body logging | network providers may observe requests |
| Proof replay | short HTTP-only signed session; World verifier; action-scoped nullifier; AgentKit nonce store | live behavior remains owner-gated until tested |
| Client-forged consensus or price | Zod validation and server calculation | compromised server can still lie |
| Charging for failed work | `withX402` post-success settlement path | facilitator outage can prevent service |
| Secret leakage | server-only variables; no public prefixes; redacted evidence policy | operator configuration error |
| Demo mistaken for production | prominent `SIMULATED` labels, non-currency credits, non-chain receipt IDs, Integration Lab states | screenshots can omit context |
| SQLite corruption or contention | WAL, explicit migration, one writable instance requirement | no multi-region/high-availability guarantee |

## Explicitly out of scope

Production geolocation fraud prevention, sensor attestation, mainnet payments, contributor balances, multi-instance SQLite, and protection from a malicious self-host operator are not v1 guarantees.
