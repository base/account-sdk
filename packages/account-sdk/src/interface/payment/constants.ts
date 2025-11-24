import type { Address } from 'viem';

/**
 * Chain IDs for supported networks
 */
export const CHAIN_IDS = {
  base: 8453,
  baseSepolia: 84532,
  ethereum: 1,
  sepolia: 11155111,
  optimism: 10,
  optimismSepolia: 11155420,
  arbitrum: 42161,
  polygon: 137,
  'avalanche-c-chain': 43114,
  avalanche: 43114,
  baseMainnet: 8453, // alias
  zora: 7777777,
  BSC: 56,
  bsc: 56,
} as const;

/**
 * Token configuration for legacy USDC-only payment APIs
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
 * when calling token-aware payment APIs.
 *
 * NOTE: Not every token is available on every supported chain. Any missing
 * addresses will force callers to provide an explicit token contract address.
 */
export const STABLECOIN_WHITELIST = {
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.ethereum]: '0xA0b86991c6218b36c1d19D4a2e9eb0ce3606eb48',
      [CHAIN_IDS.optimism]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      [CHAIN_IDS.optimismSepolia]: '0x5fd84259d66cD46123540766Be93DfE6d43130d7',
      [CHAIN_IDS.arbitrum]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      [CHAIN_IDS.polygon]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      [CHAIN_IDS['avalanche-c-chain']]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      [CHAIN_IDS.base]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      [CHAIN_IDS.baseSepolia]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      [CHAIN_IDS.BSC]: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    } satisfies Partial<Record<number, Address>>,
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.ethereum]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      [CHAIN_IDS.optimism]: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
      [CHAIN_IDS.arbitrum]: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      [CHAIN_IDS.polygon]: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      [CHAIN_IDS['avalanche-c-chain']]: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
      [CHAIN_IDS.base]: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
      [CHAIN_IDS.BSC]: '0x55d398326f99059fF775485246999027B3197955',
    } satisfies Partial<Record<number, Address>>,
  },
  DAI: {
    symbol: 'DAI',
    decimals: 18,
    addresses: {
      [CHAIN_IDS.ethereum]: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      [CHAIN_IDS.optimism]: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      [CHAIN_IDS.arbitrum]: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
      [CHAIN_IDS.polygon]: '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063',
      [CHAIN_IDS['avalanche-c-chain']]: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      [CHAIN_IDS.base]: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      [CHAIN_IDS.BSC]: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
    } satisfies Partial<Record<number, Address>>,
  },
  EURC: {
    symbol: 'EURC',
    decimals: 6,
    addresses: {
      [CHAIN_IDS.ethereum]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      [CHAIN_IDS.optimism]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      [CHAIN_IDS.arbitrum]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      [CHAIN_IDS.polygon]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      [CHAIN_IDS['avalanche-c-chain']]: '0xC891EB4cbdEFf6e178eE3d4314284F79b81Bd4C7',
      [CHAIN_IDS.base]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
      [CHAIN_IDS.BSC]: '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
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
