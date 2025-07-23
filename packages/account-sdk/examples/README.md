# Base Pay SDK Examples

This directory contains examples of using the Base Pay SDK.

## payment-script-tag.html

A complete example showing how to use the Base Pay SDK via a script tag in a browser without any build tools.

### Running the Example

1. Build the browser bundle:
   ```bash
   cd ..
   yarn install
   yarn build:browser
   ```

2. Open `payment-script-tag.html` in your browser

3. The example demonstrates:
   - Loading the SDK via script tag
   - Making USDC payments
   - Checking payment status
   - Handling errors

### Using from CDN

In production, you can load the SDK directly from a CDN instead of building locally:

```html
<!-- Via unpkg -->
<script src="https://unpkg.com/@base-org/account/dist/base-pay.min.js"></script>

<!-- Via jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@base-org/account/dist/base-pay.min.js"></script>
``` 