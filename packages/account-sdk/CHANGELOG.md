# Changelog

## [3.0.0](https://github.com/base/account-sdk/compare/account-v2.5.5...account-v3.0.0) (2026-04-28)


### ⚠ BREAKING CHANGES

* charge() now requires the wallet to exist beforehand (created via getSubscriptionOwner)

### Features

* Add support for ERC-8132: Gas Limit Override Capability ([#238](https://github.com/base/account-sdk/issues/238)) ([8b1c268](https://github.com/base/account-sdk/commit/8b1c268d5c99023d78092518506a9507da4c1c6c))
* getPermissionStatus ([#77](https://github.com/base/account-sdk/issues/77)) ([cb3adb5](https://github.com/base/account-sdk/commit/cb3adb5fb4391b6bc4b0e421b7f3d419550e38cc))
* prepareSpendCallData ([#80](https://github.com/base/account-sdk/issues/80)) ([1e7a4ec](https://github.com/base/account-sdk/commit/1e7a4ec8b8aa12ae2d3a0b5296ebc96cf7663bbc))
* requestSpendPermission + getHash ([#76](https://github.com/base/account-sdk/issues/76)) ([fb3ab76](https://github.com/base/account-sdk/commit/fb3ab76f65836f9c623ecfe35544ae7085090da8))
* route initial sub account transaction to the global account ([#61](https://github.com/base/account-sdk/issues/61)) ([48012fd](https://github.com/base/account-sdk/commit/48012fda55661e53b6a02c066eed688a5321b461))
* Set up Spend Permission Utilities + fetchPermissions ([#75](https://github.com/base/account-sdk/issues/75)) ([956e9a0](https://github.com/base/account-sdk/commit/956e9a009a9ff0e1b2d7170bebd540ca6b1d46d5))
* ship src/** in published packages ([#55](https://github.com/base/account-sdk/issues/55)) ([99154cb](https://github.com/base/account-sdk/commit/99154cb458740ba813dbe5ac92b3b1cedbcd498d))
* Spend Permission Utilities (Node Version) ([#89](https://github.com/base/account-sdk/issues/89)) ([cb62baf](https://github.com/base/account-sdk/commit/cb62baf3d6319de6520155744d85144f05426e35))
* sub accounts config ([#149](https://github.com/base/account-sdk/issues/149)) ([e939191](https://github.com/base/account-sdk/commit/e939191f1bb6d3dbc1b62f731a91e19ef75b8d02))


### Bug Fixes

* add error handling to getInjectedProvider ([#157](https://github.com/base/account-sdk/issues/157)) ([a70e839](https://github.com/base/account-sdk/commit/a70e839807336d8361c335665ab09d4348b2595e))
* do not return cached wallet_connect response when SIWE capability present ([#86](https://github.com/base/account-sdk/issues/86)) ([dae787e](https://github.com/base/account-sdk/commit/dae787e91d7e6743b73bd3b43765d53c51c701e3))
* fetch injected provider from window.top first ([#67](https://github.com/base/account-sdk/issues/67)) ([d2f4f0c](https://github.com/base/account-sdk/commit/d2f4f0cd645343c0acd5383260090050afaa6de3))
* payment values should use bigint ([#132](https://github.com/base/account-sdk/issues/132)) ([82be6e3](https://github.com/base/account-sdk/commit/82be6e3f1ec7e4cb7bb568d6316208bf81a14f63))
* propagate pay dataSuffix to wallet_sendCalls attribution ([#255](https://github.com/base/account-sdk/issues/255)) ([71801e9](https://github.com/base/account-sdk/commit/71801e92e2ba6291fb316fe53c87725bb38b1dc4))
* remove caching of wallet_connect calls ([#95](https://github.com/base/account-sdk/issues/95)) ([91ec3af](https://github.com/base/account-sdk/commit/91ec3af3d035e93e9a38151216231afa26c60b85))
* remove erronious sub account presence check ([#50](https://github.com/base/account-sdk/issues/50)) ([2fb4b45](https://github.com/base/account-sdk/commit/2fb4b45c6792acbc293130e9a8eef853c41ae05d))
* remove hard coded chain ID when requesting sub account owner change ([#69](https://github.com/base/account-sdk/issues/69)) ([ab3a207](https://github.com/base/account-sdk/commit/ab3a20711e417abb147181f2c435a76c49fe22b0))
* sub account caching policy only cache known address ([#167](https://github.com/base/account-sdk/issues/167)) ([1f0bf52](https://github.com/base/account-sdk/commit/1f0bf52c7ed115edc01444568d12998a4ba07328))
* use canonical DER encoding for WebCrypto ECDSA signatures ([#240](https://github.com/base/account-sdk/issues/240)) ([90f0668](https://github.com/base/account-sdk/commit/90f06688585656d54fda21e7a34c569947f431a0))
* use contextual chain ID from request when dynamically prompting to add new sub account owner ([#108](https://github.com/base/account-sdk/issues/108)) ([cfce820](https://github.com/base/account-sdk/commit/cfce820a879d240d02591f52b1bea31a10b26692))
* use correct chain id for sub account account signer reconciliation ([#245](https://github.com/base/account-sdk/issues/245)) ([6af7a75](https://github.com/base/account-sdk/commit/6af7a75e42c451f2bc6c50a3824517c4b4a6e05a))
* use nextOwnerIndex instead of ownerCount in findOwnerIndex ([#282](https://github.com/base/account-sdk/issues/282)) ([7e6d7f8](https://github.com/base/account-sdk/commit/7e6d7f88744a7cb41985412038dd2d85b6d9b40a))


### Code Refactoring

* Improve subscription wallet API naming and simplify wallet management ([#129](https://github.com/base/account-sdk/issues/129)) ([045f605](https://github.com/base/account-sdk/commit/045f6058d2b1c49cfcaf2ba33f308f237ffe1251))

## [2.5.5](https://github.com/base/account-sdk/compare/account@2.5.4...account-v2.5.5) (2026-04-27)


### Bug Fixes

* use nextOwnerIndex instead of ownerCount in findOwnerIndex ([#282](https://github.com/base/account-sdk/issues/282)) ([7e6d7f8](https://github.com/base/account-sdk/commit/7e6d7f88744a7cb41985412038dd2d85b6d9b40a))
