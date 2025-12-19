# E2E Test Playground

A comprehensive end-to-end test suite for the Base Account SDK, integrated into the testapp for easy testing and development.

## Overview

This E2E test playground provides an interactive interface for testing all major SDK features end-to-end. It combines tests from various sources:

1. **Smoke tests** - Basic SDK initialization and exports
2. **Wallet connection** - Account connection and chain management
3. **Payment features** - One-time payments and status checking
4. **Subscription features** - Recurring payments and charging
5. **Prolink features** - Encoding, decoding, and URL generation
6. **Spend permissions** - Permission requests and spending
7. **Sub-account features** - Sub-account creation and management
8. **Sign & Send** - Message signing and transaction sending

## 🆕 Version Testing

The E2E test playground now supports testing different versions of the SDK:

- **Local Workspace**: Test your local development version (default)
- **NPM Registry**: Test any published npm version of `@base-org/account`

This allows you to:
- ✅ Verify backward compatibility with older SDK versions
- ✅ Test new features against the latest npm release
- ✅ Compare behavior between local changes and published versions
- ✅ Validate SDK upgrades before updating in your application

### How to Switch Versions

1. Navigate to the E2E Test page
2. Use the **SDK Version Selector** at the top of the page
3. Choose between "Local Workspace" or "NPM Registry"
4. If using NPM, select a version from the dropdown (latest or specific version)
5. Click "Load SDK" to load the selected version
6. Run your tests

The currently loaded version is always displayed in the header.

## SDK Version Selection

The playground header allows you to test against different SDK versions:

- **Local Build**: Test against your local workspace build (default)
- **NPM Package**: Test against published NPM versions
  - Select from the dropdown to choose a specific version
  - Includes "latest" and the 10 most recent published versions

When switching between sources or versions, the SDK will automatically reload and reinitialize.

## Running the Tests

### Local Development

```bash
cd examples/testapp
yarn dev
```

Then navigate to `http://localhost:3000/e2e-test` or select "E2E Test" from the Pages menu.

### Production Build

```bash
cd examples/testapp
yarn build
yarn start
```

Then navigate to `http://localhost:3000/e2e-test`.

## Test Categories

### 1. SDK Initialization & Exports

Tests that verify the SDK can be properly initialized and all expected functions are exported:

- ✅ SDK can be initialized
- ✅ `createBaseAccountSDK` is exported
- ✅ `base.pay` is exported
- ✅ `base.subscribe` is exported
- ✅ `base.prepareCharge` is exported
- ✅ `encodeProlink` is exported
- ✅ `decodeProlink` is exported
- ✅ `createProlinkUrl` is exported
- ✅ `VERSION` is exported

### 2. Wallet Connection

Tests for connecting to wallets and retrieving account information:

- ✅ Connect wallet (eth_requestAccounts)
- ✅ Get accounts (eth_accounts)
- ✅ Get chain ID (eth_chainId)

### 3. Payment Features

Tests for one-time payment functionality:

- ✅ `pay()` function creates payment
- ⏸ `getPaymentStatus()` checks payment status (requires payment ID)

### 4. Subscription Features

Tests for recurring payment functionality:

- ✅ `subscribe()` function creates subscription
- ⏸ `getSubscriptionStatus()` checks subscription status (requires subscription ID)
- ⏸ `prepareCharge()` prepares charge data (requires subscription ID)

### 5. Prolink Features

Tests for Prolink encoding/decoding:

- ✅ `encodeProlink()` encodes JSON-RPC request
- ✅ `decodeProlink()` decodes prolink payload
- ✅ `createProlinkUrl()` creates Base wallet deeplink

### 6. Spend Permissions

Tests for spend permission functionality:

- ⏸ `requestSpendPermission()` requests spend permission
- ⏸ `fetchPermissions()` fetches existing permissions
- ⏸ `prepareSpendCallData()` prepares spend call data

### 7. Sub-Account Features

Tests for sub-account management:

- ✅ Sub-account API exists
- ⏸ Create sub-account
- ⏸ Get sub-accounts
- ⏸ Add owner to sub-account

### 8. Sign & Send

Tests for signing and sending transactions:

- ✅ Sign message (personal_sign)
- ⏸ Send transaction (eth_sendTransaction)
- ⏸ Send calls (wallet_sendCalls)

## Adding New Tests

To add a new test to the E2E test suite:

### 1. Add Test Category (if needed)

If your test doesn't fit into an existing category, add a new one to the `testCategories` state:

```typescript
const [testCategories, setTestCategories] = useState<TestCategory[]>([
  // ... existing categories
  {
    name: 'My New Feature',
    tests: [],
    expanded: true,
  },
]);
```

### 2. Create Test Function

Add a new test function following this pattern:

```typescript
const testMyFeature = async () => {
  const category = 'My New Feature';

  if (!provider || !currentAccount) {
    updateTestStatus(category, 'My test name', 'skipped', 'Prerequisites not met');
    return;
  }

  try {
    updateTestStatus(category, 'My test name', 'running');
    
    const start = Date.now();
    // Perform your test here
    const result = await myFeatureFunction();
    const duration = Date.now() - start;
    
    updateTestStatus(
      category,
      'My test name',
      'passed',
      undefined,
      `Result: ${result}`,
      duration
    );
  } catch (error) {
    updateTestStatus(
      category,
      'My test name',
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
```

### 3. Add to Test Sequence

Add your test to the `runAllTests()` function:

```typescript
const runAllTests = async () => {
  // ... existing tests
  
  await testMyFeature();
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // ... rest of tests
};
```

### 4. Optional: Add Individual Test Button

If you want to allow running the test individually, add a button in the UI (currently all tests run together).

## Test Status Indicators

- ⏸ **Pending** - Test has not been run yet
- ⏳ **Running** - Test is currently executing
- ✅ **Passed** - Test completed successfully
- ❌ **Failed** - Test encountered an error
- ⊘ **Skipped** - Test was skipped due to unmet prerequisites

## Features

### Visual Test Results

- Real-time test execution with status updates
- Color-coded results (green = passed, red = failed, gray = skipped)
- Duration tracking for each test
- Detailed error messages for failed tests

### Console Logs

- Real-time console output showing all test operations
- Color-coded log levels (success, error, warning, info)
- Full test execution trace

### Connection Status

- Shows connected wallet address
- Displays current chain ID
- Updates in real-time

### Test Statistics

- Total tests run
- Tests passed
- Tests failed
- Tests skipped

## Testing Best Practices

1. **Run smoke tests first** - Ensure the SDK is built and basic exports work before running E2E tests
2. **Connect wallet early** - Many tests require a connected wallet
3. **Check prerequisites** - Some tests depend on others (e.g., getPaymentStatus needs a payment ID)
4. **Review logs** - The console logs provide valuable debugging information
5. **Test on testnet** - Use Base Sepolia (84532) for testing to avoid real transactions

## Troubleshooting

### SDK Not Loaded

**Error:** Tests fail with "SDK not loaded"

**Solution:** 
1. Check that the SDK loaded successfully - look for the green version badge in the header
2. If loading from npm, ensure you have internet connectivity
3. Check the browser console for errors
4. Try reloading the page

### NPM Version Not Loading

**Error:** "Failed to load SDK from npm"

**Possible causes:**
- No internet connection
- CDN (unpkg.com) is blocked or unavailable
- Invalid version number
- Version doesn't exist on npm

**Solution:**
1. Check your internet connection
2. Try loading `latest` version first
3. Verify the version exists on npm: https://www.npmjs.com/package/@base-org/account
4. Check browser console for detailed error messages
5. Try switching back to "Local Workspace" to continue testing

### SDK Not Initialized

**Error:** Tests fail with "SDK not initialized"

**Solution:** Ensure the SDK initialization test passed. Check the browser console for errors.

### Wallet Not Connected

**Error:** Tests fail with "Not connected" or "Prerequisites not met"

**Solution:** Make sure the wallet connection test passed. You may need to approve the connection in your wallet.

### Tests Skipped

**Issue:** Many tests show as skipped

**Cause:** Tests have dependencies that weren't met (e.g., no wallet connection, no SDK initialization)

**Solution:** Run tests in sequence using "Run All Tests" button, which handles dependencies automatically.

### Payment/Subscription Tests Fail

**Issue:** Payment or subscription tests fail

**Possible causes:**
- Not connected to testnet (should be Base Sepolia - 84532)
- Insufficient funds in wallet
- Invalid recipient address
- Network issues

**Solution:** Check chain ID, ensure you have testnet ETH/USDC, and verify network connectivity.

## Related Resources

- [Base Account SDK Documentation](https://docs.base.org/base-account)
- [Smoke Test](../../../../scripts/smoke-test.mjs)
- [Pay Playground](../pay-playground/)
- [Subscribe Playground](../subscribe-playground/)
- [Prolink Playground](../prolink-playground/)
- [Spend Permission Playground](../spend-permission/)

## Contributing

When adding new SDK features, please add corresponding E2E tests to this suite. This helps ensure all features are properly tested end-to-end.

See [CONTRIBUTING.md](../../../../../CONTRIBUTING.md) for more details on contributing to the SDK.

