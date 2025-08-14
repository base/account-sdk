import { createPublicClient, defineChain, http, PublicClient } from 'viem';
import { BundlerClient, createBundlerClient } from 'viem/account-abstraction';
import { base, baseSepolia } from 'viem/chains';

import { RPCResponseNativeCurrency } from ':core/message/RPCResponse.js';
import { ChainClients } from './store.js';

// Fallback RPC URLs for Base networks
const FALLBACK_RPC_URLS: Record<number, string> = {
  [base.id]: base.rpcUrls.default.http[0],
  [baseSepolia.id]: baseSepolia.rpcUrls.default.http[0],
};

export type SDKChain = {
  id: number;
  rpcUrl?: string;
  nativeCurrency?: RPCResponseNativeCurrency;
};

export function createClients(chains: SDKChain[]) {
  chains.forEach((c) => {
    // Use fallback RPC URL for Base networks if wallet hasn't provided one
    let rpcUrl = c.rpcUrl;
    if (!rpcUrl && FALLBACK_RPC_URLS[c.id]) {
      rpcUrl = FALLBACK_RPC_URLS[c.id];
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
