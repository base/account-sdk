import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { Address, Hex, encodeFunctionData } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { toSpendPermissionArgs } from '../utils.js';
import { getPermissionStatus } from './getPermissionStatus.js';
import { PrepareSpendCallDataResponseType, prepareSpendCallData } from './prepareSpendCallData.js';

vi.mock('./getPermissionStatus.js');
vi.mock('../utils.js');
vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    encodeFunctionData: vi.fn(),
  };
});

const mockGetPermissionStatus = vi.mocked(getPermissionStatus);
const mockToSpendPermissionArgs = vi.mocked(toSpendPermissionArgs);
const mockEncodeFunctionData = vi.mocked(encodeFunctionData);

describe('prepareSpendCallData', () => {
  const mockSpendPermission: SpendPermission = {
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

  const mockSpendPermissionArgs = {
    account: '0x1234567890AbcdEF1234567890aBcdef12345678' as Address,
    spender: '0x5678901234567890abCDEf1234567890ABcDef12' as Address,
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    allowance: BigInt('1000000000000000000'),
    period: 86400,
    start: 1234567890,
    end: 1234654290,
    salt: BigInt('123456789'),
    extraData: '0x' as Hex,
  };

  const mockStatus = {
    remainingSpend: BigInt('500000000000000000'), // 0.5 ETH remaining
    nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetPermissionStatus.mockResolvedValue(mockStatus);

    mockToSpendPermissionArgs.mockReturnValue(mockSpendPermissionArgs);

    mockEncodeFunctionData.mockImplementation(({ functionName }) => {
      if (functionName === 'approveWithSignature') {
        return '0xapprovedata123456' as `0x${string}`;
      }
      if (functionName === 'spend') {
        return '0xspenddata789abc' as `0x${string}`;
      }
      return '0xinvaliddata' as `0x${string}`;
    });
  });

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should prepare call data for approve and spend operations when permission is not active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const inactiveStatus = {
        ...mockStatus,
        isActive: false, // Permission is not active, so approve call should be included
      };
      mockGetPermissionStatus.mockResolvedValue(inactiveStatus);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        to: spendPermissionManagerAddress,
        data: '0xapprovedata123456',
        value: '0x0',
      });
      expect(result[1]).toEqual({
        to: spendPermissionManagerAddress,
        data: '0xspenddata789abc',
        value: '0x0',
      });
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should prepare call data for spend operation only when permission is already active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      mockGetPermissionStatus.mockResolvedValue(mockStatus);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        to: spendPermissionManagerAddress,
        data: '0xspenddata789abc',
        value: '0x0',
      });

      // Verify approve call is not made when permission is active
      expect(mockEncodeFunctionData).not.toHaveBeenCalledWith({
        abi: spendPermissionManagerAbi,
        functionName: 'approveWithSignature',
        args: expect.any(Array),
      });
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should use remaining spend amount when max-remaining-allowance is specified for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const remainingSpend = BigInt('750000000000000000');
      mockGetPermissionStatus.mockResolvedValue({
        ...mockStatus,
        remainingSpend,
      });

      await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: spendPermissionManagerAbi,
        functionName: 'spend',
        args: [mockSpendPermissionArgs, remainingSpend],
      });
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should use provided amount when specified for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const customAmount = BigInt('250000000000000000'); // 0.25 ETH

      await prepareSpendCallDataFunc(mockSpendPermission, customAmount);

      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: spendPermissionManagerAbi,
        functionName: 'spend',
        args: [mockSpendPermissionArgs, customAmount],
      });
    }
  );

  it('should call getPermissionStatus with the correct permission for browser environment', async () => {
    await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(mockGetPermissionStatus).toHaveBeenCalledWith(mockSpendPermission);
  });

  it('should call getPermissionStatus with the correct permission for node environment', async () => {
    await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(mockGetPermissionStatus).toHaveBeenCalledWith(mockSpendPermission);
  });

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should call toSpendPermissionArgs with the correct permission for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(mockToSpendPermissionArgs).toHaveBeenCalledWith(mockSpendPermission);
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should encode approveWithSignature function data correctly when permission is not active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const inactiveStatus = {
        ...mockStatus,
        isActive: false, // Permission is not active, so approve call should be included
      };
      mockGetPermissionStatus.mockResolvedValue(inactiveStatus);

      await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: spendPermissionManagerAbi,
        functionName: 'approveWithSignature',
        args: [mockSpendPermissionArgs, mockSpendPermission.signature],
      });
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should encode spend function data correctly for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const customAmount = BigInt('300000000000000000');

      await prepareSpendCallDataFunc(mockSpendPermission, customAmount);

      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: spendPermissionManagerAbi,
        functionName: 'spend',
        args: [mockSpendPermissionArgs, customAmount],
      });
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should return calls with correct structure when permission is not active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const inactiveStatus = {
        ...mockStatus,
        isActive: false, // Permission is not active, so approve call should be included
      };
      mockGetPermissionStatus.mockResolvedValue(inactiveStatus);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      // Check that result matches the expected type
      const typedResult: PrepareSpendCallDataResponseType = result;
      expect(typedResult).toHaveLength(2);

      // Check approve call structure
      expect(typedResult[0]).toHaveProperty('to');
      expect(typedResult[0]).toHaveProperty('data');
      expect(typedResult[0]).toHaveProperty('value');
      expect(typedResult[0].value).toBe('0x0');

      // Check spend call structure
      expect(typedResult[1]).toHaveProperty('to');
      expect(typedResult[1]).toHaveProperty('data');
      expect(typedResult[1]).toHaveProperty('value');
      expect(typedResult[1].value).toBe('0x0');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should return calls with correct structure when permission is active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      mockGetPermissionStatus.mockResolvedValue(mockStatus);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      // Check that result matches the expected type
      const typedResult: PrepareSpendCallDataResponseType = result;
      expect(typedResult).toHaveLength(1);

      // Check spend call structure (only call when active)
      expect(typedResult[0]).toHaveProperty('to');
      expect(typedResult[0]).toHaveProperty('data');
      expect(typedResult[0]).toHaveProperty('value');
      expect(typedResult[0].value).toBe('0x0');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])('should handle zero amount for %s environment', async (_, prepareSpendCallDataFunc) => {
    const zeroAmount = BigInt('0');

    await expect(prepareSpendCallDataFunc(mockSpendPermission, zeroAmount)).rejects.toThrow(
      'Spend amount cannot be 0'
    );
  });

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should throw error when amount exceeds remaining spend for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const remainingSpend = BigInt('500000000000000000'); // 0.5 ETH remaining
      const excessiveAmount = BigInt('600000000000000000'); // 0.6 ETH (more than remaining)

      mockGetPermissionStatus.mockResolvedValue({
        ...mockStatus,
        remainingSpend,
      });

      await expect(prepareSpendCallDataFunc(mockSpendPermission, excessiveAmount)).rejects.toThrow(
        'Remaining spend amount is insufficient'
      );
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])('should handle very large amounts for %s environment', async (_, prepareSpendCallDataFunc) => {
    const largeAmount = BigInt('999999999999999999999999999');

    // Mock sufficient remaining balance for the large amount
    mockGetPermissionStatus.mockResolvedValue({
      ...mockStatus,
      remainingSpend: largeAmount, // Set remaining spend to match the large amount
    });

    await prepareSpendCallDataFunc(mockSpendPermission, largeAmount);

    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'spend',
      args: [mockSpendPermissionArgs, largeAmount],
    });
  });

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should use the same spendPermissionManagerAddress for both calls when permission is not active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      mockGetPermissionStatus.mockResolvedValue({
        remainingSpend: BigInt('500000000000000000'),
        nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
        isActive: false,
      });

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(result[0].to).toBe(spendPermissionManagerAddress);
      expect(result[1].to).toBe(spendPermissionManagerAddress);
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should use the same spendPermissionManagerAddress for spend call when permission is active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const status = {
        remainingSpend: BigInt('500000000000000000'),
        nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
        isActive: true,
      };
      mockGetPermissionStatus.mockResolvedValue(status);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(result[0].to).toBe(spendPermissionManagerAddress);
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should set value to 0x0 for both calls when permission is not active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const status = {
        remainingSpend: BigInt('500000000000000000'),
        nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
        isActive: false,
      };
      mockGetPermissionStatus.mockResolvedValue(status);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(result[0].value).toBe('0x0');
      expect(result[1].value).toBe('0x0');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should set value to 0x0 for spend call when permission is active for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      expect(result[0].value).toBe('0x0');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should handle remaining spend of zero for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const status = {
        remainingSpend: BigInt('0'),
        nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
        isActive: true,
      };
      mockGetPermissionStatus.mockResolvedValue(status);

      await expect(
        prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance')
      ).rejects.toThrow('Spend amount cannot be 0');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should work correctly when permission status indicates not approved for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const status = {
        remainingSpend: BigInt('500000000000000000'),
        nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
        isActive: false,
      };
      mockGetPermissionStatus.mockResolvedValue(status);

      const result = await prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance');

      // Should prepare both calls when permission is not active
      expect(result).toHaveLength(2);
      expect(mockEncodeFunctionData).toHaveBeenCalledWith({
        abi: spendPermissionManagerAbi,
        functionName: 'approveWithSignature',
        args: [mockSpendPermissionArgs, mockSpendPermission.signature],
      });
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should propagate errors from getPermissionStatus for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const error = new Error('Permission status error');
      mockGetPermissionStatus.mockRejectedValue(error);

      await expect(
        prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance')
      ).rejects.toThrow('Permission status error');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should propagate errors from toSpendPermissionArgs for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const error = new Error('Invalid permission args');
      mockToSpendPermissionArgs.mockImplementation(() => {
        throw error;
      });

      await expect(
        prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance')
      ).rejects.toThrow('Invalid permission args');
    }
  );

  it.each([
    ['browser', prepareSpendCallData],
    ['node', prepareSpendCallData],
  ])(
    'should propagate errors from encodeFunctionData for %s environment',
    async (_, prepareSpendCallDataFunc) => {
      const error = new Error('Encoding error');
      mockEncodeFunctionData.mockImplementation(() => {
        throw error;
      });

      await expect(
        prepareSpendCallDataFunc(mockSpendPermission, 'max-remaining-allowance')
      ).rejects.toThrow('Encoding error');
    }
  );
});
