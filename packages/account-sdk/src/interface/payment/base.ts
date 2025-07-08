import { CHAIN_IDS, TOKENS, VERSION, WALLET_RPC_URL } from './constants.js';
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
    WALLET_RPC_URL,
    VERSION,
  },
  types: {} as {
    PaymentOptions: PaymentOptions;
    PaymentResult: PaymentResult;
  },
};
