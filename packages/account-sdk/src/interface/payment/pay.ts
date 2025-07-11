import type { Address } from 'viem';
import type { PaymentOptions, PaymentResult } from './types.js';
import { resolveENS } from './utils/ensResolution.js';
import { executePaymentWithSDK } from './utils/sdkManager.js';
import { translatePaymentToSendCalls } from './utils/translatePayment.js';
import { isENSName, validateRecipient, validateStringAmount } from './utils/validation.js';

/**
 * Pay a specified address or ENS name with USDC on Base network using an ephemeral wallet
 *
 * @param options - Payment options
 * @param options.amount - Amount of USDC to send as a string (e.g., "10.50")
 * @param options.to - Ethereum address or ENS name to send payment to
 * @param options.testnet - Whether to use Base Sepolia testnet (default: false)
 * @param options.infoRequests - Optional information requests for data callbacks
 * @returns Promise<PaymentResult> - Result of the payment transaction
 *
 * @example
 * ```typescript
 * // Pay to an Ethereum address
 * const payment = await pay({
 *   amount: "10.50",
 *   to: "0xFe21034794A5a574B94fE4fDfD16e005F1C96e51",
 *   testnet: true
 * });
 *
 * // Pay to an ENS name with info requests
 * const payment = await pay({
 *   amount: "5.00",
 *   to: "vitalik.eth",
 *   testnet: false,
 *   infoRequests: [
 *     { request: 'email' },
 *     { request: 'physicalAddress', optional: true },
 *   ]
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
  const { amount, to, testnet = false, infoRequests } = options;

  try {
    validateStringAmount(amount, 2);
    validateRecipient(to);

    // Resolve ENS name if necessary
    let resolvedRecipient: Address;
    if (isENSName(to)) {
      resolvedRecipient = await resolveENS(to);
    } else {
      resolvedRecipient = to as Address;
    }

    // Step 2: Translate payment to sendCalls format
    const requestParams = translatePaymentToSendCalls(resolvedRecipient, amount, testnet, infoRequests);

    // Step 3: Execute payment with SDK
    const executionResult = await executePaymentWithSDK(requestParams, testnet);

    // Return success result
    return {
      success: true,
      id: executionResult.transactionHash,
      amount: amount,
      to: resolvedRecipient,
      infoResponses: executionResult.infoResponses,
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

    // Return error result
    return {
      success: false,
      error: errorMessage,
      amount: amount,
      to: to as Address,
    };
  }
}
