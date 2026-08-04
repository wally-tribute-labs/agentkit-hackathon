# Self-hosting

GroundSignal supports one writable Node.js instance with SQLite. It does not support stateless/serverless SQLite, multiple replicas, or network filesystems.

## Local Node process

```bash
npm ci
cp .env.example .env.local
# Set GROUNDSIGNAL_MODE=sqlite and a strong OBSERVER_SESSION_SECRET.
npm run db:migrate
npm run db:seed      # optional deterministic development reports
npm run build
npm run start
```

The default database path is `./data/groundsignal.db`. Migrations create only `gs_*` tables. Legacy prototype tables named `observations` and `cell_revenue`, if present, are intentionally left untouched and ignored.

Back up the database by stopping writes and copying the database plus any WAL files, or by using SQLite's online backup command. Test restore procedures before relying on the data.

## Docker

```bash
docker build -t groundsignal .
docker run --rm -p 3000:3000 -e GROUNDSIGNAL_MODE=demo groundsignal
```

SQLite containers require a persistent volume and a migrated database prepared before application startup. Do not point multiple containers at the same SQLite volume.

```bash
docker volume create groundsignal-data

# Initialize volume ownership for the non-root application user.
docker run --rm --user root \
  -v groundsignal-data:/app/data \
  groundsignal chown -R nextjs:nodejs /app/data

# Explicit, idempotent migration. This command exits after migrating.
docker run --rm \
  -v groundsignal-data:/app/data \
  -e GROUNDSIGNAL_DB_PATH=/app/data/groundsignal.db \
  groundsignal node db-migrate.js

# Optional deterministic seed.
docker run --rm \
  -v groundsignal-data:/app/data \
  -e GROUNDSIGNAL_DB_PATH=/app/data/groundsignal.db \
  groundsignal node db-seed.js

# One writable application instance.
docker run --rm -p 3000:3000 \
  -v groundsignal-data:/app/data \
  -e GROUNDSIGNAL_MODE=sqlite \
  -e GROUNDSIGNAL_DB_PATH=/app/data/groundsignal.db \
  -e OBSERVER_SESSION_SECRET=replace-with-a-long-random-secret \
  groundsignal
```

The container entrypoint checks for a migrated database and fails before the
server starts when SQLite setup is incomplete. It never creates schema
implicitly.

## Optional integrations

Copy only the variables you need from `.env.example`. Base Sepolia is the only supported x402 network. Do not use mainnet keys or funds. Run the XMTP listener as a separate process with `npm run xmtp`; it is not compatible with Vercel functions.
