import { NextResponse } from 'next/server';

// GET /api/v1/openapi
// Returns the OpenAPI 3.0 spec for the agent-facing weather API.
// Implemented in Phase 2.
export async function GET() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}
