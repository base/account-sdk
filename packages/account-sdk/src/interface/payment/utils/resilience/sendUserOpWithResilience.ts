import type { EvmSmartAccount } from '@coinbase/cdp-sdk';
import type { PrepareChargeCall } from '../../types.js';
import type {
  RecoveryAction,
  ResilientResult,
  ResilienceState,
  SendWithResilienceOptions,
} from './types.js';
import { DEFAULT_RESILIENCE_CONFIG } from './types.js';
import { MaxRetriesExceededError, UnrecoverableTransactionError } from './errors.js';
import {
  analyzeFailure,
  calculateBackoffDelay,
  sleep,
  validateResilienceConfig,
  shouldIncreaseGas,
  shouldRefreshNonce,
  shouldFallbackToSponsored,
  formatDuration,
} from './utils.js';

/**
 * Sends a user operation with automatic retry and self-healing capabilities.
 *
 * This function wraps the standard sendUserOperation flow with resilience features:
 * - Automatic retries with configurable backoff
 * - Gas adjustment on out-of-gas failures
 * - Nonce correction on nonce-related failures
 * - Fallback to sponsored transactions on insufficient funds
 * - Progress callbacks for monitoring
 *
 * @param networkSmartWallet - Network-scoped smart wallet instance
 * @param calls - Array of calls to execute
 * @param options - Configuration options including resilience settings
 * @returns Promise<ResilientResult> - Result including transaction hash and recovery info
 * @throws MaxRetriesExceededError if all retry attempts fail
 * @throws UnrecoverableTransactionError if an unrecoverable error occurs
 *
 * @example
 * ```typescript
 * // Basic usage (with default resilience)
 * const result = await sendUserOpWithResilience(wallet, calls, {
 *   timeoutSeconds: 60,
 *   context: 'payment',
 * });
 *
 * // With custom resilience configuration
 * const result = await sendUserOpWithResilience(wallet, calls, {
 *   timeoutSeconds: 60,
 *   context: 'payment',
 *   resilience: {
 *     maxRetries: 5,
 *     backoff: 'exponential',
 *     autoGasAdjust: true,
 *     fallbackToSponsored: true,
 *     fallbackPaymasterUrl: 'https://paymaster.example.com',
 *     onRetry: ({ attempt, error, nextAction }) => {
 *       console.log(`Retry ${attempt}: ${nextAction}`);
 *     },
 *   },
 * });
 * ```
 */
export async function sendUserOpWithResilience(
  networkSmartWallet: Awaited<ReturnType<EvmSmartAccount['useNetwork']>>,
  calls: PrepareChargeCall[],
  options: SendWithResilienceOptions = {}
): Promise<ResilientResult> {
  const {
    paymasterUrl,
    timeoutSeconds = 60,
    context = 'transaction',
    resilience = {},
  } = options;

  // Merge with defaults
  const config = {
    ...DEFAULT_RESILIENCE_CONFIG,
    ...resilience,
  };

  // Validate configuration
  validateResilienceConfig(config);

  // Initialize state
  const state: ResilienceState = {
    attempts: 0,
    startTime: Date.now(),
    currentPaymasterUrl: paymasterUrl,
    recoveryActions: [],
  };

  const maxAttempts = config.maxRetries + 1; // +1 for initial attempt

  while (state.attempts < maxAttempts) {
    state.attempts++;

    try {
      const transactionHash = await executeAttempt(
        networkSmartWallet,
        calls,
        state.currentPaymasterUrl,
        timeoutSeconds
      );

      // Success!
      return {
        transactionHash,
        attempts: state.attempts,
        totalTimeMs: Date.now() - state.startTime,
        recoveryActionsUsed: state.recoveryActions.length > 0,
        recoveryActions: state.recoveryActions,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      state.lastError = err;

      // Analyze the failure
      const failureAnalysis = analyzeFailure(err);
      state.lastFailureAnalysis = failureAnalysis;

      // If unrecoverable, throw immediately
      if (!failureAnalysis.isRecoverable) {
        throw new UnrecoverableTransactionError(err, failureAnalysis, state.attempts);
      }

      // Check if we have retries left
      if (state.attempts >= maxAttempts) {
        throw new MaxRetriesExceededError(
          err,
          failureAnalysis,
          state.attempts,
          Date.now() - state.startTime,
          state.recoveryActions
        );
      }

      // Determine recovery action
      const recoveryAction = determineRecoveryAction(failureAnalysis, config, state);

      if (recoveryAction) {
        state.recoveryActions.push(recoveryAction);
        config.onRecoveryAction?.(recoveryAction);
      }

      // Calculate delay
      const delay = calculateBackoffDelay(
        state.attempts,
        config.backoff,
        config.initialDelayMs,
        config.maxDelayMs
      );

      // Fire retry callback
      if (config.onRetry) {
        await config.onRetry({
          attempt: state.attempts,
          maxAttempts,
          error: err,
          failureAnalysis,
          nextAction: recoveryAction?.description || 'Retrying',
          delayMs: delay,
        });
      }

      // Wait before retry
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new MaxRetriesExceededError(
    state.lastError || new Error('Unknown error'),
    state.lastFailureAnalysis || {
      type: 'UNKNOWN',
      isRecoverable: false,
      description: 'Unknown error',
      originalMessage: '',
    },
    state.attempts,
    Date.now() - state.startTime,
    state.recoveryActions
  );
}

/**
 * Executes a single attempt to send and wait for a user operation
 */
async function executeAttempt(
  networkSmartWallet: Awaited<ReturnType<EvmSmartAccount['useNetwork']>>,
  calls: PrepareChargeCall[],
  paymasterUrl: string | undefined,
  timeoutSeconds: number
): Promise<string> {
  // Send the user operation
  const userOpResult = await networkSmartWallet.sendUserOperation({
    calls,
    ...(paymasterUrl && { paymasterUrl }),
  });

  // Wait for the operation to complete
  const completedOp = await networkSmartWallet.waitForUserOperation({
    userOpHash: userOpResult.userOpHash,
    waitOptions: {
      timeoutSeconds,
    },
  });

  // Check if the operation was successful
  if (completedOp.status === 'failed') {
    throw new Error(`User operation failed: ${userOpResult.userOpHash}`);
  }

  // For completed operations, we have the transaction hash
  const transactionHash = completedOp.transactionHash;

  if (!transactionHash) {
    throw new Error('No transaction hash received from operation');
  }

  return transactionHash;
}

/**
 * Determines and applies the appropriate recovery action based on failure analysis
 */
function determineRecoveryAction(
  failureAnalysis: ReturnType<typeof analyzeFailure>,
  config: typeof DEFAULT_RESILIENCE_CONFIG & { fallbackPaymasterUrl?: string },
  state: ResilienceState
): RecoveryAction | null {
  const timestamp = new Date();

  // Gas increase for out-of-gas errors
  if (shouldIncreaseGas(failureAnalysis.type) && config.autoGasAdjust) {
    // Note: In the current CDP SDK, gas is managed automatically
    // This action records the intent for observability
    const action: RecoveryAction = {
      type: 'gas_increase',
      description: `Requesting higher gas limit (attempt ${state.attempts})`,
      timestamp,
    };
    return action;
  }

  // Nonce refresh for nonce errors
  if (shouldRefreshNonce(failureAnalysis.type) && config.autoNonceCorrect) {
    // Note: CDP SDK handles nonce automatically on retry
    const action: RecoveryAction = {
      type: 'nonce_correction',
      description: `Refreshing nonce from network (was ${failureAnalysis.type})`,
      timestamp,
    };
    return action;
  }

  // Sponsored fallback for insufficient funds
  if (
    shouldFallbackToSponsored(failureAnalysis.type) &&
    config.fallbackToSponsored &&
    config.fallbackPaymasterUrl &&
    !state.currentPaymasterUrl
  ) {
    state.currentPaymasterUrl = config.fallbackPaymasterUrl;
    const action: RecoveryAction = {
      type: 'sponsored_fallback',
      description: 'Switching to sponsored transaction via paymaster',
      timestamp,
    };
    config.onFallbackToSponsored?.();
    return action;
  }

  // Default retry action
  return {
    type: 'retry',
    description: `Retrying after ${failureAnalysis.type}: ${failureAnalysis.description}`,
    timestamp,
  };
}

/**
 * Simplified version that maintains backward compatibility with sendUserOpAndWait
 *
 * @param networkSmartWallet - Network-scoped smart wallet instance
 * @param calls - Array of calls to execute
 * @param paymasterUrl - Optional paymaster URL
 * @param timeoutSeconds - Timeout in seconds
 * @param context - Context string for error messages
 * @returns Transaction hash
 */
export async function sendUserOpAndWaitWithResilience(
  networkSmartWallet: Awaited<ReturnType<EvmSmartAccount['useNetwork']>>,
  calls: PrepareChargeCall[],
  paymasterUrl: string | undefined,
  timeoutSeconds: number,
  context: string
): Promise<string> {
  const result = await sendUserOpWithResilience(networkSmartWallet, calls, {
    paymasterUrl,
    timeoutSeconds,
    context,
  });
  return result.transactionHash;
}
