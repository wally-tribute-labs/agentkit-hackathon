import { NextResponse } from 'next/server';

// GET /api/v1/weather?lat={lat}&lon={lon}&radius={meters}
// x402-gated endpoint returning consensus-scored weather observations.
// Payment is required via x402 (USDC on base-sepolia).
// Dynamic pricing by signal strength tier.
// Implemented in Phase 2.
export async function GET() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}
