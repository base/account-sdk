import type { Hex } from 'viem';
import { decodeEventLog, formatUnits } from 'viem';

import { logPaymentStatusCheckCompleted, logPaymentStatusCheckError, logPaymentStatusCheckStarted } from ':core/telemetry/events/payment.js';
import { ERC20_TRANSFER_ABI, TOKENS } from './constants.js';
import type { PaymentStatus, PaymentStatusOptions } from './types.js';

/**
 * Check the status of a payment transaction using its transaction ID (userOp hash)
 * 
 * @param options - Payment status check options
 * @returns Promise<PaymentStatus> - Status information about the payment
 * 
 * @example
 * const status = await getPaymentStatus({
 *   id: "0x1234...5678",
 *   testnet: true
 * })
 * 
 * @note The id is the userOp hash returned from the pay function
 */
export async function getPaymentStatus(options: PaymentStatusOptions): Promise<PaymentStatus> {
  const { id, testnet = false } = options;
  
  // Generate correlation ID for this status check
  const correlationId = crypto.randomUUID();
  
  // Log status check started
  logPaymentStatusCheckStarted({ testnet, correlationId });

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
    }).then(res => res.json());

    // Handle RPC errors
    if (receipt.error) {
      console.error('[getPaymentStatus] RPC error:', receipt.error);
      const errorMessage = receipt.error.message || 'Network error';
      logPaymentStatusCheckError({ testnet, correlationId, errorMessage });
      return {
        status: 'failed',
        id: id as Hex,
        message: 'Unable to check payment status. Please try again later.',
        error: errorMessage,
      };
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
      }).then(res => res.json());

      if (userOpResponse.result) {
        // UserOp exists but no receipt yet - it's pending
        logPaymentStatusCheckCompleted({ testnet, status: 'pending', correlationId });
        const result = {
          status: 'pending' as const,
          id: id as Hex,
          message: 'Your payment is being processed. This usually takes a few seconds.',
          sender: userOpResponse.result.sender,
        };
        return result;
      }

      // Not found at all
      logPaymentStatusCheckCompleted({ testnet, status: 'not_found', correlationId });
      const result = {
        status: 'not_found' as const,
        id: id as Hex,
        message: 'Payment not found. Please check your transaction ID.',
      };
      return result;
    }

    // Parse the receipt
    const { 
      success, 
      receipt: txReceipt,
      reason,
    } = receipt.result;

    // Determine status based on success flag
    if (success) {
      // Parse USDC amount from logs
      let amount: string | undefined;
      let recipient: string | undefined;
      
      if (txReceipt?.logs) {
        const network = testnet ? 'baseSepolia' : 'base';
        const usdcAddress = TOKENS.USDC.addresses[network].toLowerCase();
        
        for (const log of txReceipt.logs) {
          if (log.address?.toLowerCase() === usdcAddress) {
            try {
              const decoded = decodeEventLog({
                abi: ERC20_TRANSFER_ABI,
                data: log.data,
                topics: log.topics,
              });
              
              if (decoded.eventName === 'Transfer' && decoded.args) {
                // The Transfer event has indexed 'from' and 'to', and non-indexed 'value'
                // viem's decodeEventLog returns indexed args in the args object
                const args = decoded.args as { from: string; to: string; value: bigint };
                
                if (args.value && args.to) {
                  amount = formatUnits(args.value, 6);
                  recipient = args.to;
                  break;
                }
              }
            } catch (e) {
              console.error('[getPaymentStatus] Error parsing log:', e);
            }
          }
        }
      }
      
      logPaymentStatusCheckCompleted({ testnet, status: 'completed', correlationId });
      const result = {
        status: 'completed' as const,
        id: id as Hex,
        message: 'Payment completed successfully',
        sender: receipt.result.sender,
        amount,
        recipient,
      };
      return result;
    } else {
      // Parse a user-friendly reason for failure
      let userFriendlyError = 'Payment could not be completed';
      
      if (reason) {
        if (reason.toLowerCase().includes('insufficient')) {
          userFriendlyError = 'Insufficient USDC balance';
        } else if (reason.toLowerCase().includes('revert')) {
          userFriendlyError = 'Payment was rejected';
        } else {
          userFriendlyError = reason;
        }
      }
      
      logPaymentStatusCheckCompleted({ testnet, status: 'failed', correlationId });
      const result = {
        status: 'failed' as const,
        id: id as Hex,
        message: 'Payment failed',
        sender: receipt.result.sender,
        error: userFriendlyError,
      };
      return result;
    }
  } catch (error) {
    console.error('[getPaymentStatus] Error checking status:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Connection error';
    logPaymentStatusCheckError({ testnet, correlationId, errorMessage });
    
    const result = {
      status: 'failed' as const,
      id: id as Hex,
      message: 'Unable to check payment status',
      error: errorMessage,
    };
    return result;
  }
} 