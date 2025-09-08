import { CHAIN_IDS, TOKENS } from './constants.js';
import { getPaymentStatus } from './getPaymentStatus.js';
import { getSubscriptionStatus } from './getSubscriptionStatus.js';
import { pay } from './pay.js';
import { prepareCharge } from './prepareCharge.js';
import { subscribe } from './subscribe.js';
import type {
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
  PrepareChargeOptions,
  PrepareChargeResult,
  SubscriptionOptions,
  SubscriptionResult,
  SubscriptionStatus,
  SubscriptionStatusOptions,
} from './types.js';

/**
 * Base payment interface
 */
export const base = {
  pay,
  subscribe,
  getPaymentStatus,
  subscription: {
    subscribe,
    getStatus: getSubscriptionStatus,
    prepareCharge,
  },
  constants: {
    CHAIN_IDS,
    TOKENS,
  },
  types: {} as {
    PaymentOptions: PaymentOptions;
    PaymentResult: PaymentResult;
    PaymentStatusOptions: PaymentStatusOptions;
    PaymentStatus: PaymentStatus;
    PrepareChargeOptions: PrepareChargeOptions;
    PrepareChargeResult: PrepareChargeResult;
    SubscriptionOptions: SubscriptionOptions;
    SubscriptionResult: SubscriptionResult;
    SubscriptionStatus: SubscriptionStatus;
    SubscriptionStatusOptions: SubscriptionStatusOptions;
  },
};
