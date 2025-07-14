# Payment Test App

This is a test application for the Base Account SDK Payment functionality. It provides an interactive playground to test the `pay` function which allows sending USDC payments on Base network.

## Features

- Interactive code editor to test the `pay` function
- Real-time execution and output display
- Console output capture
- Support for both Base mainnet and Base Sepolia testnet
- Error handling and result visualization

## Getting Started

1. Install dependencies from the root of the account-sdk repository:
   ```bash
   yarn install
   ```

2. Navigate to the payment test app directory:
   ```bash
   cd examples/payment-test-app
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

The app provides a code editor where you can write and execute JavaScript code that uses the `pay` function. The default code shows an example of how to make a payment:

### Default Code Example

```typescript
import { pay } from '@base-org/account-sdk'

const result = await pay({
  amount: '.01',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  testnet: true
})

return result
```

### With Payer Info Example

```typescript
import { pay } from '@base-org/account-sdk'

const result = await pay({
  amount: '.01',
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  testnet: true,
  payerInfo: {
    requests: [
      { type: 'email' },
      { type: 'name', optional: true }
    ],
    callbackURL: 'https://example.com/callback'
  }
})

return result
```

## Development

The app is built with:
- Next.js
- React
- TypeScript
- @base-org/account-sdk

## Note

This is a test application intended for development and testing purposes only. 