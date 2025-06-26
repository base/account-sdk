// Copyright (c) 2018-2024 Coinbase, Inc. <https://www.coinbase.com/>
export type { AppMetadata, Preference, ProviderInterface } from ':core/provider/interface.js';
export type { CoinbaseWalletProvider } from './CoinbaseWalletProvider.js';
export { createCoinbaseWalletSDK } from './createCoinbaseWalletSDK.js';
export { getCryptoKeyAccount, removeCryptoKey } from './kms/crypto-key/index.js';
