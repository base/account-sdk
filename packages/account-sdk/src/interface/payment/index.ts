// Browser-safe exports only - no CDP SDK dependencies
export { base } from './base.browser.js';
export { getPaymentStatus } from './getPaymentStatus.js';
export { getSubscriptionStatus } from './getSubscriptionStatus.js';
export { pay } from './pay.js';
export { prepareCharge } from './prepareCharge.js';
export { prepareRevoke } from './prepareRevoke.js';
export { subscribe } from './subscribe.js';
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
} from './types.js';

// Export constants
export { CHAIN_IDS, TOKENS } from './constants.js';

// Export resilience utilities for self-healing transactions
export {
  sendUserOpWithResilience,
  sendUserOpAndWaitWithResilience,
  // Error classes
  ResilienceError,
  MaxRetriesExceededError,
  UnrecoverableTransactionError,
  InvalidResilienceConfigError,
  // Type guards
  isResilienceError,
  isMaxRetriesExceededError,
  isUnrecoverableTransactionError,
  // Utility functions
  analyzeFailure,
  // Constants
  DEFAULT_RESILIENCE_CONFIG,
} from './utils/resilience/index.js';

// Export resilience types
export type {
  BackoffStrategy,
  RecoverableFailureType,
  UnrecoverableFailureType,
  FailureType,
  FailureAnalysis,
  ResilienceConfig,
  RetryContext,
  GasAdjustmentContext,
  RecoveryAction,
  ResilientResult,
  SendWithResilienceOptions,
} from './utils/resilience/index.js';
