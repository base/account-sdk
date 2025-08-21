import { CHAIN_IDS, TOKENS } from './constants.js';
import { getPaymentStatus } from './getPaymentStatus.js';
import { pay } from './pay.js';
import { subscribe } from './subscribe.js';
import type {
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
  SubscriptionOptions,
  SubscriptionResult,
} from './types.js';

/**
 * Base payment interface
 */
export const base = {
  pay,
  subscribe,
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
    SubscriptionOptions: SubscriptionOptions;
    SubscriptionResult: SubscriptionResult;
  },
};
