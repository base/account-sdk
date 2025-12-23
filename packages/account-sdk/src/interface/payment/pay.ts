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
 * @param options.bundlerUrl - Optional custom bundler URL to use for payment status polling. Useful for avoiding rate limits on public endpoints.
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
  const { amount, to, testnet = false, payerInfo, walletUrl, telemetry = true, bundlerUrl } = options;

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
    const pollingStartTime = Date.now();
    const pollingDurationMs = 2000;
    const pollingIntervalMs = 200; // Poll every 200ms

    let latestPayerInfoResponses = executionResult.payerInfoResponses;

    while (Date.now() - pollingStartTime < pollingDurationMs) {
      try {
        // Wait before polling
        await new Promise((resolve) => setTimeout(resolve, pollingIntervalMs));

        // Check payment status
        const status = await getPaymentStatus({
          id: executionResult.transactionHash,
          testnet,
          telemetry: false, // Disable telemetry for polling to avoid noise
          bundlerUrl,
        });

        // Exit early if payment is confirmed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          break;
        }
      } catch (pollingError) {
        // If polling fails, continue with the original response
        // This ensures we don't fail the entire payment due to status check issues
        console.warn('[pay] Error during status polling:', pollingError);
        break;
      }
    }

    // Log payment completed
    if (telemetry) {
      logPaymentCompleted({ amount, testnet, correlationId });
    }

    // Return success result
    return {
      success: true,
      id: executionResult.transactionHash,
      amount: amount,
      to: normalizedAddress,
      payerInfoResponses: latestPayerInfoResponses,
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
