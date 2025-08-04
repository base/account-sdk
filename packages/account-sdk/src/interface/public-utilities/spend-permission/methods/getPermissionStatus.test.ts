import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { getClient } from ':store/chain-clients/utils.js';
import { createPublicClient, http } from 'viem';
import { readContract } from 'viem/actions';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { timestampInSecondsToDate, toSpendPermissionArgs } from '../utils.js';
import { GetPermissionStatusResponseType, getPermissionStatus } from './getPermissionStatus.js';

vi.mock(':store/chain-clients/utils.js', () => ({
  getClient: vi.fn(),
}));

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  toSpendPermissionArgs: vi.fn(),
  timestampInSecondsToDate: vi.fn(),
}));

describe('getPermissionStatus', () => {
  let mockClient: ReturnType<typeof createPublicClient>;
  let mockSpendPermission: SpendPermission;
  let mockSpendPermissionArgs: ReturnType<typeof toSpendPermissionArgs>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = createPublicClient({
      transport: http('http://localhost:8545'),
    });

    mockSpendPermission = {
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

    mockSpendPermissionArgs = {
      account: '0x1234567890aBcDeF1234567890aBcDeF12345678' as `0x${string}`,
      spender: '0x5678901234567890abCDEF1234567890abCDEF12' as `0x${string}`,
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
      allowance: BigInt('1000000000000000000'),
      period: 86400,
      start: 1234567890,
      end: 1234654290,
      salt: BigInt('123456789'),
      extraData: '0x' as `0x${string}`,
    };

    (toSpendPermissionArgs as Mock).mockReturnValue(mockSpendPermissionArgs);
    (timestampInSecondsToDate as Mock).mockImplementation(
      (timestamp: number) => new Date(timestamp * 1000)
    );
  });

  describe('successful requests', () => {
    it('should return correct permission status with remaining spend', async () => {
      const mockCurrentPeriod = {
        start: 1640995200,
        end: 1641081600,
        spend: BigInt('500000000000000000'), // 0.5 ETH spent
      };
      const mockIsRevoked = false;
      const mockIsValid = true;

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod) // getCurrentPeriod
        .mockResolvedValueOnce(mockIsRevoked) // isRevoked
        .mockResolvedValueOnce(mockIsValid); // isValid

      const result: GetPermissionStatusResponseType =
        await getPermissionStatus(mockSpendPermission);

      expect(result).toEqual({
        remainingSpend: BigInt('500000000000000000'), // 1 ETH - 0.5 ETH = 0.5 ETH remaining
        nextPeriodStart: new Date(1641081601 * 1000), // end + 1 converted to Date
        isActive: true, // not revoked and valid
      });

      expect(getClient).toHaveBeenCalledWith(8453);
      expect(toSpendPermissionArgs).toHaveBeenCalledWith(mockSpendPermission);
      expect(readContract).toHaveBeenCalledTimes(3);
    });

    it('should return zero remaining spend when allowance is exceeded', async () => {
      const mockCurrentPeriod = {
        start: 1640995200,
        end: 1641081600,
        spend: BigInt('1500000000000000000'), // 1.5 ETH spent (more than allowance)
      };
      const mockIsRevoked = false;
      const mockIsValid = true;

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(mockIsRevoked)
        .mockResolvedValueOnce(mockIsValid);

      const result = await getPermissionStatus(mockSpendPermission);

      expect(result.remainingSpend).toBe(BigInt(0));
      expect(result.isActive).toBe(true);
    });

    it('should return inactive status when permission is revoked', async () => {
      const mockCurrentPeriod = {
        start: 1640995200,
        end: 1641081600,
        spend: BigInt('0'),
      };
      const mockIsRevoked = true;
      const mockIsValid = true;

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(mockIsRevoked)
        .mockResolvedValueOnce(mockIsValid);

      const result = await getPermissionStatus(mockSpendPermission);

      expect(result.isActive).toBe(false);
    });

    it('should return inactive status when permission is invalid', async () => {
      const mockCurrentPeriod = {
        start: 1640995200,
        end: 1641081600,
        spend: BigInt('0'),
      };
      const mockIsRevoked = false;
      const mockIsValid = false;

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(mockIsRevoked)
        .mockResolvedValueOnce(mockIsValid);

      const result = await getPermissionStatus(mockSpendPermission);

      expect(result.isActive).toBe(false);
    });

    it('should handle different chain IDs correctly', async () => {
      const testChainIds = [1, 8453, 137, 42161];

      for (const chainId of testChainIds) {
        const permission = { ...mockSpendPermission, chainId };
        const mockCurrentPeriod = { start: 1, end: 2, spend: BigInt('0') };

        (getClient as Mock).mockReturnValue(mockClient);
        (readContract as Mock)
          .mockResolvedValueOnce(mockCurrentPeriod)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(true);

        await getPermissionStatus(permission);

        expect(getClient).toHaveBeenCalledWith(chainId);
      }
    });
  });

  describe('error handling', () => {
    it('should throw error when chainId is missing', async () => {
      const permissionWithoutChainId = {
        ...mockSpendPermission,
        chainId: undefined,
      };

      await expect(getPermissionStatus(permissionWithoutChainId)).rejects.toThrow(
        'chainId is missing in the spend permission'
      );

      expect(getClient).not.toHaveBeenCalled();
      expect(readContract).not.toHaveBeenCalled();
    });

    it('should throw error when client is not available', async () => {
      (getClient as Mock).mockReturnValue(null);

      await expect(getPermissionStatus(mockSpendPermission)).rejects.toThrow(
        'No client available for chain ID 8453. Make sure the SDK is in connected state.'
      );

      expect(getClient).toHaveBeenCalledWith(8453);
      expect(readContract).not.toHaveBeenCalled();
    });

    it('should propagate readContract errors', async () => {
      const contractError = new Error('Contract call failed');

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock).mockRejectedValue(contractError);

      await expect(getPermissionStatus(mockSpendPermission)).rejects.toThrow(
        'Contract call failed'
      );

      expect(getClient).toHaveBeenCalledWith(8453);
      expect(readContract).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network request failed');

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock).mockRejectedValue(networkError);

      await expect(getPermissionStatus(mockSpendPermission)).rejects.toThrow(
        'Network request failed'
      );
    });
  });

  describe('contract call verification', () => {
    it('should call all required contract functions with correct parameters', async () => {
      const mockCurrentPeriod = { start: 1, end: 2, spend: BigInt('0') };

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await getPermissionStatus(mockSpendPermission);

      expect(readContract).toHaveBeenCalledTimes(3);

      // Verify getCurrentPeriod call
      expect(readContract).toHaveBeenNthCalledWith(1, mockClient, {
        address: spendPermissionManagerAddress,
        abi: spendPermissionManagerAbi,
        functionName: 'getCurrentPeriod',
        args: [mockSpendPermissionArgs],
      });

      // Verify isRevoked call
      expect(readContract).toHaveBeenNthCalledWith(2, mockClient, {
        address: spendPermissionManagerAddress,
        abi: spendPermissionManagerAbi,
        functionName: 'isRevoked',
        args: [mockSpendPermissionArgs],
      });

      // Verify isValid call
      expect(readContract).toHaveBeenNthCalledWith(3, mockClient, {
        address: spendPermissionManagerAddress,
        abi: spendPermissionManagerAbi,
        functionName: 'isValid',
        args: [mockSpendPermissionArgs],
      });
    });

    it('should make contract calls in parallel for better performance', async () => {
      const mockCurrentPeriod = { start: 1, end: 2, spend: BigInt('0') };

      (getClient as Mock).mockReturnValue(mockClient);

      // Create promises that we can control
      let resolveGetCurrentPeriod: (value: any) => void;
      let resolveIsRevoked: (value: any) => void;
      let resolveIsValid: (value: any) => void;

      const getCurrentPeriodPromise = new Promise((resolve) => {
        resolveGetCurrentPeriod = resolve;
      });
      const isRevokedPromise = new Promise((resolve) => {
        resolveIsRevoked = resolve;
      });
      const isValidPromise = new Promise((resolve) => {
        resolveIsValid = resolve;
      });

      (readContract as Mock)
        .mockReturnValueOnce(getCurrentPeriodPromise)
        .mockReturnValueOnce(isRevokedPromise)
        .mockReturnValueOnce(isValidPromise);

      const statusPromise = getPermissionStatus(mockSpendPermission);

      // Verify all contract calls are made immediately
      expect(readContract).toHaveBeenCalledTimes(3);

      // Resolve all promises
      resolveGetCurrentPeriod!(mockCurrentPeriod);
      resolveIsRevoked!(false);
      resolveIsValid!(true);

      await statusPromise;
    });
  });

  describe('edge cases', () => {
    it('should handle zero allowance correctly', async () => {
      const permissionWithZeroAllowance = {
        ...mockSpendPermission,
        permission: {
          ...mockSpendPermission.permission,
          allowance: '0',
        },
      };

      const mockCurrentPeriod = { start: 1, end: 2, spend: BigInt('0') };

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await getPermissionStatus(permissionWithZeroAllowance);

      expect(result.remainingSpend).toBe(BigInt(0));
    });

    it('should handle very large allowance values', async () => {
      const permissionWithLargeAllowance = {
        ...mockSpendPermission,
        permission: {
          ...mockSpendPermission.permission,
          allowance: '999999999999999999999999999999',
        },
      };

      const mockCurrentPeriod = {
        start: 1,
        end: 2,
        spend: BigInt('1000000000000000000'),
      };

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await getPermissionStatus(permissionWithLargeAllowance);

      expect(result.remainingSpend).toBe(
        BigInt('999999999999999999999999999999') - BigInt('1000000000000000000')
      );
    });

    it('should handle period end at maximum timestamp', async () => {
      const mockCurrentPeriod = {
        start: 1,
        end: 2147483647, // Max 32-bit timestamp
        spend: BigInt('0'),
      };

      (getClient as Mock).mockReturnValue(mockClient);
      (readContract as Mock)
        .mockResolvedValueOnce(mockCurrentPeriod)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await getPermissionStatus(mockSpendPermission);

      expect(result.nextPeriodStart).toEqual(new Date(2147483648 * 1000));
    });
  });
});
