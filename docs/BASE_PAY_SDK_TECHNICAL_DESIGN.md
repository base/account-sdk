# Base Pay SDK – Technical Design Document

**Author:** Spencer Stock  
**Last Updated:** December 2024

---

## Table of Contents
1. [Introduction](#introduction)
2. [Solution Overview](#solution-overview)
3. [Architecture](#architecture)
4. [Core API Reference](#core-api-reference)
5. [UI Components](#ui-components)
6. [Integration Guide](#integration-guide)
7. [Security & Non-Custodial Design](#security--non-custodial-design)
8. [Roadmap](#roadmap)

---

## Introduction

Base Pay SDK enables merchants to accept one-click USDC payments on the Base network using Coinbase Wallet. The SDK provides a simple, Apple Pay-like checkout experience while maintaining the security and control of non-custodial crypto payments.

### Design Goals

1. **Minimal friction for customers** – One-click payments with no forms or manual address entry
2. **Easy integration for developers** – Drop-in components and simple async functions
3. **Non-custodial security** – Direct wallet-to-wallet transfers, no intermediary custody
4. **Immediate settlement** – Payments settle on-chain in seconds

### Package Overview

| Package | Purpose |
|---------|---------|
| `@base-org/account` | Core SDK with payment APIs and wallet provider |
| `@base-org/account-ui` | Pre-built UI components (React, Vue, Svelte, Preact) |

---

## Solution Overview

### User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAYMENT FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Customer clicks        2. Wallet prompts       3. Payment confirmed     │
│     "Pay with Base"           for approval             immediately          │
│                                                                             │
│  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐        │
│  │  Merchant     │  ───▶  │  Coinbase     │  ───▶  │  Transaction  │        │
│  │  Website      │        │  Wallet       │        │  Complete     │        │
│  │               │        │               │        │               │        │
│  │ [Pay $10.50]  │        │ "Send 10.50   │        │ ✓ Success!    │        │
│  │               │        │  USDC to..."  │        │               │        │
│  └───────────────┘        └───────────────┘        └───────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **Merchant integrates SDK** – Add the SDK to their site and place a Pay button
2. **Customer initiates payment** – Click triggers `pay()` which creates a USDC transfer call
3. **Wallet approval** – Customer approves the transaction in their Coinbase Wallet
4. **On-chain settlement** – USDC transfers directly from customer to merchant wallet
5. **Confirmation** – SDK returns transaction hash; merchant can verify on-chain

---

## Architecture

### Package Structure

```
@base-org/account/
├── Core SDK
│   ├── pay()                    # One-time payments
│   ├── subscribe()              # Recurring payments (spend permissions)
│   ├── getPaymentStatus()       # Check payment status
│   └── base.subscription.*      # Subscription management
│
├── Provider
│   ├── createBaseAccountSDK()   # Create wallet provider
│   └── provider.request()       # EIP-1193 compatible requests
│
└── Utilities
    ├── encodeProlink()          # Payment link encoding
    └── createProlinkUrl()       # Generate payment URLs

@base-org/account-ui/
├── react/
│   ├── BasePayButton            # Pay button component
│   └── SignInWithBaseButton     # Sign-in button component
├── vue/
├── svelte/
└── preact/
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Network | Base (L2), Base Sepolia (testnet) |
| Token | USDC (6 decimals) |
| Wallet Protocol | EIP-1193, wallet_sendCalls (EIP-5792) |
| Subscriptions | Spend Permissions (EIP-7715) |
| UI Framework | Preact (core), React/Vue/Svelte wrappers |

### Network Constants

```typescript
const CHAIN_IDS = {
  base: 8453,
  baseSepolia: 84532,
};

const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  baseSepolia: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};
```

---

## Core API Reference

### One-Time Payments

#### `pay(options): Promise<PaymentResult>`

Send a one-time USDC payment to a specified address.

```typescript
import { pay } from '@base-org/account';

const result = await pay({
  amount: "10.50",                                    // USDC amount as string
  to: "0xMerchantAddress...",                        // Recipient address
  testnet: false,                                    // Use mainnet (default)
  payerInfo: {                                       // Optional: request payer info
    requests: [
      { type: 'email' },
      { type: 'physicalAddress', optional: true },
    ],
    callbackURL: 'https://merchant.com/webhook'
  }
});

// Result
{
  success: true,
  id: "0x...",                    // Transaction hash
  amount: "10.50",
  to: "0xMerchantAddress...",
  payerInfoResponses?: {          // If payerInfo was requested
    email: "customer@example.com",
    physicalAddress: { ... }
  }
}
```

**Options:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `amount` | `string` | Yes | USDC amount (e.g., "10.50") |
| `to` | `string` | Yes | Recipient Ethereum address |
| `testnet` | `boolean` | No | Use Base Sepolia testnet (default: false) |
| `payerInfo` | `PayerInfo` | No | Request additional payer information |
| `telemetry` | `boolean` | No | Enable telemetry logging (default: true) |

#### `getPaymentStatus(options): Promise<PaymentStatus>`

Check the status of a payment transaction.

```typescript
import { getPaymentStatus } from '@base-org/account';

const status = await getPaymentStatus({
  id: "0xTransactionHash...",
  testnet: false
});

// Possible statuses: 'pending' | 'completed' | 'failed' | 'not_found'
if (status.status === 'completed') {
  console.log(`Payment of ${status.amount} USDC received`);
}
```

### Subscriptions (Recurring Payments)

Subscriptions use EIP-7715 Spend Permissions to enable recurring charges without repeated user approval.

#### `subscribe(options): Promise<SubscriptionResult>`

Create a subscription by requesting a spend permission from the user.

```typescript
import { subscribe } from '@base-org/account';

const subscription = await subscribe({
  recurringCharge: "9.99",                          // Monthly charge amount
  subscriptionOwner: "0xYourAppAddress...",         // Address that can charge
  periodInDays: 30,                                 // Billing period
  testnet: false
});

// Result
{
  id: "0xPermissionHash...",           // Subscription ID (permission hash)
  subscriptionOwner: "0x...",          // Your app's address
  subscriptionPayer: "0x...",          // Customer's wallet address
  recurringCharge: "9.99",
  periodInDays: 30
}
```

#### `base.subscription.getStatus(options): Promise<SubscriptionStatus>`

Check the current status of a subscription.

```typescript
import { base } from '@base-org/account';

const status = await base.subscription.getStatus({
  id: "0xPermissionHash...",
  testnet: false
});

// Result
{
  isSubscribed: true,
  recurringCharge: "9.99",
  remainingChargeInPeriod: "9.99",
  currentPeriodStart: Date,
  nextPeriodStart: Date,
  periodInDays: 30,
  subscriptionOwner: "0x..."
}
```

#### `base.subscription.prepareCharge(options): Promise<PrepareChargeResult>`

Prepare call data to charge a subscription. Use this on the client side to build the transaction.

```typescript
import { base } from '@base-org/account';

const chargeCalls = await base.subscription.prepareCharge({
  id: "0xPermissionHash...",
  amount: "9.99",                    // Or 'max-remaining-charge'
  recipient: "0xTreasuryAddress..."  // Optional: redirect funds
});

// Execute using your wallet provider
await provider.request({
  method: 'wallet_sendCalls',
  params: [{
    version: '2.0.0',
    chainId: 8453,
    calls: chargeCalls,
  }],
});
```

#### Server-Side Subscription Management (Node.js only)

These functions require CDP SDK credentials and are only available in Node.js environments.

```typescript
import { base } from '@base-org/account/payment';

// Create a subscription owner wallet
const owner = await base.subscription.getOrCreateSubscriptionOwnerWallet({
  cdpApiKeyId: process.env.CDP_API_KEY_ID,
  cdpApiKeySecret: process.env.CDP_API_KEY_SECRET,
  cdpWalletSecret: process.env.CDP_WALLET_SECRET,
});

// Charge a subscription
const charge = await base.subscription.charge({
  id: "0xPermissionHash...",
  amount: "9.99",
});

// Revoke a subscription
const revoke = await base.subscription.revoke({
  id: "0xPermissionHash...",
});
```

### Payer Information Requests

Request additional information from customers during payment using data callbacks.

**Supported Types:**

| Type | Description |
|------|-------------|
| `email` | Customer's email address |
| `physicalAddress` | Shipping/billing address |
| `phoneNumber` | Phone number with country code |
| `name` | First and family name |
| `onchainAddress` | Customer's wallet address |

```typescript
const result = await pay({
  amount: "25.00",
  to: "0xMerchant...",
  payerInfo: {
    requests: [
      { type: 'email', optional: false },
      { type: 'physicalAddress', optional: true },
      { type: 'name', optional: true },
    ],
    callbackURL: 'https://merchant.com/api/payer-info'
  }
});

// Access responses
if (result.payerInfoResponses) {
  const { email, physicalAddress, name } = result.payerInfoResponses;
}
```

---

## UI Components

### Installation

```bash
npm install @base-org/account-ui
```

### React

```tsx
import { BasePayButton } from '@base-org/account-ui/react';
import { pay } from '@base-org/account';

function Checkout({ amount, merchantAddress }) {
  const handleClick = async () => {
    const result = await pay({
      amount,
      to: merchantAddress,
    });
    console.log('Payment complete:', result.id);
  };

  return (
    <BasePayButton 
      onClick={handleClick}
      colorScheme="light"  // 'light' | 'dark' | 'system'
    />
  );
}
```

### Vue

```vue
<template>
  <BasePayButton @click="handlePayment" colorScheme="dark" />
</template>

<script setup>
import { BasePayButton } from '@base-org/account-ui/vue';
import { pay } from '@base-org/account';

const handlePayment = async () => {
  await pay({ amount: "10.00", to: merchantAddress });
};
</script>
```

### Svelte

```svelte
<script>
import { BasePayButton } from '@base-org/account-ui/svelte';
import { pay } from '@base-org/account';
</script>

<BasePayButton on:click={() => pay({ amount: "10.00", to: merchantAddress })} />
```

### Component Props

#### BasePayButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Button color theme |
| `onClick` | `() => void` | - | Click handler |

#### SignInWithBaseButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `align` | `'left' \| 'center'` | `'center'` | Button alignment |
| `variant` | `'solid' \| 'transparent'` | `'solid'` | Button style |
| `colorScheme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `onClick` | `() => void` | - | Click handler |

---

## Integration Guide

### Minimal Integration (Script Tag)

For simple integrations without build tools:

```html
<script src="https://unpkg.com/@base-org/account/dist/base-account.min.js"></script>

<button id="pay-button">Pay $10.00</button>

<script>
document.getElementById('pay-button').addEventListener('click', async () => {
  const result = await window.base.pay({
    amount: "10.00",
    to: "0xYourMerchantAddress..."
  });
  
  if (result.success) {
    alert('Payment successful! TX: ' + result.id);
  }
});
</script>
```

### React Integration

```tsx
import { useState } from 'react';
import { BasePayButton } from '@base-org/account-ui/react';
import { pay, getPaymentStatus } from '@base-org/account';

function CheckoutPage({ product }) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  const handlePayment = async () => {
    setStatus('processing');
    
    try {
      const result = await pay({
        amount: product.price,
        to: process.env.MERCHANT_ADDRESS,
        payerInfo: {
          requests: [{ type: 'email' }]
        }
      });
      
      // Optionally verify the payment
      const paymentStatus = await getPaymentStatus({
        id: result.id
      });
      
      if (paymentStatus.status === 'completed') {
        setStatus('success');
        // Redirect to confirmation page or update order status
      }
    } catch (error) {
      setStatus('error');
      console.error('Payment failed:', error);
    }
  };

  return (
    <div>
      <h2>{product.name}</h2>
      <p>${product.price} USDC</p>
      
      {status === 'idle' && (
        <BasePayButton onClick={handlePayment} />
      )}
      {status === 'processing' && <p>Processing payment...</p>}
      {status === 'success' && <p>Payment successful!</p>}
      {status === 'error' && <p>Payment failed. Please try again.</p>}
    </div>
  );
}
```

### Subscription Integration

```tsx
import { subscribe, base } from '@base-org/account';

// Client-side: Create subscription
async function createSubscription() {
  const result = await subscribe({
    recurringCharge: "9.99",
    subscriptionOwner: SUBSCRIPTION_OWNER_ADDRESS,
    periodInDays: 30,
  });
  
  // Save result.id (permission hash) to your database
  await saveSubscription(result.id, result.subscriptionPayer);
  
  return result;
}

// Server-side: Check and charge subscriptions (Node.js)
async function processBilling(subscriptionId: string) {
  // Check if subscription is active and has remaining allowance
  const status = await base.subscription.getStatus({
    id: subscriptionId,
  });
  
  if (!status.isSubscribed) {
    console.log('Subscription is not active');
    return;
  }
  
  // Charge the subscription
  const charge = await base.subscription.charge({
    id: subscriptionId,
    amount: status.recurringCharge,
  });
  
  console.log('Charge successful:', charge.id);
}
```

---

## Security & Non-Custodial Design

### Key Security Properties

1. **Non-custodial** – The SDK never has access to user private keys. All transactions require explicit user approval in their wallet.

2. **Direct transfers** – Payments go directly from customer wallet to merchant wallet. No intermediary holds funds.

3. **On-chain verification** – All payments are verifiable on the Base blockchain. Use `getPaymentStatus()` or check block explorers.

4. **Spend permission limits** – Subscriptions use spend permissions with strict limits:
   - Maximum amount per period
   - Fixed period duration
   - Specific spender address only
   - Can be revoked by user at any time

### Best Practices

```typescript
// ✅ Always validate payment status server-side
const status = await getPaymentStatus({ id: paymentId });
if (status.status !== 'completed') {
  throw new Error('Payment not confirmed');
}

// ✅ Store transaction hashes for auditing
await database.orders.update({
  where: { id: orderId },
  data: { transactionHash: result.id }
});

// ✅ Use environment variables for sensitive config
const merchantAddress = process.env.MERCHANT_WALLET_ADDRESS;

// ❌ Don't trust client-side only verification for high-value orders
```

---

## Roadmap

### Current Features (v1.0)

- ✅ One-time USDC payments on Base
- ✅ Subscription payments using spend permissions
- ✅ Payment status checking
- ✅ Payer information requests (email, address, phone, name)
- ✅ Pre-built UI components (React, Vue, Svelte, Preact)
- ✅ Script tag / CDN support
- ✅ Base Sepolia testnet support
- ✅ Server-side subscription management (charge, revoke)

### Planned Features

| Feature | Description | Status |
|---------|-------------|--------|
| Multi-token support | Accept ETH, USDT, and other tokens | Planned |
| Fiat onramp | Apple Pay / card → USDC conversion | Planned |
| Merchant dashboard | Payment analytics and management | Planned |
| Webhooks | Server-to-server payment notifications | Planned |
| Refunds API | Programmatic refund support | Planned |
| Mobile SDK | Native iOS/Android libraries | Planned |

---

## Appendix

### Type Definitions

```typescript
interface PaymentOptions {
  amount: string;
  to: string;
  testnet?: boolean;
  payerInfo?: PayerInfo;
  telemetry?: boolean;
}

interface PaymentResult {
  success: true;
  id: string;
  amount: string;
  to: Address;
  payerInfoResponses?: PayerInfoResponses;
}

interface PaymentStatus {
  status: 'pending' | 'completed' | 'failed' | 'not_found';
  id: Hex;
  message: string;
  sender?: string;
  amount?: string;
  recipient?: string;
  reason?: string;
}

interface SubscriptionOptions {
  recurringCharge: string;
  subscriptionOwner: string;
  periodInDays?: number;
  testnet?: boolean;
  requireBalance?: boolean;
}

interface SubscriptionResult {
  id: string;
  subscriptionOwner: Address;
  subscriptionPayer: Address;
  recurringCharge: string;
  periodInDays: number;
}

interface SubscriptionStatus {
  isSubscribed: boolean;
  recurringCharge: string;
  remainingChargeInPeriod?: string;
  currentPeriodStart?: Date;
  nextPeriodStart?: Date;
  periodInDays?: number;
  subscriptionOwner?: string;
}

interface PayerInfo {
  requests: InfoRequest[];
  callbackURL?: string;
}

interface InfoRequest {
  type: 'email' | 'physicalAddress' | 'phoneNumber' | 'name' | 'onchainAddress';
  optional?: boolean;
}
```

### Error Handling

```typescript
try {
  const result = await pay({ amount: "10.00", to: merchantAddress });
} catch (error) {
  if (error.message.includes('user rejected')) {
    // User cancelled the transaction in their wallet
  } else if (error.message.includes('insufficient')) {
    // Insufficient USDC balance
  } else {
    // Other error (network, etc.)
  }
}
```

### Environment Variables

For server-side subscription management:

```bash
# CDP SDK credentials (from https://portal.cdp.coinbase.com)
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret

# Optional: Paymaster for gas sponsorship
PAYMASTER_URL=https://your-paymaster.com
```

