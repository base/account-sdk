import { CHAIN_IDS, TOKENS } from './constants.js';
import { getPaymentStatus } from './getPaymentStatus.js';
import { pay } from './pay.js';
import type {
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
} from './types.js';

/**
 * Base payment interface
 */
export const base = {
  pay,
  getPaymentStatus,
  constants: {
    CHAIN_IDS,
    TOKENS,
  },
  types: {} as {
    PaymentOptions: PaymentOptions;
    PaymentResult: PaymentResult;
    PaymentStatusOptions: PaymentStatusOptions;
    PaymentStatus: PaymentStatus;
  },
};
