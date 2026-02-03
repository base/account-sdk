import { Preference } from ':core/provider/interface.js';
import { ToOwnerAccountFn } from ':store/store.js';

const VALID_OPTIONS = ['all', 'smartWalletOnly', 'eoaOnly'] as const;

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

  if (preference.options !== undefined) {
    if (!VALID_OPTIONS.includes(preference.options)) {
      throw new Error(
        `Invalid options value: '${preference.options}'. Must be one of: ${VALID_OPTIONS.join(', ')}`
      );
    }
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
