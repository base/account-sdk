import { CB_WALLET_RPC_URL } from ':core/constants.js';
import { FetchPermissionResponse } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { fetchRPCRequest } from ':util/provider.js';
import { formatUnits } from 'viem';
import { CHAIN_IDS } from './constants.js';
import type { SubscriptionStatus, SubscriptionStatusOptions } from './types.js';

/**
 * Check the current status and details of a subscription
 *
 * @param options - Subscription status options
 * @param options.subscription - Either a subscription hash/ID string or a SubscriptionResult object
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @param options.walletUrl - Optional wallet URL to use
 * @param options.telemetry - Whether to enable telemetry logging (default: true)
 * @returns Promise<SubscriptionStatus> - Current subscription status and details
 * @throws Error if the subscription status check fails
 *
 * @example
 * ```typescript
 * // Using a subscription hash
 * const status = await base.subscription.getStatus({
 *   subscription: "0x123...",
 *   testnet: true
 * });
 *
 * // Using a SubscriptionResult object
 * const subscription = await base.subscribe({ ... });
 * const status = await base.subscription.getStatus({
 *   subscription: subscription
 * });
 *
 * console.log(`Active: ${status.isSubscribed}`);
 * console.log(`Last payment: ${status.lastPaymentAmount} on ${status.lastPaymentDate}`);
 * console.log(`Next period: ${status.nextPeriodStart}`);
 * console.log(`Recurring amount: ${status.recurringAmount}`);
 * ```
 */
export async function getSubscriptionStatus(
  options: SubscriptionStatusOptions
): Promise<SubscriptionStatus> {
  const { subscription, testnet = false } = options;

  // Extract the permission hash from the input
  const permissionHash = typeof subscription === 'string' 
    ? subscription 
    : subscription.id;

  // Setup network configuration
  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];

  // Get the RPC URL from fallback chains or use CB wallet RPC
  // The coinbase_fetchPermission RPC is available at the CB wallet RPC endpoint
  // similar to how coinbase_fetchPermissions works in Signer.ts
  const rpcUrl = CB_WALLET_RPC_URL;

  // Fetch permission details using the new RPC method directly
  // This doesn't require wallet connection, similar to getPaymentStatus
  // The backend expects params as an array with an object containing the permission hash
  const response = await fetchRPCRequest(
    {
      method: 'coinbase_fetchPermission',
      params: [
        {
          permissionHash: permissionHash,
        }
      ],
    },
    rpcUrl
  ) as FetchPermissionResponse;

  // Parse the response to create the subscription status
  const status: SubscriptionStatus = {
    isSubscribed: response.isActive,
  };

  // Add last payment date if available
  if (response.lastPaymentDate) {
    status.lastPaymentDate = new Date(response.lastPaymentDate * 1000);
  }

  // Add last payment amount if available
  if (response.lastPaymentAmount) {
    status.lastPaymentAmount = response.lastPaymentAmount;
  }

  // Add next period start if available
  if (response.nextPeriodStart) {
    status.nextPeriodStart = new Date(response.nextPeriodStart * 1000);
  }

  // Calculate recurring amount from the permission details
  // The allowance is in wei (for USDC with 6 decimals)
  if (response.permission?.permission?.allowance) {
    const recurringAmount = formatUnits(BigInt(response.permission.permission.allowance), 6);
    status.recurringAmount = recurringAmount;
  }

  return status;
}
