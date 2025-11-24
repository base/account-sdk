import { getAddress, isAddress, type Address } from 'viem';

import {
  ETH_PLACEHOLDER_ADDRESS,
  STABLECOIN_ADDRESS_LOOKUP,
  STABLECOIN_WHITELIST,
} from '../constants.js';
import type { TokenInput } from '../types.js';

export interface ResolvedToken {
  address: Address;
  symbol?: string;
  decimals?: number;
  isNativeEth: boolean;
}

const ETH_PLACEHOLDER_LOWER = ETH_PLACEHOLDER_ADDRESS.toLowerCase();
const SUPPORTED_STABLECOIN_SYMBOLS = Object.keys(STABLECOIN_WHITELIST);

/**
 * Checks whether a string represents the native ETH placeholder.
 */
export function isEthPlaceholder(value: string): boolean {
  return value.trim().toLowerCase() === ETH_PLACEHOLDER_LOWER;
}

/**
 * Resolves a token input (symbol or address) into a concrete contract address.
 */
export function resolveTokenAddress(token: TokenInput, chainId: number): ResolvedToken {
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('Token is required');
  }

  const trimmed = token.trim();

  if (isEthPlaceholder(trimmed)) {
    return {
      address: getAddress(ETH_PLACEHOLDER_ADDRESS),
      symbol: 'ETH',
      decimals: 18,
      isNativeEth: true,
    };
  }

  if (isAddress(trimmed)) {
    return {
      address: getAddress(trimmed),
      isNativeEth: isEthPlaceholder(trimmed),
    };
  }

  const normalizedSymbol = trimmed.toUpperCase();
  if (normalizedSymbol in STABLECOIN_WHITELIST) {
    const stablecoin = STABLECOIN_WHITELIST[normalizedSymbol as keyof typeof STABLECOIN_WHITELIST];
    const address = stablecoin.addresses[chainId];

    if (!address) {
      throw new Error(
        `Token ${normalizedSymbol} is not whitelisted on chain ${chainId}. Provide a contract address instead.`
      );
    }

    return {
      address: getAddress(address),
      symbol: stablecoin.symbol,
      decimals: stablecoin.decimals,
      isNativeEth: false,
    };
  }

  throw new Error(
    `Unknown token "${token}". Provide a contract address or one of the supported symbols: ${SUPPORTED_STABLECOIN_SYMBOLS.join(
      ', '
    )}, ETH`
  );
}

/**
 * Returns metadata for a whitelisted stablecoin by address, if available.
 */
export function getStablecoinMetadataByAddress(address?: string) {
  if (!address) {
    return undefined;
  }

  return STABLECOIN_ADDRESS_LOOKUP[address.toLowerCase()];
}


