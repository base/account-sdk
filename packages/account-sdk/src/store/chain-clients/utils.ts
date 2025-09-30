import { Chain, createPublicClient, defineChain, http, PublicClient } from 'viem';
import { BundlerClient, createBundlerClient } from 'viem/account-abstraction';
import * as viemChains from 'viem/chains';

import { RPCResponseNativeCurrency } from ':core/message/RPCResponse.js';
import { ChainClients } from './store.js';

export type SDKChain = {
  id: number;
  rpcUrl?: string;
  nativeCurrency?: RPCResponseNativeCurrency;
};

const VIEM_CHAINS_BY_ID: Map<number, Chain> = Object.values(viemChains).reduce((acc, chain) => {
  if (
    typeof chain === 'object' &&
    chain !== null &&
    'id' in chain &&
    typeof chain.id === 'number'
  ) {
    acc.set(chain.id, chain as Chain);
  }
  return acc;
}, new Map<number, Chain>());

// Get fallback chain data from viem's built-in chains
function getViemChainById(chainId: number): Chain | undefined {
  return VIEM_CHAINS_BY_ID.get(chainId);
}

// Get fallback RPC URL from viem's chain definitions
function getFallbackRpcUrl(chainId: number): string | undefined {
  const viemChain = getViemChainById(chainId);
  if (viemChain?.rpcUrls?.default?.http?.[0]) {
    return viemChain.rpcUrls.default.http[0];
  }
  return undefined;
}

function defineChainConfig(
  chainId: number,
  rpcUrl: string,
  options?: {
    viemChain?: Chain;
    nativeCurrency?: RPCResponseNativeCurrency;
  }
): Chain {
  const viemChain = options?.viemChain;
  const nativeCurrency = options?.nativeCurrency;

  const name = nativeCurrency?.name ?? viemChain?.name ?? '';
  const symbol = nativeCurrency?.symbol ?? viemChain?.nativeCurrency?.symbol ?? '';
  const decimals = nativeCurrency?.decimal ?? viemChain?.nativeCurrency?.decimals ?? 18;

  return defineChain({
    id: chainId,
    name,
    nativeCurrency: {
      name,
      symbol,
      decimals,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
  });
}

export function createClients(chains: SDKChain[]) {
  chains.forEach((c) => {
    // Use fallback RPC URL from viem if wallet hasn't provided one
    let rpcUrl = c.rpcUrl;
    if (!rpcUrl) {
      rpcUrl = getFallbackRpcUrl(c.id);
    }

    // Skip if still no RPC URL available
    if (!rpcUrl) {
      return;
    }

    const viemChain = getViemChainById(c.id);
    const clients = createClientPair({
      chainId: c.id,
      rpcUrl,
      nativeCurrency: c.nativeCurrency,
      viemChain,
    });

    storeClientPair(c.id, clients);
  });
}

type ClientPair = {
  client: PublicClient;
  bundlerClient: BundlerClient;
};

function createClientPair(options: {
  chainId: number;
  rpcUrl: string;
  nativeCurrency?: RPCResponseNativeCurrency;
  viemChain?: Chain;
}): ClientPair {
  const { chainId, rpcUrl, nativeCurrency, viemChain } = options;
  const chain = defineChainConfig(chainId, rpcUrl, {
    viemChain,
    nativeCurrency,
  });

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const bundlerClient = createBundlerClient({
    client,
    transport: http(rpcUrl),
  });

  return { client, bundlerClient };
}

function createFallbackClientPair(chainId: number): ClientPair | undefined {
  const rpcUrl = getFallbackRpcUrl(chainId);
  const viemChain = getViemChainById(chainId);

  if (!rpcUrl) {
    return undefined;
  }

  return createClientPair({
    chainId,
    rpcUrl,
    viemChain,
  });
}

function storeClientPair(chainId: number, pair: ClientPair) {
  ChainClients.setState((state) => ({
    ...state,
    [chainId]: {
      client: pair.client,
      bundlerClient: pair.bundlerClient,
    },
  }));
}

export function getClient(chainId: number): PublicClient | undefined {
  // First check if client exists in storage
  const storedClient = ChainClients.getState()[chainId]?.client;
  if (storedClient) {
    return storedClient;
  }

  // If not in storage, try to create a fallback client
  const fallbackPair = createFallbackClientPair(chainId);

  // If we successfully created fallback clients, store them for future use
  if (fallbackPair) {
    storeClientPair(chainId, fallbackPair);
    return fallbackPair.client;
  }

  return undefined;
}

export function getBundlerClient(chainId: number): BundlerClient | undefined {
  // First check if bundler client exists in storage
  const storedBundlerClient = ChainClients.getState()[chainId]?.bundlerClient;
  if (storedBundlerClient) {
    return storedBundlerClient;
  }

  // If not in storage, try to create a fallback bundler client
  const fallbackPair = createFallbackClientPair(chainId);

  // If we successfully created fallback clients, store them for future use
  if (fallbackPair) {
    storeClientPair(chainId, fallbackPair);
    return fallbackPair.bundlerClient;
  }

  return undefined;
}
