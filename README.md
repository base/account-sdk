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

---

## Base Subscriptions - Quick Start

**Base Subscriptions lets you create recurring USDC payments**

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
// (This step requires your app's wallet to execute the transaction)
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

4. Make more requests

   ```js
   provider.request('personal_sign', [
     `0x${Buffer.from('test message', 'utf8').toString('hex')}`,
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
