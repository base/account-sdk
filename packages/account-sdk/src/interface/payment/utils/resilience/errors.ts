import type { FailureAnalysis, RecoveryAction } from './types.js';

/**
 * Base error class for resilience-related errors
 */
export class ResilienceError extends Error {
  /** Error code for programmatic handling */
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'ResilienceError';
    this.code = code;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when maximum retry attempts are exceeded
 */
export class MaxRetriesExceededError extends ResilienceError {
  /** The last error that occurred before giving up */
  readonly lastError: Error;
  /** Analysis of the last failure */
  readonly lastFailureAnalysis: FailureAnalysis;
  /** Number of attempts made */
  readonly attempts: number;
  /** Total time spent in milliseconds */
  readonly totalTimeMs: number;
  /** Recovery actions that were attempted */
  readonly recoveryActions: RecoveryAction[];

  constructor(
    lastError: Error,
    lastFailureAnalysis: FailureAnalysis,
    attempts: number,
    totalTimeMs: number,
    recoveryActions: RecoveryAction[]
  ) {
    super(
      `Transaction failed after ${attempts} attempts (${totalTimeMs}ms): ${lastError.message}`,
      'MAX_RETRIES_EXCEEDED'
    );
    this.name = 'MaxRetriesExceededError';
    this.lastError = lastError;
    this.lastFailureAnalysis = lastFailureAnalysis;
    this.attempts = attempts;
    this.totalTimeMs = totalTimeMs;
    this.recoveryActions = recoveryActions;
  }

  /**
   * Returns a summary of all recovery actions attempted
   */
  getRecoverySummary(): string {
    if (this.recoveryActions.length === 0) {
      return 'No recovery actions were attempted.';
    }
    return this.recoveryActions.map((action) => `- ${action.description}`).join('\n');
  }
}

/**
 * Error thrown when a transaction fails with an unrecoverable error
 */
export class UnrecoverableTransactionError extends ResilienceError {
  /** Analysis of the failure */
  readonly failureAnalysis: FailureAnalysis;
  /** The original error */
  readonly originalError: Error;
  /** Number of attempts made before determining unrecoverable */
  readonly attempts: number;

  constructor(originalError: Error, failureAnalysis: FailureAnalysis, attempts: number) {
    super(
      `Unrecoverable transaction error: ${failureAnalysis.description}`,
      'UNRECOVERABLE_ERROR'
    );
    this.name = 'UnrecoverableTransactionError';
    this.originalError = originalError;
    this.failureAnalysis = failureAnalysis;
    this.attempts = attempts;
  }

  /**
   * Returns suggested actions for the user
   */
  getSuggestedActions(): string[] {
    const actions: string[] = [];

    switch (this.failureAnalysis.type) {
      case 'USER_REJECTED':
        actions.push('Please approve the transaction in your wallet');
        break;
      case 'INSUFFICIENT_TOKEN_BALANCE':
        actions.push('Ensure you have sufficient token balance');
        actions.push('Check that you are using the correct wallet');
        break;
      case 'CONTRACT_REVERT':
        actions.push('The smart contract rejected the transaction');
        actions.push('Check the transaction parameters');
        break;
      case 'PERMISSION_DENIED':
        actions.push('You do not have permission to perform this action');
        actions.push('Verify your account has the required permissions');
        break;
      default:
        actions.push('Please try again or contact support');
    }

    return actions;
  }
}

/**
 * Error thrown when resilience configuration is invalid
 */
export class InvalidResilienceConfigError extends ResilienceError {
  /** The invalid configuration field */
  readonly field: string;
  /** The invalid value */
  readonly value: unknown;
  /** Expected constraint */
  readonly constraint: string;

  constructor(field: string, value: unknown, constraint: string) {
    super(`Invalid resilience config: ${field} (${value}) - ${constraint}`, 'INVALID_CONFIG');
    this.name = 'InvalidResilienceConfigError';
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

/**
 * Type guard to check if an error is a ResilienceError
 */
export function isResilienceError(error: unknown): error is ResilienceError {
  return error instanceof ResilienceError;
}

/**
 * Type guard to check if an error is a MaxRetriesExceededError
 */
export function isMaxRetriesExceededError(error: unknown): error is MaxRetriesExceededError {
  return error instanceof MaxRetriesExceededError;
}

/**
 * Type guard to check if an error is an UnrecoverableTransactionError
 */
export function isUnrecoverableTransactionError(
  error: unknown
): error is UnrecoverableTransactionError {
  return error instanceof UnrecoverableTransactionError;
}
