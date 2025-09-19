/**
 * Browser entry point for Base Account SDK
 * This file exposes the account interface to the global window object
 */

import { PACKAGE_VERSION } from './core/constants.js';
import { createBaseAccountSDK } from './interface/builder/core/createBaseAccountSDK.js';
import { base } from './interface/payment/base.js';
import { CHAIN_IDS, TOKENS } from './interface/payment/constants.js';
import { getPaymentStatus } from './interface/payment/getPaymentStatus.js';
import { pay } from './interface/payment/pay.js';
import { subscribe } from './interface/payment/subscribe.js';
import type {
  InfoRequest,
  PayerInfo,
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
  SubscriptionOptions,
  SubscriptionResult,
} from './interface/payment/types.js';

// Expose to global window object
if (typeof window !== 'undefined') {
  (window as any).base = base;
  (window as any).createBaseAccountSDK = createBaseAccountSDK;
  (window as any).BaseAccountSDK = {
    VERSION: PACKAGE_VERSION,
  };
}

// Export for module usage
export type {
  AppMetadata,
  Preference,
  ProviderInterface,
} from ':core/provider/interface.js';
export { PACKAGE_VERSION as VERSION } from './core/constants.js';
export { createBaseAccountSDK } from './interface/builder/core/createBaseAccountSDK.js';
export { getCryptoKeyAccount, removeCryptoKey } from './kms/crypto-key/index.js';
export { base, CHAIN_IDS, getPaymentStatus, pay, subscribe, TOKENS };
export type {
  InfoRequest,
  PayerInfo,
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
  SubscriptionOptions,
  SubscriptionResult,
};
