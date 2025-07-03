import { CHAIN_IDS, USDC_ADDRESS } from './constants.js';
import { pay } from './pay.js';

/**
 * Base namespace for payment functions
 */
export const base = {
  pay,
  // Export useful constants under the base namespace
  constants: {
    CHAIN_IDS,
    USDC_ADDRESS,
  },
} as const;
