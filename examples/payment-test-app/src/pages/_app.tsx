import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'viem/chains';

// Use Base Sepolia for testing
const chain = baseSepolia;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <OnchainKitProvider
      chain={chain}
      config={{
        appearance: {
          mode: 'light',
          theme: 'base',
        },
      }}
    >
      <Component {...pageProps} />
    </OnchainKitProvider>
  );
}
