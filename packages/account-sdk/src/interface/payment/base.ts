import { CHAIN_IDS, TOKENS } from './constants.js';
import { pay } from './pay.js';
import type { PaymentOptions, PaymentResult } from './types.js';

/**
 * Base payment interface
 */
export const base = {
  pay,
  constants: {
    CHAIN_IDS,
    TOKENS,
  },
  types: {} as {
    PaymentOptions: PaymentOptions;
    PaymentResult: PaymentResult;
  },
};
