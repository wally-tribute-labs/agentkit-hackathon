import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const OBSERVER_COOKIE = "groundsignal_observer";
const SESSION_TTL_SECONDS = 30 * 60;

interface SessionPayload {
  observerId: string;
  expiresAt: number;
}

function secret(): string {
  const value = process.env.OBSERVER_SESSION_SECRET;
  const sqliteMode = process.env.GROUNDSIGNAL_MODE === "sqlite";
  if (!value && (process.env.NODE_ENV === "production" || sqliteMode)) {
    throw new Error("OBSERVER_SESSION_SECRET is required for World ID sessions in SQLite or production mode.");
  }
  return value ?? "groundsignal-development-session-secret-only";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createObserverSession(observerId: string): string {
  const payload: SessionPayload = {
    observerId,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readObserverSession(value: string | undefined): SessionPayload | null {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.observerId || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const observerCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
