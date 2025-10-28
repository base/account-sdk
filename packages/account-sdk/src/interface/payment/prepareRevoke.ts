import {
  fetchPermission,
  prepareRevokeCallData,
} from '../public-utilities/spend-permission/index.js';
import type { PrepareRevokeOptions, PrepareRevokeResult } from './types.js';
import { validateUSDCBasePermission } from './utils/validateUSDCBasePermission.js';

/**
 * Prepares call data for revoking a subscription.
 *
 * This function fetches the subscription (spend permission) details using its ID (permission hash)
 * and prepares the necessary call data to revoke the subscription. It wraps the lower-level
 * prepareRevokeCallData function with subscription-specific logic.
 *
 * The resulting call data includes the encoded transaction to revoke the spend permission.
 *
 * @param options - Options for preparing the revoke
 * @param options.id - The subscription ID (permission hash) returned from subscribe()
 * @param options.testnet - Whether this permission is on testnet (Base Sepolia). Defaults to false (mainnet)
 * @returns Promise<PrepareRevokeResult> - Call data for the revoke
 * @throws Error if the subscription cannot be found
 *
 * @example
 * ```typescript
 * import { base } from '@base-org/account/payment';
 *
 * // Prepare to revoke a subscription
 * const revokeCall = await base.subscription.prepareRevoke({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   testnet: false
 * });
 *
 * // Send the call using your app's subscription owner account
 * await provider.request({
 *   method: 'wallet_sendCalls',
 *   params: [{
 *     version: '2.0.0',
 *     from: subscriptionOwner, // Must be the spender/subscription owner!
 *     chainId: testnet ? '0x14a34' : '0x2105',
 *     calls: [revokeCall],
 *   }],
 * });
 * ```
 */
export async function prepareRevoke(options: PrepareRevokeOptions): Promise<PrepareRevokeResult> {
  const { id, testnet = false } = options;

  // Fetch the permission using the subscription ID (permission hash)
  const permission = await fetchPermission({
    permissionHash: id,
  });

  // If no permission found, throw an error
  if (!permission) {
    throw new Error(`Subscription with ID ${id} not found`);
  }

  // Validate this is a USDC permission on the correct network
  validateUSDCBasePermission(permission, testnet);

  // Call the existing prepareRevokeCallData utility
  const callData = await prepareRevokeCallData(permission);

  return callData;
}
