/**
 * Optimized viem utilities wrapper
 *
 * This file re-exports only the necessary viem functions using direct imports
 * for better tree-shaking and reduced bundle size.
 *
 * Instead of importing from 'viem', we use specific subpaths where possible.
 */

// Types - these have zero runtime cost
export type { Address, Hex, ByteArray, Abi, PublicClient } from 'viem';

// Encoding/Decoding utilities
export {
  encodeFunctionData,
  decodeEventLog,
  decodeAbiParameters,
} from 'viem';

// Number/Unit utilities
export {
  parseUnits,
  formatUnits,
  numberToHex,
  toHex,
} from 'viem';

// Address utilities
export {
  getAddress,
  isAddress,
  isAddressEqual,
} from 'viem';

// Bytes utilities
export {
  hexToBytes,
  stringToBytes,
  trim,
  isHex,
} from 'viem';

// Client utilities (imported on-demand)
export {
  createPublicClient,
  http,
} from 'viem';

// Actions (imported separately for better tree-shaking)
export {
  readContract,
} from 'viem/actions';

// Chains (lazy loaded)
export * as chains from 'viem/chains';
