import type { Address } from 'viem';

/**
 * Chain IDs for supported networks (Base only)
 */
export const CHAIN_IDS = {
  base: 8453,
  baseSepolia: 84532,
} as const;

/**
 * Token configuration for USDC-only payment APIs (e.g., pay()).
 * For other stables or arbitrary tokens, use payWithToken.
 */
export const TOKENS = {
  USDC: {
    decimals: 6,
    addresses: {
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
  },
} as const;

/**
 * Canonical placeholder used by wallet providers to represent native ETH
 */
export const ETH_PLACEHOLDER_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as const;

/**
 * Registry of whitelisted stablecoins that can be referenced by symbol
 * when calling token-aware payment APIs (Base and Base Sepolia only).
 */
export const STABLECOIN_WHITELIST = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.base]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      [CHAIN_IDS.baseSepolia]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    } satisfies Partial<Record<number, Address>>,
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.base]: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    } satisfies Partial<Record<number, Address>>,
  },
  DAI: {
    symbol: 'DAI',
    decimals: 18,
    addresses: {
      [CHAIN_IDS.base]: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    } satisfies Partial<Record<number, Address>>,
  },
  EURC: {
    symbol: 'EURC',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.base]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    } satisfies Partial<Record<number, Address>>,
  },
} as const;

type StablecoinKey = keyof typeof STABLECOIN_WHITELIST;

/**
 * Lookup map from token address to stablecoin metadata.
 */
export const STABLECOIN_ADDRESS_LOOKUP = Object.entries(STABLECOIN_WHITELIST).reduce<
  Record<
    string,
    {
      symbol: StablecoinKey;
      decimals: number;
      chainId: number;
    }
  >
>((acc, [symbol, config]) => {
  for (const [chainId, address] of Object.entries(config.addresses)) {
    if (!address) {
      continue;
    }
    acc[address.toLowerCase()] = {
      symbol: symbol as StablecoinKey,
      decimals: config.decimals,
      chainId: Number(chainId),
    };
  }
  return acc;
}, {});

/**
 * ERC20 transfer function ABI
 */
export const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'Transfer',
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const;
