import {
    logPayWithTokenCompleted,
    logPayWithTokenError,
    logPayWithTokenStarted,
} from ':core/telemetry/events/payment.js';
import { CHAIN_IDS } from './constants.js';
import type { PayWithTokenOptions, PayWithTokenResult, PaymentSDKConfig } from './types.js';
import { encodePaymentId } from './utils/erc3770.js';
import { executePaymentOnChain } from './utils/sdkManager.js';
import { resolveTokenAddress } from './utils/tokenRegistry.js';
import { buildTokenPaymentRequest } from './utils/translateTokenPayment.js';
import { normalizeAddress, normalizeChainId, validateBaseUnitAmount } from './utils/validation.js';

function mergeSdkConfig(
  sdkConfig: PaymentSDKConfig | undefined,
  walletUrl?: string
): PaymentSDKConfig | undefined {
  if (!walletUrl) {
    return sdkConfig;
  }

  return {
    ...sdkConfig,
    preference: {
      ...(sdkConfig?.preference ?? {}),
      walletUrl,
    },
  };
}

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
    chainId = CHAIN_IDS.base,
    paymaster,
    payerInfo,
    walletUrl,
    telemetry = true,
    sdkConfig,
  } = options;

  const correlationId = crypto.randomUUID();
  const normalizedChainId = normalizeChainId(chainId);
  const normalizedRecipient = normalizeAddress(to);
  const amountInWei = validateBaseUnitAmount(amount);
  const resolvedToken = resolveTokenAddress(token, normalizedChainId);
  const tokenLabel = resolvedToken.symbol ?? resolvedToken.address;

  if (telemetry) {
    logPayWithTokenStarted({
      token: tokenLabel,
      chainId: normalizedChainId,
      correlationId,
    });
  }

  const mergedSdkConfig = mergeSdkConfig(sdkConfig, walletUrl);

  try {
    const requestParams = buildTokenPaymentRequest({
      recipient: normalizedRecipient,
      amount: amountInWei,
      chainId: normalizedChainId,
      token: resolvedToken,
      payerInfo,
      paymaster,
    });

    const executionResult = await executePaymentOnChain(
      requestParams,
      normalizedChainId,
      telemetry,
      mergedSdkConfig
    );

    if (telemetry) {
      logPayWithTokenCompleted({
        token: tokenLabel,
        chainId: normalizedChainId,
        correlationId,
      });
    }

    // Encode payment ID with chain ID using ERC-3770 format
    const encodedId = encodePaymentId(normalizedChainId, executionResult.transactionHash);

    return {
      success: true,
      id: encodedId,
      token: tokenLabel,
      tokenAddress: resolvedToken.address,
      tokenAmount: amountInWei.toString(),
      chainId: normalizedChainId,
      to: normalizedRecipient,
      payerInfoResponses: executionResult.payerInfoResponses,
    };
  } catch (error) {
    if (telemetry) {
      logPayWithTokenError({
        token: tokenLabel,
        chainId: normalizedChainId,
        correlationId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
    throw error;
  }
}

