# Test Scripts

This directory contains test scripts for validating the Base Account SDK.

## Scripts Overview

### 1. Smoke Test (`smoke-test.mjs`)

A Node.js-based smoke test that verifies basic SDK functionality without requiring a browser or user interaction.

**Purpose:**
- Validate SDK builds are complete
- Test module imports and exports
- Verify function types and constants
- Test basic non-interactive operations (e.g., Prolink encoding/decoding)

**Usage:**
```bash
# From the root of the repository
yarn test:smoke

# Or directly with node
node scripts/smoke-test.mjs
```

**What it tests:**
- ✅ SDK dist folder exists
- ✅ Main entry points are available
- ✅ Core exports (createBaseAccountSDK, VERSION, etc.)
- ✅ Payment module exports (pay, subscribe, prepareCharge, etc.)
- ✅ Prolink module exports (encode, decode, createUrl)
- ✅ Constants validation (TOKENS, CHAIN_IDS)
- ✅ Function type validation
- ✅ Prolink encoding/decoding (functional test)

**Requirements:**
- SDK must be built first: `yarn build:packages`
- No browser required
- No user interaction required

---

### 2. E2E Test Playground

**⚠️ NOTE:** E2E tests have been moved to the testapp playground for easier testing and development!

**New Location:** `examples/testapp/src/pages/e2e-test/index.page.tsx`

**Purpose:**
- Test complete SDK workflows end-to-end
- Trigger and validate SDK popups
- Test wallet connections and transactions
- Test payment and subscription features
- Validate all user-facing SDK functionality
- Integrated with the full testapp development environment

**Usage:**
```bash
# From the examples/testapp directory
cd examples/testapp
yarn dev

# Open http://localhost:3000/e2e-test in your browser
# Or navigate to "E2E Test" from the Pages menu
```

**What it tests:**

#### SDK Initialization & Exports
- SDK initialization
- All major SDK exports (pay, subscribe, prolink functions, etc.)

#### Account Connection
- Connect Wallet (triggers SDK popup)
- Get Accounts
- Get Chain ID

#### Payment Features
- Pay (one-time payment)
- Subscription creation

#### Prolink Features
- Encode Prolink
- Decode Prolink
- Create Prolink URL

#### Sub-Account Features
- Sub-account API validation

#### Sign & Send
- Sign Message (personal_sign)

**Features:**
- 🎨 Modern React/TypeScript UI with Chakra UI
- 📊 Real-time test statistics and results
- 📝 Console logging for all operations
- 🔄 Comprehensive test categories
- ✅ Visual pass/fail indicators with detailed error messages
- ⚡ Fast, maintainable, and integrated with full testapp

**Requirements:**
- SDK must be built first: `yarn build:packages`
- Modern web browser
- User interaction required for wallet connection tests

---

## Workflow

### For Quick Validation (CI/Automated)
```bash
# Build the SDK
yarn build:packages

# Run smoke test
yarn test:smoke
```

### For Full Manual Testing
```bash
# Build the SDK
yarn build:packages

# Start testapp development server
cd examples/testapp
yarn dev

# Open http://localhost:3000/e2e-test in your browser
# Click "Run All Tests" or test individual features
```

---

## Development Tips

### Testing Local Changes

1. Make your changes to the SDK source code
2. Rebuild: `yarn build:packages`
3. Run smoke test to verify builds: `yarn test:smoke`
4. Run E2E tests for interactive validation: Start testapp (`cd examples/testapp && yarn dev`) and open http://localhost:3000/e2e-test

### Debugging E2E Tests

The E2E test page includes:
- **Console panel:** Shows all SDK operations in real-time
- **Browser DevTools:** Use for detailed debugging
- **Status indicators:** Each test shows pending/success/error states
- **Test statistics:** Track pass/fail counts

### Common Issues

**"Build Required" Error**
- Solution: Run `yarn build:packages` first

**SDK Popup Not Appearing**
- Check browser console for errors
- Verify SDK is initialized (click "Initialize SDK" button first)
- Ensure popup blockers are disabled

**CORS Errors**
- The E2E server sets proper CORS headers
- If issues persist, check browser security settings

**Module Import Errors**
- Ensure SDK is built: `yarn build:packages`
- Check that `dist/` folder exists with all files
- Try clearing browser cache

---

## Adding New Tests

### Adding to Smoke Test

Edit `smoke-test.mjs` and add your test in the appropriate section:

```javascript
logSection('My New Feature');

let myModule;
try {
  myModule = await import('../packages/account-sdk/dist/my-feature/index.js');
  logTest('My feature module imports', true);
} catch (error) {
  logTest('My feature module imports', false, error.message);
}

logTest('myFunction is exported', isDefined(myModule.myFunction));
```

### Adding to E2E Test

Edit `examples/testapp/src/pages/e2e-test/index.page.tsx` and:

1. Add a new test function:
```typescript
const testMyFeature = async () => {
  const category = 'My Feature Category';
  
  try {
    updateTestStatus(category, 'My Feature Test', 'running');
    addLog('info', 'Testing my feature...');
    
    const result = await myFeatureFunction();
    
    updateTestStatus(
      category,
      'My Feature Test',
      'passed',
      undefined,
      `Result: ${result}`
    );
    addLog('success', `My feature test passed: ${result}`);
  } catch (error) {
    updateTestStatus(
      category,
      'My Feature Test',
      'failed',
      error instanceof Error ? error.message : 'Unknown error'
    );
    addLog('error', `My feature test failed: ${error}`);
  }
};
```

2. Call the test function in `runAllTests()`:
```typescript
await testMyFeature();
await new Promise((resolve) => setTimeout(resolve, 500));
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build SDK
  run: yarn build:packages

- name: Run Smoke Tests
  run: yarn test:smoke

# E2E tests typically require manual testing or browser automation
# For automated E2E testing, consider using Playwright or Puppeteer
```

---

## Resources

- [SDK Documentation](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [SDK Technical Design](../docs/BASE_PAY_SDK_TECHNICAL_DESIGN.md)

