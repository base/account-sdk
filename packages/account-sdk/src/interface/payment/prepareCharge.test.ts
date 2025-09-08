import type { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { describe, expect, it, vi } from 'vitest';
import { prepareCharge } from './prepareCharge.js';
import type { PrepareChargeResult } from './types.js';

// Mock dependencies
vi.mock('../public-utilities/spend-permission/index.js', () => ({
  fetchPermission: vi.fn(),
  prepareSpendCallData: vi.fn(),
}));

vi.mock('viem', () => ({
  parseUnits: vi.fn((value: string) => BigInt(parseFloat(value) * 1_000_000)),
}));

describe('prepareCharge', () => {
  const mockPermission = {
    chainId: 8453, // Base mainnet
    permission: { token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }, // USDC mainnet
    signature: '0xmocksignature',
  } as SpendPermission;

  const mockCallData: PrepareChargeResult = [
    { to: '0xmock', data: '0xapprove', value: '0x0' },
    { to: '0xmock', data: '0xspend', value: '0x0' },
  ];

  it('should prepare charge for specific amount', async () => {
    const { fetchPermission, prepareSpendCallData } = await import(
      '../public-utilities/spend-permission/index.js'
    );
    vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
    vi.mocked(prepareSpendCallData).mockResolvedValue(mockCallData);

    const result = await prepareCharge({
      id: '0xhash123',
      amount: '10.50',
      testnet: false,
    });

    expect(fetchPermission).toHaveBeenCalledWith({ permissionHash: '0xhash123' });
    expect(prepareSpendCallData).toHaveBeenCalledWith(mockPermission, 10500000n);
    expect(result).toEqual(mockCallData);
  });

  it('should prepare charge for max remaining amount', async () => {
    const { fetchPermission, prepareSpendCallData } = await import(
      '../public-utilities/spend-permission/index.js'
    );
    vi.mocked(fetchPermission).mockResolvedValue(mockPermission);
    vi.mocked(prepareSpendCallData).mockResolvedValue(mockCallData);

    const result = await prepareCharge({
      id: '0xhash123',
      amount: 'max-remaining-charge',
      testnet: false,
    });

    expect(prepareSpendCallData).toHaveBeenCalledWith(mockPermission, 'max-remaining-allowance');
    expect(result).toEqual(mockCallData);
  });

  it('should handle testnet permissions', async () => {
    const testnetPermission = {
      chainId: 84532, // Base Sepolia
      permission: { token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' }, // USDC testnet
      signature: '0xmocksignature',
    } as SpendPermission;
    const { fetchPermission, prepareSpendCallData } = await import(
      '../public-utilities/spend-permission/index.js'
    );
    vi.mocked(fetchPermission).mockResolvedValue(testnetPermission);
    vi.mocked(prepareSpendCallData).mockResolvedValue(mockCallData);

    await prepareCharge({
      id: '0xhash123',
      amount: '5.00',
      testnet: true,
    });

    expect(prepareSpendCallData).toHaveBeenCalledWith(testnetPermission, 5000000n);
  });

  it('should throw error for network mismatch', async () => {
    const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
    vi.mocked(fetchPermission).mockResolvedValue(mockPermission);

    await expect(prepareCharge({ id: '0xhash123', amount: '10', testnet: true })).rejects.toThrow(
      'The subscription was requested on testnet but is actually a mainnet subscription'
    );
  });

  it('should throw error for non-USDC token', async () => {
    const wrongTokenPermission = {
      chainId: 8453,
      permission: { token: '0xwrongtoken' },
      signature: '0xmocksignature',
    } as SpendPermission;
    const { fetchPermission } = await import('../public-utilities/spend-permission/index.js');
    vi.mocked(fetchPermission).mockResolvedValue(wrongTokenPermission);

    await expect(prepareCharge({ id: '0xhash123', amount: '10', testnet: false })).rejects.toThrow(
      /Subscription is not for USDC token/
    );
  });
});
