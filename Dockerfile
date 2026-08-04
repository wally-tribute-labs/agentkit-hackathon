FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV GROUNDSIGNAL_MODE=demo
RUN npm run build
RUN npx --no-install esbuild scripts/db-migrate.ts scripts/db-seed.ts \
  --bundle --platform=node --format=cjs --packages=external \
  --outdir=.next/standalone

FROM base AS runner
ENV NODE_ENV=production
ENV GROUNDSIGNAL_MODE=demo
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts/container-start.mjs ./container-start.mjs
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "container-start.mjs"]
