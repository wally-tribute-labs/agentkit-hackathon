'use client';

import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

const ACTION = 'submit-observation';

export function VerifyButton() {
  const router = useRouter();
  const { setVerified } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev bypass — skip World ID for local testing
  if (process.env.NEXT_PUBLIC_DEV_SKIP_VERIFY === 'true') {
    return (
      <button
        onClick={() => {
          setVerified('dev_nullifier_' + Date.now());
          router.push('/observe');
        }}
        className="w-full py-3 px-6 bg-yellow-400 text-black font-semibold rounded-xl text-lg"
      >
        Dev: Skip Verify
      </button>
    );
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      if (MiniKit.isInstalled()) {
        // World App path
        const { finalPayload } = await MiniKit.commandsAsync.verify({
          action: ACTION,
          verification_level: VerificationLevel.Orb,
        });

        if (finalPayload.status === 'error') {
          setError('Verification failed. Please try again.');
          return;
        }

        const res = await fetch('/api/verify-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...finalPayload, action: ACTION }),
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error ?? 'Verification failed.');
          return;
        }

        setVerified(data.nullifier_hash);
        router.push('/observe');
      } else {
        // Non-World App browser: show instructions
        setError('Please open this app in World App to verify your identity.');
      }
    } catch (e) {
      setError('Something went wrong. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleVerify}
        disabled={loading}
        className="w-full py-3 px-6 bg-black text-white font-semibold rounded-xl text-lg disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify with World ID'}
      </button>
      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
