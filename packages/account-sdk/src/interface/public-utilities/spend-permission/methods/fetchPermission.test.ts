import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as utils from '../utils.js';
import { fetchPermission } from './fetchPermission.js';

vi.mock('../utils.js', () => ({
  fetchRPCRequest: vi.fn(),
}));

describe('fetchPermission', () => {
  let mockPermission: SpendPermission;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockPermission = {
      signature: '0xsignature123',
      chainId: 8453,
      permissionHash: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
      createdAt: 1234567890,
      permission: {
        account: '0x1234567890123456789012345678901234567890',
        spender: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        token: '0x0000000000000000000000000000000000000000',
        allowance: '1000000000000000000',
        period: 86400,
        start: 1234567890,
        end: 1234654290,
        salt: '12345',
        extraData: '0x',
      },
    };

    vi.mocked(utils.fetchRPCRequest).mockResolvedValue({
      permission: mockPermission,
    });
  });

  it('should fetch a permission by hash', async () => {
    const permissionHash = '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984';
    
    const result = await fetchPermission({
      permissionHash,
    });

    expect(utils.fetchRPCRequest).toHaveBeenCalledWith(
      {
        method: 'coinbase_fetchPermission',
        params: [
          {
            permissionHash,
          },
        ],
      },
      'https://rpc.wallet.coinbase.com/'
    );

    expect(result).toEqual(mockPermission);
  });

  it('should handle different permission hash formats', async () => {
    const permissionHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    
    await fetchPermission({
      permissionHash,
    });

    expect(utils.fetchRPCRequest).toHaveBeenCalledWith(
      {
        method: 'coinbase_fetchPermission',
        params: [
          {
            permissionHash,
          },
        ],
      },
      'https://rpc.wallet.coinbase.com/'
    );
  });

  it('should propagate errors from fetchRPCRequest', async () => {
    const error = new Error('RPC request failed');
    vi.mocked(utils.fetchRPCRequest).mockRejectedValue(error);

    await expect(
      fetchPermission({
        permissionHash: '0x123',
      })
    ).rejects.toThrow('RPC request failed');
  });
});
