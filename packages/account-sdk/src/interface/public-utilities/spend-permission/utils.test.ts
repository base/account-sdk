import type { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { describe, expect, it } from 'vitest';
import { calculateCurrentPeriod } from './utils.js';

describe('calculateCurrentPeriod', () => {
  const basePermission: SpendPermission = {
    chainId: 8453,
    permissionHash: '0x123',
    permission: {
      account: '0x1234567890123456789012345678901234567890',
      spender: '0x2345678901234567890123456789012345678901',
      token: '0x3456789012345678901234567890123456789012',
      allowance: '1000000', // 1 USDC
      period: 86400, // 1 day in seconds
      start: 1700000000, // Some timestamp
      end: 1700864000, // 10 days later
      salt: '0x123',
      extraData: '0x',
    },
  };

  it('should calculate the first period when current time is before permission start', () => {
    const currentTime = 1699999999; // 1 second before start
    const period = calculateCurrentPeriod(basePermission, currentTime);

    expect(period.start).toBe(1700000000);
    expect(period.end).toBe(1700086399); // start + 1 day - 1 second
    expect(period.spend).toBe(BigInt(0));
  });

  it('should calculate the current period when within permission time bounds', () => {
    // Test first period
    const firstPeriodTime = 1700050000; // Middle of first day
    const firstPeriod = calculateCurrentPeriod(basePermission, firstPeriodTime);

    expect(firstPeriod.start).toBe(1700000000);
    expect(firstPeriod.end).toBe(1700086399);
    expect(firstPeriod.spend).toBe(BigInt(0));

    // Test second period
    const secondPeriodTime = 1700150000; // Middle of second day
    const secondPeriod = calculateCurrentPeriod(basePermission, secondPeriodTime);

    expect(secondPeriod.start).toBe(1700086400); // start of second day
    expect(secondPeriod.end).toBe(1700172799); // end of second day
    expect(secondPeriod.spend).toBe(BigInt(0));

    // Test fifth period
    const fifthPeriodTime = 1700400000; // Middle of fifth day
    const fifthPeriod = calculateCurrentPeriod(basePermission, fifthPeriodTime);

    expect(fifthPeriod.start).toBe(1700345600); // start of fifth day
    expect(fifthPeriod.end).toBe(1700431999); // end of fifth day
    expect(fifthPeriod.spend).toBe(BigInt(0));
  });

  it('should handle the last period correctly when it is shorter than the period duration', () => {
    const lastPeriodTime = 1700850000; // Near the end of permission
    const lastPeriod = calculateCurrentPeriod(basePermission, lastPeriodTime);

    expect(lastPeriod.start).toBe(1700777600); // start of 10th day
    expect(lastPeriod.end).toBe(1700864000); // permission end (not full day)
    expect(lastPeriod.spend).toBe(BigInt(0));
  });

  it('should return the last period when current time is after permission end', () => {
    const afterEndTime = 1701000000; // After permission ends
    const period = calculateCurrentPeriod(basePermission, afterEndTime);

    expect(period.start).toBe(1700777600); // start of last period
    expect(period.end).toBe(1700864000); // permission end
    expect(period.spend).toBe(BigInt(0));
  });

  it('should use current time when no timestamp is provided', () => {
    const _now = Math.floor(Date.now() / 1000);
    const period = calculateCurrentPeriod(basePermission);

    // We can't test exact values since time moves, but we can verify it returns a valid structure
    expect(typeof period.start).toBe('number');
    expect(typeof period.end).toBe('number');
    expect(period.spend).toBe(BigInt(0));
    expect(period.end).toBeGreaterThanOrEqual(period.start);
  });

  it('should handle permissions with longer periods correctly', () => {
    const weeklyPermission: SpendPermission = {
      ...basePermission,
      permission: {
        ...basePermission.permission,
        period: 604800, // 7 days in seconds
        end: 1702108800, // ~3 weeks after start
      },
    };

    // Test middle of second week
    const secondWeekTime = 1700800000;
    const period = calculateCurrentPeriod(weeklyPermission, secondWeekTime);

    expect(period.start).toBe(1700604800); // start of second week
    expect(period.end).toBe(1701209599); // end of second week
    expect(period.spend).toBe(BigInt(0));
  });
});
