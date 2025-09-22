import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { getClient } from ':store/chain-clients/utils.js';
import { PublicClient } from 'viem';
import { readContract } from 'viem/actions';
import { timestampInSecondsToDate, toSpendPermissionArgs } from '../utils.js';
import { getPublicClientFromChainId } from '../utils.node.js';
import { withTelemetry } from '../withTelemetry.js';

export type GetPermissionStatusResponseType = {
  remainingSpend: bigint;
  nextPeriodStart: Date;
  isRevoked: boolean;
  isExpired: boolean;
  isActive: boolean;
  currentPeriod: {
    start: number;
    end: number;
    spend: bigint;
  };
};

/**
 * Gets the current status of a spend permission.
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
 * console.log(`Next period starts: ${status.nextPeriodStart}`);
 * console.log(`Is revoked: ${status.isRevoked}`);
 * console.log(`Is expired: ${status.isExpired}`);
 * console.log(`Is active: ${status.isActive}`);
 *
 * if (status.isActive && status.remainingSpend > BigInt(0)) {
 *   console.log('Permission can be used for spending');
 * }
 * ```
 */
const getPermissionStatusFn = async (
  permission: SpendPermission
): Promise<GetPermissionStatusResponseType> => {
  const { chainId } = permission;

  if (!chainId) {
    throw new Error('chainId is missing in the spend permission');
  }

  // Try to get client from store first (browser environment with connected SDK)
  let client: PublicClient | undefined = getClient(chainId);

  // If no client in store, create one using the node utility (node environment or disconnected SDK)
  if (!client) {
    client = getPublicClientFromChainId(chainId);
    if (!client) {
      throw new Error(`No client available for chain ID ${chainId}. Chain is not supported.`);
    }
  }

  const spendPermissionArgs = toSpendPermissionArgs(permission);

  const [currentPeriod, isRevoked] = await Promise.all([
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
  ]);

  // Calculate remaining spend in current period
  const allowance = BigInt(permission.permission.allowance);
  const spent = currentPeriod.spend;
  const remainingSpend = allowance > spent ? allowance - spent : BigInt(0);

  // Calculate next period start
  // Next period starts immediately after current period ends
  const nextPeriodStart = (Number(currentPeriod.end) + 1).toString();

  // Check if permission is expired
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const isExpired = currentTimestamp > permission.permission.end;

  // Permission is active if it's not revoked and not expired
  const isActive = !isRevoked && !isExpired;

  return {
    remainingSpend,
    nextPeriodStart: timestampInSecondsToDate(Number(nextPeriodStart)),
    isRevoked,
    isExpired,
    isActive,
    currentPeriod,
  };
};

export const getPermissionStatus = withTelemetry(getPermissionStatusFn);
