import "server-only";
import { randomUUID } from "node:crypto";
import type { ApiErrorEnvelope } from "@/core/types";

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Response {
  const body: ApiErrorEnvelope = {
    error: { code, message, ...(details ? { details } : {}) },
    requestId: randomUUID(),
  };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function parseJson(request: Request): Promise<unknown | Response> {
  try {
    return await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
}
