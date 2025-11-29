import {
  logPayWithTokenCompleted,
  logPayWithTokenError,
  logPayWithTokenStarted,
} from ':core/telemetry/events/payment.js';
import { CHAIN_IDS } from './constants.js';
import type { PayWithTokenOptions, PayWithTokenResult } from './types.js';
import { executePaymentWithSDK } from './utils/sdkManager.js';
import { resolveTokenAddress } from './utils/tokenRegistry.js';
import { buildTokenPaymentRequest } from './utils/translateTokenPayment.js';
import { normalizeAddress, validateBaseUnitAmount } from './utils/validation.js';

/**
 * Pay a specified address with any ERC20 token using an ephemeral smart wallet.
 *
 * @param options - Payment options
 * @returns Promise<PayWithTokenResult>
 */
export async function payWithToken(options: PayWithTokenOptions): Promise<PayWithTokenResult> {
  const {
    amount,
    to,
    token,
    testnet = false,
    paymaster,
    payerInfo,
    walletUrl,
    telemetry = true,
  } = options;

  const correlationId = crypto.randomUUID();
  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];
  const normalizedRecipient = normalizeAddress(to);
  const amountInWei = validateBaseUnitAmount(amount);
  const resolvedToken = resolveTokenAddress(token, chainId);
  const tokenLabel = resolvedToken.symbol ?? resolvedToken.address;

  if (telemetry) {
    logPayWithTokenStarted({
      token: tokenLabel,
      chainId,
      correlationId,
    });
  }

  try {
    const requestParams = buildTokenPaymentRequest({
      recipient: normalizedRecipient,
      amount: amountInWei,
      chainId,
      token: resolvedToken,
      payerInfo,
      paymaster,
    });

    const executionResult = await executePaymentWithSDK(
      requestParams,
      testnet,
      walletUrl,
      telemetry
    );

    if (telemetry) {
      logPayWithTokenCompleted({
        token: tokenLabel,
        chainId,
        correlationId,
      });
    }

    return {
      success: true,
      id: executionResult.transactionHash,
      token: tokenLabel,
      tokenAddress: resolvedToken.address,
      tokenAmount: amountInWei.toString(),
      to: normalizedRecipient,
      payerInfoResponses: executionResult.payerInfoResponses,
    };
  } catch (error) {
    if (telemetry) {
      logPayWithTokenError({
        token: tokenLabel,
        chainId,
        correlationId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
    throw error;
  }
}
