# Contributing to GroundSignal

GroundSignal is intentionally narrow: weather is the only v1 adapter, and the default experience must remain usable without credentials or paid services.

1. Fork the repository and create a focused branch.
2. Install Node 22 dependencies with `npm ci`.
3. Add tests for changes to consensus, privacy boundaries, API contracts, or integrations.
4. Run `npm run check` and the relevant Playwright tests.
5. Open a pull request describing the user-visible result, evidence, and any `NOT RUN` external gate.

Do not commit credentials, real World ID proof payloads, private keys, precise user locations, SQLite files, or screenshots containing secrets. Do not describe mocks as verified integrations.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
