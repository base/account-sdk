import {
    logSubscriptionChargeCompleted,
    logSubscriptionChargeError,
    logSubscriptionChargeStarted,
} from ':core/telemetry/events/subscription.js';
import { CdpClient } from '@coinbase/cdp-sdk';
import { type Address } from 'viem';
import { prepareCharge } from './prepareCharge.js';
import type { ChargeOptions, ChargeResult } from './types.js';

/**
 * Prepares and executes a charge for a given spend permission.
 * 
 * This function combines the functionality of getSubscriptionOwner and prepareCharge,
 * then executes the charge using a CDP smart wallet. The smart wallet is controlled
 * by an EVM account and can leverage paymasters for gas sponsorship.
 * 
 * The function will:
 * - Use the provided CDP credentials or fall back to environment variables
 * - Create or retrieve a smart wallet to act as the subscription owner
 * - Prepare the charge call data using the subscription ID
 * - Execute the charge transaction using the smart wallet
 * - Optionally use a paymaster for transaction sponsorship
 * 
 * @param options - Options for charging the subscription
 * @param options.id - The subscription ID (permission hash) to charge
 * @param options.amount - Amount to charge as a string (e.g., "10.50") or 'max-remaining-charge'
 * @param options.testnet - Whether this is on testnet (Base Sepolia). Defaults to false (mainnet)
 * @param options.cdpApiKeyId - CDP API key ID. Falls back to CDP_API_KEY_ID env var
 * @param options.cdpApiKeySecret - CDP API key secret. Falls back to CDP_API_KEY_SECRET env var
 * @param options.cdpWalletSecret - CDP wallet secret. Falls back to CDP_WALLET_SECRET env var
 * @param options.walletName - Custom wallet name. Defaults to "subscription owner"
 * @param options.paymasterUrl - Paymaster URL for sponsorship. Falls back to PAYMASTER_URL env var
 * @param options.telemetry - Whether to enable telemetry logging. Defaults to true
 * @returns Promise<ChargeResult> - Result of the charge transaction
 * @throws Error if CDP credentials are missing, subscription not found, or charge fails
 * 
 * @example
 * ```typescript
 * import { base } from '@base-org/account/payment';
 * 
 * // Using environment variables for credentials and paymaster
 * const charge = await base.subscription.charge({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   amount: '9.99',
 *   testnet: false
 * });
 * console.log(`Charged ${charge.amount} - Transaction: ${charge.id}`);
 * 
 * // Using explicit credentials and paymaster URL
 * const charge = await base.subscription.charge({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   amount: 'max-remaining-charge',
 *   cdpApiKeyId: 'your-api-key-id',
 *   cdpApiKeySecret: 'your-api-key-secret',
 *   cdpWalletSecret: 'your-wallet-secret',
 *   paymasterUrl: 'https://your-paymaster.com',
 *   testnet: false
 * });
 * 
 * // Using a custom wallet name
 * const charge = await base.subscription.charge({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   amount: '5.00',
 *   walletName: 'my-app-charge-wallet',
 *   testnet: true
 * });
 * ```
 */
export async function charge(options: ChargeOptions): Promise<ChargeResult> {
  const {
    id,
    amount,
    testnet = false,
    cdpApiKeyId,
    cdpApiKeySecret,
    cdpWalletSecret,
    walletName = 'subscription owner',
    paymasterUrl = process.env.PAYMASTER_URL,
    telemetry = true,
  } = options;

  // Generate correlation ID for this charge request
  const correlationId = crypto.randomUUID();

  // Log charge started
  if (telemetry) {
    logSubscriptionChargeStarted({ 
      subscriptionId: id, 
      amount: amount === 'max-remaining-charge' ? 'max' : amount, 
      testnet, 
      correlationId 
    });
  }

  try {
    // Step 1: Initialize CDP client with provided credentials or environment variables
    let cdpClient: CdpClient;
    
    try {
      cdpClient = new CdpClient({
        apiKeyId: cdpApiKeyId,
        apiKeySecret: cdpApiKeySecret,
        walletSecret: cdpWalletSecret,
      });
    } catch (error) {
      // Re-throw with more context about what credentials are missing
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to initialize CDP client for subscription charge. ${errorMessage}\n\n` +
        'Please ensure you have set the required CDP credentials either:\n' +
        '1. As environment variables: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET\n' +
        '2. As function parameters: cdpApiKeyId, cdpApiKeySecret, cdpWalletSecret\n\n' +
        'You can get these credentials from https://portal.cdp.coinbase.com/projects/api-keys'
      );
    }

    // Step 2: Get or create the EVM account and smart wallet
    let smartWallet;
    try {
      // First get or create the EOA that will own the smart wallet
      const eoaAccount = await cdpClient.evm.getOrCreateAccount({ name: walletName });
      
      // Get or create a smart wallet with the EOA as owner
      // Using getOrCreateSmartAccount ensures idempotency
      const smartWalletName = `${walletName}-smart`;
      smartWallet = await cdpClient.evm.getOrCreateSmartAccount({
        name: smartWalletName,
        owner: eoaAccount,
        // Note: We don't set enableSpendPermissions since this wallet will use
        // spend permissions, not grant them to others
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to get or create charge smart wallet "${walletName}": ${errorMessage}`
      );
    }

    // Step 3: Prepare the charge call data
    const chargeCalls = await prepareCharge({ id, amount, testnet });

    // Step 4: Get the network-scoped smart wallet
    const network = testnet ? 'base-sepolia' : 'base';
    const networkSmartWallet = await smartWallet.useNetwork(network);

    // Step 5: Execute the charge transaction(s) using the smart wallet
    // Smart wallets can batch multiple calls and use paymasters for gas sponsorship
    let transactionHash: string | undefined;

    try {
      // Build the calls array for the smart wallet
      // Convert value from hex string to bigint if needed
      const calls = chargeCalls.map(call => ({
        to: call.to,
        data: call.data,
        value: BigInt(call.value || '0x0'),
      }));

      // For smart wallets, we can send all calls in a single user operation
      // This is more efficient and allows for better paymaster integration
      
      // Send the user operation
      const userOpResult = await networkSmartWallet.sendUserOperation({
        calls,
        ...(paymasterUrl && { paymasterUrl }),
      });
      
      // The sendUserOperation returns { smartAccountAddress, status: "broadcast", userOpHash }
      // We need to wait for the operation to complete to get the transaction hash
      const completedOp = await networkSmartWallet.waitForUserOperation({
        userOpHash: userOpResult.userOpHash,
        waitOptions: {
          timeoutSeconds: 60, // Wait up to 60 seconds for the operation to complete
        },
      });
      
      // Check if the operation was successful
      if (completedOp.status === 'failed') {
        throw new Error(`User operation failed: ${userOpResult.userOpHash}`);
      }
      
      // For completed operations, we have the transaction hash
      transactionHash = completedOp.transactionHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute charge transaction with smart wallet: ${errorMessage}`);
    }

    if (!transactionHash) {
      throw new Error('No transaction hash received from charge execution');
    }

    // Log charge completed
    if (telemetry) {
      logSubscriptionChargeCompleted({ 
        subscriptionId: id, 
        amount: amount === 'max-remaining-charge' ? 'max' : amount, 
        testnet, 
        correlationId 
      });
    }

    // Return success result
    return {
      success: true,
      id: transactionHash,
      subscriptionId: id,
      amount: amount === 'max-remaining-charge' ? 'max' : amount,
      chargedBy: smartWallet.address as Address,
    };
  } catch (error) {
    // Extract error message
    let errorMessage = 'Unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Log charge error
    if (telemetry) {
      logSubscriptionChargeError({ 
        subscriptionId: id, 
        amount: amount === 'max-remaining-charge' ? 'max' : amount, 
        testnet, 
        correlationId, 
        errorMessage 
      });
    }

    // Re-throw the original error
    throw error;
  }
}
