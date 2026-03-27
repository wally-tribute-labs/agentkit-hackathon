import { NextResponse } from 'next/server';

// POST /api/verify-proof
// Verifies a World ID proof (MiniKit or IDKit) server-side.
// Implemented in Phase 1.
export async function POST() {
  return NextResponse.json({ status: 'not_implemented' }, { status: 501 });
}
