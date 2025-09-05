import { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from ':sign/base-account/utils/constants.js';
import { createClients, FALLBACK_CHAINS, getClient } from ':store/chain-clients/utils.js';
import { readContract } from 'viem/actions';
import {
  calculateCurrentPeriod,
  timestampInSecondsToDate,
  toSpendPermissionArgs,
} from '../utils.js';
import { withTelemetry } from '../withTelemetry.js';

export type GetPermissionStatusResponseType = {
  remainingSpend: bigint;
  nextPeriodStart: Date;
  isActive: boolean;
  currentPeriodStart: Date;
  currentPeriodSpend: bigint;
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
 * console.log(`Next period starts: ${new Date(parseInt(status.nextPeriodStart) * 1000)}`);
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

  let client = getClient(chainId);
  if (!client) {
    // Try to initialize with fallback chain if available
    const fallbackChain = FALLBACK_CHAINS.find((chain) => chain.id === chainId);
    if (fallbackChain) {
      createClients([fallbackChain]);
      client = getClient(chainId);
    }

    // If still no client, throw error
    if (!client) {
      throw new Error(
        `No client available for chain ID ${chainId}. Make sure the SDK is in connected state.`
      );
    }
  }

  const spendPermissionArgs = toSpendPermissionArgs(permission);

  // Try to get on-chain state
  let currentPeriod: { start: number; end: number; spend: bigint };
  let isRevoked: boolean;
  let isValid: boolean;

  try {
    const results = await Promise.all([
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

    currentPeriod = results[0];
    isRevoked = results[1];
    isValid = results[2];
  } catch (_error) {
    // If we can't read on-chain state (e.g., permission never used),
    // infer the current period from the permission parameters
    currentPeriod = calculateCurrentPeriod(permission);

    // When there's no on-chain state, assume the permission is:
    // - Not revoked (since it hasn't been used yet)
    // - Valid if we're within its time bounds
    isRevoked = false;
    const now = Math.floor(Date.now() / 1000);
    isValid =
      now >= Number(permission.permission.start) && now <= Number(permission.permission.end);
  }

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
    currentPeriodStart: timestampInSecondsToDate(currentPeriod.start),
    currentPeriodSpend: spent,
  };
};

export const getPermissionStatus = withTelemetry(getPermissionStatusFn);
