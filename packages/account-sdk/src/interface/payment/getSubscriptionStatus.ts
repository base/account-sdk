import { formatUnits } from 'viem';
import {
  fetchPermission,
  getPermissionStatus,
} from '../public-utilities/spend-permission/index.js';
import { timestampInSecondsToDate } from '../public-utilities/spend-permission/utils.js';
import { PaymentError } from ':core/error/sdkErrors.js';
import type { SubscriptionStatus, SubscriptionStatusOptions } from './types.js';
import { validateUSDCBasePermission } from './utils/validateUSDCBasePermission.js';

/**
 * Gets the current status and details of a subscription.
 *
 * This function fetches the subscription (spend permission) details using its ID (permission hash)
 * and returns status information about the subscription.
 *
 * @param options - Options for checking subscription status
 * @param options.id - The subscription ID (permission hash) returned from subscribe()
 * @param options.testnet - Whether to check on testnet (Base Sepolia). Defaults to false (mainnet)
 * @param options.rpcUrl - Optional custom RPC URL to use for blockchain queries. Useful for avoiding rate limits on public endpoints.
 * @returns Promise<SubscriptionStatus> - Subscription status information
 * @throws ValidationError if the subscription chain or token doesn't match expected values
 * @throws PaymentError if the subscription has not started yet or if fetching fails
 *
 * @example
 * ```typescript
 * import { getSubscriptionStatus } from '@base-org/account/payment';
 *
 * // Check status of a subscription using its ID
 * const status = await getSubscriptionStatus({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   testnet: false
 * });
 *
 * // With custom RPC URL to avoid rate limits
 * const status = await getSubscriptionStatus({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   testnet: false,
 *   rpcUrl: 'https://my-custom-rpc.example.com'
 * });
 *
 * console.log(`Subscribed: ${status.isSubscribed}`);
 * console.log(`Next payment: ${status.nextPeriodStart}`);
 * console.log(`Recurring amount: $${status.recurringCharge}`);
 * console.log(`Owner address: ${status.subscriptionOwner}`);
 * ```
 */
export async function getSubscriptionStatus(
  options: SubscriptionStatusOptions
): Promise<SubscriptionStatus> {
  const { id, testnet = false, rpcUrl } = options;

  // First, try to fetch the permission details using the hash
  const permission = await fetchPermission({
    permissionHash: id,
  });

  // If no permission found in the indexer, return as not subscribed
  if (!permission) {
    // No permission found - the subscription doesn't exist or cannot be found
    return {
      isSubscribed: false,
      recurringCharge: '0',
    };
  }

  // Validate this is a USDC permission on Base/Base Sepolia
  validateUSDCBasePermission(permission, testnet);

  // Get the current permission status (includes period info and active state)
  const status = await getPermissionStatus(permission, { rpcUrl });

  // Format the allowance amount from wei to USD string (USDC has 6 decimals)
  const recurringCharge = formatUnits(BigInt(permission.permission.allowance), 6);

  // Calculate period in days from the period duration in seconds
  const periodInDays = Number(permission.permission.period) / 86400;

  // Check if the subscription period has started
  const currentTime = Math.floor(Date.now() / 1000);
  const permissionStart = Number(permission.permission.start);

  if (currentTime < permissionStart) {
    throw new PaymentError(
      `Subscription has not started yet. It will begin at ${new Date(permissionStart * 1000).toISOString()}`,
      'SUBSCRIPTION_NOT_STARTED',
      false
    );
  }

  // Build the result with data from getPermissionStatus
  const result: SubscriptionStatus = {
    isSubscribed: status.isActive,
    recurringCharge,
    remainingChargeInPeriod: formatUnits(status.remainingSpend, 6),
    currentPeriodStart: timestampInSecondsToDate(status.currentPeriod.start),
    nextPeriodStart: status.nextPeriodStart,
    periodInDays,
    subscriptionOwner: permission.permission.spender,
  };
  return result;
}
