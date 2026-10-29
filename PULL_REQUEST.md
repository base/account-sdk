# Pull Request: Self-Healing Transactions (Resilience Module)

## Summary

This PR introduces a **resilience module** for self-healing blockchain transactions in the Base Account SDK. The module provides automatic retry mechanisms, intelligent error classification, and recovery actions to dramatically improve transaction success rates and developer experience.

### Key Changes

- ✅ New `sendUserOpWithResilience()` function with configurable retry logic
- ✅ Intelligent failure analysis (recoverable vs. unrecoverable errors)
- ✅ Automatic gas adjustment on out-of-gas failures
- ✅ Automatic nonce correction on nonce-related issues
- ✅ Fallback to sponsored transactions on insufficient funds
- ✅ Rich error types with recovery suggestions
- ✅ Progress callbacks for UI updates
- ✅ Comprehensive test coverage (87 tests)

## Problem Statement

Currently, `sendUserOpAndWait` in the SDK:
1. **Has no retry logic** - A single network hiccup causes complete failure
2. **Generic error handling** - Errors like "User operation failed" provide no guidance
3. **No recovery mechanisms** - Gas, nonce, and funding issues require manual intervention
4. **No visibility** - Developers can't track what's happening during execution

```typescript
// Current behavior - fails immediately on any error
const result = await sendUserOpAndWait(wallet, calls, paymaster, 60, 'payment');
// If this fails, developer must handle everything manually
```

## Solution

The resilience module wraps transaction execution with:

### 1. Automatic Retries with Backoff

```typescript
const result = await sendUserOpWithResilience(wallet, calls, {
  resilience: {
    maxRetries: 3,
    backoff: 'exponential',  // 1s → 2s → 4s
    initialDelayMs: 1000,
  },
});
```

### 2. Intelligent Failure Classification

| Recoverable | Unrecoverable |
|-------------|---------------|
| OUT_OF_GAS | USER_REJECTED |
| NONCE_TOO_LOW | CONTRACT_REVERT |
| NETWORK_ERROR | INSUFFICIENT_BALANCE |
| TIMEOUT | PERMISSION_DENIED |
| RPC_ERROR | INVALID_PARAMS |

### 3. Automatic Recovery Actions

```typescript
const result = await sendUserOpWithResilience(wallet, calls, {
  resilience: {
    autoGasAdjust: true,      // Increase gas on out-of-gas
    autoNonceCorrect: true,   // Fix nonce issues
    fallbackToSponsored: true, // Use paymaster if user can't pay gas
    fallbackPaymasterUrl: 'https://backup-paymaster.com',
  },
});
```

### 4. Progress Callbacks

```typescript
const result = await sendUserOpWithResilience(wallet, calls, {
  resilience: {
    onRetry: ({ attempt, maxAttempts, nextAction }) => {
      showToast(`Attempt ${attempt}/${maxAttempts}: ${nextAction}`);
    },
    onFallbackToSponsored: () => {
      analytics.track('sponsored_fallback_used');
    },
  },
});
```

### 5. Rich Error Types

```typescript
try {
  await sendUserOpWithResilience(wallet, calls, options);
} catch (error) {
  if (isMaxRetriesExceededError(error)) {
    console.log(`Failed after ${error.attempts} attempts`);
    console.log(error.getRecoverySummary());
  } else if (isUnrecoverableTransactionError(error)) {
    console.log(error.getSuggestedActions());
  }
}
```

## Files Changed

### New Files

| File | Description |
|------|-------------|
| `resilience/types.ts` | Type definitions for resilience config, callbacks, and results |
| `resilience/errors.ts` | Custom error classes (`MaxRetriesExceededError`, `UnrecoverableTransactionError`) |
| `resilience/utils.ts` | Utility functions (failure analysis, backoff calculation, validation) |
| `resilience/sendUserOpWithResilience.ts` | Main resilience function |
| `resilience/index.ts` | Module exports |
| `resilience/RESILIENCE.md` | Comprehensive documentation |

### Test Files

| File | Tests |
|------|-------|
| `resilience/errors.test.ts` | 20 tests for error classes |
| `resilience/utils.test.ts` | 48 tests for utility functions |
| `resilience/sendUserOpWithResilience.test.ts` | 19 tests for main function |

### Modified Files

| File | Change |
|------|--------|
| `interface/payment/index.ts` | Added exports for resilience module |

## Test Results

```
✓ src/interface/payment/utils/resilience/errors.test.ts (20 tests)
✓ src/interface/payment/utils/resilience/utils.test.ts (48 tests)
✓ src/interface/payment/utils/resilience/sendUserOpWithResilience.test.ts (19 tests)

Test Files  3 passed (3)
     Tests  87 passed (87)
```

## Backward Compatibility

This PR is **fully backward compatible**:

1. **No changes to existing functions** - `sendUserOpAndWait` remains unchanged
2. **Drop-in replacement available** - `sendUserOpAndWaitWithResilience` has the same signature
3. **Opt-in resilience** - Default config is sensible, advanced features are opt-in

```typescript
// Minimal migration (same signature)
const txHash = await sendUserOpAndWaitWithResilience(
  wallet, calls, paymaster, 60, 'payment'
);
```

## Usage Example

```typescript
import {
  sendUserOpWithResilience,
  isMaxRetriesExceededError,
} from '@base-org/account/payment';

async function chargeSubscription(subscriptionId: string, amount: string) {
  const calls = await prepareCharge({ id: subscriptionId, amount });

  try {
    const result = await sendUserOpWithResilience(networkSmartWallet, calls, {
      timeoutSeconds: 60,
      context: 'subscription charge',
      resilience: {
        maxRetries: 3,
        fallbackToSponsored: true,
        fallbackPaymasterUrl: process.env.BACKUP_PAYMASTER,
        onRetry: ({ attempt }) => {
          console.log(`Charge attempt ${attempt}...`);
        },
      },
    });

    return { success: true, txHash: result.transactionHash };

  } catch (error) {
    if (isMaxRetriesExceededError(error)) {
      return {
        success: false,
        error: 'Transaction failed after multiple attempts',
        details: error.getRecoverySummary(),
      };
    }
    throw error;
  }
}
```

## Performance Considerations

- **Minimal overhead on success**: If the first attempt succeeds, there's negligible overhead
- **Configurable limits**: `maxRetries` capped at 10, `gasMultiplier` capped at 3x
- **Smart backoff**: Exponential backoff with jitter prevents thundering herd
- **Early termination**: Unrecoverable errors throw immediately without retrying

## Documentation

Full documentation is available in [`RESILIENCE.md`](./packages/account-sdk/src/interface/payment/utils/resilience/RESILIENCE.md).

## Checklist

- [x] Implementation complete
- [x] Tests written and passing (87 tests)
- [x] TypeScript types exported
- [x] Documentation written
- [x] Backward compatible
- [x] No breaking changes to existing API

## Request for Review

This PR is ready for review. Please focus on:

1. **Error classification logic** in `utils.ts` - Are the regex patterns comprehensive?
2. **Default configuration** in `types.ts` - Are the defaults sensible?
3. **Recovery action logic** in `sendUserOpWithResilience.ts` - Is the decision tree correct?
4. **API design** - Is the interface intuitive and consistent with the rest of the SDK?

### Reviewer Checklist

- [ ] Code follows project conventions
- [ ] Error handling is appropriate
- [ ] Tests cover edge cases
- [ ] Documentation is clear
- [ ] No security concerns
- [ ] Performance is acceptable

---

**Author**: Claude AI
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
