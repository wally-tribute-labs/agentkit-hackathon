'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { MiniKitProvider } from '@worldcoin/minikit-js/minikit-provider';
import { useState } from 'react';
import { AuthProvider } from './auth-context';

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Weather Oracle' }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <MiniKitProvider props={{ appId: process.env.NEXT_PUBLIC_APP_ID ?? '' }}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MiniKitProvider>
  );
}
