# Demo guide

## Recruiter path

1. Read the landing statement: “When the model says clear, ask the ground.”
2. Select **Run the field test**.
3. Step through the deterministic trace until twelve simulated observers produce rain at 91.67% agreement.
4. Add a browser-local cloudy or clear report and inspect the recalculation.
5. Open **Developers**, run the free endpoint, and compare its immutable response with the local sandbox.
6. Open **Integration Lab** to see which adapters are simulated, configured, or still `NOT RUN`.

The featured replay uses fixed IDs and timestamps. The final simulated receipt is `demo_receipt_sf-rain-v1_final`; it is deliberately not shaped like a transaction hash. `20 signal credits` is a nonredeemable scenario score.

## Reset

Use **Reset local contribution** in the replay, or remove the `groundsignal.demo.v1` browser storage key. No server fixture changes.

## Maintainer capture

With a local server running, `npm run capture:demo` refreshes the repository's
desktop, mobile, consensus, and developer-console screenshots plus a short,
credential-free WebM replay. The script uses only the deterministic demo.

Before a release, review the generated artifacts for visual regressions. A
longer narrated release recording remains an owner-operated artifact gate.
