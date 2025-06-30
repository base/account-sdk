import {
  AppMetadata,
  ConstructorOptions,
  Preference,
  ProviderInterface,
  SubAccountOptions,
} from ':core/provider/interface.js';
import { loadTelemetryScript } from ':core/telemetry/initCCA.js';
import { store } from ':store/store.js';
import { checkCrossOriginOpenerPolicy } from ':util/checkCrossOriginOpenerPolicy.js';
import { validatePreferences, validateSubAccount } from ':util/validatePreferences.js';
import { CoinbaseWalletProvider } from './CoinbaseWalletProvider.js';

export type CreateProviderOptions = Partial<AppMetadata> & {
  preference?: Preference;
  subAccounts?: SubAccountOptions;
  paymasterUrls?: Record<number, string>;
};

/**
 * Create a SDK instance with EIP-1193 compliant provider
 * @param params - Options to create a base account SDK instance.
 * @returns An SDK object with a getProvider method that returns an EIP-1193 compliant provider.
 */
export function createSDK(params: CreateProviderOptions) {
  const options: ConstructorOptions = {
    metadata: {
      appName: params.appName || 'Dapp',
      appLogoUrl: params.appLogoUrl || '',
      appChainIds: params.appChainIds || [],
    },
    preference: params.preference ?? {},
    paymasterUrls: params.paymasterUrls,
  };

  //  ====================================================================
  //  If we have a toOwnerAccount function, set it in the non-persisted config
  //  ====================================================================

  if (params.subAccounts?.toOwnerAccount) {
    validateSubAccount(params.subAccounts.toOwnerAccount);
  }

  store.subAccountsConfig.set({
    toOwnerAccount: params.subAccounts?.toOwnerAccount,
    enableAutoSubAccounts: params.subAccounts?.enableAutoSubAccounts,
    defaultSpendPermissions: params.subAccounts?.defaultSpendPermissions,
  });

  //  ====================================================================
  //  Set the options in the store and rehydrate the store from storage
  //  ====================================================================

  store.config.set(options);

  void store.persist.rehydrate();

  //  ====================================================================
  //  Validation and telemetry
  //  ====================================================================

  void checkCrossOriginOpenerPolicy();

  validatePreferences(options.preference);

  if (options.preference.telemetry !== false) {
    void loadTelemetryScript();
  }

  //  ====================================================================
  //  Return the provider
  //  ====================================================================

  let provider: ProviderInterface | null = null;

  return {
    getProvider: () => {
      if (!provider) {
        provider = new CoinbaseWalletProvider(options);
      }

      return provider;
    },
  };
}
