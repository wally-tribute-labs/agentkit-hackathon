import { NextResponse } from 'next/server';

// POST /api/observations
// Submits a new weather observation from a verified human.
// Implemented in Phase 1.
export async function POST() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}

// GET /api/observations
// Returns observations for the authenticated user (for dashboard).
// Implemented in Phase 3.
export async function GET() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}
