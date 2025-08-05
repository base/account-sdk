import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { Address, Hex, encodeFunctionData } from 'viem';

import { toSpendPermissionArgs } from '../utils.js';
import { getPermissionStatus } from './getPermissionStatus.js';

type Call = {
  to: Address;
  data: Hex;
  value: '0x0'; // explicitly set to 0x0
};

export type PrepareSpendCallDataResponseType = [
  Call, // approveWithSignature call
  Call, // spend call
];

/**
 * Prepares call data for both approving and spending a spend permission.
 *
 * This helper method constructs the call data for both `approveWithSignature`
 * and `spend` functions. The former is a no-op when the permission is already approved,
 * but we always include it for simplicity and safety.
 *
 * When the spend amount is undefined, the function automatically uses the all remaining
 * spend permission allowance.
 *
 * The resulting call data must be sent using the spender account, not the
 * account holder. The spender is responsible for executing both the approval
 * and spend operations.
 *
 * @param permission - The spend permission object containing the permission details and signature.
 * @param amount - Optional: The amount to spend in wei (default: full permission allowance).
 *
 * @returns A promise that resolves to an array containing the approve and spend call objects.
 *
 * @example
 * ```typescript
 * import { prepareSpendCallData } from '@base-org/account/spend-permission';
 *
 * // Prepare calls to approve and spend from a permission
 * const calls = await prepareSpendCallData({
 *   permission, // from requestSpendPermission or fetchPermissions
 *   amount: 50n * 10n ** 6n, // Optional: spend 50 USDC (6 decimals) instead of all remaining allowance
 * });
 *
 * // If amount is omitted, all remaining allowance will be spent automatically
 * const callsFullAmount = await prepareSpendCallData({
 *   permission, // Will spend the complete permission.allowance
 * });
 *
 * // Send the calls using the spender account (example: using wallet_sendCalls)
 * await provider.request({
 *   method: 'wallet_sendCalls',
 *   params: [{
 *     version: '2.0.0',
 *     atomicRequired: true,
 *     from: permission.permission.spender, // Must be the spender!
 *     chainId: `0x${permission.chainId?.toString(16)}`,
 *     calls,
 *   }],
 * });
 * ```
 */
export const prepareSpendCallData = async (
  permission: SpendPermission,
  amount?: bigint
): Promise<PrepareSpendCallDataResponseType> => {
  const { remainingSpend } = await getPermissionStatus(permission);
  const spendAmount = amount ?? remainingSpend;

  if (spendAmount === BigInt(0)) {
    throw new Error('Spend amount cannot be 0');
  }

  const spendPermissionArgs = toSpendPermissionArgs(permission);

  const approveData = encodeFunctionData({
    abi: spendPermissionManagerAbi,
    functionName: 'approveWithSignature',
    args: [spendPermissionArgs, permission.signature as `0x${string}`],
  });

  const spendData = encodeFunctionData({
    abi: spendPermissionManagerAbi,
    functionName: 'spend',
    args: [spendPermissionArgs, spendAmount],
  });

  return [
    {
      to: spendPermissionManagerAddress,
      data: approveData,
      value: '0x0', // explicitly set to 0x0
    },
    {
      to: spendPermissionManagerAddress,
      data: spendData,
      value: '0x0', // explicitly set to 0x0
    },
  ];
};
