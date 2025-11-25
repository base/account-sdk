# Payment Interface

The payment interface provides a simple way to make USDC payments on Base network using an ephemeral wallet.

## Basic Usage

```typescript
import { pay } from '@base-org/account';

// Basic payment
const payment = await pay({
  amount: "10.50",
  to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
  testnet: true
});

if (payment.success) {
  console.log(`Payment sent! Transaction ID: ${payment.id}`);
} else {
  console.error(`Payment failed: ${payment.error}`);
}
```

## Token Payments (`payWithToken`)

Use `payWithToken` to send any ERC20 token on Base or Base Sepolia by specifying the token and paymaster configuration.

```typescript
import { payWithToken } from '@base-org/account';

const payment = await payWithToken({
  amount: '1000000',          // base units (wei)
  token: 'USDC',              // symbol or contract address
  testnet: false,             // Use Base mainnet (false) or Base Sepolia (true)
  to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
  paymaster: {
    url: 'https://paymaster.example.com',
  },
  payerInfo: {
    requests: [{ type: 'email' }],
  },
});

console.log(`Token payment sent! Transaction ID: ${payment.id}`);
```

**Token payment notes**

- `amount` must be provided in the token's smallest unit (e.g., wei).
- `token` can be an address or a supported symbol (USDC, USDT, DAI).
- `testnet` toggles between Base mainnet (false) and Base Sepolia (true). Only Base and Base Sepolia are supported.
- `paymaster` is required. Provide either a `url` for a paymaster service or a precomputed `paymasterAndData`.
- The returned `payment.id` is a transaction hash, just like the `pay()` function. Pass this ID to `getPaymentStatus` along with the same `testnet` value.

## Checking Payment Status

You can check the status of a payment using the ID returned from either `pay()` or `payWithToken()`:

```typescript
import { getPaymentStatus } from '@base/account-sdk';

// Assume tokenPayment/usdcPayment are the results from the examples above.

// Token payments - use the same testnet value as the original payment
const tokenStatus = await getPaymentStatus({
  id: tokenPayment.id, // e.g., "0x1234..."
  testnet: false,      // Same testnet value used in payWithToken
});

// USDC payments via pay() still require a testnet flag.
const usdcStatus = await getPaymentStatus({
  id: usdcPayment.id,
  testnet: true,
});

switch (status.status) {
  case 'pending':
    console.log('Payment is still being processed...');
    break;
  case 'completed':
    console.log(`Payment completed! Amount: ${status.amount} to ${status.recipient}`);
    break;
  case 'failed':
    console.log(`Payment failed: ${status.error}`);
    break;
  case 'not_found':
    console.log('Payment not found');
    break;
}
```

The status object now includes:

- `tokenAmount`, `tokenAddress`, and `tokenSymbol` for any detected ERC20 transfer.
- `amount` (human-readable) when the token is a whitelisted stablecoin (USDC/USDT/DAI).

## Information Requests (Data Callbacks)

You can request additional information from the user during payment using the `payerInfo` parameter:

```typescript
import { pay } from '@base-org/account';

const payment = await pay({
  amount: "10.50",
  to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
  testnet: true,
  payerInfo: {
    requests: [
      { type: 'email' },
      { type: 'physicalAddress', optional: true },
      { type: 'phoneNumber', optional: false },
      { type: 'name', optional: true },
      { type: 'onchainAddress' },
    ],
    callbackURL: 'https://example.com/callback'
  }
});
```

### Supported Information Types

- `email` - User's email address
- `physicalAddress` - User's physical address
- `phoneNumber` - User's phone number
- `name` - User's full name
- `onchainAddress` - User's on-chain address

### Optional vs Required

By default, all information requests are required (`optional: false`). You can make a request optional by setting `optional: true`.

### Callback URL

The `callbackURL` specifies where the collected user information will be sent after the payment is completed.

## Telemetry

Both `pay()` and `getPaymentStatus()` functions log telemetry events by default to help with monitoring and debugging. You can opt out of telemetry by setting the `telemetry` parameter to `false`:

```typescript
// Disable telemetry for payment
const payment = await pay({
  amount: "10.50",
  to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
  testnet: true,
  telemetry: false  // Opt out of telemetry
});

// Disable telemetry for status check
const status = await getPaymentStatus({
  id: payment.id,
  testnet: true,
  telemetry: false  // Opt out of telemetry
});
```

## API Reference

### `pay(options: PaymentOptions): Promise<PaymentResult>`

#### PaymentOptions

- `amount: string` - Amount of USDC to send as a string (e.g., "10.50")
- `to: string` - Ethereum address to send payment to
- `testnet?: boolean` - Whether to use Base Sepolia testnet (default: false)
- `payerInfo?: PayerInfo` - Optional payer information configuration for data callbacks
- `telemetry?: boolean` - Whether to enable telemetry logging (default: true)

#### PayerInfo

- `requests: InfoRequest[]` - Array of information requests
- `callbackURL?: string` - Optional URL where the collected information will be sent

#### InfoRequest

- `type: string` - The type of information being requested
- `optional?: boolean` - Whether the information is optional (default: false)

#### PaymentResult

The payment result is always a successful payment (errors are thrown as exceptions):
- `success: true` - Indicates successful payment
- `id: string` - Transaction hash
- `amount: string` - Amount sent in USDC
- `to: Address` - Recipient address
- `payerInfoResponses?: PayerInfoResponses` - Responses from information requests (if any)

### `getPaymentStatus(options: PaymentStatusOptions): Promise<PaymentStatus>`

- `id: string` - Payment ID to check (transaction hash returned from `pay()` or `payWithToken()`).
- `testnet?: boolean` - Whether the payment was on testnet (Base Sepolia). Must match the value used in the original payment.
- `telemetry?: boolean` - Whether to enable telemetry logging (default: true)

#### PaymentStatus

- `status: 'pending' | 'completed' | 'failed' | 'not_found'` - Current status of the payment
- `id: string` - Transaction ID that was checked
- `message: string` - Human-readable message about the status
- `sender?: string` - Sender address (present for pending, completed, and failed)
- `amount?: string` - Amount sent (present for completed transactions, parsed from logs)
- `recipient?: string` - Recipient address (present for completed transactions, parsed from logs)
- `error?: string` - Error message (present for failed status - includes both on-chain failure reasons and off-chain errors) 