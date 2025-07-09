# Payment Interface

The payment interface provides a simple way to make USDC payments on Base network using an ephemeral wallet.

## Basic Usage

```typescript
import { pay } from '@base/account-sdk';

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

## Information Requests (Data Callbacks)

You can request additional information from the user during payment using the `infoRequests` parameter:

```typescript
import { pay, InfoRequest } from '@base/account-sdk';

const payment = await pay({
  amount: "10.50",
  to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
  testnet: true,
  infoRequests: [
    { request: 'email' },
    { request: 'physicalAddress', optional: true },
    { request: 'phoneNumber', optional: false },
    { request: 'name', optional: true },
    { request: 'onchainAddress' },
  ]
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

## API Reference

### `pay(options: PaymentOptions): Promise<PaymentResult>`

#### PaymentOptions

- `amount: string` - Amount of USDC to send as a string (e.g., "10.50")
- `to: string` - Ethereum address or ENS name to send payment to
- `testnet?: boolean` - Whether to use Base Sepolia testnet (default: false)
- `infoRequests?: InfoRequest[]` - Optional information requests for data callbacks

#### InfoRequest

- `request: string` - The type of information being requested
- `optional?: boolean` - Whether the information is optional (default: false)

#### PaymentResult

Success:
- `success: true`
- `id: string` - Transaction ID (hash) of the payment
- `amount: string` - The amount that was sent
- `to: string` - The address that received the payment (resolved from ENS if applicable)
- `infoResponses?: InfoResponses` - Responses from information requests (if any)

Error:
- `success: false`
- `error: string` - Error message describing what went wrong
- `amount: string` - The amount that was attempted
- `to: string` - The address that would have received the payment 