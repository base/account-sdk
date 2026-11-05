import { ConstructorOptions, Preference, SubAccountOptions } from ':core/provider/interface.js';
import { ToOwnerAccountFn } from ':store/store.js';

const SUB_ACCOUNT_CREATION_MODES = ['on-connect', 'manual'] as const;
const SUB_ACCOUNT_DEFAULT_ACCOUNTS = ['sub', 'universal'] as const;
const SUB_ACCOUNT_FUNDING_MODES = ['spend-permissions', 'manual'] as const;

function assertPositiveIntegerChainId(chainId: unknown, fieldName: string) {
  if (!Number.isInteger(chainId) || (chainId as number) <= 0) {
    throw new Error(`${fieldName} must be a positive integer chain ID`);
  }
}

function assertOption<T extends readonly string[]>(value: unknown, fieldName: string, options: T) {
  if (value !== undefined && !options.includes(value as T[number])) {
    throw new Error(`${fieldName} must be one of: ${options.join(', ')}`);
  }
}

function assertHttpUrl(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be an absolute http(s) URL`);
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error();
    }
  } catch {
    throw new Error(`${fieldName} must be an absolute http(s) URL`);
  }
}

/**
 * Validates user supplied preferences. Throws if keys are not valid.
 * @param preference
 */
export function validatePreferences(preference?: Preference) {
  if (!preference) {
    return;
  }

  if (preference.attribution) {
    if (
      preference.attribution.auto !== undefined &&
      preference.attribution.dataSuffix !== undefined
    ) {
      throw new Error(`Attribution cannot contain both auto and dataSuffix properties`);
    }
  }

  if (preference.telemetry) {
    if (typeof preference.telemetry !== 'boolean') {
      throw new Error(`Telemetry must be a boolean`);
    }
  }
}

/**
 * Validates SDK configuration before it is written to the store or used by providers.
 * @param options
 * @param subAccounts
 */
export function validateSDKConfig(options: ConstructorOptions, subAccounts?: SubAccountOptions) {
  if (!Array.isArray(options.metadata.appChainIds)) {
    throw new Error('appChainIds must be an array of positive integer chain IDs');
  }

  options.metadata.appChainIds.forEach((chainId, index) => {
    assertPositiveIntegerChainId(chainId, `appChainIds[${index}]`);
  });

  if (options.paymasterUrls !== undefined) {
    if (
      typeof options.paymasterUrls !== 'object' ||
      options.paymasterUrls === null ||
      Array.isArray(options.paymasterUrls)
    ) {
      throw new Error('paymasterUrls must be an object mapping chain IDs to URLs');
    }

    Object.entries(options.paymasterUrls).forEach(([chainId, url]) => {
      const numericChainId = Number(chainId);
      assertPositiveIntegerChainId(numericChainId, `paymasterUrls key "${chainId}"`);
      assertHttpUrl(url, `paymasterUrls[${chainId}]`);
    });
  }

  if (subAccounts) {
    assertOption(subAccounts.creation, 'subAccounts.creation', SUB_ACCOUNT_CREATION_MODES);
    assertOption(
      subAccounts.defaultAccount,
      'subAccounts.defaultAccount',
      SUB_ACCOUNT_DEFAULT_ACCOUNTS
    );
    assertOption(subAccounts.funding, 'subAccounts.funding', SUB_ACCOUNT_FUNDING_MODES);
  }
}

/**
 * Validates user supplied toSubAccountSigner function. Throws if keys are not valid.
 * @param toAccount
 */
export function validateSubAccount(toAccount: ToOwnerAccountFn) {
  if (typeof toAccount !== 'function') {
    throw new Error(`toAccount is not a function`);
  }
}
