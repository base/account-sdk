import { logPaymentCompleted, logPaymentError, logPaymentStarted } from ':core/telemetry/events/payment.js';
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
 * @param options.to - Ethereum address to send payment to
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @param options.payerInfo - Optional payer information configuration for data callbacks
 * @returns Promise<PaymentResult> - Result of the payment transaction
 *
 * @example
 * ```typescript
 * const payment = await pay({
 *   amount: "10.50",
 *   to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
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
  const { amount, to, testnet = false, payerInfo } = options;
  
  // Generate correlation ID for this payment request
  const correlationId = crypto.randomUUID();
  
  // Log payment started
  logPaymentStarted({ amount, testnet, correlationId });

  try {
    validateStringAmount(amount, 2);
    validateAddress(to);

    // Step 2: Translate payment to sendCalls format
    const requestParams = translatePaymentToSendCalls(to, amount, testnet, payerInfo);

    // Step 3: Execute payment with SDK
    const executionResult = await executePaymentWithSDK(requestParams, testnet);

    // Log payment completed
    logPaymentCompleted({ amount, testnet, correlationId });

    // Return success result
    return {
      success: true,
      id: executionResult.transactionHash,
      amount: amount,
      to: to as Address,
      payerInfoResponses: executionResult.payerInfoResponses,
    };
  } catch (error) {
    // Extract error message
    let errorMessage = 'Unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Check for various error message properties using optional chaining
      const err = error as { message?: unknown; error?: { message?: unknown }; reason?: unknown };
      if (typeof err?.message === 'string') {
        errorMessage = err.message;
      } else if (typeof err?.error?.message === 'string') {
        errorMessage = err.error.message;
      } else if (typeof err?.reason === 'string') {
        errorMessage = err.reason;
      }
    }

    // Log payment error
    logPaymentError({ amount, testnet, correlationId, errorMessage });

    // Return error result
    return {
      success: false,
      error: errorMessage,
      amount: amount,
      to: to as Address,
    };
  }
}
