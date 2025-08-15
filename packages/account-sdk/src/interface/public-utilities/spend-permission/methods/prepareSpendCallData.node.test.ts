import { describe, expect, it, vi } from 'vitest';

// Mock all dependencies before imports
vi.mock(':core/rpc/coinbase_fetchSpendPermissions.js', () => ({}));

vi.mock(':sign/base-account/utils/constants.js', () => ({
  spendPermissionManagerAbi: [],
  spendPermissionManagerAddress: '0x0000000000000000000000000000000000000000',
}));

vi.mock('./getPermissionStatus.js', () => ({
  getPermissionStatus: vi.fn(),
}));

vi.mock('./getPermissionStatus.node.js', () => ({
  getPermissionStatus: vi.fn(),
}));

vi.mock('../withTelemetry.js', () => ({
  withTelemetry: (fn: any) => fn,
}));

vi.mock('../utils.js', () => ({
  toSpendPermissionArgs: vi.fn(),
}));

vi.mock('viem', async () => {
  const actual = await vi.importActual('viem');
  return {
    ...actual,
    encodeFunctionData: vi.fn(),
  };
});

import { prepareSpendCallData as prepareSpendCallDataBrowser } from './prepareSpendCallData.js';
import { prepareSpendCallData as prepareSpendCallDataNode } from './prepareSpendCallData.node.js';

describe('browser/node synchronization', () => {
  it('should have identical business logic', async () => {
    // Verify the stringified functions contain the critical business logic
    const nodeImplementation = prepareSpendCallDataNode.toString();
    const browserImplementation = prepareSpendCallDataBrowser.toString();

    // Critical business logic patterns that must exist in both implementations
    const criticalLogicPatterns = [
      'amount === "max-remaining-allowance" ? remainingSpend : amount',
      'spendAmount === BigInt(0)',
      'Spend amount cannot be 0',
      'spendAmount > remainingSpend',
      'Remaining spend amount is insufficient',
      'toSpendPermissionArgs(permission)',
      '!isActive',
      'approveWithSignature',
      'spendPermissionManagerAbi',
      'spendPermissionManagerAddress',
      'encodeFunctionData',
      'functionName: "spend"',
      'permission.signature',
      'value: "0x0"',
      'filter((item) => item !== null)',
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

    // Verify the same amount calculation formula exists in both
    const amountCalculationFormula =
      'amount === "max-remaining-allowance" ? remainingSpend : amount';
    expect(nodeImplementation).toContain(amountCalculationFormula);
    expect(browserImplementation).toContain(amountCalculationFormula);

    // Verify the same error handling exists in both
    const errorMessages = ['Spend amount cannot be 0', 'Remaining spend amount is insufficient'];
    for (const errorMessage of errorMessages) {
      expect(nodeImplementation).toContain(errorMessage);
      expect(browserImplementation).toContain(errorMessage);
    }

    // Verify the same validation logic exists in both
    const validationPatterns = ['spendAmount === BigInt(0)', 'spendAmount > remainingSpend'];
    for (const pattern of validationPatterns) {
      expect(nodeImplementation).toContain(pattern);
      expect(browserImplementation).toContain(pattern);
    }

    // Verify the same call construction logic exists in both
    const callConstructionPatterns = [
      'approveCall = {',
      'spendCall = {',
      'to: ',
      'spendPermissionManagerAddress',
      'data: approveData',
      'data: spendData',
      'value: "0x0"',
    ];
    for (const pattern of callConstructionPatterns) {
      expect(nodeImplementation).toContain(pattern);
      expect(browserImplementation).toContain(pattern);
    }

    // Verify the same function call patterns exist in both
    const functionCallPatterns = [
      'getPermissionStatus(permission)',
      'toSpendPermissionArgs(permission)',
      'encodeFunctionData({',
      'spendPermissionManagerAbi',
      'functionName: "approveWithSignature"',
      'functionName: "spend"',
    ];
    for (const pattern of functionCallPatterns) {
      expect(nodeImplementation).toContain(pattern);
      expect(browserImplementation).toContain(pattern);
    }

    // Verify the same return logic exists in both
    const returnPattern = '[approveCall, spendCall].filter((item) => item !== null)';
    expect(nodeImplementation).toContain(returnPattern);
    expect(browserImplementation).toContain(returnPattern);

    // Verify the same conditional logic exists in both
    const conditionalPatterns = [
      'if (spendAmount === BigInt(0))',
      'if (spendAmount > remainingSpend)',
      'if (!isActive)',
    ];
    for (const pattern of conditionalPatterns) {
      expect(nodeImplementation).toContain(pattern);
      expect(browserImplementation).toContain(pattern);
    }
  });
});
