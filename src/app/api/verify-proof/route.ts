import { apiError } from "@/server/errors";

export function POST() {
  return apiError(410, "ENDPOINT_REPLACED", "Use POST /api/verify/world-id with an IDKit 4 result.");
}
