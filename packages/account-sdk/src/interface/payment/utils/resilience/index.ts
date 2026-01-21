/**
 * Resilience module for self-healing transaction capabilities
 *
 * This module provides automatic retry and recovery mechanisms for blockchain transactions,
 * including:
 * - Automatic retries with configurable backoff strategies
 * - Gas adjustment for out-of-gas failures
 * - Nonce correction for nonce-related issues
 * - Fallback to sponsored transactions
 * - Progress callbacks for monitoring
 *
 * @example
 * ```typescript
 * import {
 *   sendUserOpWithResilience,
 *   isMaxRetriesExceededError,
 *   isUnrecoverableTransactionError,
 * } from './resilience';
 *
 * try {
 *   const result = await sendUserOpWithResilience(wallet, calls, {
 *     timeoutSeconds: 60,
 *     resilience: {
 *       maxRetries: 3,
 *       autoGasAdjust: true,
 *       onRetry: ({ attempt, nextAction }) => {
 *         console.log(`Attempt ${attempt}: ${nextAction}`);
 *       },
 *     },
 *   });
 *   console.log(`Success after ${result.attempts} attempts`);
 * } catch (error) {
 *   if (isMaxRetriesExceededError(error)) {
 *     console.log(`Failed after ${error.attempts} attempts`);
 *     console.log(error.getRecoverySummary());
 *   }
 * }
 * ```
 *
 * @module resilience
 */

// Main function
export {
  sendUserOpWithResilience,
  sendUserOpAndWaitWithResilience,
} from './sendUserOpWithResilience.js';

// Error classes and type guards
export {
  ResilienceError,
  MaxRetriesExceededError,
  UnrecoverableTransactionError,
  InvalidResilienceConfigError,
  isResilienceError,
  isMaxRetriesExceededError,
  isUnrecoverableTransactionError,
} from './errors.js';

// Utility functions (for advanced use cases)
export {
  analyzeFailure,
  calculateBackoffDelay,
  validateResilienceConfig,
  shouldIncreaseGas,
  shouldRefreshNonce,
  shouldFallbackToSponsored,
  formatDuration,
} from './utils.js';

// Types
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
} from './types.js';

// Constants
export { DEFAULT_RESILIENCE_CONFIG } from './types.js';
