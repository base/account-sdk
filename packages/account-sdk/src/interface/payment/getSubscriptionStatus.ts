import { formatUnits } from 'viem';
import { createClients, FALLBACK_CHAINS, getClient } from '../../store/chain-clients/utils.js';
import { fetchPermission, getPermissionStatus } from '../public-utilities/spend-permission/index.js';
import { CHAIN_IDS, TOKENS } from './constants.js';
import type { SubscriptionStatus, SubscriptionStatusOptions } from './types.js';


/**
 * Gets the current status and details of a subscription.
 * 
 * This function fetches the subscription (spend permission) details using its ID (permission hash)
 * and returns status information about the subscription. If there's no on-chain state for the
 * subscription (e.g., it has never been used), the function will infer that the subscription
 * is unrevoked and the full recurring amount is available to spend.
 * 
 * @param options - Options for checking subscription status
 * @param options.id - The subscription ID (permission hash) returned from subscribe()
 * @param options.testnet - Whether to check on testnet (Base Sepolia). Defaults to false (mainnet)
 * @returns Promise<SubscriptionStatus> - Subscription status information
 * @throws Error if the subscription cannot be found or if fetching fails
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
 * console.log(`Subscribed: ${status.isSubscribed}`);
 * console.log(`Next payment: ${status.nextPeriodStart}`);
 * console.log(`Recurring amount: $${status.recurringAmount}`);
 * ```
 */
export async function getSubscriptionStatus(
  options: SubscriptionStatusOptions
): Promise<SubscriptionStatus> {
  const { id, testnet = false } = options;

  // First, try to fetch the permission details using the hash
  const permission = await fetchPermission({
    permissionHash: id,
  });

  // If no permission found in the indexer, return as not subscribed
  if (!permission) {
    // No permission found - the subscription doesn't exist or cannot be found
    return {
      isSubscribed: false,
      recurringAmount: '0',
    };
  }

  try {

    // Validate this is a USDC permission on Base/Base Sepolia
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
        errorMessage = 'The subscription was requested on testnet but is actually a mainnet subscription';
      } else if (!testnet && isSubscriptionOnTestnet) {
        errorMessage = 'The subscription was requested on mainnet but is actually a testnet subscription';
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

    // Ensure chain client is initialized for the permission's chain
    // This is needed when getSubscriptionStatus is called standalone without SDK initialization
    if (permission.chainId && !getClient(permission.chainId)) {
      const fallbackChain = FALLBACK_CHAINS.find(chain => chain.id === permission.chainId);
      if (fallbackChain) {
        createClients([fallbackChain]);
      }
    }

    // Get the current permission status (includes period info and active state)
    // This will either fetch on-chain state or infer from the permission parameters
    // if there's no on-chain state (e.g., subscription never used)
    const status = await getPermissionStatus(permission);

    // Format the allowance amount from wei to USD string (USDC has 6 decimals)
    const recurringAmount = formatUnits(BigInt(permission.permission.allowance), 6);

    // Check if the subscription period has started
    const currentTime = Math.floor(Date.now() / 1000);
    const permissionStart = Number(permission.permission.start);
    const permissionEnd = Number(permission.permission.end);
    
    if (currentTime < permissionStart) {
      throw new Error(
        `Subscription has not started yet. It will begin at ${new Date(permissionStart * 1000).toISOString()}`
      );
    }
    
    // Check if the subscription has expired
    const hasNotExpired = currentTime <= permissionEnd;
    
    // A subscription is considered active if we're within the valid time bounds
    // and the permission hasn't been revoked.
    // Since we've already checked that:
    // 1. The permission exists (fetchPermission succeeded)
    // 2. The subscription has started (checked above)
    // 3. The subscription hasn't expired (hasNotExpired)
    // Then the subscription should be active unless explicitly revoked.
    //
    // For subscriptions with no on-chain state (currentPeriodSpend === 0),
    // they cannot be revoked since they've never been used, so we know they're active.
    const hasNoOnChainState = status.currentPeriodSpend === BigInt(0);
    const isSubscribed = hasNotExpired && (status.isActive || hasNoOnChainState);

    // Format the spent amount in the current period (USDC has 6 decimals)
    // When inferred from permission parameters, this will be 0
    const spentInCurrentPeriod = formatUnits(status.currentPeriodSpend, 6);

    // Build the result with data from getCurrentPeriod and other on-chain functions
    // Include period information even when subscription appears inactive to provide
    // useful information about the subscription state
    const result: SubscriptionStatus = {
      isSubscribed,
      recurringAmount,
      remainingSpendInPeriod: formatUnits(status.remainingSpend, 6),
      spentInCurrentPeriod: spentInCurrentPeriod,
      currentPeriodStart: status.currentPeriodStart,
      nextPeriodStart: status.nextPeriodStart,
    };

    return result;
  } catch (error) {
    // Always re-throw errors - don't silently return a default status
    throw error;
  }
}
