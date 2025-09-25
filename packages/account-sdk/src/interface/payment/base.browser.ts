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
 * Browser-safe payment interface
 * This version excludes Node.js-only functions that depend on CDP SDK
 */
export const base = {
  pay,
  subscribe,
  getPaymentStatus,
  subscription: {
    subscribe,
    getStatus: getSubscriptionStatus,
    prepareCharge,
    // Note: charge and getOrCreateSubscriptionOwnerWallet are not available in browser
    // They require CDP SDK which is Node.js-only
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
