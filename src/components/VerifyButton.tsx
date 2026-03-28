'use client';

import { motion } from 'framer-motion';
import { Globe, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { spring, buttonTap, buttonHover } from '@/lib/motion';

const ACTION = 'submit-observation';

export function VerifyButton() {
  const router = useRouter();
  const { setVerified } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dev bypass
  if (process.env.NEXT_PUBLIC_DEV_SKIP_VERIFY === 'true') {
    return (
      <motion.button
        onClick={() => { setVerified('dev_nullifier_' + Date.now()); router.push('/observe'); }}
        className="w-full py-3.5 px-6 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2"
        style={{
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: 'var(--amber-light)',
          fontFamily: 'var(--font-display)',
        }}
        whileHover={{ scale: buttonHover.scale, boxShadow: 'var(--shadow-glow-amber)' }}
        whileTap={{ scale: buttonTap.scale }}
        transition={spring}
      >
        <Zap size={16} strokeWidth={2} />
        Dev: Skip Verify
      </motion.button>
    );
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      if (MiniKit.isInstalled()) {
        const { finalPayload } = await MiniKit.commandsAsync.verify({
          action: ACTION,
          verification_level: VerificationLevel.Orb,
        });
        if (finalPayload.status === 'error') { setError('Verification failed. Please try again.'); return; }

        const res  = await fetch('/api/verify-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...finalPayload, action: ACTION }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error ?? 'Verification failed.'); return; }

        setVerified(data.nullifier_hash);
        router.push('/observe');
      } else {
        setError('Please open this app in World App to verify your identity.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={handleVerify}
        disabled={loading}
        className="w-full py-3.5 px-6 font-bold rounded-2xl text-base text-white flex items-center justify-center gap-2.5 disabled:opacity-50"
        style={{
          background: loading
            ? 'rgba(6,182,212,0.25)'
            : 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
          boxShadow: loading ? 'none' : 'var(--shadow-glow-cyan)',
          fontFamily: 'var(--font-display)',
        }}
        whileHover={!loading ? { scale: buttonHover.scale, boxShadow: '0 0 40px rgba(6,182,212,0.5)' } : {}}
        whileTap={!loading ? { scale: buttonTap.scale } : {}}
        transition={spring}
      >
        {loading
          ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Loader2 size={18} strokeWidth={2} /></motion.span> Verifying...</>
          : <><Globe size={18} strokeWidth={1.5} /> Verify with World ID</>
        }
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-center px-4 py-2.5 rounded-xl w-full flex items-center justify-center gap-2"
          style={{ background: 'var(--error-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--error)' }}
        >
          <AlertCircle size={14} strokeWidth={2} />
          {error}
        </motion.p>
      )}
    </div>
  );
}
