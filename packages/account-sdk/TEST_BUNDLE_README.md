# Base Account SDK Bundle Testing

This directory contains test files to verify the UMD bundle build of the Base Account SDK, including the new `createBaseAccountSDK` functionality.

## Test Files

- `test-bundle.html` - Browser-based interactive test page
- `test-bundle-node.cjs` - Node.js script to verify bundle structure
- `test-create-sdk.cjs` - Node.js script to test createBaseAccountSDK functionality
- `examples/create-sdk-example.html` - Real-world usage example

## Running the Tests

### 1. Build the Bundle

First, build the browser bundle:

```bash
cd packages/account-sdk
yarn build:browser
```

This creates:
- `dist/base-account.js` - Development bundle
- `dist/base-account.min.js` - Minified production bundle

### 2. Node.js Bundle Verification

Run the Node.js test to verify the bundle structure:

```bash
node test-bundle-node.cjs
```

This checks:
- ✅ Bundle file existence and sizes
- ✅ UMD format structure
- ✅ Global assignment (window.base)
- ✅ Core exports (pay, getPaymentStatus, constants)
- ✅ createBaseAccountSDK availability
- ✅ Sub-account functionality

### 3. CreateBaseAccountSDK Functionality Test

Run the dedicated createBaseAccountSDK test (requires built SDK):

```bash
# First build the full SDK (not just browser bundle)
yarn build

# Then run the test
node test-create-sdk.cjs
# or
./test-create-sdk.cjs
```

This tests:
- ✅ Basic SDK creation
- ✅ Custom configuration (wallet URL, paymaster URLs)
- ✅ Sub-account configuration
- ✅ Multiple SDK instances

### 4. Browser Testing

Start a local HTTP server:

```bash
python3 -m http.server 8080
# or if port 8080 is in use:
python3 -m http.server 8081
```

Then open `http://localhost:8080/test-bundle.html` in your browser.

## Test Coverage

The test bundle includes coverage for:

### 1. Bundle Loading
- Verifies `window.base` object is available
- Checks for `window.createBaseAccountSDK` function

### 2. Payment Functionality
- Tests the `pay()` method with testnet
- Simulates payment transactions

### 3. Payment Status
- Tests `getPaymentStatus()` method
- Checks transaction status retrieval

### 4. Constants
- Verifies CHAIN_IDS and TOKENS are accessible

### 5. CreateBaseAccountSDK (NEW)
The test includes three specific tests for the SDK creation functionality:

#### Basic SDK Creation
Tests creating an SDK instance with:
- App metadata (name, logo, chain IDs)
- Preferences (telemetry settings)
- Verifies the SDK object structure

#### SDK Provider Methods
Tests the provider functionality:
- Creates SDK with custom wallet URL
- Verifies provider methods (request, on, removeListener, etc.)
- Tests paymaster URL configuration

#### Sub-Account Methods
Tests sub-account functionality:
- Creates SDK with custom toOwnerAccount function
- Verifies sub-account.create() and sub-account.get() methods
- Tests sub-account retrieval (requires wallet connection)

### 6. Modal/Dialog Testing (NEW)
The test includes comprehensive modal testing functionality:

#### Modal Types Tested
1. **Popup Blocked Modal**
   - Appears when browser blocks required popups
   - Shows "{AppName} wants to continue in Base Account"
   - Offers "Try again" and "Cancel" options

2. **Insufficient Balance Modal**
   - Appears for sub-account spend permission issues
   - Offers to edit permission or use primary account

3. **Add Owner Modal**
   - Appears when re-authorization is needed
   - Shows when app loses account access

#### Testing Features
- **Modal Detection**: Uses MutationObserver to detect modal appearances
- **Live Monitoring**: Real-time tracking of dialog DOM changes
- **Interactive Testing**: Button to trigger popup-blocked scenario
- **CSS Selectors**: Complete list of modal-related CSS classes

#### How to Test Modals
1. Block popups in your browser
2. Click "Trigger Popup (Block to See Modal)" button
3. Observe the modal detection in the output

See `examples/modal-testing-guide.html` for a comprehensive modal testing guide.

## Expected Output

When running the browser tests, you should see:
- ✅ Bundle loaded successfully
- ✅ createBaseAccountSDK available
- ✅ All provider methods available
- ✅ Sub-account configuration successful

## Bundle Details

- **Format**: UMD (Universal Module Definition)
- **Global namespace**: `window.base`
- **Main exports**: 
  - `base.pay()`
  - `base.getPaymentStatus()`
  - `base.constants`
- **SDK Builder**: `window.createBaseAccountSDK()`
- **File sizes**: ~1.3MB (dev), ~520KB (minified) 