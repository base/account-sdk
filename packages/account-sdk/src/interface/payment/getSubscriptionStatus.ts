import { formatUnits } from 'viem';
import { readContract } from 'viem/actions';
import {
  spendPermissionManagerAbi,
  spendPermissionManagerAddress,
} from '../../sign/base-account/utils/constants.js';
import { createClients, FALLBACK_CHAINS, getClient } from '../../store/chain-clients/utils.js';
import {
  fetchPermission,
  getPermissionStatus,
} from '../public-utilities/spend-permission/index.js';
import {
  calculateCurrentPeriod,
  timestampInSecondsToDate,
  toSpendPermissionArgs,
} from '../public-utilities/spend-permission/utils.js';
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
      recurringCharge: '0',
    };
  }

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

  // Ensure chain client is initialized for the permission's chain
  if (permission.chainId && !getClient(permission.chainId)) {
    const fallbackChain = FALLBACK_CHAINS.find((chain) => chain.id === permission.chainId);
    if (fallbackChain) {
      createClients([fallbackChain]);
    }
  }

  // Get the current permission status (includes period info and active state)
  const status = await getPermissionStatus(permission);

  // Get the current period info directly to get spend amount
  let currentPeriod: { start: number; end: number; spend: bigint };

  const client = getClient(permission.chainId!);
  if (client) {
    try {
      const spendPermissionArgs = toSpendPermissionArgs(permission);
      currentPeriod = (await readContract(client, {
        address: spendPermissionManagerAddress,
        abi: spendPermissionManagerAbi,
        functionName: 'getCurrentPeriod',
        args: [spendPermissionArgs],
      })) as { start: number; end: number; spend: bigint };
    } catch {
      // If we can't read on-chain state, calculate from permission parameters
      currentPeriod = calculateCurrentPeriod(permission);
    }
  } else {
    // No client available, calculate from permission parameters
    currentPeriod = calculateCurrentPeriod(permission);
  }

  // Format the allowance amount from wei to USD string (USDC has 6 decimals)
  const recurringCharge = formatUnits(BigInt(permission.permission.allowance), 6);

  // Calculate period in days from the period duration in seconds
  const periodInDays = Number(permission.permission.period) / 86400;

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
  const hasNoOnChainState = currentPeriod.spend === BigInt(0);
  const isSubscribed =
    hasNotExpired && !status.isRevoked && (status.isActive || hasNoOnChainState);

  // Build the result with data from getCurrentPeriod and other on-chain functions
  const result: SubscriptionStatus = {
    isSubscribed,
    recurringCharge,
    remainingChargeInPeriod: formatUnits(status.remainingSpend, 6),
    currentPeriodStart: timestampInSecondsToDate(currentPeriod.start),
    nextPeriodStart: status.nextPeriodStart,
    periodInDays,
  };

  return result;
}
