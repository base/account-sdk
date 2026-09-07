# Base Account SDK

## Base Account SDK allows dapps to connect to Base Account

1. [Base Account](https://account.base.org/)
   - [Docs](https://www.base.org/builders/smart-wallet)

### Installing Base Account SDK

1. Check available versions:

   ```shell
     # yarn
     yarn info @base-org/account versions

     # npm
     npm view @base-org/account versions
   ```

2. Install latest version:

   ```shell
   # yarn
   yarn add @base-org/account

   # npm
   npm install @base-org/account
   ```

3. Check installed version:

   ```shell
   # yarn
   yarn list @base-org/account

   # npm
   npm list @base-org/account
   ```

### Upgrading Base Account SDK

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

### Basic Usage

1. Initialize Base Account SDK

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
   const addresses = provider.request({
     method: 'eth_requestAccounts',
   });
   ```

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

### Error handling and retries

Provider and RPC calls reject with Ethereum-compatible errors that include an integer `code` and a `message`. Use `code` to decide whether to retry, fail fast, or prompt the user.

| Category | Typical codes | Guidance |
| --- | --- | --- |
| User / auth decisions | `4001` user rejected, `4100` unauthorized | Fail fast. Do not retry; ask the user to approve or reconnect. |
| Connectivity / chain | `4900` disconnected, `4901` chain disconnected, `4902` unsupported chain | Fail fast or recover by reconnecting / switching chain. Do not blind-retry the original request. |
| Invalid input / config | `-32600` invalid request, `-32601` method not found, `-32602` invalid params, `-32000` invalid input, `4200` unsupported method | Fail fast. Fix arguments or configuration before calling again. |
| Transient RPC / capacity | `-32002` resource unavailable, `-32005` limit exceeded, `-32603` internal, network/`HttpRequestError` transport failures | Safe to retry with bounded backoff for **read-only** or otherwise idempotent requests. |
| Transaction outcome | `-32003` transaction rejected | Fail fast unless your app has an explicit, user-visible resubmit path. |

Keep retries conservative:

- Prefer retries for reads and status checks (for example `getPaymentStatus`).
- Avoid automatic retries for wallet prompts, signing, and payment submission — those can duplicate user-facing confirmations or onchain effects.
- Cap attempts (for example 3) with exponential backoff and jitter; surface the last error if all attempts fail.
- Treat insufficient-funds / spend-permission errors as actionable configuration problems, not transient network failures.

Minimal pattern:

```js
function getErrorCode(error) {
  if (typeof error === 'number') return error;
  if (error && typeof error === 'object' && typeof error.code === 'number') return error.code;
  return undefined;
}

function isRetryable(error) {
  const code = getErrorCode(error);
  return code === -32002 || code === -32005 || code === -32603 || code === undefined;
}

async function requestWithRetry(provider, args, { retries = 3 } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      return await provider.request(args);
    } catch (error) {
      attempt += 1;
      const code = getErrorCode(error);
      if (code === 4001 || code === 4100 || !isRetryable(error) || attempt > retries) {
        throw error;
      }
      await new Promise((r) => setTimeout(r, 250 * 2 ** (attempt - 1)));
    }
  }
}
```

### Developing locally and running the test dapp

- The Base Account SDK test dapp can be viewed here https://base.github.io/account-sdk/.
- To run it locally follow these steps:

  1. Fork this repo and clone it
  1. From the root dir run `yarn install`
  1. From the root dir run `yarn dev`

## Script Tag Usage

Base Accunt can be used directly in HTML pages via a script tag, without any build tools:

```html
<!-- Via unpkg -->
<script src="https://unpkg.com/@base-org/account/dist/base-account.min.js"></script>

<!-- Via jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@base-org/account/dist/base-account.min.js"></script>
```

Once loaded, the SDK is available as `window.base` and `window.createBaseAccountSDK`:

```javascript
// Make a payment
const result = await window.base.pay({
  amount: "10.50",
  to: "0xYourAddress...",
  testnet: true
});

// Check payment status
const status = await window.base.getPaymentStatus({
  id: result.id,
  expectedPayment: {
    amount: "10.50",
    recipient: "0xYourAddress..."
  },
  testnet: true
});

// Create Base Account Provider
const provider = window.createBaseAccountSDK().getProvider()
```

For production payment verification, call `getPaymentStatus` on your backend and populate
`expectedPayment` from trusted server-side order data. Omitting it preserves backward compatibility
but does not verify the order amount or recipient. Bind each payment ID to one order and reject IDs
that have already been used for fulfillment.
