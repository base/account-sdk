import {
  AppMetadata,
  ConstructorOptions,
  Preference,
  ProviderInterface,
  SubAccountOptions,
} from ':core/provider/interface.js';
import { AddSubAccountAccount } from ':core/rpc/wallet_addSubAccount.js';
import { WalletConnectResponse } from ':core/rpc/wallet_connect.js';
import { loadTelemetryScript } from ':core/telemetry/initCCA.js';
import { abi } from ':sign/base-account/utils/constants.js';
import { SubAccount, ToOwnerAccountFn, store } from ':store/store.js';
import { assertPresence } from ':util/assertPresence.js';
import { checkCrossOriginOpenerPolicy } from ':util/checkCrossOriginOpenerPolicy.js';
import { validatePreferences, validateSubAccount } from ':util/validatePreferences.js';
import { decodeAbiParameters, encodeFunctionData, toHex } from 'viem';
import { BaseAccountProvider } from './BaseAccountProvider.js';

export type CreateProviderOptions = Partial<AppMetadata> & {
  preference?: Preference;
  subAccounts?: Omit<SubAccountOptions, 'enableAutoSubAccounts'>;
  paymasterUrls?: Record<number, string>;
};

/**
 * Create Base AccountSDK instance with EIP-1193 compliant provider
 * @param params - Options to create a base account SDK instance.
 * @returns An SDK object with a getProvider method that returns an EIP-1193 compliant provider.
 */
export function createBaseAccountSDK(params: CreateProviderOptions) {
  const options: ConstructorOptions = {
    metadata: {
      appName: params.appName || 'App',
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
    // @ts-expect-error - enableSubAccounts is not officially supported yet
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

  const sdk = {
    getProvider: () => {
      if (!provider) {
        provider = new BaseAccountProvider(options);
      }

      return provider;
    },
    subAccount: {
      async create(account: AddSubAccountAccount): Promise<SubAccount> {
        const state = store.getState();
        assertPresence(state.subAccount?.address, new Error('subaccount already exists'));

        return (await sdk.getProvider()?.request({
          method: 'wallet_addSubAccount',
          params: [
            {
              version: '1',
              account,
            },
          ],
        })) as SubAccount;
      },
      async get(): Promise<SubAccount | null> {
        const subAccount = store.subAccounts.get();

        if (subAccount?.address) {
          return subAccount;
        }

        const response = (await sdk.getProvider()?.request({
          method: 'wallet_connect',
          params: [
            {
              version: '1',
              capabilities: {},
            },
          ],
        })) as WalletConnectResponse;

        const subAccounts = response.accounts[0].capabilities?.subAccounts;
        if (!Array.isArray(subAccounts)) {
          return null;
        }

        return subAccounts[0] as SubAccount;
      },
      addOwner: async ({
        address,
        publicKey,
        chainId,
      }: {
        address?: `0x${string}`;
        publicKey?: `0x${string}`;
        chainId: number;
      }) => {
        const subAccount = store.subAccounts.get();
        const account = store.account.get();
        assertPresence(account, new Error('account does not exist'));
        assertPresence(subAccount?.address, new Error('subaccount does not exist'));

        const calls = [];
        if (publicKey) {
          const [x, y] = decodeAbiParameters([{ type: 'bytes32' }, { type: 'bytes32' }], publicKey);
          calls.push({
            to: subAccount.address,
            data: encodeFunctionData({
              abi,
              functionName: 'addOwnerPublicKey',
              args: [x, y] as const,
            }),
            value: toHex(0),
          });
        }

        if (address) {
          calls.push({
            to: subAccount.address,
            data: encodeFunctionData({
              abi,
              functionName: 'addOwnerAddress',
              args: [address] as const,
            }),
            value: toHex(0),
          });
        }

        return (await sdk.getProvider()?.request({
          method: 'wallet_sendCalls',
          params: [
            {
              calls,
              chainId: toHex(chainId),
              from: account.accounts?.[0],
              version: '1',
            },
          ],
        })) as string;
      },
      setToOwnerAccount(toSubAccountOwner: ToOwnerAccountFn): void {
        validateSubAccount(toSubAccountOwner);
        store.subAccountsConfig.set({
          toOwnerAccount: toSubAccountOwner,
        });
      },
    },
  };

  return sdk;
}
