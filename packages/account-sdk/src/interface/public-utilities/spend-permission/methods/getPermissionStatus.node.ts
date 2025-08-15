import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { readContract } from 'viem/actions';
import { timestampInSecondsToDate, toSpendPermissionArgs } from '../utils.js';
import { getPublicClientFromChainId } from '../utils.node.js';

export type GetPermissionStatusResponseType = {
  remainingSpend: bigint;
  nextPeriodStart: Date;
  isActive: boolean;
};

/**
 * Gets the current status of a spend permission (node environment or server side rendering).
 *
 * This helper method queries the blockchain to retrieve real-time information
 * about a spend permission, including how much can still be spent in the current
 * period, when the next period starts, and whether the permission is still active.
 *
 * The function automatically uses the appropriate blockchain client based on the
 * permission's chain ID and calls multiple view functions on the SpendPermissionManager
 * contract to gather comprehensive status information.
 *
 * When the spend permission does not have a chainId, the function will throw an error.
 *
 * @param permission - The spend permission object to check status for.
 *
 * @returns A promise that resolves to an object containing permission status details.
 *
 * @example
 * ```typescript
 * import { getPermissionStatus } from '@base-org/account/spend-permission';
 *
 * // Check the status of a permission (no client needed)
 * const status = await getPermissionStatus(permission);
 *
 * console.log(`Remaining spend: ${status.remainingSpend} wei`);
 * console.log(`Next period starts: ${new Date(parseInt(status.nextPeriodStart) * 1000)}`);
 * console.log(`Is active: ${status.isActive}`);
 *
 * if (status.isActive && status.remainingSpend > BigInt(0)) {
 *   console.log('Permission can be used for spending');
 * }
 * ```
 */
export const getPermissionStatus = async (
  permission: SpendPermission
): Promise<GetPermissionStatusResponseType> => {
  const { chainId } = permission;
  if (!chainId) {
    throw new Error('chainId is missing in the spend permission');
  }

  // Get public client from chainId, this step is not optimized for browser environment.
  // only use this for node environment or server side rendering.
  const client = getPublicClientFromChainId(chainId);
  if (!client) {
    throw new Error(`No client available for chain ID ${chainId}.`);
  }

  //===========================================================
  // Below should be kept in sync with the browser environment.
  //===========================================================

  const spendPermissionArgs = toSpendPermissionArgs(permission);

  const [currentPeriod, isRevoked, isValid] = await Promise.all([
    readContract(client, {
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: 'getCurrentPeriod',
      args: [spendPermissionArgs],
    }) as Promise<{ start: number; end: number; spend: bigint }>,
    readContract(client, {
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: 'isRevoked',
      args: [spendPermissionArgs],
    }) as Promise<boolean>,
    readContract(client, {
      address: spendPermissionManagerAddress,
      abi: spendPermissionManagerAbi,
      functionName: 'isValid',
      args: [spendPermissionArgs],
    }) as Promise<boolean>,
  ]);

  // Calculate remaining spend in current period
  const allowance = BigInt(permission.permission.allowance);
  const spent = currentPeriod.spend;
  const remainingSpend = allowance > spent ? allowance - spent : BigInt(0);

  // Calculate next period start
  // Next period starts immediately after current period ends
  const nextPeriodStart = (Number(currentPeriod.end) + 1).toString();

  // Permission is active if it's not revoked and is still valid
  const isActive = !isRevoked && isValid;

  return {
    remainingSpend,
    nextPeriodStart: timestampInSecondsToDate(Number(nextPeriodStart)),
    isActive,
  };
};
