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

export type PrepareSpendCallDataResponseType = [ApproveCall: Call, SpendCall: Call];

/**
 * Prepares call data for both approving and spending a spend permission.
 *
 * This helper method constructs the call data for both `approveWithSignature`
 * and `spend` functions. The former is a no-op when the permission is already approved,
 * but we always include it for simplicity and safety.
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
 * @returns A promise that resolves to an array containing the approveCall and spendCall objects.
 *
 * @example
 * ```typescript
 * import { prepareSpendCallData } from '@base-org/account/spend-permission';
 *
 * // Prepare calls to approve and spend a specific amount from a permission
 * const [approveCall, spendCall] = await prepareSpendCallData(
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
 *     calls: [approveCall, spendCall],
 *   }],
 * });
 *
 * // Or send the calls using eth_sendTransaction to submit both calls in exact order
 * await provider.request({
 *   method: 'eth_sendTransaction',
 *   params: [
 *     {
 *       ...approveCall,
 *       from: permission.permission.spender, // Must be the spender!
 *     },
 *   ],
 * });
 *
 * await provider.request({
 *   method: 'eth_sendTransaction',
 *   params: [
 *     {
 *       ...spendCall,
 *       from: permission.permission.spender, // Must be the spender!
 *     },
 *   ],
 * });
 * ```
 */
export const prepareSpendCallData = async (
  permission: SpendPermission,
  amount: bigint | 'max-remaining-allowance'
): Promise<PrepareSpendCallDataResponseType> => {
  const { remainingSpend } = await getPermissionStatus(permission);
  const spendAmount = amount === 'max-remaining-allowance' ? remainingSpend : amount;

  if (spendAmount === BigInt(0)) {
    throw new Error('Spend amount cannot be 0');
  }

  if (spendAmount > remainingSpend) {
    throw new Error('Remaining spend amount is insufficient');
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
