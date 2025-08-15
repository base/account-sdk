import { describe, expect, it, vi } from 'vitest';

// Import both versions of the function to compare their stringified implementations
import { getPermissionStatus as getPermissionStatusBrowser } from './getPermissionStatus.js';
import { getPermissionStatus as getPermissionStatusNode } from './getPermissionStatus.node.js';

// We need to mock the dependencies before importing the browser version
vi.mock(':store/chain-clients/utils.js', () => ({
  getClient: vi.fn(),
}));

vi.mock('../withTelemetry.js', () => ({
  withTelemetry: (fn: any) => fn,
}));

vi.mock('../utils.node.js', () => ({
  getPublicClientFromChainId: vi.fn(),
}));

vi.mock('viem/actions', () => ({
  readContract: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  toSpendPermissionArgs: vi.fn(),
  timestampInSecondsToDate: vi.fn(),
}));

describe('browser/node synchronization', () => {
  it('should have identical business logic', async () => {
    // Verify the stringified functions contain the critical business logic
    const nodeImplementation = getPermissionStatusNode.toString();
    const browserImplementation = getPermissionStatusBrowser.toString();

    // Critical business logic patterns that must exist in both implementations
    const criticalLogicPatterns = [
      'BigInt(permission.permission.allowance)',
      'currentPeriod.spend',
      'allowance > spent ? allowance - spent : BigInt(0)',
      '(Number(currentPeriod.end) + 1).toString()',
      '!isRevoked && isValid',
      'timestampInSecondsToDate(Number(nextPeriodStart))',
      'spendPermissionManagerAddress',
      'getCurrentPeriod',
      'isRevoked',
      'isValid',
    ];

    // Verify all critical patterns exist in both function implementations
    for (const pattern of criticalLogicPatterns) {
      expect(nodeImplementation, `Node function missing critical pattern: ${pattern}`).toContain(
        pattern
      );
      expect(
        browserImplementation,
        `Browser function missing critical pattern: ${pattern}`
      ).toContain(pattern);
    }

    // Verify the same calculation formula exists in both
    const calculationFormula = 'allowance > spent ? allowance - spent : BigInt(0)';
    expect(nodeImplementation).toContain(calculationFormula);
    expect(browserImplementation).toContain(calculationFormula);

    // Verify the same return structure exists in both
    const returnFields = ['remainingSpend', 'nextPeriodStart', 'isActive'];
    for (const field of returnFields) {
      expect(nodeImplementation).toContain(field);
      expect(browserImplementation).toContain(field);
    }
  });
});
