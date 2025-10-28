import { CdpClient } from '@coinbase/cdp-sdk';
import { type Address } from 'viem';
import { prepareRevoke } from './prepareRevoke.js';
import type { RevokeOptions, RevokeResult } from './types.js';

/**
 * Prepares and executes a revoke for a given spend permission.
 *
 * Note: This function relies on Node.js APIs and is only available in Node.js environments.
 *
 * This function combines the functionality of getOrCreateSubscriptionOwnerWallet and prepareRevoke,
 * then executes the revoke using a CDP smart wallet. The smart wallet is controlled
 * by an EVM account and can leverage paymasters for gas sponsorship.
 *
 * The function will:
 * - Use the provided CDP credentials or fall back to environment variables
 * - Get the existing smart wallet that acts as the subscription owner
 * - Prepare the revoke call data using the subscription ID
 * - Execute the revoke transaction using the smart wallet
 * - Optionally use a paymaster for transaction sponsorship
 *
 * @param options - Options for revoking the subscription
 * @param options.id - The subscription ID (permission hash) to revoke
 * @param options.testnet - Whether this is on testnet (Base Sepolia). Defaults to false (mainnet)
 * @param options.cdpApiKeyId - CDP API key ID. Falls back to CDP_API_KEY_ID env var
 * @param options.cdpApiKeySecret - CDP API key secret. Falls back to CDP_API_KEY_SECRET env var
 * @param options.cdpWalletSecret - CDP wallet secret. Falls back to CDP_WALLET_SECRET env var
 * @param options.walletName - Custom wallet name. Defaults to "subscription owner"
 * @param options.paymasterUrl - Paymaster URL for sponsorship. Falls back to PAYMASTER_URL env var
 * @returns Promise<RevokeResult> - Result of the revoke transaction
 * @throws Error if CDP credentials are missing, subscription not found, or revoke fails
 *
 * @example
 * ```typescript
 * import { base } from '@base-org/account/payment';
 *
 * // Using environment variables for credentials and paymaster
 * const result = await base.subscription.revoke({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   testnet: false
 * });
 * console.log(`Revoked subscription - Transaction: ${result.id}`);
 *
 * // Using explicit credentials and paymaster URL
 * const result = await base.subscription.revoke({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   cdpApiKeyId: 'your-api-key-id',
 *   cdpApiKeySecret: 'your-api-key-secret',
 *   cdpWalletSecret: 'your-wallet-secret',
 *   paymasterUrl: 'https://your-paymaster.com',
 *   testnet: false
 * });
 *
 * // Using a custom wallet name
 * const result = await base.subscription.revoke({
 *   id: '0x71319cd488f8e4f24687711ec5c95d9e0c1bacbf5c1064942937eba4c7cf2984',
 *   walletName: 'my-app-charge-wallet',
 *   testnet: true
 * });
 * ```
 */
export async function revoke(options: RevokeOptions): Promise<RevokeResult> {
  const {
    id,
    testnet = false,
    cdpApiKeyId,
    cdpApiKeySecret,
    cdpWalletSecret,
    walletName = 'subscription owner',
    paymasterUrl = process.env.PAYMASTER_URL,
  } = options;

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
      `Failed to initialize CDP client for subscription revoke. ${errorMessage}\n\nPlease ensure you have set the required CDP credentials either:\n1. As environment variables: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET\n2. As function parameters: cdpApiKeyId, cdpApiKeySecret, cdpWalletSecret\n\nYou can get these credentials from https://portal.cdp.coinbase.com/`
    );
  }

  // Step 2: Get the existing EVM account and smart wallet
  // NOTE: We use get() instead of getOrCreate() to ensure the wallet already exists.
  // The wallet should have been created prior to executing a revoke on it.
  let smartWallet;
  try {
    // First get the existing EOA that owns the smart wallet
    const eoaAccount = await cdpClient.evm.getAccount({ name: walletName });

    if (!eoaAccount) {
      throw new Error(
        `EOA wallet "${walletName}" not found. The wallet must be created before executing a revoke. Use getOrCreateSubscriptionOwnerWallet() to create the wallet first.`
      );
    }

    // Get the existing smart wallet with the EOA as owner
    // NOTE: Both the EOA wallet and smart wallet are given the same name intentionally.
    // This simplifies wallet management and ensures consistency across the system.
    smartWallet = await cdpClient.evm.getSmartAccount({
      name: walletName, // Same name as the EOA wallet
      owner: eoaAccount,
    });

    if (!smartWallet) {
      throw new Error(
        `Smart wallet "${walletName}" not found. The wallet must be created before executing a revoke. Use getOrCreateSubscriptionOwnerWallet() to create the wallet first.`
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get revoke smart wallet "${walletName}": ${errorMessage}`);
  }

  // Step 3: Prepare the revoke call data
  const revokeCall = await prepareRevoke({ id, testnet });

  // Step 4: Get the network-scoped smart wallet
  const network = testnet ? 'base-sepolia' : 'base';
  const networkSmartWallet = await smartWallet.useNetwork(network);

  // Step 5: Execute the revoke transaction using the smart wallet
  // Smart wallets can batch multiple calls and use paymasters for gas sponsorship
  let transactionHash: string | undefined;

  try {
    // Build the calls array for the smart wallet
    const calls = [
      {
        to: revokeCall.to,
        data: revokeCall.data,
        value: revokeCall.value,
      },
    ];

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
    throw new Error(`Failed to execute revoke transaction with smart wallet: ${errorMessage}`);
  }

  if (!transactionHash) {
    throw new Error('No transaction hash received from revoke execution');
  }

  // Return success result
  return {
    success: true,
    id: transactionHash,
    subscriptionId: id,
    subscriptionOwner: smartWallet.address as Address,
  };
}


