import { CdpClient } from '@coinbase/cdp-sdk';
import type { EvmSmartAccount } from '@coinbase/cdp-sdk';
import type { Address } from 'viem';
import type { SpendPermission } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { CHAIN_IDS, TOKENS } from './constants.js';

/**
 * Options for creating a CDP client
 */
export interface CreateCdpClientOptions {
  cdpApiKeyId?: string;
  cdpApiKeySecret?: string;
  cdpWalletSecret?: string;
}

/**
 * Creates and initializes a CDP client with provided credentials or environment variables.
 * Throws a detailed error if credentials are missing or invalid.
 *
 * @param options - CDP credential options
 * @param context - Context string for error messages (e.g., "subscription charge", "subscription revoke")
 * @returns Initialized CdpClient instance
 * @throws Error if credentials are missing or invalid
 */
export function createCdpClientOrThrow(
  options: CreateCdpClientOptions,
  context: string
): CdpClient {
  try {
    return new CdpClient({
      apiKeyId: options.cdpApiKeyId,
      apiKeySecret: options.cdpApiKeySecret,
      walletSecret: options.cdpWalletSecret,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to initialize CDP client for ${context}. ${errorMessage}\n\nPlease ensure you have set the required CDP credentials either:\n1. As environment variables: CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET\n2. As function parameters: cdpApiKeyId, cdpApiKeySecret, cdpWalletSecret\n\nYou can get these credentials from https://portal.cdp.coinbase.com/`
    );
  }
}

/**
 * Retrieves an existing smart wallet from CDP by name.
 * Throws detailed errors if the EOA or smart wallet doesn't exist.
 *
 * @param cdpClient - Initialized CDP client
 * @param walletName - Name of the wallet to retrieve
 * @param context - Context string for error messages (e.g., "charge", "revoke")
 * @returns The smart wallet instance
 * @throws Error if EOA or smart wallet not found
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
      throw new Error(
        `EOA wallet "${walletName}" not found. The wallet must be created before executing a ${context}. Use getOrCreateSubscriptionOwnerWallet() to create the wallet first.`
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
      throw new Error(
        `Smart wallet "${walletName}" not found. The wallet must be created before executing a ${context}. Use getOrCreateSubscriptionOwnerWallet() to create the wallet first.`
      );
    }

    return smartWallet;
  } catch (error) {
    // If the error is already our custom error, re-throw it
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get ${context} smart wallet "${walletName}": ${errorMessage}`);
  }
}

/**
 * Returns the network identifier based on testnet flag
 *
 * @param testnet - Whether this is testnet (Base Sepolia) or mainnet (Base)
 * @returns Network identifier string
 */
export function getNetworkFor(testnet: boolean): 'base' | 'base-sepolia' {
  return testnet ? 'base-sepolia' : 'base';
}

/**
 * Call data for a smart wallet operation
 */
export interface CallData {
  to: Address;
  data: `0x${string}`;
  value: bigint;
}

/**
 * Sends a user operation and waits for it to complete.
 * Handles error cases and provides consistent error messages.
 *
 * @param networkSmartWallet - Network-scoped smart wallet instance
 * @param calls - Array of calls to execute
 * @param paymasterUrl - Optional paymaster URL for gas sponsorship
 * @param timeoutSeconds - Timeout in seconds (default: 60)
 * @param context - Context string for error messages (e.g., "charge", "revoke")
 * @returns Transaction hash of the completed operation
 * @throws Error if operation fails or times out
 */
export async function sendUserOpAndWait(
  networkSmartWallet: Awaited<ReturnType<EvmSmartAccount['useNetwork']>>,
  calls: CallData[],
  paymasterUrl: string | undefined,
  timeoutSeconds: number,
  context: string
): Promise<string> {
  try {
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
        timeoutSeconds,
      },
    });

    // Check if the operation was successful
    if (completedOp.status === 'failed') {
      throw new Error(`User operation failed: ${userOpResult.userOpHash}`);
    }

    // For completed operations, we have the transaction hash
    const transactionHash = completedOp.transactionHash;

    if (!transactionHash) {
      throw new Error('No transaction hash received from operation');
    }

    return transactionHash;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to execute ${context} transaction with smart wallet: ${errorMessage}`);
  }
}

/**
 * Validates that a permission is for USDC on the expected Base network.
 * Throws detailed errors if validation fails.
 *
 * @param permission - The permission to validate
 * @param testnet - Whether this should be testnet (Base Sepolia) or mainnet (Base)
 * @throws Error if chainId or token address doesn't match expected values
 */
export function validateUSDCBasePermission(
  permission: SpendPermission,
  testnet: boolean
): void {
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
}

