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

### Base Sepolia account readiness

> [!NOTE]
> Newly created Base Accounts may currently connect and report Base Sepolia (84532)
> capabilities while the hosted wallet rejects transaction or typed-data requests during account
> provisioning. This is tracked in [#363](https://github.com/base/account-sdk/issues/363). Treat
> capability discovery as feature support, not proof that the connected account is ready to
> transact on that chain. Handle provider errors explicitly and use an account or environment
> known to work on Base Sepolia for integration testing until the hosted-wallet limitation is
> resolved.

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
