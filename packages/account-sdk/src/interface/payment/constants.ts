/**
 * Token configuration for supported payment tokens
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
 * Chain IDs for supported networks
 */
export const CHAIN_IDS = {
  base: 8453,
  baseSepolia: 84532,
} as const;

/**
 * Wallet RPC base URL
 */
export const WALLET_RPC_URL = 'https://api.wallet.coinbase.com/rpc';

/**
 * API version
 */
export const VERSION = 'v2';

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
] as const;

/**
 * Checks if a string is a valid ENS name
 * @param name - The string to check
 * @returns True if the string appears to be an ENS name
 */
export function isENSName(name: string): boolean {
  // Must have content and contain a dot
  if (!name || !name.includes('.')) {
    return false;
  }
  
  // Check if it ends with a valid ENS domain and has content before the domain
  const validDomains = ['.eth', '.xyz', '.base', '.cb.id'];
  return validDomains.some(domain => {
    return name.endsWith(domain) && name.length > domain.length;
  });
}
