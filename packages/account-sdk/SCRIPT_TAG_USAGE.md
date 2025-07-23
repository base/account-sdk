# Base Pay SDK - Script Tag Usage

The Base Pay SDK can be used directly in HTML pages via a script tag, without any build tools or module bundlers.

## Building the Browser Bundle

First, build the browser-ready bundle:

```bash
cd packages/account-sdk
yarn install
yarn build:browser
```

This creates two files in the `dist` directory:
- `base-pay.js` - Development version with readable code
- `base-pay.min.js` - Minified production version

## Including in Your HTML

Add the script tag to your HTML:

```html
<!-- Development version -->
<script src="https://your-cdn.com/base-pay.js"></script>

<!-- Production version (recommended) -->
<script src="https://your-cdn.com/base-pay.min.js"></script>
```

## Usage

Once loaded, the SDK is available as `window.base`:

```html
<script>
  // Make a payment
  const result = await base.pay({
    amount: "10.50",
    to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
    testnet: true
  });

  if (result.success) {
    console.log('Payment sent! Transaction ID:', result.id);
  } else {
    console.error('Payment failed:', result.error);
  }

  // Check payment status
  const status = await base.getPaymentStatus({
    id: result.id,
    testnet: true
  });

  console.log('Payment status:', status.status);
</script>
```

## Available Methods

### `base.pay(options)`

Send a USDC payment.

**Parameters:**
- `amount` (string) - Amount of USDC to send (e.g., "10.50")
- `to` (string) - Recipient's Ethereum address
- `testnet` (boolean, optional) - Use testnet (default: false)
- `payerInfo` (object, optional) - Request additional payer information

**Returns:** Promise<PaymentResult>

### `base.getPaymentStatus(options)`

Check the status of a payment.

**Parameters:**
- `id` (string) - Transaction ID from the payment
- `testnet` (boolean, optional) - Use testnet (default: false)

**Returns:** Promise<PaymentStatus>

### `base.constants`

Access SDK constants:
- `base.constants.CHAIN_IDS` - Supported chain IDs
- `base.constants.TOKENS` - Token configurations

## Complete Example

See the [example HTML file](examples/payment-script-tag.html) for a complete working example.

## Hosting the SDK

You can host the SDK files on:

1. **npm CDN** - Use unpkg or jsDelivr to load directly from npm (recommended):
   ```html
   <!-- Via unpkg -->
   <script src="https://unpkg.com/@base-org/account/dist/base-pay.min.js"></script>
   
   <!-- Via jsDelivr -->
   <script src="https://cdn.jsdelivr.net/npm/@base-org/account/dist/base-pay.min.js"></script>
   ```

2. **Your own CDN/server** - Download the built files and upload to your static hosting

## Browser Compatibility

The SDK supports all modern browsers with ES2017+ support:
- Chrome 60+
- Firefox 60+
- Safari 11.1+
- Edge 79+

## Security Considerations

1. Always use HTTPS when hosting the SDK
2. Consider using Subresource Integrity (SRI) for CDN-hosted files:
   ```html
   <script 
     src="https://cdn.example.com/base-pay.min.js"
     integrity="sha384-[hash]"
     crossorigin="anonymous">
   </script>
   ```
3. Validate all user inputs before passing to the SDK
4. Handle errors appropriately and don't expose sensitive information 