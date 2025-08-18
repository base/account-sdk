import { createPublicClient, defineChain, http, PublicClient } from 'viem';
import { BundlerClient, createBundlerClient } from 'viem/account-abstraction';
import { base, baseSepolia } from 'viem/chains';

import { RPCResponseNativeCurrency } from ':core/message/RPCResponse.js';
import { ChainClients } from './store.js';

export type SDKChain = {
  id: number;
  rpcUrl?: string;
  nativeCurrency?: RPCResponseNativeCurrency;
};

// Fallback chains using viem's chain definitions directly
export const FALLBACK_CHAINS: SDKChain[] = [
  {
    id: base.id,
    rpcUrl: base.rpcUrls.default.http[0],
    nativeCurrency: {
      name: base.nativeCurrency.name,
      symbol: base.nativeCurrency.symbol,
      decimal: base.nativeCurrency.decimals,
    },
  },
  {
    id: baseSepolia.id,
    rpcUrl: baseSepolia.rpcUrls.default.http[0],
    nativeCurrency: {
      name: baseSepolia.nativeCurrency.name,
      symbol: baseSepolia.nativeCurrency.symbol,
      decimal: baseSepolia.nativeCurrency.decimals,
    },
  },
];

export function createClients(chains: SDKChain[]) {
  chains.forEach((c) => {
    // Use fallback RPC URL for Base networks if wallet hasn't provided one
    let rpcUrl = c.rpcUrl;
    if (!rpcUrl) {
      const fallbackChain = FALLBACK_CHAINS.find((fc) => fc.id === c.id);
      if (fallbackChain) {
        rpcUrl = fallbackChain.rpcUrl;
      }
    }

    // Skip if still no RPC URL available
    if (!rpcUrl) {
      return;
    }

    const viemchain = defineChain({
      id: c.id,
      rpcUrls: {
        default: {
          http: [rpcUrl],
        },
      },
      name: c.nativeCurrency?.name ?? '',
      nativeCurrency: {
        name: c.nativeCurrency?.name ?? '',
        symbol: c.nativeCurrency?.symbol ?? '',
        decimals: c.nativeCurrency?.decimal ?? 18,
      },
    });

    const client = createPublicClient({
      chain: viemchain,
      transport: http(rpcUrl),
    });
    const bundlerClient = createBundlerClient({
      client,
      transport: http(rpcUrl),
    });

    ChainClients.setState((state) => ({
      ...state,
      [c.id]: {
        client,
        bundlerClient,
      },
    }));
  });
}

export function getClient(chainId: number): PublicClient | undefined {
  return ChainClients.getState()[chainId]?.client;
}

export function getBundlerClient(chainId: number): BundlerClient | undefined {
  return ChainClients.getState()[chainId]?.bundlerClient;
}
