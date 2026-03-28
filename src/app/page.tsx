'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { VerifyButton } from '@/components/VerifyButton';
import { HeroScenario } from '@/components/HeroScenario';
import { SignalBadge } from '@/components/SignalBadge';
import { SIGNAL_PRICES } from '@/types/weather';
import type { SignalStrength } from '@/types/weather';

export default function HomePage() {
  const router = useRouter();
  const { verified } = useAuth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-4">🌦️</div>
          <h1 className="text-3xl font-bold tracking-tight">Weather Oracle</h1>
          <p className="mt-2 text-gray-500 text-base">
            Human-verified weather, paid by AI agents
          </p>
        </div>

        {/* Hero scenario: model vs humans */}
        <HeroScenario />

        {/* How it works */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-lg">1️⃣</span>
            <span><strong>Verify</strong> your personhood with World ID — one human, one account.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">2️⃣</span>
            <span><strong>Report</strong> what the weather is actually like outside right now.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg">3️⃣</span>
            <span><strong>Earn</strong> when AI agents pay micropayments for your consensus data.</span>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full">
          {verified ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/observe')}
                className="w-full py-3 px-6 bg-black text-white font-semibold rounded-xl text-lg"
              >
                Submit Observation →
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl text-base border border-gray-200"
              >
                View Dashboard
              </button>
            </div>
          ) : (
            <VerifyButton />
          )}
        </div>

        {/* For AI Agents */}
        <div className="w-full border-t border-gray-100 pt-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            For AI Agents
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Query consensus-scored weather via x402 micropayments.
            Priced by signal strength:
          </p>
          <div className="flex flex-col gap-2">
            {(Object.entries(SIGNAL_PRICES) as [SignalStrength, string][]).map(([tier, price]) => (
              <div key={tier} className="flex items-center justify-between text-sm">
                <SignalBadge signal={tier} />
                <span className="text-gray-500 font-mono text-xs">{price} USDC / query</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 font-mono break-all">
            GET /api/v1/weather?lat=&#123;lat&#125;&amp;lon=&#123;lon&#125;
          </p>
        </div>
      </div>
    </main>
  );
}
