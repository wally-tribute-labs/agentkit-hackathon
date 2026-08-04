import "server-only";
import { z } from "zod";

const modeSchema = z.enum(["demo", "sqlite"]);

export type GroundSignalMode = z.infer<typeof modeSchema>;

export function getRuntimeMode(): GroundSignalMode {
  const parsed = modeSchema.safeParse(process.env.GROUNDSIGNAL_MODE ?? "demo");
  if (!parsed.success) {
    throw new Error("Invalid GROUNDSIGNAL_MODE. Expected 'demo' or 'sqlite'.");
  }
  return parsed.data;
}

export function getDatabasePath(): string {
  return process.env.GROUNDSIGNAL_DB_PATH ?? "./data/groundsignal.db";
}

export interface IntegrationAvailability {
  worldId: boolean;
  x402: boolean;
  agentKit: boolean;
  xmtp: boolean;
}

export function getIntegrationAvailability(): IntegrationAvailability {
  const x402 = Boolean(
    process.env.X402_FACILITATOR_URL && process.env.X402_PAY_TO && process.env.X402_NETWORK,
  );
  return {
    worldId: Boolean(
      process.env.WORLD_ID_APP_ID
      && process.env.WORLD_ID_RP_ID
      && process.env.WORLD_ID_RP_SIGNING_KEY
      && process.env.OBSERVER_SESSION_SECRET,
    ),
    x402,
    agentKit: getRuntimeMode() === "sqlite" && x402 && Boolean(
      process.env.AGENTKIT_ENABLED === "true" && process.env.WORLD_CHAIN_RPC_URL,
    ),
    xmtp: Boolean(process.env.XMTP_WALLET_KEY && process.env.XMTP_DB_ENCRYPTION_KEY),
  };
}
