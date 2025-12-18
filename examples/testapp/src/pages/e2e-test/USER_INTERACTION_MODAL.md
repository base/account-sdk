# User Interaction Modal for E2E Tests

## Overview

The User Interaction Modal is a utility designed to prevent popup blockers from interfering with E2E tests that interact with Smart Contract Wallet (SCW). It ensures that each test requiring user interaction (opening popups/windows) has a valid user gesture immediately before the action.

## Problem

When running E2E tests that make requests to SCW, browsers' popup blockers can prevent the necessary popups from opening if there isn't a recent user interaction. This causes tests to fail even though the code is working correctly.

## Solution

A modal dialog appears before each test that requires user interaction, asking the user to either:
- **Continue Test**: Proceeds with the test (provides the required user gesture)
- **Cancel Test**: Stops the entire test suite

## Implementation

### Components

1. **`UserInteractionModal.tsx`** - The modal component that displays the prompt
   - Auto-focuses the "Continue" button for quick testing
   - Supports keyboard shortcuts (Enter to continue, Escape to cancel)
   - Shows the name of the test about to run

2. **`useUserInteraction.tsx`** - React hook that manages the modal state
   - Returns a promise-based API for requesting user interaction
   - Handles both continue and cancel scenarios

### Tests with User Interaction

The following tests require user interaction and will show the modal:

- `testPay()` - Creates a payment
- `testSubscribe()` - Creates a subscription
- `testRequestSpendPermission()` - Requests spend permission
- `testSignMessage()` - Signs a message with personal_sign
- `testSignTypedData()` - Signs typed data with eth_signTypedData_v4
- `testWalletSendCalls()` - Sends calls via wallet_sendCalls

**Note:** The following tests do NOT require user interaction:
- `testWalletPrepareCalls()` - Only prepares calls internally without opening a popup
- `testSignWithSubAccount()` - Subaccount signing is done locally without a popup
- `testSendCallsFromSubAccount()` - Subaccount transactions are signed locally without a popup

Subaccount operations don't require user interaction because subaccounts are controlled by the primary account and can sign transactions locally.

### Usage

In the E2E test file:

```typescript
// Before a test that opens a popup
await requestUserInteraction('Test Name');

// Then perform the action that opens a popup
const result = await provider.request({
  method: 'eth_requestAccounts',
  params: [],
});
```

### Error Handling

When a test is cancelled:
1. The modal promise rejects with `'Test cancelled by user'`
2. The test catches the error and marks itself as 'skipped'
3. The error is re-thrown to stop the test suite
4. The `runAllTests` function catches it and shows a cancellation toast

## User Experience

1. User clicks "Run All Tests"
2. The first test (`testConnectWallet`) runs immediately using the button click as the user gesture
3. For subsequent tests that need user interaction, a modal appears
4. User clicks "Continue Test" (or presses Enter)
5. Test continues immediately
6. Process repeats for each test requiring interaction

## Keyboard Shortcuts

- **Enter**: Continue with the test
- **Escape**: Cancel the test suite

