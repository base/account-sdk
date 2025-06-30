import * as telemetryModule from ':core/telemetry/initCCA.js';
import { store } from ':store/store.js';
import * as checkCrossOriginModule from ':util/checkCrossOriginOpenerPolicy.js';
import * as validatePreferencesModule from ':util/validatePreferences.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoinbaseWalletProvider } from './CoinbaseWalletProvider.js';
import { CreateProviderOptions, createSDK } from './createSDK.js';

// Mock all dependencies
vi.mock(':store/store.js', () => ({
  store: {
    subAccountsConfig: {
      set: vi.fn(),
    },
    config: {
      set: vi.fn(),
    },
    persist: {
      rehydrate: vi.fn(),
    },
  },
}));

vi.mock(':core/telemetry/initCCA.js', () => ({
  loadTelemetryScript: vi.fn(),
}));

vi.mock(':util/checkCrossOriginOpenerPolicy.js', () => ({
  checkCrossOriginOpenerPolicy: vi.fn(),
}));

vi.mock(':util/validatePreferences.js', () => ({
  validatePreferences: vi.fn(),
  validateSubAccount: vi.fn(),
}));

vi.mock('./CoinbaseWalletProvider.js', () => ({
  CoinbaseWalletProvider: vi.fn(),
}));

const mockStore = store as any;
const mockLoadTelemetryScript = telemetryModule.loadTelemetryScript as any;
const mockCheckCrossOriginOpenerPolicy = checkCrossOriginModule.checkCrossOriginOpenerPolicy as any;
const mockValidatePreferences = validatePreferencesModule.validatePreferences as any;
const mockValidateSubAccount = validatePreferencesModule.validateSubAccount as any;
const mockCoinbaseWalletProvider = CoinbaseWalletProvider as any;

describe('createProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCoinbaseWalletProvider.mockReturnValue({
      mockProvider: true,
    });
  });

  describe('Basic functionality', () => {
    it('should create a provider with minimal parameters', () => {
      const result = createSDK({}).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith({
        metadata: {
          appName: 'Dapp',
          appLogoUrl: '',
          appChainIds: [],
        },
        preference: {},
        paymasterUrls: undefined,
      });

      expect(result).toEqual({ mockProvider: true });
    });

    it('should create a provider with custom app metadata', () => {
      const params: CreateProviderOptions = {
        appName: 'Test App',
        appLogoUrl: 'https://example.com/logo.png',
        appChainIds: [1, 137],
      };

      createSDK(params).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith({
        metadata: {
          appName: 'Test App',
          appLogoUrl: 'https://example.com/logo.png',
          appChainIds: [1, 137],
        },
        preference: {},
        paymasterUrls: undefined,
      });
    });

    it('should create a provider with custom preference', () => {
      const params: CreateProviderOptions = {
        preference: {
          options: 'all',
          attribution: { auto: true },
        },
      };

      createSDK(params).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith({
        metadata: {
          appName: 'Dapp',
          appLogoUrl: '',
          appChainIds: [],
        },
        preference: {
          options: 'all',
          attribution: { auto: true },
        },
        paymasterUrls: undefined,
      });
    });

    it('should create a provider with paymaster URLs', () => {
      const params: CreateProviderOptions = {
        paymasterUrls: {
          1: 'https://paymaster.example.com',
          137: 'https://paymaster-polygon.example.com',
        },
      };

      createSDK(params).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          paymasterUrls: {
            1: 'https://paymaster.example.com',
            137: 'https://paymaster-polygon.example.com',
          },
        })
      );
    });
  });

  describe('Sub-account configuration', () => {
    it('should set sub-account configuration when provided', () => {
      const mockToOwnerAccount = vi.fn();
      const params: CreateProviderOptions = {
        subAccounts: {
          toOwnerAccount: mockToOwnerAccount,
          enableAutoSubAccounts: true,
          defaultSpendPermissions: {
            1: [
              {
                token: '0x1234567890123456789012345678901234567890',
                allowance: '0x1000',
                period: 3600,
              },
            ],
          },
        },
      };

      createSDK(params).getProvider();

      expect(mockValidateSubAccount).toHaveBeenCalledWith(mockToOwnerAccount);
      expect(mockStore.subAccountsConfig.set).toHaveBeenCalledWith({
        toOwnerAccount: mockToOwnerAccount,
        enableAutoSubAccounts: true,
        defaultSpendPermissions: {
          1: [
            {
              token: '0x1234567890123456789012345678901234567890',
              allowance: '0x1000',
              period: 3600,
            },
          ],
        },
      });
    });

    it('should handle partial sub-account configuration', () => {
      const params: CreateProviderOptions = {
        subAccounts: {
          enableAutoSubAccounts: true,
        },
      };

      createSDK(params).getProvider();

      expect(mockValidateSubAccount).not.toHaveBeenCalled();
      expect(mockStore.subAccountsConfig.set).toHaveBeenCalledWith({
        toOwnerAccount: undefined,
        enableAutoSubAccounts: true,
        defaultSpendPermissions: undefined,
      });
    });

    it('should handle empty sub-account configuration', () => {
      const params: CreateProviderOptions = {
        subAccounts: undefined,
      };

      createSDK(params).getProvider();

      expect(mockStore.subAccountsConfig.set).toHaveBeenCalledWith({
        toOwnerAccount: undefined,
        enableAutoSubAccounts: undefined,
        defaultSpendPermissions: undefined,
      });
    });
  });

  describe('Store configuration', () => {
    it('should set store configuration', () => {
      const params: CreateProviderOptions = {
        appName: 'Test App',
        preference: { options: 'all' },
        paymasterUrls: { 1: 'https://paymaster.example.com' },
      };

      createSDK(params).getProvider();

      expect(mockStore.config.set).toHaveBeenCalledWith({
        metadata: {
          appName: 'Test App',
          appLogoUrl: '',
          appChainIds: [],
        },
        preference: { options: 'all' },
        paymasterUrls: { 1: 'https://paymaster.example.com' },
      });
    });

    it('should rehydrate store from storage', () => {
      createSDK({}).getProvider();

      expect(mockStore.persist.rehydrate).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate preferences', () => {
      const preference = { options: 'all', telemetry: true };
      createSDK({ preference }).getProvider();

      expect(mockValidatePreferences).toHaveBeenCalledWith(preference);
    });

    it('should validate sub-account when toOwnerAccount is provided', () => {
      const mockToOwnerAccount = vi.fn();
      createSDK({
        subAccounts: { toOwnerAccount: mockToOwnerAccount },
      }).getProvider();

      expect(mockValidateSubAccount).toHaveBeenCalledWith(mockToOwnerAccount);
    });

    it('should check cross-origin opener policy', () => {
      createSDK({}).getProvider();

      expect(mockCheckCrossOriginOpenerPolicy).toHaveBeenCalled();
    });
  });

  describe('Telemetry', () => {
    it('should load telemetry script when telemetry is not disabled', () => {
      createSDK({
        preference: { telemetry: true },
      }).getProvider();

      expect(mockLoadTelemetryScript).toHaveBeenCalled();
    });

    it('should load telemetry script when telemetry is undefined (default)', () => {
      createSDK({
        preference: {},
      }).getProvider();

      expect(mockLoadTelemetryScript).toHaveBeenCalled();
    });

    it('should not load telemetry script when telemetry is disabled', () => {
      createSDK({
        preference: { telemetry: false },
      }).getProvider();

      expect(mockLoadTelemetryScript).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle validation errors', () => {
      mockValidatePreferences.mockImplementationOnce(() => {
        throw new Error('Invalid preference');
      });

      expect(() => {
        createSDK({ preference: { options: 'invalid' } }).getProvider();
      }).toThrow('Invalid preference');
    });

    it('should handle sub-account validation errors', () => {
      mockValidateSubAccount.mockImplementationOnce(() => {
        throw new Error('Invalid sub-account function');
      });

      expect(() => {
        createSDK({
          subAccounts: { toOwnerAccount: 'not-a-function' as any },
        }).getProvider();
      }).toThrow('Invalid sub-account function');
    });
  });

  describe('Integration', () => {
    it('should perform all setup steps in correct order', () => {
      const mockToOwnerAccount = vi.fn();
      const params: CreateProviderOptions = {
        appName: 'Integration Test',
        appLogoUrl: 'https://example.com/logo.png',
        appChainIds: [1, 137],
        preference: {
          options: 'all',
          telemetry: true,
        },
        subAccounts: {
          toOwnerAccount: mockToOwnerAccount,
          enableAutoSubAccounts: true,
        },
        paymasterUrls: {
          1: 'https://paymaster.example.com',
        },
      };

      const result = createSDK(params).getProvider();

      // Check sub-account validation and configuration
      expect(mockValidateSubAccount).toHaveBeenCalledWith(mockToOwnerAccount);
      expect(mockStore.subAccountsConfig.set).toHaveBeenCalledWith({
        toOwnerAccount: mockToOwnerAccount,
        enableAutoSubAccounts: true,
        defaultSpendPermissions: undefined,
      });

      // Check store configuration
      expect(mockStore.config.set).toHaveBeenCalledWith({
        metadata: {
          appName: 'Integration Test',
          appLogoUrl: 'https://example.com/logo.png',
          appChainIds: [1, 137],
        },
        preference: {
          options: 'all',
          telemetry: true,
        },
        paymasterUrls: {
          1: 'https://paymaster.example.com',
        },
      });

      // Check store rehydration
      expect(mockStore.persist.rehydrate).toHaveBeenCalled();

      // Check validation
      expect(mockCheckCrossOriginOpenerPolicy).toHaveBeenCalled();
      expect(mockValidatePreferences).toHaveBeenCalledWith({
        options: 'all',
        telemetry: true,
      });

      // Check telemetry
      expect(mockLoadTelemetryScript).toHaveBeenCalled();

      // Check provider creation
      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith({
        metadata: {
          appName: 'Integration Test',
          appLogoUrl: 'https://example.com/logo.png',
          appChainIds: [1, 137],
        },
        preference: {
          options: 'all',
          telemetry: true,
        },
        paymasterUrls: {
          1: 'https://paymaster.example.com',
        },
      });

      expect(result).toEqual({ mockProvider: true });
    });
  });

  describe('Edge cases', () => {
    it('should handle null app logo URL', () => {
      createSDK({ appLogoUrl: null }).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            appLogoUrl: '',
          }),
        })
      );
    });

    it('should handle empty app chain IDs array', () => {
      createSDK({ appChainIds: [] }).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            appChainIds: [],
          }),
        })
      );
    });

    it('should handle complex nested preference objects', () => {
      const complexPreference = {
        options: 'all',
        attribution: { dataSuffix: '0x1234567890123456' as `0x${string}` },
        telemetry: false,
        customProperty: 'custom value',
      };

      createSDK({ preference: complexPreference }).getProvider();

      expect(mockValidatePreferences).toHaveBeenCalledWith(complexPreference);
      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          preference: complexPreference,
        })
      );
    });
  });
});
