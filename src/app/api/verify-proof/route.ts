import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof } from '@worldcoin/minikit-js';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { proof, merkle_root, nullifier_hash, verification_level, action } = body;

  // Dev bypass
  if (process.env.NEXT_PUBLIC_DEV_SKIP_VERIFY === 'true') {
    return NextResponse.json({ success: true, nullifier_hash: nullifier_hash ?? 'dev_bypass' });
  }

  const appId = process.env.NEXT_PUBLIC_APP_ID;
  if (!appId) {
    return NextResponse.json({ success: false, error: 'App ID not configured' }, { status: 500 });
  }

  try {
    const result = await verifyCloudProof(
      { proof, merkle_root, nullifier_hash, verification_level },
      appId as `app_${string}`,
      action ?? 'submit-observation',
    );

    if (result.success) {
      return NextResponse.json({ success: true, nullifier_hash });
    } else {
      return NextResponse.json({ success: false, error: result.detail ?? 'Verification failed' }, { status: 400 });
    }
  } catch (e) {
    console.error('verify-proof error:', e);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
