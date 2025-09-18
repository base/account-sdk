import type { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { readContract } from 'viem/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHAIN_IDS, TOKENS } from './constants.js';
import { getSubscriptionStatus } from './getSubscriptionStatus.js';
import type { SubscriptionStatus } from './types.js';

// Mock dependencies
vi.mock('viem', () => ({
  formatUnits: vi.fn((value: bigint, decimals: number) => {
    return (Number(value) / Math.pow(10, decimals)).toString();
  }),
}));

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

vi.mock('../../store/chain-clients/utils.js', () => ({
  createClients: vi.fn(),
  FALLBACK_CHAINS: [
    { id: 8453, name: 'Base' },
    { id: 84532, name: 'Base Sepolia' },
  ],
  getClient: vi.fn(),
}));

vi.mock('../public-utilities/spend-permission/index.js', () => ({
  fetchPermission: vi.fn(),
  getPermissionStatus: vi.fn(),
}));

vi.mock('../public-utilities/spend-permission/utils.js', () => ({
  calculateCurrentPeriod: vi.fn(),
  timestampInSecondsToDate: vi.fn((timestamp: number) => new Date(timestamp * 1000)),
  toSpendPermissionArgs: vi.fn(),
}));

describe('getSubscriptionStatus', () => {
  const mockPermissionHash = '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984';
  const mockClient = { transport: { url: 'http://localhost:8545' } };

  const createMockPermission = (overrides?: Partial<SpendPermission>): SpendPermission => {
    const defaultPermission = {
      account: '0xAccount0000000000000000000000000000000000', // The account that owns the subscription
      token: TOKENS.USDC.addresses.base,
      spender: '0xSpender0000000000000000000000000000000000', // The spender (should be returned as subscriptionOwner)
      allowance: '10000000', // 10 USDC (10 * 10^6)
      period: 2592000, // 30 days in seconds
      start: Math.floor(Date.now() / 1000) - 86400, // Started yesterday
      end: Math.floor(Date.now() / 1000) + 31536000, // Ends in 1 year
      salt: '0',
      extraData: '0x',
    };

    return {
      chainId: overrides?.chainId ?? CHAIN_IDS.base,
      permission: {
        ...defaultPermission,
        ...(overrides?.permission || {}),
      },
      signature: overrides?.signature ?? '0xmocksignature',
    } as SpendPermission;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful status retrieval', () => {
    it('should return active subscription status with on-chain state', async () => {
      const mockPermission = createMockPermission();
      const currentTime = Math.floor(Date.now() / 1000);
      const mockCurrentPeriod = {
        start: currentTime - 86400, // Started yesterday
        end: currentTime + 2505600, // Ends in 29 days
        spend: 2000000n, // 2 USDC spent
      };

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');
      const { toSpendPermissionArgs } = await import('../public-utilities/spend-permission/utils.js');
      const { timestampInSecondsToDate } = await import('../public-utilities/spend-permission/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      
      // Add a spy to see what the implementation actually receives
      vi.mocked(fetchPermission).mockImplementation(async () => {
        return mockPermission;
      });
      vi.mocked(getClient).mockReturnValue(mockClient);
      vi.mocked(toSpendPermissionArgs).mockReturnValue(['mockArgs'] as any);
      vi.mocked(readContract).mockResolvedValue(mockCurrentPeriod);
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: true,
        remainingSpend: 8000000n, // 8 USDC remaining
        nextPeriodStart: new Date((currentTime + 2505600) * 1000),
      } as any);
      vi.mocked(timestampInSecondsToDate).mockImplementation((timestamp: number) => new Date(timestamp * 1000));

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(result).toEqual<SubscriptionStatus>({
        isSubscribed: true,
        recurringCharge: '10',
        remainingChargeInPeriod: '8',
        currentPeriodStart: new Date((currentTime - 86400) * 1000),
        nextPeriodStart: new Date((currentTime + 2505600) * 1000),
        periodInDays: 30,
        subscriptionOwner: '0xSpender0000000000000000000000000000000000', // Should be the spender field
      });

      expect(fetchPermission).toHaveBeenCalledWith({ permissionHash: mockPermissionHash });
      expect(getPermissionStatus).toHaveBeenCalledWith(mockPermission);
      expect(readContract).toHaveBeenCalled();
    });

    it('should return active subscription when no on-chain state exists', async () => {
      const mockPermission = createMockPermission();
      const currentTime = Math.floor(Date.now() / 1000);
      const mockCurrentPeriod = {
        start: currentTime - 86400,
        end: currentTime + 2505600,
        spend: 0n, // No spend yet
      };

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient).mockReturnValue(mockClient);
      vi.mocked(readContract).mockResolvedValue(mockCurrentPeriod);
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: false, // No on-chain activity yet
        remainingSpend: 10000000n, // Full amount available
        nextPeriodStart: new Date((currentTime + 2505600) * 1000),
      } as any);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(result.isSubscribed).toBe(true); // Should still be subscribed
      expect(result.recurringCharge).toBe('10');
      expect(result.remainingChargeInPeriod).toBe('10');
    });

    it('should handle testnet subscriptions', async () => {
      const mockPermission = createMockPermission({
        chainId: CHAIN_IDS.baseSepolia,
        permission: {
          account: '0xAccount0000000000000000000000000000000000',
          token: TOKENS.USDC.addresses.baseSepolia,
          spender: '0xSpender0000000000000000000000000000000000',
          allowance: '5000000', // 5 USDC
          period: 86400, // 1 day
          start: Math.floor(Date.now() / 1000) - 3600,
          end: Math.floor(Date.now() / 1000) + 86400,
          salt: '0',
          extraData: '0x',
        },
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient).mockReturnValue(mockClient);
      vi.mocked(readContract).mockResolvedValue({
        start: Math.floor(Date.now() / 1000) - 3600,
        end: Math.floor(Date.now() / 1000) + 82800,
        spend: 1000000n,
      });
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: true,
        remainingSpend: 4000000n,
        nextPeriodStart: new Date((Math.floor(Date.now() / 1000) + 82800) * 1000),
      } as any);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: true,
      });

      expect(result).toMatchObject({
        isSubscribed: true,
        recurringCharge: '5',
        remainingChargeInPeriod: '4',
        periodInDays: 1,
      });
    });

    it('should calculate period from permission when client is not available', async () => {
      const mockPermission = createMockPermission();
      const currentTime = Math.floor(Date.now() / 1000);

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');
      const { calculateCurrentPeriod } = await import('../public-utilities/spend-permission/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient).mockReturnValue(null); // No client available
      vi.mocked(calculateCurrentPeriod).mockReturnValue({
        start: currentTime - 86400,
        end: currentTime + 2505600,
        spend: 0n,
      });
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: true,
        remainingSpend: 10000000n,
        nextPeriodStart: new Date((currentTime + 2505600) * 1000),
      } as any);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(calculateCurrentPeriod).toHaveBeenCalledWith(mockPermission);
      expect(result.isSubscribed).toBe(true);
    });

    it('should handle readContract errors gracefully', async () => {
      const mockPermission = createMockPermission();
      const currentTime = Math.floor(Date.now() / 1000);

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');
      const { calculateCurrentPeriod } = await import('../public-utilities/spend-permission/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient).mockReturnValue(mockClient);
      vi.mocked(readContract).mockRejectedValue(new Error('Contract read failed'));
      vi.mocked(calculateCurrentPeriod).mockReturnValue({
        start: currentTime - 86400,
        end: currentTime + 2505600,
        spend: 0n,
      });
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: true,
        remainingSpend: 10000000n,
        nextPeriodStart: new Date((currentTime + 2505600) * 1000),
      } as any);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      // Should fall back to calculateCurrentPeriod
      expect(calculateCurrentPeriod).toHaveBeenCalledWith(mockPermission);
      expect(result.isSubscribed).toBe(true);
    });
  });

  describe('subscription not found', () => {
    it('should return not subscribed when permission is not found', async () => {
      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      vi.mocked(fetchPermission).mockResolvedValue(null);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(result).toEqual<SubscriptionStatus>({
        isSubscribed: false,
        recurringCharge: '0',
      });
    });
  });

  describe('expired subscriptions', () => {
    it('should return not subscribed for expired subscription', async () => {
      const mockPermission = createMockPermission({
        permission: {
          account: '0xAccount0000000000000000000000000000000000',
          token: TOKENS.USDC.addresses.base,
          spender: '0xSpender0000000000000000000000000000000000',
          allowance: '10000000',
          period: 2592000,
          start: Math.floor(Date.now() / 1000) - 31536000, // Started 1 year ago
          end: Math.floor(Date.now() / 1000) - 86400, // Ended yesterday
          salt: '0',
          extraData: '0x',
        },
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient).mockReturnValue(mockClient);
      vi.mocked(readContract).mockResolvedValue({
        start: Math.floor(Date.now() / 1000) - 31536000,
        end: Math.floor(Date.now() / 1000) - 86400,
        spend: 0n,
      });
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: true, // May still be "active" in contract state
        remainingSpend: 10000000n,
        nextPeriodStart: undefined,
      } as any);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(result.isSubscribed).toBe(false); // Should not be subscribed due to expiration
    });
  });

  describe('revoked subscriptions', () => {
    it('should return not subscribed for revoked subscription', async () => {
      const mockPermission = createMockPermission();
      const currentTime = Math.floor(Date.now() / 1000);

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient } = await import('../../store/chain-clients/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient).mockReturnValue(mockClient);
      vi.mocked(readContract).mockResolvedValue({
        start: currentTime - 86400,
        end: currentTime + 2505600,
        spend: 1000000n, // Has been used (not 0)
      });
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: false, // Revoked
        remainingSpend: 0n,
        nextPeriodStart: undefined,
      } as any);

      const result = await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(result.isSubscribed).toBe(false); // Should not be subscribed due to revocation
    });
  });

  describe('chain validation', () => {
    it('should throw error when testnet requested but subscription is on mainnet', async () => {
      const mockPermission = createMockPermission({
        chainId: CHAIN_IDS.base, // Mainnet
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);

      await expect(
        getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: true, // Requesting testnet
        })
      ).rejects.toThrow('The subscription was requested on testnet but is actually a mainnet subscription');
    });

    it('should throw error when mainnet requested but subscription is on testnet', async () => {
      const mockPermission = createMockPermission({
        chainId: CHAIN_IDS.baseSepolia, // Testnet
        permission: {
          account: '0xAccount0000000000000000000000000000000000',
          token: TOKENS.USDC.addresses.baseSepolia,
          spender: '0xSpender0000000000000000000000000000000000',
          allowance: '10000000',
          period: 2592000,
          start: Math.floor(Date.now() / 1000) - 86400,
          end: Math.floor(Date.now() / 1000) + 31536000,
          salt: '0',
          extraData: '0x',
        },
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);

      await expect(
        getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: false, // Requesting mainnet
        })
      ).rejects.toThrow('The subscription was requested on mainnet but is actually a testnet subscription');
    });

    it('should throw error for unexpected chain ID', async () => {
      const mockPermission = createMockPermission({
        chainId: 1, // Ethereum mainnet (not Base)
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);

      await expect(
        getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: false,
        })
      ).rejects.toThrow('Subscription is on chain 1, expected 8453 (Base)');
    });
  });

  describe('token validation', () => {
    it('should throw error when subscription is not for USDC', async () => {
      const mockPermission = createMockPermission({
        permission: {
          account: '0xAccount0000000000000000000000000000000000',
          token: '0x0000000000000000000000000000000000000000', // Not USDC
          spender: '0xSpender0000000000000000000000000000000000',
          allowance: '10000000',
          period: 2592000,
          start: Math.floor(Date.now() / 1000) - 86400,
          end: Math.floor(Date.now() / 1000) + 31536000,
          salt: '0',
          extraData: '0x',
        },
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);

      await expect(
        getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: false,
        })
      ).rejects.toThrow(/Subscription is not for USDC token/);
    });
  });

  describe('timing validation', () => {
    it('should throw error when subscription has not started yet', async () => {
      const futureStart = Math.floor(Date.now() / 1000) + 86400; // Starts tomorrow
      const mockPermission = createMockPermission({
        permission: {
          account: '0xAccount0000000000000000000000000000000000',
          token: TOKENS.USDC.addresses.base,
          spender: '0xSpender0000000000000000000000000000000000',
          allowance: '10000000',
          period: 2592000,
          start: futureStart,
          end: futureStart + 31536000,
          salt: '0',
          extraData: '0x',
        },
      });

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);

      await expect(
        getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: false,
        })
      ).rejects.toThrow(/Subscription has not started yet/);
    });
  });

  describe('chain client initialization', () => {
    it('should create client for fallback chain if not initialized', async () => {
      const mockPermission = createMockPermission();

      const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
      const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
      const { getClient, createClients } = await import('../../store/chain-clients/utils.js');

      vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
      vi.mocked(getClient)
        .mockReturnValueOnce(null) // First call returns null
        .mockReturnValue(mockClient); // Subsequent calls return client
      vi.mocked(getPermissionStatus).mockResolvedValue({
        isActive: true,
        remainingSpend: 10000000n,
        nextPeriodStart: new Date(),
      } as any);
      vi.mocked(readContract).mockResolvedValue({
        start: Math.floor(Date.now() / 1000) - 86400,
        end: Math.floor(Date.now() / 1000) + 2505600,
        spend: 0n,
      });

      await getSubscriptionStatus({
        id: mockPermissionHash,
        testnet: false,
      });

      expect(createClients).toHaveBeenCalledWith([{ id: 8453, name: 'Base' }]);
    });
  });

  describe('period calculation', () => {
    it('should calculate period in days correctly', async () => {
      const testCases = [
        { periodSeconds: 86400, expectedDays: 1 },
        { periodSeconds: 604800, expectedDays: 7 },
        { periodSeconds: 2592000, expectedDays: 30 },
        { periodSeconds: 31536000, expectedDays: 365 },
      ];

      for (const { periodSeconds, expectedDays } of testCases) {
        vi.clearAllMocks();

        const mockPermission = createMockPermission({
          permission: {
            account: '0xAccount0000000000000000000000000000000000',
            token: TOKENS.USDC.addresses.base,
            spender: '0xSpender0000000000000000000000000000000000',
            allowance: '10000000',
            period: periodSeconds,
            start: Math.floor(Date.now() / 1000) - 86400,
            end: Math.floor(Date.now() / 1000) + 31536000,
            salt: '0',
            extraData: '0x',
          },
        });

        const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
        const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
        const { getClient } = await import('../../store/chain-clients/utils.js');

        vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
        vi.mocked(getClient).mockReturnValue(mockClient);
        vi.mocked(readContract).mockResolvedValue({
          start: Math.floor(Date.now() / 1000) - 86400,
          end: Math.floor(Date.now() / 1000) + periodSeconds - 86400,
          spend: 0n,
        });
        vi.mocked(getPermissionStatus).mockResolvedValue({
          isActive: true,
          remainingSpend: 10000000n,
          nextPeriodStart: new Date(),
        } as any);

        const result = await getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: false,
        });

        expect(result.periodInDays).toBe(expectedDays);
      }
    });
  });

  describe('amount formatting', () => {
    it('should format USDC amounts correctly', async () => {
      const testCases = [
        { allowance: '1000000', expectedRecurring: '1' }, // 1 USDC
        { allowance: '10000000', expectedRecurring: '10' }, // 10 USDC
        { allowance: '999000', expectedRecurring: '0.999' }, // 0.999 USDC
        { allowance: '12500000', expectedRecurring: '12.5' }, // 12.5 USDC
      ];

      for (const { allowance, expectedRecurring } of testCases) {
        vi.clearAllMocks();

        const mockPermission = createMockPermission({
          permission: {
            account: '0xAccount0000000000000000000000000000000000',
            token: TOKENS.USDC.addresses.base,
            spender: '0xSpender0000000000000000000000000000000000',
            allowance,
            period: 2592000,
            start: Math.floor(Date.now() / 1000) - 86400,
            end: Math.floor(Date.now() / 1000) + 31536000,
            salt: '0',
            extraData: '0x',
          },
        });

        const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
        const { getPermissionStatus } = await import('../public-utilities/spend-permission/index.js');
        const { getClient } = await import('../../store/chain-clients/utils.js');

        vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
        vi.mocked(getClient).mockReturnValue(mockClient);
        vi.mocked(readContract).mockResolvedValue({
          start: Math.floor(Date.now() / 1000) - 86400,
          end: Math.floor(Date.now() / 1000) + 2505600,
          spend: 0n,
        });
        vi.mocked(getPermissionStatus).mockResolvedValue({
          isActive: true,
          remainingSpend: BigInt(allowance),
          nextPeriodStart: new Date(),
        } as any);

        const result = await getSubscriptionStatus({
          id: mockPermissionHash,
          testnet: false,
        });

        expect(result.recurringCharge).toBe(expectedRecurring);
      }
    });
  });
});
