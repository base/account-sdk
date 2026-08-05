# Self-Healing Transactions - Resilience Module

## Overview

This module provides automatic retry and self-healing capabilities for blockchain transactions in the Base Account SDK. It wraps the standard `sendUserOperation` flow with intelligent error handling, automatic retries, and recovery mechanisms.

## Features

- **Automatic Retries**: Configurable retry logic with exponential, linear, or fixed backoff strategies
- **Failure Analysis**: Intelligent classification of errors into recoverable vs unrecoverable
- **Gas Auto-Adjustment**: Automatic gas limit increases on out-of-gas failures
- **Nonce Correction**: Automatic nonce refresh on nonce-related failures
- **Sponsored Fallback**: Automatic switch to paymaster-sponsored transactions on insufficient funds
- **Progress Callbacks**: Real-time notifications for retry attempts, gas adjustments, and recovery actions
- **Rich Error Types**: Custom error classes with detailed failure analysis and recovery suggestions

## Installation

The resilience module is included in the `@base-org/account` package:

```typescript
import {
  sendUserOpWithResilience,
  isMaxRetriesExceededError,
  isUnrecoverableTransactionError,
} from '@base-org/account/payment';
```

## Basic Usage

### Simple Usage (with defaults)

```typescript
import { sendUserOpWithResilience } from '@base-org/account/payment';

const result = await sendUserOpWithResilience(networkSmartWallet, calls, {
  timeoutSeconds: 60,
  context: 'payment',
});

console.log(`Transaction successful: ${result.transactionHash}`);
console.log(`Completed in ${result.attempts} attempt(s)`);
```

### With Custom Resilience Configuration

```typescript
import {
  sendUserOpWithResilience,
  isMaxRetriesExceededError,
  isUnrecoverableTransactionError,
} from '@base-org/account/payment';

try {
  const result = await sendUserOpWithResilience(networkSmartWallet, calls, {
    timeoutSeconds: 60,
    context: 'subscription charge',
    paymasterUrl: 'https://paymaster.example.com',
    resilience: {
      // Retry configuration
      maxRetries: 5,
      backoff: 'exponential',
      initialDelayMs: 1000,
      maxDelayMs: 30000,

      // Auto-recovery options
      autoGasAdjust: true,
      gasMultiplier: 1.3,
      autoNonceCorrect: true,

      // Sponsored fallback
      fallbackToSponsored: true,
      fallbackPaymasterUrl: 'https://backup-paymaster.example.com',

      // Progress callbacks
      onRetry: ({ attempt, maxAttempts, error, nextAction, delayMs }) => {
        console.log(`Retry ${attempt}/${maxAttempts}: ${nextAction}`);
        console.log(`Waiting ${delayMs}ms before retry...`);
        updateUI({ status: 'retrying', attempt });
      },

      onRecoveryAction: (action) => {
        console.log(`Recovery action: ${action.type} - ${action.description}`);
      },

      onFallbackToSponsored: () => {
        console.log('Switching to sponsored transaction');
        showNotification('Gas will be sponsored');
      },
    },
  });

  console.log('Transaction successful!');
  console.log(`Hash: ${result.transactionHash}`);
  console.log(`Attempts: ${result.attempts}`);
  console.log(`Time: ${result.totalTimeMs}ms`);

  if (result.recoveryActionsUsed) {
    console.log('Recovery actions taken:');
    result.recoveryActions.forEach(action => {
      console.log(`  - ${action.type}: ${action.description}`);
    });
  }

} catch (error) {
  if (isMaxRetriesExceededError(error)) {
    console.error(`Failed after ${error.attempts} attempts`);
    console.error(`Last error: ${error.lastError.message}`);
    console.error(`Failure type: ${error.lastFailureAnalysis.type}`);
    console.error('Recovery actions attempted:');
    console.error(error.getRecoverySummary());
  } else if (isUnrecoverableTransactionError(error)) {
    console.error('Unrecoverable error:', error.failureAnalysis.description);
    console.error('Suggested actions:');
    error.getSuggestedActions().forEach(action => {
      console.error(`  - ${action}`);
    });
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## API Reference

### `sendUserOpWithResilience(networkSmartWallet, calls, options)`

Sends a user operation with automatic retry and self-healing capabilities.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `networkSmartWallet` | `NetworkSmartWallet` | Network-scoped smart wallet instance from CDP SDK |
| `calls` | `PrepareChargeCall[]` | Array of calls to execute |
| `options` | `SendWithResilienceOptions` | Configuration options |

#### Options

```typescript
interface SendWithResilienceOptions {
  paymasterUrl?: string;      // Paymaster URL for gas sponsorship
  timeoutSeconds?: number;    // Timeout per attempt (default: 60)
  context?: string;           // Context for error messages
  resilience?: ResilienceConfig;
}

interface ResilienceConfig {
  maxRetries?: number;              // Max retry attempts (default: 3, max: 10)
  backoff?: BackoffStrategy;        // 'exponential' | 'linear' | 'fixed'
  initialDelayMs?: number;          // Initial delay (default: 1000)
  maxDelayMs?: number;              // Max delay (default: 30000)
  autoGasAdjust?: boolean;          // Auto-increase gas (default: true)
  gasMultiplier?: number;           // Gas multiplier (default: 1.2, max: 3)
  autoNonceCorrect?: boolean;       // Auto-correct nonce (default: true)
  fallbackToSponsored?: boolean;    // Use paymaster fallback (default: false)
  fallbackPaymasterUrl?: string;    // Fallback paymaster URL
  onRetry?: (context: RetryContext) => void;
  onGasAdjusted?: (context: GasAdjustmentContext) => void;
  onFallbackToSponsored?: () => void;
  onRecoveryAction?: (action: RecoveryAction) => void;
}
```

#### Return Value

```typescript
interface ResilientResult {
  transactionHash: string;           // Transaction hash
  attempts: number;                  // Number of attempts made
  totalTimeMs: number;               // Total time in milliseconds
  recoveryActionsUsed: boolean;      // Whether recovery was needed
  recoveryActions: RecoveryAction[]; // List of recovery actions
}
```

## Error Types

### `MaxRetriesExceededError`

Thrown when all retry attempts are exhausted.

```typescript
if (isMaxRetriesExceededError(error)) {
  error.attempts;           // Number of attempts made
  error.totalTimeMs;        // Total time spent
  error.lastError;          // The last error that occurred
  error.lastFailureAnalysis; // Analysis of the last failure
  error.recoveryActions;    // All recovery actions attempted
  error.getRecoverySummary(); // Human-readable summary
}
```

### `UnrecoverableTransactionError`

Thrown immediately when an unrecoverable error is detected.

```typescript
if (isUnrecoverableTransactionError(error)) {
  error.originalError;       // The original error
  error.failureAnalysis;     // Detailed failure analysis
  error.attempts;            // Attempts before detection
  error.getSuggestedActions(); // Suggested user actions
}
```

## Failure Types

### Recoverable Failures (will retry)

| Type | Description | Recovery Action |
|------|-------------|-----------------|
| `OUT_OF_GAS` | Transaction ran out of gas | Increase gas limit |
| `NONCE_TOO_LOW` | Nonce already used | Refresh nonce |
| `NONCE_TOO_HIGH` | Nonce gap detected | Wait/refresh nonce |
| `REPLACEMENT_UNDERPRICED` | Gas price too low | Increase gas price |
| `INSUFFICIENT_FUNDS_FOR_GAS` | Can't pay gas | Switch to sponsored |
| `TIMEOUT` | Operation timed out | Retry with backoff |
| `NETWORK_ERROR` | Network connectivity issue | Retry with backoff |
| `RPC_ERROR` | RPC provider error | Retry with backoff |

### Unrecoverable Failures (immediate throw)

| Type | Description |
|------|-------------|
| `USER_REJECTED` | User rejected the transaction |
| `INVALID_PARAMS` | Invalid transaction parameters |
| `CONTRACT_REVERT` | Smart contract reverted |
| `INSUFFICIENT_TOKEN_BALANCE` | Not enough tokens |
| `PERMISSION_DENIED` | Permission denied |
| `UNKNOWN` | Unrecognized error |

## Backoff Strategies

### Exponential (default)

Doubles the delay after each attempt with ±10% jitter:

```
Attempt 1: 1000ms
Attempt 2: 2000ms (±200ms)
Attempt 3: 4000ms (±400ms)
Attempt 4: 8000ms (±800ms)
...
```

### Linear

Increases delay linearly:

```
Attempt 1: 1000ms
Attempt 2: 2000ms
Attempt 3: 3000ms
...
```

### Fixed

Same delay for all attempts:

```
Attempt 1: 1000ms
Attempt 2: 1000ms
Attempt 3: 1000ms
...
```

## Backward Compatibility

For backward compatibility with the original `sendUserOpAndWait`, use:

```typescript
import { sendUserOpAndWaitWithResilience } from '@base-org/account/payment';

// Same signature as original, but with resilience
const txHash = await sendUserOpAndWaitWithResilience(
  networkSmartWallet,
  calls,
  paymasterUrl,
  timeoutSeconds,
  context
);
```

## Best Practices

### 1. Always Handle Both Error Types

```typescript
try {
  await sendUserOpWithResilience(wallet, calls, options);
} catch (error) {
  if (isMaxRetriesExceededError(error)) {
    // Show retry option to user
  } else if (isUnrecoverableTransactionError(error)) {
    // Show specific guidance based on failure type
  }
}
```

### 2. Use Callbacks for UI Updates

```typescript
const result = await sendUserOpWithResilience(wallet, calls, {
  resilience: {
    onRetry: ({ attempt, maxAttempts }) => {
      showProgress(`Attempt ${attempt} of ${maxAttempts}...`);
    },
  },
});
```

### 3. Configure Sponsored Fallback for Better UX

```typescript
const result = await sendUserOpWithResilience(wallet, calls, {
  resilience: {
    fallbackToSponsored: true,
    fallbackPaymasterUrl: process.env.BACKUP_PAYMASTER_URL,
    onFallbackToSponsored: () => {
      analytics.track('sponsored_fallback_used');
    },
  },
});
```

### 4. Set Reasonable Limits

```typescript
const result = await sendUserOpWithResilience(wallet, calls, {
  resilience: {
    maxRetries: 3,        // Don't retry indefinitely
    maxDelayMs: 30000,    // Cap the delay
    gasMultiplier: 1.5,   // Don't increase gas too much
  },
});
```

## Testing

The module includes comprehensive tests:

```bash
npm run test -- --run src/interface/payment/utils/resilience/
```

## Migration Guide

### From `sendUserOpAndWait`

Before:
```typescript
const txHash = await sendUserOpAndWait(
  networkSmartWallet,
  calls,
  paymasterUrl,
  timeoutSeconds,
  context
);
```

After (minimal change):
```typescript
const txHash = await sendUserOpAndWaitWithResilience(
  networkSmartWallet,
  calls,
  paymasterUrl,
  timeoutSeconds,
  context
);
```

After (with full resilience):
```typescript
const result = await sendUserOpWithResilience(
  networkSmartWallet,
  calls,
  {
    paymasterUrl,
    timeoutSeconds,
    context,
    resilience: {
      maxRetries: 3,
      autoGasAdjust: true,
    },
  }
);
const txHash = result.transactionHash;
```
