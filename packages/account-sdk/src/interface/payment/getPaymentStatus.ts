import type { Address, Hex } from 'viem';
import { decodeEventLog, formatUnits, getAddress, isAddressEqual } from 'viem';

import {
  logPaymentStatusCheckCompleted,
  logPaymentStatusCheckError,
  logPaymentStatusCheckStarted,
} from ':core/telemetry/events/payment.js';
import { CHAIN_IDS, ERC20_TRANSFER_ABI } from './constants.js';
import type { PaymentStatus, PaymentStatusOptions } from './types.js';
import { decodePaymentId, getBundlerUrl } from './utils/erc3770.js';
import { getStablecoinMetadataByAddress } from './utils/tokenRegistry.js';

/**
 * Check the status of a payment transaction using its transaction ID (userOp hash)
 *
 * @param options - Payment status check options
 * @param options.id - Payment ID. For `payWithToken()`, this is ERC-3770 encoded (e.g., "base:0x1234...5678").
 *                     For `pay()`, this is a plain transaction hash (e.g., "0x1234...5678").
 * @param options.testnet - Whether to use testnet (only used for legacy format from `pay()`)
 * @returns Promise<PaymentStatus> - Status information about the payment
 * @throws Error if unable to connect to the RPC endpoint or if the RPC request fails
 *
 * @example
 * ```typescript
 * // ERC-3770 encoded ID from payWithToken()
 * try {
 *   const status = await getPaymentStatus({
 *     id: "base:0x1234...5678"
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
 * @example
 * ```typescript
 * // Legacy format from pay() - requires testnet flag
 * try {
 *   const status = await getPaymentStatus({
 *     id: "0x1234...5678",
 *     testnet: true
 *   })
 * } catch (error) {
 *   console.error('Unable to check payment status:', error.message)
 * }
 * ```
 *
 * @note For `payWithToken()`, the ID is automatically encoded with chain information using ERC-3770 format.
 *       For `pay()`, the ID is a plain hash and requires the `testnet` flag to determine the chain.
 */
export async function getPaymentStatus(options: PaymentStatusOptions): Promise<PaymentStatus> {
  const { id, testnet = false, telemetry = true } = options;

  // Generate correlation ID for this status check
  const correlationId = crypto.randomUUID();

  // Decode payment ID to extract chainId and transactionHash
  // If ERC-3770 format, extract chainId; otherwise use legacy format with testnet flag
  const decoded = decodePaymentId(id);
  let chainId: number;
  let transactionHash: string;
  let bundlerUrl: string | null;

  if (decoded) {
    // ERC-3770 encoded format: extract chainId and transactionHash
    chainId = decoded.chainId;
    transactionHash = decoded.transactionHash;
    bundlerUrl = getBundlerUrl(chainId);

    if (!bundlerUrl) {
      throw new Error(
        `Bundler URL not available for chain ID ${chainId}. Payment status checking is not supported for this chain.`
      );
    }
  } else {
    // Legacy format: use testnet flag to determine Base network
    transactionHash = id;
    chainId = testnet ? CHAIN_IDS.baseSepolia : CHAIN_IDS.base;
    bundlerUrl = getBundlerUrl(chainId);

    if (!bundlerUrl) {
      // Fallback to hardcoded URLs for backward compatibility
      bundlerUrl = testnet
        ? 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O'
        : 'https://api.developer.coinbase.com/rpc/v1/base/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O';
    }
  }

  // Determine testnet status from chainId for telemetry
  const isTestnet = chainId === CHAIN_IDS.baseSepolia || chainId === CHAIN_IDS.sepolia;

  // Log status check started
  if (telemetry) {
    logPaymentStatusCheckStarted({ testnet: isTestnet, correlationId });
  }

  try {
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
        params: [transactionHash],
      }),
    }).then((res) => res.json());

    // Handle RPC errors
    if (receipt.error) {
      console.error('[getPaymentStatus] RPC error:', receipt.error);
      const errorMessage = receipt.error.message || 'Network error';
      if (telemetry) {
        logPaymentStatusCheckError({ testnet: isTestnet, correlationId, errorMessage });
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
          params: [transactionHash],
        }),
      }).then((res) => res.json());

      if (userOpResponse.result) {
        // UserOp exists but no receipt yet - it's pending
        if (telemetry) {
          logPaymentStatusCheckCompleted({ testnet: isTestnet, status: 'pending', correlationId });
        }
        const result = {
          status: 'pending' as const,
          id: transactionHash as Hex,
          message: 'Your payment is being processed. This usually takes a few seconds.',
          sender: userOpResponse.result.sender,
        };
        return result;
      }

      // Not found at all
      if (telemetry) {
        logPaymentStatusCheckCompleted({ testnet: isTestnet, status: 'not_found', correlationId });
      }
      const result = {
        status: 'not_found' as const,
        id: transactionHash as Hex,
        message: 'Payment not found. Please check your transaction ID.',
      };
      return result;
    }

    // Parse the receipt
    const { success, receipt: txReceipt, reason } = receipt.result;

    // Determine status based on success flag
    if (success) {
      // Parse token transfer details from logs
      let amount: string | undefined;
      let tokenAmount: string | undefined;
      let tokenAddress: string | undefined;
      let tokenSymbol: string | undefined;
      let recipient: string | undefined;

      if (txReceipt?.logs) {
        const senderAddress: Address | undefined = receipt.result.sender
          ? getAddress(receipt.result.sender)
          : undefined;

        const tokenTransfers: Array<{
          from: Address;
          to: Address;
          value: bigint;
          contract: Address;
        }> = [];

        for (const log of txReceipt.logs) {
          if (!log.address) {
            continue;
          }

          try {
            const decoded = decodeEventLog({
              abi: ERC20_TRANSFER_ABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === 'Transfer' && decoded.args) {
              const args = decoded.args as { from: string; to: string; value: bigint };
              if (args.value && args.to && args.from) {
                tokenTransfers.push({
                  from: getAddress(args.from),
                  to: getAddress(args.to),
                  value: args.value,
                  contract: getAddress(log.address as Address),
                });
              }
            }
          } catch (_e) {
            // Ignore non ERC-20 logs
          }
        }

        if (tokenTransfers.length > 0 && senderAddress) {
          const senderTransfers = tokenTransfers.filter((t) => {
            try {
              return isAddressEqual(t.from, senderAddress);
            } catch {
              return false;
            }
          });

          if (senderTransfers.length === 0) {
            throw new Error(
              `Unable to find token transfer from sender wallet ${receipt.result.sender}. ` +
                `Found ${tokenTransfers.length} transfer(s) but none originated from the sender wallet.`
            );
          }

          if (senderTransfers.length > 1) {
            const transferDetails = senderTransfers
              .map((t) => `${t.value.toString()} wei to ${t.to}`)
              .join(', ');
            throw new Error(
              `Found multiple token transfers from sender wallet ${receipt.result.sender}: ${transferDetails}. Expected exactly one transfer.`
            );
          }

          const transfer = senderTransfers[0];
          const stablecoinMetadata = getStablecoinMetadataByAddress(transfer.contract);

          tokenAmount = transfer.value.toString();
          tokenAddress = transfer.contract as Address;
          tokenSymbol = stablecoinMetadata?.symbol;
          recipient = transfer.to;

          if (stablecoinMetadata) {
            amount = formatUnits(transfer.value, stablecoinMetadata.decimals);
          }
        }
      }

      if (telemetry) {
        logPaymentStatusCheckCompleted({ testnet: isTestnet, status: 'completed', correlationId });
      }
      const result = {
        status: 'completed' as const,
        id: transactionHash as Hex,
        message: 'Payment completed successfully',
        sender: receipt.result.sender,
        amount,
        tokenAmount,
        tokenAddress,
        tokenSymbol,
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
      logPaymentStatusCheckCompleted({ testnet: isTestnet, status: 'failed', correlationId });
    }
    const result = {
      status: 'failed' as const,
      id: transactionHash as Hex,
      message: 'Payment failed',
      sender: receipt.result.sender,
      reason: userFriendlyReason,
    };
    return result;
  } catch (error) {
    console.error('[getPaymentStatus] Error checking status:', error);

    const errorMessage = error instanceof Error ? error.message : 'Connection error';
    if (telemetry) {
      logPaymentStatusCheckError({ testnet: isTestnet, correlationId, errorMessage });
    }

    // Re-throw the error
    throw error;
  }
}
