import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { Address, Hex, encodeFunctionData } from 'viem';

import { toSpendPermissionArgs } from '../utils.js';
import { withTelemetry } from '../withTelemetry.js';
import { getPermissionStatus } from './getPermissionStatus.js';

type Call = {
  to: Address;
  data: Hex;
  value: '0x0'; // explicitly set to 0x0
};

export type PrepareSpendCallDataResponseType = Call[];

/**
 * Prepares call data for approving and spending a spend permission.
 *
 * This helper method constructs the call data for `approveWithSignature`
 * and `spend` functions. The approve call is only included when the permission
 * is not yet active. If the permission is already approved, only the spend call is returned.
 *
 * When 'max-remaining-allowance' is provided as the amount, the function automatically uses all remaining
 * spend permission allowance.
 *
 * The resulting call data must be sent using the spender account, not the
 * account holder. The spender is responsible for executing both the approval
 * and spend operations.
 *
 * @param permission - The spend permission object containing the permission details and signature.
 * @param amount - The amount to spend in wei. If 'max-remaining-allowance' is provided, the full remaining allowance will be spent.
 *
 * @returns A promise that resolves to an array containing all the necessary calls.
 *
 * @example
 * ```typescript
 * import { prepareSpendCallData } from '@base-org/account/spend-permission';
 *
 * // Prepare calls to approve and spend a specific amount from a permission
 * const spendCalls = await prepareSpendCallData(
 *   permission, // from requestSpendPermission or fetchPermissions
 *   50n * 10n ** 6n // spend 50 USDC (6 decimals)
 * );
 *
 * // To spend all remaining allowance, use 'max-remaining-allowance'
 * const callsFullAmount = await prepareSpendCallData(
 *   permission,
 *   'max-remaining-allowance'
 * );
 *
 * // Send the calls using your app's spender account
 * // this is an example of how to send the calls using the wallet_sendCalls method
 * await provider.request({
 *   method: 'wallet_sendCalls',
 *   params: [{
 *     version: '2.0.0',
 *     atomicRequired: true,
 *     from: permission.permission.spender, // Must be the spender!
 *     chainId: `0x${permission.chainId?.toString(16)}`,
 *     calls: spendCalls,
 *   }],
 * });
 *
 * // Or send the calls using eth_sendTransaction to submit both calls in exact order
 * const promises = spendCalls.map((call) => provider.request({
 *   method: 'eth_sendTransaction',
 *   params: [
 *     {
 *       ...call,
 *       from: permission.permission.spender, // Must be the spender!
 *     }
 *   ]
 * }))
 *
 * await Promise.all(promises);
 * ```
 */
const prepareSpendCallDataFn = async (
  permission: SpendPermission,
  amount: bigint | 'max-remaining-allowance'
): Promise<PrepareSpendCallDataResponseType> => {
  const { remainingSpend, isActive } = await getPermissionStatus(permission);
  const spendAmount = amount === 'max-remaining-allowance' ? remainingSpend : amount;

  if (spendAmount === BigInt(0)) {
    throw new Error('Spend amount cannot be 0');
  }

  if (spendAmount > remainingSpend) {
    throw new Error('Remaining spend amount is insufficient');
  }

  let approveCall: Call | null = null;

  const spendPermissionArgs = toSpendPermissionArgs(permission);

  if (!isActive) {
    const approveData = encodeFunctionData({
      abi: spendPermissionManagerAbi,
      functionName: 'approveWithSignature',
      args: [spendPermissionArgs, permission.signature as `0x${string}`],
    });
    approveCall = {
      to: spendPermissionManagerAddress,
      data: approveData,
      value: '0x0', // explicitly set to 0x0
    };
  }

  const spendData = encodeFunctionData({
    abi: spendPermissionManagerAbi,
    functionName: 'spend',
    args: [spendPermissionArgs, spendAmount],
  });
  const spendCall: Call = {
    to: spendPermissionManagerAddress,
    data: spendData,
    value: '0x0', // explicitly set to 0x0
  };

  return [approveCall, spendCall].filter((item) => item !== null);
};

export const prepareSpendCallData = withTelemetry(prepareSpendCallDataFn);
