import { describe, expect, it, beforeEach, vi, type Mock } from 'vitest';
import { TOKENS } from './constants.js';
import { getSubscriptionStatus } from './getSubscriptionStatus.js';

vi.mock('../public-utilities/spend-permission/index.js', () => ({
  fetchPermission: vi.fn(),
  getPermissionStatus: vi.fn(),
}));

vi.mock('../../store/chain-clients/utils.js', () => ({
  createClients: vi.fn(),
  getClient: vi.fn(),
  FALLBACK_CHAINS: [
    {
      id: 8453,
      rpcUrl: 'https://example-base.test',
      nativeCurrency: { name: 'Base', symbol: 'ETH', decimal: 18 },
    },
    {
      id: 84532,
      rpcUrl: 'https://example-base-sepolia.test',
      nativeCurrency: { name: 'Base Sepolia', symbol: 'ETH', decimal: 18 },
    },
  ],
}));

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

vi.mock('../public-utilities/spend-permission/utils.js', () => ({
  calculateCurrentPeriod: vi.fn(),
  timestampInSecondsToDate: vi.fn((timestamp: number) => new Date(timestamp * 1000)),
  toSpendPermissionArgs: vi.fn(),
}));

describe('getSubscriptionStatus', () => {
  let fetchPermission: Mock;
  let getPermissionStatus: Mock;
  let getClient: Mock;
  let createClients: Mock;
  let calculateCurrentPeriod: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();

    const spendPermissionModule = await import('../public-utilities/spend-permission/index.js');
    fetchPermission = vi.mocked(spendPermissionModule.fetchPermission);
    getPermissionStatus = vi.mocked(spendPermissionModule.getPermissionStatus);

    const chainClientsModule = await import('../../store/chain-clients/utils.js');
    getClient = vi.mocked(chainClientsModule.getClient);
    createClients = vi.mocked(chainClientsModule.createClients);

    const utilsModule = await import('../public-utilities/spend-permission/utils.js');
    calculateCurrentPeriod = vi.mocked(utilsModule.calculateCurrentPeriod);
    vi.mocked(utilsModule.timestampInSecondsToDate).mockImplementation(
      (timestamp: number) => new Date(timestamp * 1000)
    );
  });

  const basePermission = {
    createdAt: 0,
    permissionHash: '0xhash',
    signature: '0xsig',
    chainId: 8453,
    permission: {
      account: '0x0000000000000000000000000000000000000001',
      spender: '0x0000000000000000000000000000000000000002',
      token: TOKENS.USDC.addresses.base,
      allowance: '1000000',
      period: 86400,
      start: 1_699_999_000,
      end: 1_700_086_400,
      salt: '1',
      extraData: '0x',
    },
  } as const;

  it('treats non-revoked subscriptions with no on-chain state as active', async () => {
    const nowSeconds = 1_700_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

    fetchPermission.mockResolvedValue(basePermission as any);
    getPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt(1_000_000),
      nextPeriodStart: new Date((nowSeconds + 86400) * 1000),
      isActive: false,
      isRevoked: false,
    });
    getClient.mockReturnValue(undefined);
    createClients.mockReturnValue(undefined);
    calculateCurrentPeriod.mockReturnValue({
      start: basePermission.permission.start,
      end: basePermission.permission.end,
      spend: BigInt(0),
    });

    const status = await getSubscriptionStatus({ id: basePermission.permissionHash });

    expect(status.isSubscribed).toBe(true);
    expect(status.remainingChargeInPeriod).toBe('1');
    expect(status.recurringCharge).toBe('1');

    nowSpy.mockRestore();
  });

  it('returns inactive status when permission is revoked before any spend', async () => {
    const nowSeconds = 1_700_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(nowSeconds * 1000);

    fetchPermission.mockResolvedValue(basePermission as any);
    getPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt(1_000_000),
      nextPeriodStart: new Date((nowSeconds + 86400) * 1000),
      isActive: false,
      isRevoked: true,
    });
    getClient.mockReturnValue(undefined);
    createClients.mockReturnValue(undefined);
    calculateCurrentPeriod.mockReturnValue({
      start: basePermission.permission.start,
      end: basePermission.permission.end,
      spend: BigInt(0),
    });

    const status = await getSubscriptionStatus({ id: basePermission.permissionHash });

    expect(status.isSubscribed).toBe(false);

    nowSpy.mockRestore();
  });
});
