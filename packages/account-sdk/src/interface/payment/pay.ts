import {
  logPaymentCompleted,
  logPaymentError,
  logPaymentStarted,
} from ':core/telemetry/events/payment.js';
import { getPaymentStatus } from './getPaymentStatus.js';
import type { PaymentOptions, PaymentResult } from './types.js';
import { executePaymentWithSDK } from './utils/sdkManager.js';
import { translatePaymentToSendCalls } from './utils/translatePayment.js';
import { normalizeAddress, validateStringAmount } from './utils/validation.js';

/**
 * Pay a specified address with USDC on Base network using an ephemeral wallet
 *
 * @param options - Payment options
 * @param options.amount - Amount of USDC to send as a string (e.g., "10.50")
 * @param options.to - Ethereum address to send payment to
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @param options.payerInfo - Optional payer information configuration for data callbacks
 * @returns Promise<PaymentResult> - Result of the payment transaction
 * @throws Error if the payment fails
 *
 * @example
 * ```typescript
 * try {
 *   const payment = await pay({
 *     amount: "10.50",
 *     to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
 *     testnet: true
 *   });
 *
 *   console.log(`Payment sent! Transaction ID: ${payment.id}`);
 * } catch (error) {
 *   console.error(`Payment failed: ${error.message}`);
 * }
 * ```
 */
export async function pay(options: PaymentOptions): Promise<PaymentResult> {
  const { amount, to, testnet = false, payerInfo, walletUrl, telemetry = true } = options;

  // Generate correlation ID for this payment request
  const correlationId = crypto.randomUUID();

  // Log payment started
  if (telemetry) {
    logPaymentStarted({ amount, testnet, correlationId });
  }

  try {
    validateStringAmount(amount, 6);
    const normalizedAddress = normalizeAddress(to);

    // Step 2: Translate payment to sendCalls format
    const requestParams = translatePaymentToSendCalls(
      normalizedAddress,
      amount,
      testnet,
      payerInfo
    );

    // Step 3: Execute payment with SDK
    const executionResult = await executePaymentWithSDK(
      requestParams,
      testnet,
      walletUrl,
      telemetry
    );

    // Step 4: Poll for status updates for up to 2 seconds
    const transactionHash = executionResult.transactionHash;
    const pollStartTime = Date.now();
    const pollTimeout = 2000; // 2 seconds
    const pollInterval = 300; // Poll every 300ms

    let finalAmount = amount;
    let finalRecipient = normalizedAddress;

    while (Date.now() - pollStartTime < pollTimeout) {
      try {
        const status = await getPaymentStatus({
          id: transactionHash,
          testnet,
          telemetry: false, // Don't emit telemetry for internal polling
        });

        // Update with latest information if available
        if (status.amount) {
          finalAmount = status.amount;
        }
        if (status.recipient) {
          finalRecipient = status.recipient as `0x${string}`;
        }

        // Exit early if we get a definitive status
        if (status.status === 'completed' || status.status === 'failed') {
          break;
        }
      } catch (_error) {
        // Ignore polling errors and continue
        // The initial transaction was successful, so we'll return that
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Log payment completed
    if (telemetry) {
      logPaymentCompleted({ amount, testnet, correlationId });
    }

    // Return success result with latest information
    return {
      success: true,
      id: transactionHash,
      amount: finalAmount,
      to: finalRecipient,
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
    if (telemetry) {
      logPaymentError({ amount, testnet, correlationId, errorMessage });
    }

    // Re-throw the original error
    throw error;
  }
}
