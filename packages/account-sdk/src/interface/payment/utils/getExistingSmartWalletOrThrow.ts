import type { EvmSmartAccount } from '@coinbase/cdp-sdk';
import { CdpClient } from '@coinbase/cdp-sdk';

import { PaymentError } from ':core/error/sdkErrors.js';

/**
 * Retrieves an existing smart wallet from CDP by name.
 * Throws detailed errors if the EOA or smart wallet doesn't exist.
 *
 * @param cdpClient - Initialized CDP client
 * @param walletName - Name of the wallet to retrieve
 * @param context - Context string for error messages (e.g., "charge", "revoke")
 * @returns The smart wallet instance
 * @throws PaymentError if EOA or smart wallet not found
 */
export async function getExistingSmartWalletOrThrow(
  cdpClient: CdpClient,
  walletName: string,
  context: string
): Promise<EvmSmartAccount> {
  try {
    // First get the existing EOA that owns the smart wallet
    const eoaAccount = await cdpClient.evm.getAccount({ name: walletName });

    if (!eoaAccount) {
      throw new PaymentError(
        `EOA wallet "${walletName}" not found. The wallet must be created before executing a ${context}. Use getOrCreateSubscriptionOwnerWallet() to create the wallet first.`,
        'WALLET_NOT_FOUND',
        false
      );
    }

    // Get the existing smart wallet with the EOA as owner
    // NOTE: Both the EOA wallet and smart wallet are given the same name intentionally.
    // This simplifies wallet management and ensures consistency across the system.
    const smartWallet = await cdpClient.evm.getSmartAccount({
      name: walletName, // Same name as the EOA wallet
      owner: eoaAccount,
    });

    if (!smartWallet) {
      throw new PaymentError(
        `Smart wallet "${walletName}" not found. The wallet must be created before executing a ${context}. Use getOrCreateSubscriptionOwnerWallet() to create the wallet first.`,
        'WALLET_NOT_FOUND',
        false
      );
    }

    return smartWallet;
  } catch (error) {
    // If the error is already our custom error, re-throw it
    if (error instanceof PaymentError) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new PaymentError(
      `Failed to get ${context} smart wallet "${walletName}": ${errorMessage}`,
      'WALLET_RETRIEVAL_FAILED',
      true
    );
  }
}
