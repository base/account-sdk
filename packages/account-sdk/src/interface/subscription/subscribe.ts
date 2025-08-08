import { Address } from 'viem';
import { CHAIN_IDS, TOKENS } from '../payment/constants.js';
import { createEphemeralSDK } from '../payment/utils/sdkManager.js';
import { requestSpendPermissionWithMutableData } from '../public-utilities/spend-permission/methods/requestSpendPermissionWithMutableData.js';
import type { SubscriptionOptions, SubscriptionResult } from './types.js';
import {
    PLACEHOLDER_ADDRESS,
    periodToDays,
    validateAndConvertAmount,
    validateSubscriptionOwnerAddress
} from './utils.js';

/**
 * Create a new subscription for recurring payments using USDC on Base network.
 * 
 * This method creates a spend permission that allows the subscription owner to
 * charge the specified amount at the given period. The subscription uses an
 * ephemeral wallet and the wallet_sign RPC with mutable data to enable
 * connectionless subscription creation.
 * 
 * @param options - Subscription options
 * @param options.subscriptionOwnerAddress - The address that will own and manage the subscription
 * @param options.recurringCharge - Amount in USD to charge per period (e.g., "9.99")
 * @param options.period - The billing period for the subscription
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @param options.walletUrl - Optional wallet URL to use
 * @param options.telemetry - Whether to enable telemetry (default: true)
 * @returns Promise<SubscriptionResult> - Result of the subscription creation
 * @throws Error if the subscription creation fails
 * 
 * @example
 * ```typescript
 * import { base } from '@base-org/account';
 * 
 * try {
 *   const subscription = await base.subscription.subscribe({
 *     subscriptionOwnerAddress: "0xYourAppAddress",
 *     recurringCharge: "9.99",
 *     period: "monthly",
 *     testnet: true
 *   });
 *   
 *   console.log(`Subscription created for ${subscription.accountAddress}`);
 *   console.log(`Permission hash: ${subscription.permission.permissionHash}`);
 * } catch (error) {
 *   console.error(`Subscription failed: ${error.message}`);
 * }
 * ```
 */
export async function subscribe(options: SubscriptionOptions): Promise<SubscriptionResult> {
  const { 
    subscriptionOwnerAddress, 
    recurringCharge, 
    period, 
    testnet = false, 
    walletUrl,
    telemetry = true 
  } = options;

  try {
    // Validate inputs
    validateSubscriptionOwnerAddress(subscriptionOwnerAddress);
    const allowanceInWei = validateAndConvertAmount(recurringCharge);
    const periodInDays = periodToDays(period);

    // Determine network and token
    const network = testnet ? 'baseSepolia' : 'base';
    const chainId = CHAIN_IDS[network];
    const usdcAddress = TOKENS.USDC.addresses[network];

    // Create ephemeral SDK
    const sdk = createEphemeralSDK(chainId, walletUrl, telemetry);
    const provider = sdk.getProvider();

    try {
      // Request spend permission using wallet_sign with mutable data
      // Use placeholder address since we don't know the user's address yet
      const permission = await requestSpendPermissionWithMutableData({
        provider,
        account: PLACEHOLDER_ADDRESS, // Will be replaced by wallet
        spender: subscriptionOwnerAddress,
        token: usdcAddress,
        chainId,
        allowance: allowanceInWei,
        periodInDays,
        // mutableFields will default to ['message.account'] for placeholder
      });

      // Extract the actual account address from the signed permission
      const actualAccountAddress = permission.permission.account as Address;

      // Return success result
      return {
        success: true,
        permission,
        subscriptionOwnerAddress,
        recurringCharge,
        period,
        accountAddress: actualAccountAddress,
      };
    } finally {
      // Clean up provider state
      await provider.disconnect();
    }
  } catch (error) {
    // Extract error message
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      const err = error as { message?: unknown; error?: { message?: unknown }; reason?: unknown };
      if (typeof err?.message === 'string') {
        errorMessage = err.message;
      } else if (typeof err?.error?.message === 'string') {
        errorMessage = err.error.message;
      } else if (typeof err?.reason === 'string') {
        errorMessage = err.reason;
      }
    }

    // Re-throw with better error message
    throw new Error(`Subscription creation failed: ${errorMessage}`);
  }
}