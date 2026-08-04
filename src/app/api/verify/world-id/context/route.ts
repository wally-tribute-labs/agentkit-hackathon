import { apiError } from "@/server/errors";

const ACTION = "groundsignal-observation";

export async function GET() {
  const appId = process.env.WORLD_ID_APP_ID;
  const rpId = process.env.WORLD_ID_RP_ID;
  const signingKey = process.env.WORLD_ID_RP_SIGNING_KEY;
  if (!appId || !rpId || !signingKey) {
    return apiError(503, "INTEGRATION_DISABLED", "World ID is not configured for this environment.");
  }
  const { signRequest } = await import("@worldcoin/idkit/signing");
  const signed = signRequest({ action: ACTION, signingKeyHex: signingKey });
  return Response.json({
    app_id: appId,
    action: ACTION,
    rp_context: {
      rp_id: rpId,
      nonce: signed.nonce,
      created_at: signed.createdAt,
      expires_at: signed.expiresAt,
      signature: signed.sig,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
