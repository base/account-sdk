import * as telemetryModule from ':core/telemetry/initCCA.js';
import { store } from ':store/store.js';
import * as checkCrossOriginModule from ':util/checkCrossOriginOpenerPolicy.js';
import * as validatePreferencesModule from ':util/validatePreferences.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoinbaseWalletProvider } from './CoinbaseWalletProvider.js';
import { CreateProviderOptions, createBaseAccountSDK } from './createBaseAccountSDK.js';

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
      const result = createBaseAccountSDK({}).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith({
        metadata: {
          appName: 'App',
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

      createBaseAccountSDK(params).getProvider();

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
          attribution: { auto: true },
        },
      };

      createBaseAccountSDK(params).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith({
        metadata: {
          appName: 'App',
          appLogoUrl: '',
          appChainIds: [],
        },
        preference: {
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

      createBaseAccountSDK(params).getProvider();

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

      createBaseAccountSDK(params).getProvider();

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

      createBaseAccountSDK(params).getProvider();

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

      createBaseAccountSDK(params).getProvider();

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
        preference: {},
        paymasterUrls: { 1: 'https://paymaster.example.com' },
      };

      createBaseAccountSDK(params).getProvider();

      expect(mockStore.config.set).toHaveBeenCalledWith({
        metadata: {
          appName: 'Test App',
          appLogoUrl: '',
          appChainIds: [],
        },
        preference: {},
        paymasterUrls: { 1: 'https://paymaster.example.com' },
      });
    });

    it('should rehydrate store from storage', () => {
      createBaseAccountSDK({}).getProvider();

      expect(mockStore.persist.rehydrate).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    it('should validate preferences', () => {
      const preference = { telemetry: true };
      createBaseAccountSDK({ preference }).getProvider();

      expect(mockValidatePreferences).toHaveBeenCalledWith(preference);
    });

    it('should validate sub-account when toOwnerAccount is provided', () => {
      const mockToOwnerAccount = vi.fn();
      createBaseAccountSDK({
        subAccounts: { toOwnerAccount: mockToOwnerAccount },
      }).getProvider();

      expect(mockValidateSubAccount).toHaveBeenCalledWith(mockToOwnerAccount);
    });

    it('should check cross-origin opener policy', () => {
      createBaseAccountSDK({}).getProvider();

      expect(mockCheckCrossOriginOpenerPolicy).toHaveBeenCalled();
    });
  });

  describe('Telemetry', () => {
    it('should load telemetry script when telemetry is not disabled', () => {
      createBaseAccountSDK({
        preference: { telemetry: true },
      }).getProvider();

      expect(mockLoadTelemetryScript).toHaveBeenCalled();
    });

    it('should load telemetry script when telemetry is undefined (default)', () => {
      createBaseAccountSDK({
        preference: {},
      }).getProvider();

      expect(mockLoadTelemetryScript).toHaveBeenCalled();
    });

    it('should not load telemetry script when telemetry is disabled', () => {
      createBaseAccountSDK({
        preference: { telemetry: false },
      }).getProvider();

      expect(mockLoadTelemetryScript).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle sub-account validation errors', () => {
      mockValidateSubAccount.mockImplementationOnce(() => {
        throw new Error('Invalid sub-account function');
      });

      expect(() => {
        createBaseAccountSDK({
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

      const result = createBaseAccountSDK(params).getProvider();

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
      createBaseAccountSDK({ appLogoUrl: null }).getProvider();

      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            appLogoUrl: '',
          }),
        })
      );
    });

    it('should handle empty app chain IDs array', () => {
      createBaseAccountSDK({ appChainIds: [] }).getProvider();

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
        attribution: { dataSuffix: '0x1234567890123456' as `0x${string}` },
        telemetry: false,
        customProperty: 'custom value',
      };

      createBaseAccountSDK({ preference: complexPreference }).getProvider();

      expect(mockValidatePreferences).toHaveBeenCalledWith(complexPreference);
      expect(mockCoinbaseWalletProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          preference: complexPreference,
        })
      );
    });
  });
});
