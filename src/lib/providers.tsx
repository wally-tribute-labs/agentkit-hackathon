'use client';

// Phase 1: Client providers wrapper
// - MiniKitProvider (@worldcoin/minikit-js)
// - WagmiProvider with worldApp + coinbaseWallet connectors
// - QueryClientProvider (@tanstack/react-query)

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
