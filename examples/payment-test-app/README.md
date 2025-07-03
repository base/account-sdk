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

```javascript
import { pay } from '@coinbase/wallet-sdk/payment'

// Make a payment
const result = await pay({
  amount: '1',
  recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
  testnet: true
})

// Handle the result
if (result.success) {
  console.log('Payment successful!')
  console.log('Transaction ID:', result.id)
  console.log('Amount sent:', result.amount, 'USDC')
  console.log('Sent to:', result.recipient)
} else {
  console.error('Payment failed:', result.error)
}

return result
```

## Development

The app is built with:
- Next.js
- React
- TypeScript
- @coinbase/wallet-sdk

## Note

This is a test application intended for development and testing purposes only. 