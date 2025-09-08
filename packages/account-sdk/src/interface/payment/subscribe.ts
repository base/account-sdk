import {
  logSubscriptionCompleted,
  logSubscriptionError,
  logSubscriptionStarted,
} from ':core/telemetry/events/subscription.js';
import { parseErrorMessageFromAny } from ':core/telemetry/utils.js';
import { parseUnits } from 'viem';
import { getHash } from '../public-utilities/spend-permission/index.js';
import {
  createSpendPermissionTypedData,
  type SpendPermissionTypedData,
} from '../public-utilities/spend-permission/utils.js';
import { CHAIN_IDS, TOKENS } from './constants.js';
import type { SubscriptionOptions, SubscriptionResult } from './types.js';
import { createEphemeralSDK } from './utils/sdkManager.js';
import { normalizeAddress, validateStringAmount } from './utils/validation.js';

// Placeholder address for mutable data - will be replaced by wallet with actual account
const PLACEHOLDER_ADDRESS = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as const;

/**
 * Creates a subscription using spend permissions on Base network
 *
 * @param options - Subscription options
 * @param options.recurringCharge - Amount of USDC to spend per period as a string (e.g., "10.50")
 * @param options.subscriptionOwner - Ethereum address that will be the spender (your application's address)
 * @param options.periodInDays - The period in days for the subscription (default: 30)
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @param options.walletUrl - Optional wallet URL to use
 * @param options.telemetry - Whether to enable telemetry logging (default: true)
 * @returns Promise<SubscriptionResult> - Simplified result with subscription details
 * @throws Error if the subscription fails
 *
 * @example
 * ```typescript
 * try {
 *   const subscription = await subscribe({
 *     recurringCharge: "10.50",
 *     subscriptionOwner: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51", // Your app's address
 *     periodInDays: 30, // Monthly subscription
 *     testnet: true
 *   });
 *
 *   console.log(`Subscription created!`);
 *   console.log(`ID: ${subscription.id}`);
 *   console.log(`Payer: ${subscription.subscriptionPayer}`);
 *   console.log(`Owner: ${subscription.subscriptionOwner}`);
 *   console.log(`Charge: $${subscription.recurringCharge} every ${subscription.periodInDays} days`);
 * } catch (error) {
 *   console.error(`Subscription failed: ${error.message}`);
 * }
 * ```
 */
export async function subscribe(options: SubscriptionOptions): Promise<SubscriptionResult> {
  const {
    recurringCharge,
    subscriptionOwner,
    periodInDays = 30,
    testnet = false,
    walletUrl,
    telemetry = true,
  } = options;

  // Generate correlation ID for this subscription request
  const correlationId = crypto.randomUUID();

  // Log subscription started
  if (telemetry) {
    logSubscriptionStarted({ recurringCharge, periodInDays, testnet, correlationId });
  }

  try {
    // Validate inputs
    validateStringAmount(recurringCharge, 6);
    const spenderAddress = normalizeAddress(subscriptionOwner);

    // Setup network configuration
    const network = testnet ? 'baseSepolia' : 'base';
    const chainId = CHAIN_IDS[network];
    const tokenAddress = TOKENS.USDC.addresses[network];

    // Convert amount to wei (USDC has 6 decimals)
    const allowanceInWei = parseUnits(recurringCharge, 6);

    // Create the spend permission typed data using the utility
    // The utility handles:
    // - Default values for start (now) and end (ETERNITY_TIMESTAMP)
    // - Auto-generation of salt and extraData
    // - Proper formatting of all fields
    // We use PLACEHOLDER_ADDRESS which will be replaced by wallet with actual account
    const typedData = createSpendPermissionTypedData({
      account: PLACEHOLDER_ADDRESS,
      spender: spenderAddress,
      token: tokenAddress,
      chainId: chainId,
      allowance: allowanceInWei,
      periodInDays: periodInDays,
    });

    // Create SDK instance
    const sdk = createEphemeralSDK(chainId, walletUrl, telemetry);
    const provider = sdk.getProvider();

    try {
      // Define the wallet_sign parameters with mutable data
      // This allows the wallet to replace PLACEHOLDER_ADDRESS with the actual account
      const signParams = {
        version: '1.0',
        request: {
          type: '0x01' as const, // EIP-712 Typed Data
          data: typedData,
        },
        mutableData: {
          fields: ['message.account'],
        },
      };

      // Request signature from wallet

      const result = await provider.request({
        method: 'wallet_sign',
        params: [signParams],
      });

      // Type guard and validation for the result
      if (!result || typeof result !== 'object') {
        console.error('[SUBSCRIBE] Invalid response - expected object but got:', result);
        throw new Error(
          `Invalid response from wallet_sign: expected object but got ${typeof result}`
        );
      }

      // Check for expected properties
      const hasSignature = 'signature' in result;
      const hasSignedData = 'signedData' in result;

      if (!hasSignature || !hasSignedData) {
        console.error(
          '[SUBSCRIBE] Missing expected properties. Response keys:',
          Object.keys(result)
        );
        throw new Error(
          `Invalid response from wallet_sign: missing ${!hasSignature ? 'signature' : ''} ${!hasSignedData ? 'signedData' : ''}`
        );
      }

      // Cast to expected response type
      const signResult = result as {
        signature: `0x${string}`;
        signedData: SpendPermissionTypedData;
      };

      // Extract the signed permission data
      const { signedData } = signResult;
      const { message } = signedData;

      // Calculate the real permission hash using the contract's getHash method
      const permissionHash = await getHash({
        permission: message,
        chainId,
      });

      // Log subscription completed
      if (telemetry) {
        logSubscriptionCompleted({
          recurringCharge,
          periodInDays,
          testnet,
          correlationId,
          permissionHash,
        });
      }

      // Return simplified result
      return {
        id: permissionHash,
        subscriptionOwner: message.spender,
        subscriptionPayer: message.account,
        recurringCharge: recurringCharge, // The amount in USD as provided by the user
        periodInDays,
      };
    } finally {
      // Clean up provider state
      await provider.disconnect();
    }
  } catch (error) {
    // Extract error message using the utility
    const errorMessage = parseErrorMessageFromAny(error);

    // Log subscription error
    if (telemetry) {
      logSubscriptionError({
        recurringCharge,
        periodInDays,
        testnet,
        correlationId,
        errorMessage,
      });
    }

    // Re-throw the original error
    throw error;
  }
}
