import type { Address } from 'viem';
import type { PaymentOptions, PaymentResult } from './types.js';
import { executePaymentWithSDK } from './utils/sdkManager.js';
import { translatePaymentToSendCalls } from './utils/translatePayment.js';
import { validateAddress, validateStringAmount } from './utils/validation.js';

/**
 * Pay a specified address with USDC on Base network using an ephemeral wallet
 * 
 * @param options - Payment options
 * @param options.amount - Amount of USDC to send as a string (e.g., "10.50")
 * @param options.recipient - Ethereum address of the recipient
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @returns Promise<PaymentResult> - Result of the payment transaction
 * 
 * @example
 * ```typescript
 * const payment = await pay({
 *   amount: "10.50",
 *   recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
 *   testnet: true
 * });
 * 
 * if (payment.success) {
 *   console.log(`Payment sent! Transaction ID: ${payment.id}`);
 * } else {
 *   console.error(`Payment failed: ${payment.error}`);
 * }
 * ```
 */
export async function pay(options: PaymentOptions): Promise<PaymentResult> {
  const { amount, recipient, testnet = false } = options;
  
  try {
    validateStringAmount(amount, 2);
    validateAddress(recipient);
    
    // Step 2: Translate payment to sendCalls format
    const requestParams = translatePaymentToSendCalls(
      recipient,
      amount,
      testnet
    );
    
    // Step 3: Execute payment with SDK
    const transactionHash = await executePaymentWithSDK(requestParams, testnet);
    
    // Return success result
    return {
      success: true,
      id: transactionHash,
      amount: amount,
      recipient: recipient as Address,
    };
  } catch (error) {
    // Extract error message
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Check for various error message properties
      if ('message' in error) {
        errorMessage = String(error.message);
      } else if ('error' in error && error.error && typeof error.error === 'object' && 'message' in error.error) {
        errorMessage = String(error.error.message);
      } else if ('reason' in error) {
        errorMessage = String(error.reason);
      }
    }
    
    // Return error result
    return {
      success: false,
      error: errorMessage,
      amount: amount,
      recipient: recipient as Address,
    };
  }
}