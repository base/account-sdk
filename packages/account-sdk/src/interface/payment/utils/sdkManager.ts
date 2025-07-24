import type { Hex } from 'viem';
import { createBaseAccountSDK } from '../../builder/core/createBaseAccountSDK.js';
import { CHAIN_IDS } from '../constants.js';
import type { PayerInfoResponses } from '../types.js';

/**
 * Type for wallet_sendCalls request parameters
 */
type WalletSendCallsRequestParams = {
  version: string;
  chainId: number;
  calls: Array<{
    to: Hex;
    data: Hex;
    value: Hex;
  }>;
  capabilities: Record<string, unknown>;
};

/**
 * Type for wallet_sendCalls response when it returns an object
 */
type WalletSendCallsObjectResponse = {
  id: string; // sendCalls 2.0.0+ field
  capabilities?: {
    dataCallback?: PayerInfoResponses;
    [key: string]: unknown;
  };
};

/**
 * Type for payment execution result
 */
export interface PaymentExecutionResult {
  transactionHash: Hex;
  payerInfoResponses?: PayerInfoResponses;
}

/**
 * Creates an ephemeral SDK instance configured for payments
 * @param chainId - The chain ID to use
 * @param walletUrl - Optional wallet URL to use
 * @param telemetry - Whether to enable telemetry (defaults to true)
 * @returns The configured SDK instance
 */
export function createEphemeralSDK(chainId: number, walletUrl?: string, telemetry: boolean = true) {
  const appName = typeof window !== 'undefined' ? window.location.origin : 'Base Pay SDK';

  const sdk = createBaseAccountSDK({
    appName: appName,
    appChainIds: [chainId],
    preference: {
      telemetry: telemetry,
      walletUrl,
    },
  });

  return sdk;
}

/**
 * Executes a payment using the SDK
 * @param sdk - The SDK instance
 * @param requestParams - The wallet_sendCalls request parameters
 * @returns The payment execution result with transaction hash and optional info responses
 */
export async function executePayment(
  sdk: ReturnType<typeof createBaseAccountSDK>,
  requestParams: WalletSendCallsRequestParams
): Promise<PaymentExecutionResult> {
  const provider = sdk.getProvider();

  const result = await provider.request({
    method: 'wallet_sendCalls',
    params: [requestParams],
  });

  let transactionHash: Hex;
  let payerInfoResponses: PayerInfoResponses | undefined;

  // Handle different response formats
  if (typeof result === 'string' && result.length >= 66) {
    // Standard response format - just a transaction hash
    transactionHash = result.slice(0, 66) as Hex;
  } else if (typeof result === 'object' && result !== null) {
    // Object response format - contains id and capabilities with dataCallback (sendCalls 2.0.0+)
    const resultObj = result as WalletSendCallsObjectResponse;

    // Extract transaction hash from id field
    if (typeof resultObj.id === 'string' && resultObj.id.length >= 66) {
      transactionHash = resultObj.id.slice(0, 66) as Hex;

      // Extract info responses from capabilities.dataCallback
      if (resultObj.capabilities?.dataCallback) {
        payerInfoResponses = resultObj.capabilities.dataCallback;
      }
    } else {
      throw new Error(
        `Could not extract transaction hash from object response. Available fields: ${Object.keys(resultObj).join(', ')}`
      );
    }
  } else {
    throw new Error(
      `Unexpected response format from wallet_sendCalls: expected string with length > 66 or object with id, got ${typeof result}`
    );
  }

  return { transactionHash, payerInfoResponses };
}

/**
 * Manages the complete payment flow with SDK lifecycle
 * @param requestParams - The wallet_sendCalls request parameters
 * @param testnet - Whether to use testnet
 * @param walletUrl - Optional wallet URL to use
 * @param telemetry - Whether to enable telemetry (defaults to true)
 * @returns The payment execution result
 */
export async function executePaymentWithSDK(
  requestParams: WalletSendCallsRequestParams,
  testnet: boolean,
  walletUrl?: string,
  telemetry: boolean = true
): Promise<PaymentExecutionResult> {
  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];

  const sdk = createEphemeralSDK(chainId, walletUrl, telemetry);
  const provider = sdk.getProvider();

  try {
    const result = await executePayment(sdk, requestParams);
    return result;
  } finally {
    // Clean up provider state for subsequent payments
    await provider.disconnect();
  }
}
