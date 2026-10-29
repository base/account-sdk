import { ToOwnerAccountFn } from ':store/store.js';
import { ConstructorOptions, Preference, SubAccountOptions } from '../core/provider/interface.js';
import {
  validatePreferences,
  validateSDKConfig,
  validateSubAccount,
} from './validatePreferences.js';

describe('validatePreferences', () => {
  it('should not throw an error if preference is undefined', () => {
    expect(() => validatePreferences(undefined)).not.toThrow();
  });

  it('should not throw an error if preference is valid', () => {
    const validPreference: Preference = {
      options: 'all',
      attribution: {
        auto: true,
      },
    };
    expect(() => validatePreferences(validPreference)).not.toThrow();
  });

  it('should not throw an error if attribution is undefined', () => {
    const validPreference: Preference = {
      options: 'all',
    };
    expect(() => validatePreferences(validPreference)).not.toThrow();
  });

  it('should throw an error if both auto and dataSuffix are defined in attribution', () => {
    const invalidPreference: Preference = {
      options: 'all',
      attribution: {
        auto: true,
        // @ts-expect-error passing two values to attribution
        dataSuffix: 'suffix',
      },
    };
    expect(() => validatePreferences(invalidPreference)).toThrow(
      'Attribution cannot contain both auto and dataSuffix properties'
    );
  });

  it('should not throw an error if only auto is defined in attribution', () => {
    const validPreference: Preference = {
      options: 'all',
      attribution: {
        auto: true,
      },
    };
    expect(() => validatePreferences(validPreference)).not.toThrow();
  });

  it('should not throw an error if only dataSuffix is defined in attribution', () => {
    const validPreference: Preference = {
      options: 'all',
      attribution: {
        dataSuffix: '0xsuffix',
      },
    };
    expect(() => validatePreferences(validPreference)).not.toThrow();
  });
});

describe('validateSubAccount', () => {
  it('should throw an error if toSubAccountSigner is not a function', () => {
    expect(() => validateSubAccount(undefined as any)).toThrow('toAccount is not a function');
  });

  it('should not throw an error if toSubAccountSigner is a function', () => {
    const toSubAccountSigner: ToOwnerAccountFn = () => Promise.resolve({} as any);
    expect(() => validateSubAccount(toSubAccountSigner)).not.toThrow();
  });
});

describe('validateSDKConfig', () => {
  const validOptions: ConstructorOptions = {
    metadata: {
      appName: 'Test App',
      appLogoUrl: '',
      appChainIds: [8453, 84532],
    },
    preference: {},
    paymasterUrls: {
      8453: 'https://paymaster.example.com',
      84532: 'http://localhost:3000/paymaster',
    },
  };

  it('should not throw for valid SDK config', () => {
    expect(() => validateSDKConfig(validOptions)).not.toThrow();
  });

  it('should throw when appChainIds is not an array', () => {
    const invalidOptions = {
      ...validOptions,
      metadata: {
        ...validOptions.metadata,
        appChainIds: '8453',
      },
    } as any;

    expect(() => validateSDKConfig(invalidOptions)).toThrow(
      'appChainIds must be an array of positive integer chain IDs'
    );
  });

  it('should throw when appChainIds contains an invalid chain ID', () => {
    const invalidOptions = {
      ...validOptions,
      metadata: {
        ...validOptions.metadata,
        appChainIds: [8453, 0],
      },
    };

    expect(() => validateSDKConfig(invalidOptions)).toThrow(
      'appChainIds[1] must be a positive integer chain ID'
    );
  });

  it('should throw when paymasterUrls is not an object', () => {
    const invalidOptions = {
      ...validOptions,
      paymasterUrls: 'https://paymaster.example.com',
    } as any;

    expect(() => validateSDKConfig(invalidOptions)).toThrow(
      'paymasterUrls must be an object mapping chain IDs to URLs'
    );
  });

  it('should throw when paymasterUrls contains an invalid chain ID key', () => {
    const invalidOptions = {
      ...validOptions,
      paymasterUrls: {
        base: 'https://paymaster.example.com',
      },
    } as any;

    expect(() => validateSDKConfig(invalidOptions)).toThrow(
      'paymasterUrls key "base" must be a positive integer chain ID'
    );
  });

  it('should throw when paymasterUrls contains an invalid URL', () => {
    const invalidOptions = {
      ...validOptions,
      paymasterUrls: {
        8453: 'not-a-url',
      },
    };

    expect(() => validateSDKConfig(invalidOptions)).toThrow(
      'paymasterUrls[8453] must be an absolute http(s) URL'
    );
  });

  it('should throw when sub-account options contain invalid values', () => {
    const invalidSubAccounts: SubAccountOptions = {
      creation: 'automatic' as any,
    };

    expect(() => validateSDKConfig(validOptions, invalidSubAccounts)).toThrow(
      'subAccounts.creation must be one of: on-connect, manual'
    );
  });
});

describe('validateTelemetry', () => {
  it('should not throw an error if telemetry is true', () => {
    const validPreference: Preference = {
      options: 'all',
      telemetry: true,
    };
    expect(() => validatePreferences(validPreference)).not.toThrow();
  });

  it('should not throw an error if telemetry is undefined', () => {
    const validPreference: Preference = {
      options: 'all',
    };
    expect(() => validatePreferences(validPreference)).not.toThrow();
  });

  it('should throw an error if telemetry is not a boolean', () => {
    const invalidPreference: Preference = {
      options: 'all',
      telemetry: 'true' as any,
    };
    expect(() => validatePreferences(invalidPreference)).toThrow('Telemetry must be a boolean');
  });
});
