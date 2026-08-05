import type { EvmSmartAccount } from '@coinbase/cdp-sdk';

import { PaymentError } from ':core/error/sdkErrors.js';
import type { PrepareChargeCall } from '../types.js';

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
 * @throws PaymentError if operation fails or times out
 */
export async function sendUserOpAndWait(
  networkSmartWallet: Awaited<ReturnType<EvmSmartAccount['useNetwork']>>,
  calls: PrepareChargeCall[],
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
      throw new PaymentError(
        `${context} user operation was rejected on-chain (hash: ${userOpResult.userOpHash}). This may be due to insufficient gas, invalid calldata, or a contract revert.`,
        'USER_OP_FAILED',
        true
      );
    }

    // For completed operations, we have the transaction hash
    const transactionHash = completedOp.transactionHash;

    if (!transactionHash) {
      throw new PaymentError(
        `${context} user operation completed with status "${completedOp.status}" but no transaction hash was returned (hash: ${userOpResult.userOpHash}). Please retry or contact support if this persists.`,
        'NO_TX_HASH',
        true
      );
    }

    return transactionHash;
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new PaymentError(
      `Failed to execute ${context} transaction: ${errorMessage}`,
      'EXECUTION_FAILED',
      true
    );
  }
}
