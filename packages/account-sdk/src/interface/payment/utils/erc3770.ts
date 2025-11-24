import { CHAIN_IDS } from '../constants.js';

/**
 * Mapping of chain IDs to ERC-3770 short names
 * Short names are from https://github.com/ethereum-lists/chains
 */
const CHAIN_SHORT_NAMES: Record<number, string> = {
  [CHAIN_IDS.ethereum]: 'eth',
  [CHAIN_IDS.sepolia]: 'sep',
  [CHAIN_IDS.base]: 'base',
  [CHAIN_IDS.baseSepolia]: 'base-sepolia',
  [CHAIN_IDS.optimism]: 'oeth',
  [CHAIN_IDS.optimismSepolia]: 'oeth-sepolia',
  [CHAIN_IDS.arbitrum]: 'arb1',
  [CHAIN_IDS.polygon]: 'matic',
  [CHAIN_IDS.avalanche]: 'avax',
  [CHAIN_IDS.BSC]: 'bnb',
  [CHAIN_IDS.zora]: 'zora',
} as const;

type HexString = `0x${string}`;

export type ChainShortName = (typeof CHAIN_SHORT_NAMES)[keyof typeof CHAIN_SHORT_NAMES];
export type ERC3770PaymentId = `${ChainShortName}:${HexString}`;

/**
 * Mapping of chain IDs to bundler URLs
 * Format: https://api.developer.coinbase.com/rpc/v1/{chain-name}/{api-key}
 */
const BUNDLER_URLS: Record<number, string> = {
  [CHAIN_IDS.base]: 'https://api.developer.coinbase.com/rpc/v1/base/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
  [CHAIN_IDS.baseSepolia]: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
  // Add more chains as bundler URLs become available
} as const;

/**
 * Get the ERC-3770 short name for a given chain ID
 * @param chainId - The chain ID
 * @returns The short name, or null if not found
 */
export function getChainShortName(chainId: number): string | null {
  return CHAIN_SHORT_NAMES[chainId] ?? null;
}

/**
 * Get the bundler URL for a given chain ID
 * @param chainId - The chain ID
 * @returns The bundler URL, or null if not available
 */
export function getBundlerUrl(chainId: number): string | null {
  return BUNDLER_URLS[chainId] ?? null;
}

/**
 * Get the chain ID from an ERC-3770 short name
 * @param shortName - The ERC-3770 short name
 * @returns The chain ID, or null if not found
 */
export function getChainIdFromShortName(shortName: string): number | null {
  const entry = Object.entries(CHAIN_SHORT_NAMES).find(
    ([, name]) => name === shortName.toLowerCase()
  );
  return entry ? Number.parseInt(entry[0], 10) : null;
}

/**
 * Decoded payment ID result
 */
export interface DecodedPaymentId {
  chainId: number;
  transactionHash: HexString;
}

/**
 * Decode an ERC-3770 encoded payment ID
 * @param id - The payment ID (either ERC-3770 encoded or legacy format)
 * @returns Decoded result with chainId and transactionHash, or null if legacy format
 * @throws Error if the format is invalid
 */
export function decodePaymentId(id: string): DecodedPaymentId | null {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid payment ID: must be a non-empty string');
  }

  // Check if it's ERC-3770 format (contains colon)
  const colonIndex = id.indexOf(':');
  if (colonIndex === -1) {
    // Legacy format - no chain ID encoded
    return null;
  }

  // Extract short name and transaction hash
  const shortName = id.slice(0, colonIndex);
  const transactionHash = id.slice(colonIndex + 1) as HexString;

  // Validate short name
  if (!shortName || shortName.length === 0) {
    throw new Error('Invalid ERC-3770 format: short name is required');
  }

  // Validate transaction hash format (should be hex string starting with 0x)
  if (!transactionHash || !/^0x[a-fA-F0-9]+$/.test(transactionHash)) {
    throw new Error(
      'Invalid ERC-3770 format: transaction hash must be a valid hex string starting with 0x'
    );
  }

  // Get chain ID from short name
  const chainId = getChainIdFromShortName(shortName);
  if (chainId === null) {
    throw new Error(`Unknown chain short name: ${shortName}`);
  }

  return {
    chainId,
    transactionHash,
  };
}

/**
 * Encode a payment ID with chain ID using ERC-3770 format
 * @param chainId - The chain ID where the payment was executed
 * @param transactionHash - The transaction hash
 * @returns ERC-3770 encoded payment ID (format: "shortName:transactionHash")
 * @throws Error if chainId is not supported
 */
export function encodePaymentId(chainId: number, transactionHash: string): ERC3770PaymentId {
  if (!transactionHash || typeof transactionHash !== 'string') {
    throw new Error('Invalid transaction hash: must be a non-empty string');
  }

  // Validate transaction hash format
  if (!/^0x[a-fA-F0-9]+$/.test(transactionHash)) {
    throw new Error('Invalid transaction hash: must be a valid hex string starting with 0x');
  }

  const shortName = getChainShortName(chainId);
  if (shortName === null) {
    throw new Error(`Unsupported chain ID: ${chainId}. Cannot encode payment ID.`);
  }

  return `${shortName}:${transactionHash}` as ERC3770PaymentId;
}

/**
 * Check if a payment ID is in ERC-3770 format
 * @param id - The payment ID to check
 * @returns True if the ID contains a colon (ERC-3770 format), false otherwise
 */
export function isERC3770Format(id: string): boolean {
  return typeof id === 'string' && id.includes(':');
}

