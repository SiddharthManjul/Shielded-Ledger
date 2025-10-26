'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './config';
import { ReactNode, useMemo } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Use useMemo to ensure QueryClient is only created once
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Prevents unnecessary refetches
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
