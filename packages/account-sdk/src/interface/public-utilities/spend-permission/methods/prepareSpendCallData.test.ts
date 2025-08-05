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

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'), // 0.5 ETH remaining
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

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

  it('should prepare call data for approve and spend operations when permission is not active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: false, // Permission is not active, so approve call should be included
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

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
  });

  it('should prepare call data for spend operation only when permission is already active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true, // Permission is active, so no approve call needed
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

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
  });

  it('should use remaining spend amount when max-remaining-allowance is specified', async () => {
    const remainingSpend = BigInt('750000000000000000');
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend,
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

    await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'spend',
      args: [mockSpendPermissionArgs, remainingSpend],
    });
  });

  it('should use provided amount when specified', async () => {
    const customAmount = BigInt('250000000000000000'); // 0.25 ETH

    await prepareSpendCallData(mockSpendPermission, customAmount);

    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'spend',
      args: [mockSpendPermissionArgs, customAmount],
    });
  });

  it('should call getPermissionStatus with the correct permission', async () => {
    await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(mockGetPermissionStatus).toHaveBeenCalledWith(mockSpendPermission);
  });

  it('should call toSpendPermissionArgs with the correct permission', async () => {
    await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(mockToSpendPermissionArgs).toHaveBeenCalledWith(mockSpendPermission);
  });

  it('should encode approveWithSignature function data correctly when permission is not active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: false, // Permission is not active
    });

    await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'approveWithSignature',
      args: [mockSpendPermissionArgs, mockSpendPermission.signature],
    });
  });

  it('should encode spend function data correctly', async () => {
    const customAmount = BigInt('300000000000000000');

    await prepareSpendCallData(mockSpendPermission, customAmount);

    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'spend',
      args: [mockSpendPermissionArgs, customAmount],
    });
  });

  it('should return calls with correct structure when permission is not active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: false,
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

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
  });

  it('should return calls with correct structure when permission is active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    // Check that result matches the expected type
    const typedResult: PrepareSpendCallDataResponseType = result;
    expect(typedResult).toHaveLength(1);

    // Check spend call structure (only call when active)
    expect(typedResult[0]).toHaveProperty('to');
    expect(typedResult[0]).toHaveProperty('data');
    expect(typedResult[0]).toHaveProperty('value');
    expect(typedResult[0].value).toBe('0x0');
  });

  it('should handle zero amount', async () => {
    const zeroAmount = BigInt('0');

    await expect(prepareSpendCallData(mockSpendPermission, zeroAmount)).rejects.toThrow(
      'Spend amount cannot be 0'
    );
  });

  it('should throw error when amount exceeds remaining spend', async () => {
    const remainingSpend = BigInt('500000000000000000'); // 0.5 ETH remaining
    const excessiveAmount = BigInt('600000000000000000'); // 0.6 ETH (more than remaining)

    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend,
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

    await expect(prepareSpendCallData(mockSpendPermission, excessiveAmount)).rejects.toThrow(
      'Remaining spend amount is insufficient'
    );
  });

  it('should handle very large amounts', async () => {
    const largeAmount = BigInt('999999999999999999999999999');

    // Mock sufficient remaining balance for the large amount
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: largeAmount, // Set remaining spend to match the large amount
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

    await prepareSpendCallData(mockSpendPermission, largeAmount);

    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'spend',
      args: [mockSpendPermissionArgs, largeAmount],
    });
  });

  it('should use the same spendPermissionManagerAddress for both calls when permission is not active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: false,
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(result[0].to).toBe(spendPermissionManagerAddress);
    expect(result[1].to).toBe(spendPermissionManagerAddress);
  });

  it('should use the same spendPermissionManagerAddress for spend call when permission is active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(result[0].to).toBe(spendPermissionManagerAddress);
  });

  it('should set value to 0x0 for both calls when permission is not active', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: false,
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(result[0].value).toBe('0x0');
    expect(result[1].value).toBe('0x0');
  });

  it('should set value to 0x0 for spend call when permission is active', async () => {
    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    expect(result[0].value).toBe('0x0');
  });

  it('should handle remaining spend of zero', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('0'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: true,
    });

    await expect(
      prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance')
    ).rejects.toThrow('Spend amount cannot be 0');
  });

  it('should work correctly when permission status indicates not approved', async () => {
    mockGetPermissionStatus.mockResolvedValue({
      remainingSpend: BigInt('500000000000000000'),
      nextPeriodStart: new Date('2024-01-01T00:00:00Z'),
      isActive: false,
    });

    const result = await prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance');

    // Should prepare both calls when permission is not active
    expect(result).toHaveLength(2);
    expect(mockEncodeFunctionData).toHaveBeenCalledWith({
      abi: spendPermissionManagerAbi,
      functionName: 'approveWithSignature',
      args: [mockSpendPermissionArgs, mockSpendPermission.signature],
    });
  });

  it('should propagate errors from getPermissionStatus', async () => {
    const error = new Error('Permission status error');
    mockGetPermissionStatus.mockRejectedValue(error);

    await expect(
      prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance')
    ).rejects.toThrow('Permission status error');
  });

  it('should propagate errors from toSpendPermissionArgs', async () => {
    const error = new Error('Invalid permission args');
    mockToSpendPermissionArgs.mockImplementation(() => {
      throw error;
    });

    await expect(
      prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance')
    ).rejects.toThrow('Invalid permission args');
  });

  it('should propagate errors from encodeFunctionData', async () => {
    const error = new Error('Encoding error');
    mockEncodeFunctionData.mockImplementation(() => {
      throw error;
    });

    await expect(
      prepareSpendCallData(mockSpendPermission, 'max-remaining-allowance')
    ).rejects.toThrow('Encoding error');
  });
});
