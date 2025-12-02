// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>
export type {
  AppMetadata,
  Preference,
  ProviderInterface,
} from ':core/provider/interface.js';

export { createBaseAccountSDK } from './interface/builder/core/createBaseAccountSDK.js';

export {
  getCryptoKeyAccount,
  removeCryptoKey,
} from './kms/crypto-key/index.js';

export { PACKAGE_VERSION as VERSION } from './core/constants.js';

// Payment interface exports
export {
  base,
  CHAIN_IDS,
  getPaymentStatus,
  getSubscriptionStatus,
  pay,
  payWithToken,
  prepareCharge,
  subscribe,
  TOKENS,
} from './interface/payment/index.js';
export type {
  ChargeOptions,
  ChargeResult,
  GetOrCreateSubscriptionOwnerWalletOptions,
  GetOrCreateSubscriptionOwnerWalletResult,
  InfoRequest,
  PayerInfo,
  PayerInfoResponses,
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
  PaymentStatusType,
  PaymentSuccess,
  PrepareChargeCall,
  PrepareChargeOptions,
  PrepareChargeResult,
  PrepareRevokeCall,
  PrepareRevokeOptions,
  PrepareRevokeResult,
  RevokeOptions,
  RevokeResult,
  SubscriptionOptions,
  SubscriptionResult,
  SubscriptionStatus,
  SubscriptionStatusOptions,
  PayWithTokenOptions,
  PayWithTokenResult,
  PaymasterOptions,
  TokenPaymentSuccess,
  TokenInput,
} from './interface/payment/index.js';

export {
  createProlinkUrl,
  decodeProlink,
  encodeProlink,
} from './interface/public-utilities/prolink/index.js';
export type {
  ProlinkDecoded,
  ProlinkRequest,
} from './interface/public-utilities/prolink/index.js';
