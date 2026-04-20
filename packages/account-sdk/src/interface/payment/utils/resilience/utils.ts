import type {
  BackoffStrategy,
  FailureAnalysis,
  FailureType,
  RecoverableFailureType,
  ResilienceConfig,
} from './types.js';
import { InvalidResilienceConfigError } from './errors.js';

/**
 * Error patterns that indicate recoverable failures
 * Note: More specific patterns should be checked first
 */
const RECOVERABLE_ERROR_PATTERNS: Record<RecoverableFailureType, RegExp[]> = {
  OUT_OF_GAS: [
    /\bout of gas\b/i,
    /\bgas too low\b/i,
    /intrinsic gas too low/i,
    /gas limit reached/i,
  ],
  NONCE_TOO_LOW: [/nonce too low/i, /nonce has already been used/i, /invalid nonce/i],
  NONCE_TOO_HIGH: [/nonce too high/i, /nonce gap/i],
  REPLACEMENT_UNDERPRICED: [
    /replacement transaction underpriced/i,
    /transaction underpriced/i,
    /gas price too low/i,
  ],
  INSUFFICIENT_FUNDS_FOR_GAS: [
    /insufficient funds for gas/i,
    /insufficient balance for transfer/i,
    /sender doesn't have enough funds/i,
  ],
  TIMEOUT: [/timeout/i, /timed out/i, /deadline exceeded/i, /request timeout/i],
  NETWORK_ERROR: [
    /network error/i,
    /connection refused/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /fetch failed/i,
    /network request failed/i,
  ],
  RPC_ERROR: [
    /rpc error/i,
    /internal json-rpc error/i,
    /-32000/,
    /-32603/,
    /server error/i,
    /bad gateway/i,
    /service unavailable/i,
    /user operation failed/i,
    /no transaction hash/i,
  ],
};

/**
 * Error patterns that indicate unrecoverable failures
 */
const UNRECOVERABLE_ERROR_PATTERNS: Record<string, RegExp[]> = {
  USER_REJECTED: [
    /user rejected/i,
    /user denied/i,
    /user cancelled/i,
    /rejected by user/i,
    /action_rejected/i,
    /4001/, // EIP-1193 user rejected error code
  ],
  INVALID_PARAMS: [/invalid params/i, /invalid argument/i, /invalid address/i, /invalid input/i],
  CONTRACT_REVERT: [
    /execution reverted/i,
    /revert/i,
    /VM Exception/i,
    /call revert exception/i,
  ],
  INSUFFICIENT_TOKEN_BALANCE: [
    /insufficient token balance/i,
    /transfer amount exceeds balance/i,
    /ERC20: transfer amount exceeds balance/i,
  ],
  PERMISSION_DENIED: [
    /permission denied/i,
    /not authorized/i,
    /unauthorized/i,
    /access denied/i,
    /forbidden/i,
  ],
};

/**
 * Analyzes an error to determine its type and recoverability
 */
export function analyzeFailure(error: Error): FailureAnalysis {
  const message = error.message || '';
  const errorString = String(error);

  // Check for error code in the error object
  const code = extractErrorCode(error);

  // First check for unrecoverable errors (they take precedence)
  for (const [type, patterns] of Object.entries(UNRECOVERABLE_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message) || pattern.test(errorString)) {
        return {
          type: type as FailureType,
          isRecoverable: false,
          description: getFailureDescription(type as FailureType),
          originalMessage: message,
          code,
        };
      }
    }
  }

  // Then check for recoverable errors
  for (const [type, patterns] of Object.entries(RECOVERABLE_ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(message) || pattern.test(errorString)) {
        return {
          type: type as FailureType,
          isRecoverable: true,
          description: getFailureDescription(type as FailureType),
          suggestedAction: getSuggestedAction(type as RecoverableFailureType),
          originalMessage: message,
          code,
        };
      }
    }
  }

  // Default to unknown unrecoverable error
  return {
    type: 'UNKNOWN',
    isRecoverable: false,
    description: 'An unknown error occurred',
    originalMessage: message,
    code,
  };
}

/**
 * Extracts error code from various error formats
 */
function extractErrorCode(error: Error): number | undefined {
  // Check for direct code property
  if ('code' in error && typeof (error as { code?: unknown }).code === 'number') {
    return (error as { code: number }).code;
  }

  // Check for nested error code
  if ('error' in error) {
    const nestedError = (error as { error?: { code?: unknown } }).error;
    if (nestedError && typeof nestedError.code === 'number') {
      return nestedError.code;
    }
  }

  // Try to extract from message
  const codeMatch = error.message?.match(/-?\d{4,5}/);
  if (codeMatch) {
    return parseInt(codeMatch[0], 10);
  }

  return undefined;
}

/**
 * Returns a human-readable description for a failure type
 */
function getFailureDescription(type: FailureType): string {
  const descriptions: Record<FailureType, string> = {
    OUT_OF_GAS: 'Transaction ran out of gas during execution',
    NONCE_TOO_LOW: 'Transaction nonce is too low (already used)',
    NONCE_TOO_HIGH: 'Transaction nonce is too high (gap in sequence)',
    REPLACEMENT_UNDERPRICED: 'Replacement transaction gas price is too low',
    INSUFFICIENT_FUNDS_FOR_GAS: 'Insufficient funds to pay for gas',
    TIMEOUT: 'Transaction timed out waiting for confirmation',
    NETWORK_ERROR: 'Network connectivity issue occurred',
    RPC_ERROR: 'RPC provider returned an error',
    USER_REJECTED: 'User rejected the transaction',
    INVALID_PARAMS: 'Invalid transaction parameters',
    CONTRACT_REVERT: 'Smart contract reverted the transaction',
    INSUFFICIENT_TOKEN_BALANCE: 'Insufficient token balance for transfer',
    PERMISSION_DENIED: 'Permission denied for this operation',
    UNKNOWN: 'An unknown error occurred',
  };
  return descriptions[type];
}

/**
 * Returns a suggested action for a recoverable failure type
 */
function getSuggestedAction(type: RecoverableFailureType): string {
  const actions: Record<RecoverableFailureType, string> = {
    OUT_OF_GAS: 'Increasing gas limit',
    NONCE_TOO_LOW: 'Refreshing nonce from network',
    NONCE_TOO_HIGH: 'Waiting for pending transactions',
    REPLACEMENT_UNDERPRICED: 'Increasing gas price',
    INSUFFICIENT_FUNDS_FOR_GAS: 'Attempting sponsored transaction',
    TIMEOUT: 'Retrying with extended timeout',
    NETWORK_ERROR: 'Retrying after delay',
    RPC_ERROR: 'Retrying with backoff',
  };
  return actions[type];
}

/**
 * Calculates the delay before the next retry attempt
 */
export function calculateBackoffDelay(
  attempt: number,
  strategy: BackoffStrategy,
  initialDelayMs: number,
  maxDelayMs: number
): number {
  let delay: number;

  switch (strategy) {
    case 'exponential':
      // 2^(attempt-1) * initialDelay, with jitter
      delay = Math.pow(2, attempt - 1) * initialDelayMs;
      // Add jitter (±10%) to prevent thundering herd
      const jitter = delay * 0.1 * (Math.random() * 2 - 1);
      delay += jitter;
      break;
    case 'linear':
      delay = attempt * initialDelayMs;
      break;
    case 'fixed':
      delay = initialDelayMs;
      break;
    default:
      delay = initialDelayMs;
  }

  return Math.min(delay, maxDelayMs);
}

/**
 * Sleeps for the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates resilience configuration
 */
export function validateResilienceConfig(config: ResilienceConfig): void {
  if (config.maxRetries !== undefined) {
    if (!Number.isInteger(config.maxRetries) || config.maxRetries < 0) {
      throw new InvalidResilienceConfigError(
        'maxRetries',
        config.maxRetries,
        'must be a non-negative integer'
      );
    }
    if (config.maxRetries > 10) {
      throw new InvalidResilienceConfigError(
        'maxRetries',
        config.maxRetries,
        'must not exceed 10 to prevent excessive retries'
      );
    }
  }

  if (config.initialDelayMs !== undefined) {
    if (!Number.isFinite(config.initialDelayMs) || config.initialDelayMs < 0) {
      throw new InvalidResilienceConfigError(
        'initialDelayMs',
        config.initialDelayMs,
        'must be a non-negative number'
      );
    }
  }

  if (config.maxDelayMs !== undefined) {
    if (!Number.isFinite(config.maxDelayMs) || config.maxDelayMs < 0) {
      throw new InvalidResilienceConfigError(
        'maxDelayMs',
        config.maxDelayMs,
        'must be a non-negative number'
      );
    }
  }

  if (
    config.initialDelayMs !== undefined &&
    config.maxDelayMs !== undefined &&
    config.initialDelayMs > config.maxDelayMs
  ) {
    throw new InvalidResilienceConfigError(
      'initialDelayMs',
      config.initialDelayMs,
      'must not exceed maxDelayMs'
    );
  }

  if (config.gasMultiplier !== undefined) {
    if (!Number.isFinite(config.gasMultiplier) || config.gasMultiplier < 1) {
      throw new InvalidResilienceConfigError(
        'gasMultiplier',
        config.gasMultiplier,
        'must be a number >= 1'
      );
    }
    if (config.gasMultiplier > 3) {
      throw new InvalidResilienceConfigError(
        'gasMultiplier',
        config.gasMultiplier,
        'must not exceed 3 to prevent excessive gas costs'
      );
    }
  }

  if (config.fallbackToSponsored && !config.fallbackPaymasterUrl) {
    throw new InvalidResilienceConfigError(
      'fallbackPaymasterUrl',
      config.fallbackPaymasterUrl,
      'must be provided when fallbackToSponsored is true'
    );
  }

  if (config.backoff !== undefined) {
    const validStrategies: BackoffStrategy[] = ['linear', 'exponential', 'fixed'];
    if (!validStrategies.includes(config.backoff)) {
      throw new InvalidResilienceConfigError(
        'backoff',
        config.backoff,
        `must be one of: ${validStrategies.join(', ')}`
      );
    }
  }
}

/**
 * Determines if a failure type should trigger a gas increase
 */
export function shouldIncreaseGas(failureType: FailureType): boolean {
  return failureType === 'OUT_OF_GAS';
}

/**
 * Determines if a failure type should trigger a nonce refresh
 */
export function shouldRefreshNonce(failureType: FailureType): boolean {
  return failureType === 'NONCE_TOO_LOW' || failureType === 'NONCE_TOO_HIGH';
}

/**
 * Determines if a failure type should trigger a sponsored fallback
 */
export function shouldFallbackToSponsored(failureType: FailureType): boolean {
  return failureType === 'INSUFFICIENT_FUNDS_FOR_GAS';
}

/**
 * Formats a duration in milliseconds to a human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${(ms / 60000).toFixed(1)}m`;
}
