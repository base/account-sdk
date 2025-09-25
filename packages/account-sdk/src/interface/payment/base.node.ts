import { charge } from './charge.js';
import { CHAIN_IDS, TOKENS } from './constants.js';
import { getOrCreateSubscriptionOwnerWallet } from './getOrCreateSubscriptionOwnerWallet.js';
import { getPaymentStatus } from './getPaymentStatus.js';
import { getSubscriptionStatus } from './getSubscriptionStatus.js';
import { pay } from './pay.js';
import { prepareCharge } from './prepareCharge.js';
import { subscribe } from './subscribe.js';
import type {
  ChargeOptions,
  ChargeResult,
  GetOrCreateSubscriptionOwnerWalletOptions,
  GetOrCreateSubscriptionOwnerWalletResult,
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
 * Node.js payment interface
 * This version includes all browser functions plus Node-only functions that depend on CDP SDK
 */
export const base = {
  pay,
  subscribe,
  getPaymentStatus,
  subscription: {
    subscribe,
    getStatus: getSubscriptionStatus,
    prepareCharge,
    charge, // Node-only: requires CDP SDK
    getOrCreateSubscriptionOwnerWallet, // Node-only: requires CDP SDK
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
    ChargeOptions: ChargeOptions;
    ChargeResult: ChargeResult;
    SubscriptionOptions: SubscriptionOptions;
    SubscriptionResult: SubscriptionResult;
    SubscriptionStatus: SubscriptionStatus;
    SubscriptionStatusOptions: SubscriptionStatusOptions;
    GetOrCreateSubscriptionOwnerWalletOptions: GetOrCreateSubscriptionOwnerWalletOptions;
    GetOrCreateSubscriptionOwnerWalletResult: GetOrCreateSubscriptionOwnerWalletResult;
  },
};
