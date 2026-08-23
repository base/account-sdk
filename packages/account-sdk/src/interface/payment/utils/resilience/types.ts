import type { Address } from 'viem';

/**
 * Backoff strategy for retry attempts
 */
export type BackoffStrategy = 'linear' | 'exponential' | 'fixed';

/**
 * Types of transaction failures that can be automatically recovered
 */
export type RecoverableFailureType =
  | 'OUT_OF_GAS'
  | 'NONCE_TOO_LOW'
  | 'NONCE_TOO_HIGH'
  | 'REPLACEMENT_UNDERPRICED'
  | 'INSUFFICIENT_FUNDS_FOR_GAS'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'RPC_ERROR';

/**
 * Types of transaction failures that cannot be automatically recovered
 */
export type UnrecoverableFailureType =
  | 'USER_REJECTED'
  | 'INVALID_PARAMS'
  | 'CONTRACT_REVERT'
  | 'INSUFFICIENT_TOKEN_BALANCE'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN';

/**
 * All possible failure types
 */
export type FailureType = RecoverableFailureType | UnrecoverableFailureType;

/**
 * Analysis of a transaction failure
 */
export interface FailureAnalysis {
  /** The type of failure */
  type: FailureType;
  /** Whether this failure can be automatically recovered */
  isRecoverable: boolean;
  /** Human-readable description of the failure */
  description: string;
  /** Suggested action to recover from this failure */
  suggestedAction?: string;
  /** Original error message */
  originalMessage: string;
  /** Error code if available */
  code?: number;
}

/**
 * Configuration for resilience behavior
 */
export interface ResilienceConfig {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Backoff strategy between retries
   * - 'exponential': Doubles delay each attempt (recommended)
   * - 'linear': Increases delay linearly
   * - 'fixed': Same delay each attempt
   * @default 'exponential'
   */
  backoff?: BackoffStrategy;

  /**
   * Initial delay in milliseconds before first retry
   * @default 1000
   */
  initialDelayMs?: number;

  /**
   * Maximum delay in milliseconds between retries
   * @default 30000
   */
  maxDelayMs?: number;

  /**
   * Automatically increase gas limit if transaction fails due to out of gas
   * @default true
   */
  autoGasAdjust?: boolean;

  /**
   * Multiplier for gas adjustment (e.g., 1.2 = 20% increase)
   * @default 1.2
   */
  gasMultiplier?: number;

  /**
   * Automatically correct nonce if transaction fails due to nonce issues
   * @default true
   */
  autoNonceCorrect?: boolean;

  /**
   * Fall back to sponsored transaction if user has insufficient funds for gas
   * @default false
   */
  fallbackToSponsored?: boolean;

  /**
   * Paymaster URL to use for sponsored fallback
   */
  fallbackPaymasterUrl?: string;

  /**
   * Callback fired before each retry attempt
   */
  onRetry?: (context: RetryContext) => void | Promise<void>;

  /**
   * Callback fired when gas is adjusted
   */
  onGasAdjusted?: (context: GasAdjustmentContext) => void;

  /**
   * Callback fired when falling back to sponsored transaction
   */
  onFallbackToSponsored?: () => void;

  /**
   * Callback fired when recovery action is taken
   */
  onRecoveryAction?: (action: RecoveryAction) => void;
}

/**
 * Context provided to retry callbacks
 */
export interface RetryContext {
  /** Current attempt number (1-indexed) */
  attempt: number;
  /** Maximum number of attempts */
  maxAttempts: number;
  /** The error that caused this retry */
  error: Error;
  /** Analysis of the failure */
  failureAnalysis: FailureAnalysis;
  /** Description of the next action to be taken */
  nextAction: string;
  /** Delay before next retry in milliseconds */
  delayMs: number;
}

/**
 * Context provided when gas is adjusted
 */
export interface GasAdjustmentContext {
  /** Original gas limit */
  originalGas: bigint;
  /** New adjusted gas limit */
  adjustedGas: bigint;
  /** Multiplier applied */
  multiplier: number;
  /** Attempt number */
  attempt: number;
}

/**
 * Recovery action taken during resilience handling
 */
export interface RecoveryAction {
  /** Type of recovery action */
  type: 'gas_increase' | 'nonce_correction' | 'sponsored_fallback' | 'retry';
  /** Description of the action */
  description: string;
  /** Timestamp when action was taken */
  timestamp: Date;
}

/**
 * Result of a resilient operation
 */
export interface ResilientResult {
  /** Transaction hash of the successful operation */
  transactionHash: string;
  /** Number of attempts made */
  attempts: number;
  /** Total time taken in milliseconds */
  totalTimeMs: number;
  /** Whether any recovery actions were taken */
  recoveryActionsUsed: boolean;
  /** List of recovery actions taken */
  recoveryActions: RecoveryAction[];
}

/**
 * Options for the resilient send operation
 */
export interface SendWithResilienceOptions {
  /** Optional paymaster URL for gas sponsorship */
  paymasterUrl?: string;
  /** Timeout in seconds for each attempt */
  timeoutSeconds?: number;
  /** Context string for error messages */
  context?: string;
  /** Resilience configuration */
  resilience?: ResilienceConfig;
}

/**
 * Internal state tracked during resilient operation
 */
export interface ResilienceState {
  attempts: number;
  startTime: number;
  currentPaymasterUrl?: string;
  recoveryActions: RecoveryAction[];
  lastError?: Error;
  lastFailureAnalysis?: FailureAnalysis;
}

/**
 * Default resilience configuration
 */
export const DEFAULT_RESILIENCE_CONFIG: Required<
  Omit<
    ResilienceConfig,
    | 'fallbackPaymasterUrl'
    | 'onRetry'
    | 'onGasAdjusted'
    | 'onFallbackToSponsored'
    | 'onRecoveryAction'
  >
> = {
  maxRetries: 3,
  backoff: 'exponential',
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  autoGasAdjust: true,
  gasMultiplier: 1.2,
  autoNonceCorrect: true,
  fallbackToSponsored: false,
};
