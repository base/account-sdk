import { CB_WALLET_RPC_URL } from ':core/constants.js';
import { ProviderInterface } from ':core/provider/interface.js';
import { FetchPermissionResponse } from ':core/rpc/coinbase_fetchPermission.js';
import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { fetchRPCRequest } from ':util/provider.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPermission } from './fetchPermission.js';

// Mock the provider utility
vi.mock(':util/provider.js');

const mockFetchRPCRequest = vi.mocked(fetchRPCRequest);

const PERMISSION_HASH = '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984';

const mockPermission: SpendPermission = {
  createdAt: 1234567890,
  permissionHash: '0xabcdef123456',
  signature: '0x987654321fedcba',
  chainId: 8453,
  permission: {
    account: '0x1234567890abcdef1234567890abcdef12345678',
    spender: '0x5678901234567890abcdef1234567890abcdef12',
    token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    allowance: '1000000000000000000',
    period: 86400,
    start: 1234567890,
    end: 1234654290,
    salt: '123456789',
    extraData: '0x',
  },
};

const mockResponse: FetchPermissionResponse = {
  permission: mockPermission,
};

describe('fetchPermission - with provider', () => {
  const mockProvider = {
    request: vi.fn(),
  } as unknown as ProviderInterface;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call provider.request with coinbase_fetchPermission and return the permission', async () => {
    vi.mocked(mockProvider.request).mockResolvedValue(mockResponse);

    const result = await fetchPermission({
      provider: mockProvider,
      permissionHash: PERMISSION_HASH,
    });

    expect(mockProvider.request).toHaveBeenCalledWith({
      method: 'coinbase_fetchPermission',
      params: [
        {
          permissionHash: PERMISSION_HASH,
        },
      ],
    });
    expect(result).toEqual(mockPermission);
  });

  it('should not call fetchRPCRequest when a provider is supplied', async () => {
    vi.mocked(mockProvider.request).mockResolvedValue(mockResponse);

    await fetchPermission({
      provider: mockProvider,
      permissionHash: PERMISSION_HASH,
    });

    expect(mockFetchRPCRequest).not.toHaveBeenCalled();
  });

  it('should propagate provider errors', async () => {
    const errorMessage = 'Provider error';
    vi.mocked(mockProvider.request).mockRejectedValue(new Error(errorMessage));

    await expect(
      fetchPermission({
        provider: mockProvider,
        permissionHash: PERMISSION_HASH,
      })
    ).rejects.toThrow(errorMessage);
  });

  it('should propagate RPC-style error objects', async () => {
    vi.mocked(mockProvider.request).mockRejectedValue({
      code: -32603,
      message: 'Internal error',
    });

    await expect(
      fetchPermission({
        provider: mockProvider,
        permissionHash: PERMISSION_HASH,
      })
    ).rejects.toEqual({
      code: -32603,
      message: 'Internal error',
    });
  });
});

describe('fetchPermission - without provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchRPCRequest with the request object and CB_WALLET_RPC_URL', async () => {
    mockFetchRPCRequest.mockResolvedValue(mockResponse);

    const result = await fetchPermission({
      permissionHash: PERMISSION_HASH,
    });

    expect(mockFetchRPCRequest).toHaveBeenCalledWith(
      {
        method: 'coinbase_fetchPermission',
        params: [
          {
            permissionHash: PERMISSION_HASH,
          },
        ],
      },
      CB_WALLET_RPC_URL
    );
    expect(result).toEqual(mockPermission);
  });

  it('should propagate fetchRPCRequest errors', async () => {
    const errorMessage = 'Network error';
    mockFetchRPCRequest.mockRejectedValue(new Error(errorMessage));

    await expect(
      fetchPermission({
        permissionHash: PERMISSION_HASH,
      })
    ).rejects.toThrow(errorMessage);
  });
});

describe('fetchPermission - return shape', () => {
  const mockProvider = {
    request: vi.fn(),
  } as unknown as ProviderInterface;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should unwrap and return response.permission (not the full response)', async () => {
    vi.mocked(mockProvider.request).mockResolvedValue(mockResponse);

    const result = await fetchPermission({
      provider: mockProvider,
      permissionHash: PERMISSION_HASH,
    });

    expect(result).toEqual(mockPermission);
    expect(result).not.toEqual(mockResponse);
  });

  it('should handle a permission with only the minimal required fields', async () => {
    const minimalPermission: SpendPermission = {
      signature: '0x987654321fedcba',
      permission: {
        account: '0x1234567890abcdef1234567890abcdef12345678',
        spender: '0x5678901234567890abcdef1234567890abcdef12',
        token: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        allowance: '1000000000000000000',
        period: 86400,
        start: 1234567890,
        end: 1234654290,
        salt: '123456789',
        extraData: '0x',
      },
    };

    vi.mocked(mockProvider.request).mockResolvedValue({
      permission: minimalPermission,
    } as FetchPermissionResponse);

    const result = await fetchPermission({
      provider: mockProvider,
      permissionHash: PERMISSION_HASH,
    });

    expect(result).toEqual(minimalPermission);
    expect(result).not.toHaveProperty('createdAt');
    expect(result).not.toHaveProperty('permissionHash');
    expect(result).not.toHaveProperty('chainId');
  });
});

describe('fetchPermission - current behavior on malformed RPC response', () => {
  const mockProvider = {
    request: vi.fn(),
  } as unknown as ProviderInterface;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject when the RPC resolves null', async () => {
    // NOTE: current behavior; not asserting this is correct.
    // Reading `.permission` off a null response throws a TypeError today.
    vi.mocked(mockProvider.request).mockResolvedValue(null as unknown as FetchPermissionResponse);

    await expect(
      fetchPermission({
        provider: mockProvider,
        permissionHash: PERMISSION_HASH,
      })
    ).rejects.toThrow();
  });

  it('should resolve to undefined when the RPC response has no `permission` key', async () => {
    // NOTE: current behavior; not asserting this is correct.
    // The response is returned unvalidated, so `response.permission` is undefined.
    vi.mocked(mockProvider.request).mockResolvedValue({} as FetchPermissionResponse);

    const result = await fetchPermission({
      provider: mockProvider,
      permissionHash: PERMISSION_HASH,
    });

    expect(result).toBeUndefined();
  });
});
