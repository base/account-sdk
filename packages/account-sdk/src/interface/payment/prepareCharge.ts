import { parseUnits } from 'viem';
import {
  fetchPermission,
  prepareSpendCallData,
} from '../public-utilities/spend-permission/index.js';
import { CHAIN_IDS, TOKENS } from './constants.js';
import type { PrepareChargeOptions, PrepareChargeResult } from './types.js';

/**
 * Prepares call data for charging a subscription.
 *
 * This function fetches the subscription (spend permission) details using its ID (permission hash)
 * and prepares the necessary call data to charge the subscription. It wraps the lower-level
 * prepareSpendCallData function with subscription-specific logic.
 *
 * The resulting call data includes:
 * - An approval call (if the permission is not yet active)
 * - A spend call to charge the subscription
 *
 * @param options - Options for preparing the charge
 * @param options.id - The subscription ID (permission hash) returned from subscribe()
 * @param options.amount - Amount to charge as a string (e.g., "10.50") or 'max-remaining-charge'
 * @param options.testnet - Whether this permission is on testnet (Base Sepolia). Defaults to false (mainnet)
 * @returns Promise<PrepareChargeResult> - Array of call data for the charge
 * @throws Error if the subscription cannot be found or if the amount exceeds remaining allowance
 *
 * @example
 * ```typescript
 * import { base } from '@base-org/account/payment';
 *
 * // Prepare to charge a specific amount from a subscription
 * const chargeCalls = await base.subscription.prepareCharge({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   amount: '9.99',
 *   testnet: false
 * });
 *
 * // Prepare to charge the full remaining charge
 * const maxChargeCalls = await base.subscription.prepareCharge({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   amount: 'max-remaining-charge'
 * });
 *
 * // Send the calls using your app's spender account
 * await provider.request({
 *   method: 'wallet_sendCalls',
 *   params: [{
 *     version: '2.0.0',
 *     atomicRequired: true,
 *     from: subscriptionOwner, // Must be the spender/subscription owner!
 *     chainId: testnet ? '0x14a34' : '0x2105',
 *     calls: chargeCalls,
 *   }],
 * });
 * ```
 */
export async function prepareCharge(options: PrepareChargeOptions): Promise<PrepareChargeResult> {
  const { id, amount, testnet = false } = options;

  // Fetch the permission using the subscription ID (permission hash)
  const permission = await fetchPermission({
    permissionHash: id,
  });

  // If no permission found, throw an error
  if (!permission) {
    throw new Error(`Subscription with ID ${id} not found`);
  }

  // Validate this is a USDC permission on the correct network
  const expectedChainId = testnet ? CHAIN_IDS.baseSepolia : CHAIN_IDS.base;
  const expectedTokenAddress = testnet
    ? TOKENS.USDC.addresses.baseSepolia.toLowerCase()
    : TOKENS.USDC.addresses.base.toLowerCase();

  if (permission.chainId !== expectedChainId) {
    // Determine if the subscription is on mainnet or testnet
    const isSubscriptionOnMainnet = permission.chainId === CHAIN_IDS.base;
    const isSubscriptionOnTestnet = permission.chainId === CHAIN_IDS.baseSepolia;

    let errorMessage: string;
    if (testnet && isSubscriptionOnMainnet) {
      errorMessage =
        'The subscription was requested on testnet but is actually a mainnet subscription';
    } else if (!testnet && isSubscriptionOnTestnet) {
      errorMessage =
        'The subscription was requested on mainnet but is actually a testnet subscription';
    } else {
      // Fallback for unexpected chain IDs
      errorMessage = `Subscription is on chain ${permission.chainId}, expected ${expectedChainId} (${testnet ? 'Base Sepolia' : 'Base'})`;
    }

    throw new Error(errorMessage);
  }

  if (permission.permission.token.toLowerCase() !== expectedTokenAddress) {
    throw new Error(
      `Subscription is not for USDC token. Got ${permission.permission.token}, expected ${expectedTokenAddress}`
    );
  }

  // Convert the amount to the appropriate format for prepareSpendCallData
  let spendAmount: bigint | 'max-remaining-allowance';

  if (amount === 'max-remaining-charge') {
    // Translate from subscription terminology to the core util terminology
    spendAmount = 'max-remaining-allowance';
  } else {
    // Parse the USD amount string to USDC wei (6 decimals)
    // For example, "10.50" becomes 10500000n (10.50 * 10^6)
    const usdcDecimals = TOKENS.USDC.decimals;
    spendAmount = parseUnits(amount, usdcDecimals);
  }

  // Call the existing prepareSpendCallData utility with the fetched permission
  const callData = await prepareSpendCallData(permission, spendAmount);

  return callData;
}
