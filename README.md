# Base Account SDK

[![npm](https://img.shields.io/npm/v/@base-org/account-sdk.svg)](https://www.npmjs.com/package/@base-org/account-sdk)

## Base Account SDK allows dapps to connect to Base Account

1. [Base Account](https://account.base.org/)
   - [Docs](https://www.base.org/builders/smart-wallet)

### Installing Base Account SDK

1. Check available versions:

   ```shell
     # yarn
     yarn info @base-org/account-sdk versions

     # npm
     npm view @base-org/account-sdk versions
   ```

2. Install latest version:

   ```shell
   # yarn
   yarn add @base-org/account-sdk

   # npm
   npm install @base-org/account-sdk
   ```

3. Check installed version:

   ```shell
   # yarn
   yarn list @base-org/account-sdk

   # npm
   npm list @base-org/account-sdk
   ```

### Upgrading Base Account SDK

1. Compare the installed version with the latest:

   ```shell
   # yarn
   yarn outdated @base-org/account-sdk

   # npm
   npm outdated @base-org/account-sdk
   ```

2. Update to latest:

   ```shell
   # yarn
   yarn upgrade @base-org/account-sdk --latest

   # npm
   npm update @base-org/account-sdk
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

### Developing locally and running the test dapp

- The Base Account SDK test dapp can be viewed here https://base.github.io/account-sdk/.
- To run it locally follow these steps:

  1. Fork this repo and clone it
  1. From the root dir run `yarn install`
  1. From the root dir run `yarn dev`
