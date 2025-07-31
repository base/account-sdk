// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>
export type { AppMetadata, Preference, ProviderInterface } from ':core/provider/interface.js';

export { createBaseAccountSDK } from './interface/builder/core/createBaseAccountSDK.js';

export { getCryptoKeyAccount, removeCryptoKey } from './kms/crypto-key/index.js';

// Payment interface exports
export { base, getPaymentStatus, pay } from './interface/payment/index.js';
export type {
  InfoRequest,
  PayerInfo,
  PayerInfoResponses,
  PaymentOptions,
  PaymentResult,
  PaymentStatus,
  PaymentStatusOptions,
  PaymentStatusType,
  PaymentSuccess,
} from './interface/payment/index.js';
