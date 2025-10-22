import type { Address, Hex } from 'viem';
import { decodeEventLog, formatUnits, getAddress, isAddressEqual } from 'viem';

import {
  logPaymentStatusCheckCompleted,
  logPaymentStatusCheckError,
  logPaymentStatusCheckStarted,
} from ':core/telemetry/events/payment.js';
import { ERC20_TRANSFER_ABI, TOKENS } from './constants.js';
import type { PaymentStatus, PaymentStatusOptions } from './types.js';

/**
 * Check the status of a payment transaction using its transaction ID (userOp hash)
 *
 * @param options - Payment status check options
 * @returns Promise<PaymentStatus> - Status information about the payment
 * @throws Error if unable to connect to the RPC endpoint or if the RPC request fails
 *
 * @example
 * ```typescript
 * try {
 *   const status = await getPaymentStatus({
 *     id: "0x1234...5678",
 *     testnet: true
 *   })
 *
 *   if (status.status === 'failed') {
 *     console.log(`Payment failed: ${status.reason}`)
 *   }
 * } catch (error) {
 *   console.error('Unable to check payment status:', error.message)
 * }
 * ```
 *
 * @note The id is the userOp hash returned from the pay function
 */
export async function getPaymentStatus(options: PaymentStatusOptions): Promise<PaymentStatus> {
  const { id, testnet = false, telemetry = true } = options;

  // Generate correlation ID for this status check
  const correlationId = crypto.randomUUID();

  // Log status check started
  if (telemetry) {
    logPaymentStatusCheckStarted({ testnet, correlationId });
  }

  try {
    // Get the bundler URL based on network
    const bundlerUrl = testnet
      ? 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O'
      : 'https://api.developer.coinbase.com/rpc/v1/base/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O';

    // Call eth_getUserOperationReceipt via the bundler
    const receipt = await fetch(bundlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getUserOperationReceipt',
        params: [id],
      }),
    }).then((res) => res.json());

    // Handle RPC errors
    if (receipt.error) {
      console.error('[getPaymentStatus] RPC error:', receipt.error);
      const errorMessage = receipt.error.message || 'Network error';
      if (telemetry) {
        logPaymentStatusCheckError({ testnet, correlationId, errorMessage });
      }
      // Re-throw error for RPC failures
      throw new Error(`RPC error: ${errorMessage}`);
    }

    // If no result, payment is still pending or not found
    if (!receipt.result) {
      // Try eth_getUserOperationByHash to see if it's in mempool
      const userOpResponse = await fetch(bundlerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_getUserOperationByHash',
          params: [id],
        }),
      }).then((res) => res.json());

      if (userOpResponse.result) {
        // UserOp exists but no receipt yet - it's pending
        if (telemetry) {
          logPaymentStatusCheckCompleted({ testnet, status: 'pending', correlationId });
        }
        const result = {
          status: 'pending' as const,
          id: id as Hex,
          message: 'Your payment is being processed. This usually takes a few seconds.',
          sender: userOpResponse.result.sender,
        };
        return result;
      }

      // Not found at all
      if (telemetry) {
        logPaymentStatusCheckCompleted({ testnet, status: 'not_found', correlationId });
      }
      const result = {
        status: 'not_found' as const,
        id: id as Hex,
        message: 'Payment not found. Please check your transaction ID.',
      };
      return result;
    }

    // Parse the receipt
    const { success, receipt: txReceipt, reason } = receipt.result;

    // Determine status based on success flag
    if (success) {
      // Parse USDC amount from logs
      let amount: string | undefined;
      let recipient: string | undefined;

      if (txReceipt?.logs) {
        const network = testnet ? 'baseSepolia' : 'base';
        const usdcAddress = TOKENS.USDC.addresses[network].toLowerCase();
        // Normalize sender address for comparison
        const senderAddress: Address | undefined = receipt.result.sender
          ? getAddress(receipt.result.sender)
          : undefined;

        // Collect all USDC transfers
        const usdcTransfers: Array<{
          from: string;
          to: string;
          value: bigint;
          formattedAmount: string;
          logIndex: number;
        }> = [];

        for (let i = 0; i < txReceipt.logs.length; i++) {
          const log = txReceipt.logs[i];

          // Check if this is a USDC log
          const logAddressLower = log.address?.toLowerCase();
          const isUsdcLog = logAddressLower === usdcAddress;

          if (isUsdcLog) {
            try {
              const decoded = decodeEventLog({
                abi: ERC20_TRANSFER_ABI,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === 'Transfer' && decoded.args) {
                const args = decoded.args as { from: string; to: string; value: bigint };

                if (args.value && args.to && args.from) {
                  const formattedAmount = formatUnits(args.value, 6);

                  usdcTransfers.push({
                    from: args.from,
                    to: args.to,
                    value: args.value,
                    formattedAmount,
                    logIndex: i,
                  });
                }
              }
            } catch (_e) {
              // Do not fail here - fail when we can't find a single valid transfer
            }
          }
        }

        // Now select the correct transfer
        // Strategy: Find the transfer from the sender (smart wallet) address
        if (usdcTransfers.length > 0 && senderAddress) {
          // Look for transfers from the sender address (smart wallet)
          // Compare checksummed addresses for consistency
          const senderTransfers = usdcTransfers.filter((t) => {
            try {
              return isAddressEqual(t.from as Address, senderAddress!);
            } catch {
              return false;
            }
          });

          if (senderTransfers.length === 0) {
            // No transfer from the sender wallet was found
            throw new Error(
              `Unable to find USDC transfer from sender wallet ${receipt.result.sender}. ` +
                `Found ${usdcTransfers.length} USDC transfer(s) but none originated from the sender wallet.`
            );
          }
          if (senderTransfers.length > 1) {
            // Multiple transfers from the sender wallet found
            const transferDetails = senderTransfers
              .map((t) => `${t.formattedAmount} USDC to ${t.to}`)
              .join(', ');
            throw new Error(
              `Found multiple USDC transfers from sender wallet ${receipt.result.sender}: ${transferDetails}. Expected exactly one transfer.`
            );
          }
          // Exactly one transfer from sender found
          amount = senderTransfers[0].formattedAmount;
          recipient = senderTransfers[0].to;
        }
      }

      if (telemetry) {
        logPaymentStatusCheckCompleted({ testnet, status: 'completed', correlationId });
      }
      const result = {
        status: 'completed' as const,
        id: id as Hex,
        message: 'Payment completed successfully',
        sender: receipt.result.sender,
        amount,
        recipient,
      };
      return result;
    }
    // else block - Parse a user-friendly reason for failure
    let userFriendlyReason = 'Payment could not be completed';

    if (reason) {
      if (reason.toLowerCase().includes('insufficient')) {
        userFriendlyReason = 'Insufficient USDC balance';
      } else {
        userFriendlyReason = reason;
      }
    }

    if (telemetry) {
      logPaymentStatusCheckCompleted({ testnet, status: 'failed', correlationId });
    }
    const result = {
      status: 'failed' as const,
      id: id as Hex,
      message: 'Payment failed',
      sender: receipt.result.sender,
      reason: userFriendlyReason,
    };
    return result;
  } catch (error) {
    console.error('[getPaymentStatus] Error checking status:', error);

    const errorMessage = error instanceof Error ? error.message : 'Connection error';
    if (telemetry) {
      logPaymentStatusCheckError({ testnet, correlationId, errorMessage });
    }

    // Re-throw the error
    throw error;
  }
}
