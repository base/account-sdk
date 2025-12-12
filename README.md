# Base Account SDK

[![npm](https://img.shields.io/npm/v/@base-org/account.svg)](https://www.npmjs.com/package/@base-org/account)

## Overview

The Base Account SDK provides two distinct sets of functionality:

### 1. **Base Pay & Base Subscriptions** (Standalone Functions)
Purely functional payment and subscription APIs that work immediately without any SDK setup or wallet connection.

### 2. **Base Account SDK** (Full SDK)
Complete SDK for connecting to Base Account wallets and interacting with the Ethereum blockchain.

---

## Base Pay - Quick Start

**Base Pay allows you to accept USDC payments with just 3 lines of code.** No SDK instantiation or wallet connection required.

### Installation

```bash
# npm
npm install @base-org/account

# yarn
yarn add @base-org/account
```

> **⚠️ Production Note:** Remember to set `testnet: false` (or omit it) when deploying to production!

### Accept a Payment

```typescript
import { pay } from '@base-org/account';

// That's it! Just call the pay function directly
const payment = await pay({
  amount: "10.50",                                    // Amount in USDC
  to: "0xYourWalletAddress",                         // Your wallet address
  testnet: true                                       // Use testnet for testing
});

console.log(`Payment successful! ID: ${payment.id}`);
```

### Check Payment Status

```typescript
import { getPaymentStatus } from '@base-org/account';

const status = await getPaymentStatus({
  id: payment.id,
  testnet: true
});

console.log(`Payment status: ${status.status}`);
```

### Error Handling

Always wrap payment operations in try-catch blocks:

```typescript
import { pay } from '@base-org/account';

try {
  const payment = await pay({
    amount: "10.50",
    to: "0xYourWalletAddress",
    testnet: true
  });
  
  console.log(`Payment successful! ID: ${payment.id}`);
} catch (error) {
  console.error('Payment failed:', error.message);
  // Handle the error appropriately
}
```

---

## Base Subscriptions - Quick Start

**Base Subscriptions let you create recurring USDC payments**

### Create a Subscription

```typescript
import { subscribe } from '@base-org/account';

// Create a monthly subscription - that's all!
const subscription = await subscribe({
  recurringCharge: "9.99",                           // Amount to charge per period
  subscriptionOwner: "0xYourAppAddress",             // Your app's address
  periodInDays: 30,                                  // Billing period
  testnet: true                                       // Use testnet for testing
});

console.log(`Subscription created! ID: ${subscription.id}`);
```

### Check Subscription Status

```typescript
import { getSubscriptionStatus } from '@base-org/account';

const status = await getSubscriptionStatus({
  id: subscription.id,
  testnet: true
});

console.log(`Active: ${status.isSubscribed}`);
console.log(`Next charge: ${status.nextPeriodStart}`);
```

### Charge a Subscription

```typescript
import { base } from '@base-org/account';

// Prepare the charge (get the transaction data)
const chargeCalls = await base.subscription.prepareCharge({
  id: subscription.id,
  amount: '9.99',        // or 'max-remaining-charge'
  testnet: true
});

// Execute the charge using your wallet provider
// Option 1: Using ethers.js
import { ethers } from 'ethers';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

for (const call of chargeCalls) {
  const tx = await signer.sendTransaction({
    to: call.to,
    data: call.data,
    value: call.value || 0,
  });
  await tx.wait();
  console.log(`Transaction confirmed: ${tx.hash}`);
}

// Option 2: Using Base Account SDK provider
const sdk = createBaseAccountSDK({ appName: 'Your App' });
const sdkProvider = sdk.getProvider();

for (const call of chargeCalls) {
  const txHash = await sdkProvider.request('eth_sendTransaction', [{
    to: call.to,
    data: call.data,
    value: call.value || 0,
  }]);
  console.log(`Transaction sent: ${txHash}`);
}
```


## Base Account SDK (Full SDK)

For applications that need full wallet connectivity and blockchain interactions beyond payments:

1. [Base Account](https://account.base.app)
   - [Docs](https://docs.base.org/base-account/quickstart/web)

### Installing the SDK

```bash
# npm
npm install @base-org/account

# yarn
yarn add @base-org/account
```

### SDK Setup and Usage

> **Note:** The following sections apply only to the full Base Account SDK functionality. For payments and subscriptions, use the standalone functions shown above.

#### Upgrading the SDK

1. Compare the installed version with the latest:

   ```shell
   # yarn
   yarn outdated @base-org/account

   # npm
   npm outdated @base-org/account
   ```

2. Update to latest:

   ```shell
   # yarn
   yarn upgrade @base-org/account --latest

   # npm
   npm update @base-org/account
   ```

#### Basic SDK Usage

1. Initialize the SDK

   ```js
   const sdk = createBaseAccountSDK({
     appName: 'SDK Playground',
   });
   ```

2. Make Base Account Provider

   ```js
   const provider = sdk.getProvider();
   ```

3. Request accounts to initialize a connection to wallet

   ```js
   const addresses = await provider.request({
     method: 'eth_requestAccounts',
   });
   ```

4. Make more requests

   ```js
   // Helper function to convert string to hex (browser-compatible)
   function stringToHex(str) {
     return '0x' + Array.from(new TextEncoder().encode(str))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('');
   }

   const signature = await provider.request('personal_sign', [
     stringToHex('test message'),
     addresses[0],
   ]);
   ```

5. Handle provider events

   ```js
   provider.on('connect', (info) => {
     setConnect(info);
   });

   provider.on('disconnect', (error) => {
     setDisconnect({ code: error.code, message: error.message });
   });

   provider.on('accountsChanged', (accounts) => {
     setAccountsChanged(accounts);
   });

   provider.on('chainChanged', (chainId) => {
     setChainChanged(chainId);
   });

   provider.on('message', (message) => {
     setMessage(message);
   });
   ```

### Developing locally and running the test app

- The Base Account SDK test app can be viewed here https://base.github.io/account-sdk/.
- To run it locally follow these steps:

  1. Fork this repo and clone it
  1. From the root dir run `yarn install`
  1. From the root dir run `yarn dev`
