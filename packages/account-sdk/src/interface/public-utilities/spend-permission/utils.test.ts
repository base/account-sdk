import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestSpendPermissionType } from './methods/requestSpendPermission.js';
import { createSpendPermissionTypedData, toTimestampInSeconds } from './utils.js';

const ETERNITY_TIMESTAMP = 281474976710655; // 2^48 - 1

describe('createSpendPermissionTypedData', () => {
  const mockCurrentDate = new Date('2022-01-01T00:00:00.000Z');
  const mockCurrentTimestamp = 1640995200; // 2022-01-01 00:00:00 UTC in seconds
  let OriginalDate: DateConstructor;

  beforeEach(() => {
    // Store original Date constructor
    OriginalDate = global.Date;

    // Mock crypto.getRandomValues for consistent testing
    const mockGetRandomValues = vi.fn((array: Uint8Array) => {
      // Fill with deterministic values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = 0xab;
      }
      return array;
    });

    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: mockGetRandomValues,
      },
      writable: true,
    });

    // Mock Date constructor to return our mock date when called without arguments
    vi.spyOn(global, 'Date').mockImplementation(((...args: any[]) => {
      if (args.length === 0) {
        return mockCurrentDate;
      }
      return new OriginalDate(...(args as [string | number | Date]));
    }) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  const baseRequest: RequestSpendPermissionType = {
    account: '0x1234567890123456789012345678901234567890',
    spender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Valid checksummed address
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    chainId: 8453,
    allowance: BigInt('1000000000000000000'), // 1 ETH in wei
    periodInDays: 30,
  };

  it('should generate valid EIP-712 typed data with all required fields', () => {
    const result = createSpendPermissionTypedData(baseRequest);

    expect(result).toEqual({
      domain: {
        name: 'Spend Permission Manager',
        version: '1',
        chainId: 8453,
        verifyingContract: '0xf85210B21cC50302F477BA56686d2019dC9b67Ad',
      },
      types: {
        SpendPermission: [
          { name: 'account', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'allowance', type: 'uint160' },
          { name: 'period', type: 'uint48' },
          { name: 'start', type: 'uint48' },
          { name: 'end', type: 'uint48' },
          { name: 'salt', type: 'uint256' },
          { name: 'extraData', type: 'bytes' },
        ],
      },
      primaryType: 'SpendPermission',
      message: {
        account: '0x1234567890123456789012345678901234567890',
        spender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        allowance: '1000000000000000000',
        period: 86400 * 30, // 30 days in seconds
        start: mockCurrentTimestamp, // toTimestampInSeconds(new Date())
        end: ETERNITY_TIMESTAMP, // ETERNITY_TIMESTAMP when end is not specified
        salt: '0xabababababababababababababababababababababababababababababababab',
        extraData: '0x',
      },
    });
  });

  it('should use provided optional parameters when specified', () => {
    const startDate = new Date('2020-01-01T00:00:00.000Z');
    const endDate = new Date('2021-01-01T00:00:00.000Z');
    const startTimestamp = 1577836800; // 2020-01-01 00:00:00 UTC in seconds
    const endTimestamp = 1609459200; // 2021-01-01 00:00:00 UTC in seconds

    const requestWithOptionals: RequestSpendPermissionType = {
      ...baseRequest,
      start: startDate,
      end: endDate,
      salt: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      extraData: '0xdeadbeef',
    };

    const result = createSpendPermissionTypedData(requestWithOptionals);

    expect(result.message.start).toBe(startTimestamp);
    expect(result.message.end).toBe(endTimestamp);
    expect(result.message.salt).toBe(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    );
    expect(result.message.extraData).toBe('0xdeadbeef');
  });

  it('should convert period in days to seconds correctly', () => {
    const requestWith7Days: RequestSpendPermissionType = {
      ...baseRequest,
      periodInDays: 7,
    };

    const result = createSpendPermissionTypedData(requestWith7Days);
    expect(result.message.period).toBe(86400 * 7); // 7 days in seconds
  });

  it('should convert allowance bigint to string', () => {
    const requestWithLargeAllowance: RequestSpendPermissionType = {
      ...baseRequest,
      allowance: BigInt('999999999999999999999999999'), // Very large number
    };

    const result = createSpendPermissionTypedData(requestWithLargeAllowance);
    expect(result.message.allowance).toBe('999999999999999999999999999');
    expect(typeof result.message.allowance).toBe('string');
  });

  it('should generate different salts for different calls when salt is not provided', () => {
    // Clear the mock and set up different return values
    vi.clearAllMocks();

    let callCount = 0;
    const mockGetRandomValues = vi.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = callCount + i; // Different values for each call
      }
      callCount++;
      return array;
    });

    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: mockGetRandomValues,
      },
      writable: true,
    });

    const result1 = createSpendPermissionTypedData(baseRequest);
    const result2 = createSpendPermissionTypedData(baseRequest);

    expect(result1.message.salt).not.toBe(result2.message.salt);
    expect(mockGetRandomValues).toHaveBeenCalledTimes(2);
  });

  it('should use current timestamp for start when not provided', () => {
    const result = createSpendPermissionTypedData(baseRequest);
    expect(result.message.start).toBe(mockCurrentTimestamp);
  });

  it('should use ETERNITY_TIMESTAMP for end when not provided', () => {
    const result = createSpendPermissionTypedData(baseRequest);
    expect(result.message.end).toBe(ETERNITY_TIMESTAMP);
  });

  it('should use empty hex string for extraData when not provided', () => {
    const result = createSpendPermissionTypedData(baseRequest);
    expect(result.message.extraData).toBe('0x');
  });

  it('should have correct EIP-712 domain structure', () => {
    const result = createSpendPermissionTypedData(baseRequest);

    expect(result.domain).toEqual({
      name: 'Spend Permission Manager',
      version: '1',
      chainId: baseRequest.chainId,
      verifyingContract: '0xf85210B21cC50302F477BA56686d2019dC9b67Ad',
    });
  });

  it('should have correct EIP-712 types structure', () => {
    const result = createSpendPermissionTypedData(baseRequest);

    expect(result.types.SpendPermission).toHaveLength(9);
    expect(result.types.SpendPermission).toContainEqual({ name: 'account', type: 'address' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'spender', type: 'address' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'token', type: 'address' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'allowance', type: 'uint160' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'period', type: 'uint48' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'start', type: 'uint48' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'end', type: 'uint48' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'salt', type: 'uint256' });
    expect(result.types.SpendPermission).toContainEqual({ name: 'extraData', type: 'bytes' });
  });

  it('should have correct SpendPermission field order for EIP-712 compatibility', () => {
    const result = createSpendPermissionTypedData(baseRequest);

    // Field order is crucial for EIP-712 hash calculation and must match smart contract expectations
    const expectedFieldOrder = [
      { name: 'account', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'allowance', type: 'uint160' },
      { name: 'period', type: 'uint48' },
      { name: 'start', type: 'uint48' },
      { name: 'end', type: 'uint48' },
      { name: 'salt', type: 'uint256' },
      { name: 'extraData', type: 'bytes' },
    ];

    expect(result.types.SpendPermission).toEqual(expectedFieldOrder);

    // Verify each field is in the exact expected position
    expect(result.types.SpendPermission[0]).toEqual({ name: 'account', type: 'address' });
    expect(result.types.SpendPermission[1]).toEqual({ name: 'spender', type: 'address' });
    expect(result.types.SpendPermission[2]).toEqual({ name: 'token', type: 'address' });
    expect(result.types.SpendPermission[3]).toEqual({ name: 'allowance', type: 'uint160' });
    expect(result.types.SpendPermission[4]).toEqual({ name: 'period', type: 'uint48' });
    expect(result.types.SpendPermission[5]).toEqual({ name: 'start', type: 'uint48' });
    expect(result.types.SpendPermission[6]).toEqual({ name: 'end', type: 'uint48' });
    expect(result.types.SpendPermission[7]).toEqual({ name: 'salt', type: 'uint256' });
    expect(result.types.SpendPermission[8]).toEqual({ name: 'extraData', type: 'bytes' });
  });
});

describe('toTimestampInSeconds', () => {
  it('should convert Date to Unix timestamp in seconds', () => {
    const date = new Date('2022-01-01T00:00:00.000Z');
    const result = toTimestampInSeconds(date);
    expect(result).toBe(1640995200); // 2022-01-01 00:00:00 UTC in seconds
  });

  it('should handle different dates correctly', () => {
    const testCases = [
      { date: new Date('2020-01-01T00:00:00.000Z'), expected: 1577836800 },
      { date: new Date('2021-12-31T23:59:59.999Z'), expected: 1640995199 },
      { date: new Date('1970-01-01T00:00:00.000Z'), expected: 0 },
    ];

    testCases.forEach(({ date, expected }) => {
      const result = toTimestampInSeconds(date);
      expect(result).toBe(expected);
    });
  });

  it('should floor the result to remove milliseconds', () => {
    const date = new Date('2022-01-01T00:00:00.999Z'); // 999ms
    const result = toTimestampInSeconds(date);
    expect(result).toBe(1640995200); // Should be floored to seconds
  });
});
