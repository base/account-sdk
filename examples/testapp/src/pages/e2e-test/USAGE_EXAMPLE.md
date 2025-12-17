# User Interaction Modal - Usage Example

## Quick Start

To add user interaction modal to a new test that opens popups:

```typescript
// Example: Adding a new test that requires user interaction

const testNewWalletFeature = async () => {
  const category = 'Wallet Connection';

  if (!provider) {
    updateTestStatus(category, 'New Feature Test', 'skipped', 'SDK not initialized');
    return;
  }

  try {
    updateTestStatus(category, 'New Feature Test', 'running');
    addLog('info', 'Testing new wallet feature...');
    
    // 🔥 ADD THIS LINE before any action that opens a popup
    await requestUserInteraction('New Feature Test');
    
    // Now call the method that opens a popup
    const result = await provider.request({
      method: 'wallet_someNewMethod',
      params: [],
    });

    // Handle success
    updateTestStatus(
      category,
      'New Feature Test',
      'passed',
      undefined,
      `Result: ${result}`
    );
    addLog('success', 'New feature test passed!');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // 🔥 ADD THIS ERROR HANDLING for test cancellation
    if (errorMessage === 'Test cancelled by user') {
      updateTestStatus(category, 'New Feature Test', 'skipped', 'Cancelled by user');
      addLog('warning', 'Test cancelled by user');
      throw error; // Re-throw to stop test execution
    }
    
    // Handle other errors
    updateTestStatus(category, 'New Feature Test', 'failed', errorMessage);
    addLog('error', `New feature test failed: ${errorMessage}`);
  }
};
```

## When to Use

Add `requestUserInteraction()` before any operation that:
- Opens a new window or popup
- Makes a request to SCW (Smart Contract Wallet)
- **EXCEPT** for the very first test with an external request (e.g., `testConnectWallet`), which can use the "Run All Tests" button click as the user gesture
- Uses methods like:
  - `eth_requestAccounts`
  - `personal_sign`
  - `eth_signTypedData_v4`
  - `wallet_sendCalls`
  - `wallet_prepareCalls`
  - Any SDK method that opens the SCW interface

## When NOT to Use

Do NOT add `requestUserInteraction()` for:
- Read-only operations (`eth_accounts`, `eth_chainId`)
- Background operations that don't open popups
- Tests that don't interact with the wallet UI
- Status check operations (`getPaymentStatus`, `getPermissionStatus`)

## Integration Checklist

When adding a new test with user interaction:

- [ ] Add `await requestUserInteraction('Test Name')` before the popup-triggering action
- [ ] Add error handling for `'Test cancelled by user'`
- [ ] Mark test as 'skipped' when cancelled
- [ ] Re-throw the error to stop the test suite
- [ ] Add the test to the `runAllTests()` function with proper sequencing
- [ ] Add appropriate logging messages

## Testing Your Implementation

1. Start the dev server: `yarn dev`
2. Open the E2E test page: `http://localhost:3000/e2e-test`
3. Click "Run All Tests"
4. Verify your test shows the modal
5. Test both "Continue Test" and "Cancel Test" buttons
6. Verify keyboard shortcuts work (Enter/Escape)

## Common Patterns

### Simple Pattern (Most Tests)
```typescript
// Request interaction
await requestUserInteraction('Test Name');

// Call method
const result = await someMethod();
```

### With Complex Setup
```typescript
// Setup
const data = prepareData();

// Request interaction just before the popup
await requestUserInteraction('Test Name');

// Call method immediately after
const result = await methodThatOpensPopup(data);
```

### Multiple Popups in One Test
```typescript
// First popup
await requestUserInteraction('First Action');
const result1 = await firstMethod();

// Wait a bit
await new Promise(resolve => setTimeout(resolve, 500));

// Second popup
await requestUserInteraction('Second Action');
const result2 = await secondMethod();
```

## Troubleshooting

### Modal doesn't appear
- Check that `requestUserInteraction()` is being called
- Verify the hook is properly imported and used
- Check browser console for errors

### Popup still blocked
- Make sure `requestUserInteraction()` is called IMMEDIATELY before the popup
- Don't add delays between the modal and the popup action
- Check browser popup settings

### Test hangs
- Modal might be open but hidden behind other windows
- Check if there's a JavaScript error preventing the modal from rendering
- Verify the modal's `isOpen` state is being updated correctly

### Cancel doesn't stop tests
- Ensure you're checking for `'Test cancelled by user'` error message exactly
- Verify you're re-throwing the error after handling it
- Check that the `runAllTests()` function has try-catch wrapping

## Best Practices

1. **Call just before the popup**: Place `requestUserInteraction()` immediately before the action
2. **Use descriptive names**: The test name should clearly describe what's about to happen
3. **Handle cancellation**: Always add proper error handling for user cancellation
4. **Add delays between tests**: Use `setTimeout` between tests to avoid overwhelming the user
5. **Log appropriately**: Add info logs before and success/error logs after the action

