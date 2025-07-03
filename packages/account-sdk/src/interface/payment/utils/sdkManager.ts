import type { Hex } from 'viem';
import { createBaseAccountSDK } from '../../../index.js';
import { CHAIN_IDS } from '../constants.js';

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
 * Type for wallet_sendCalls response
 */
type WalletSendCallsResponse = {
  id: string;
  capabilities?: Record<string, any>;
};

/**
 * Creates an ephemeral SDK instance configured for payments
 * @param chainId - The chain ID to use
 * @returns The configured SDK instance
 */
export function createEphemeralSDK(chainId: number) {
  const sdk = createBaseAccountSDK({
    appName: 'Payment',
    appChainIds: [chainId],
    preference: {
      telemetry: true,
    },
  });

  return sdk;
}

/**
 * Executes a payment using the SDK
 * @param sdk - The SDK instance
 * @param requestParams - The wallet_sendCalls request parameters
 * @returns The transaction hash
 */
export async function executePayment(
  sdk: ReturnType<typeof createBaseAccountSDK>,
  requestParams: WalletSendCallsRequestParams
): Promise<Hex> {
  const provider = sdk.getProvider();

  const result = await provider.request({
    method: 'wallet_sendCalls',
    params: [requestParams],
  });

  let transactionHash: Hex;

  if (result && typeof result === 'object' && 'id' in result) {
    transactionHash = (result as WalletSendCallsResponse).id as Hex;
  } else {
    throw new Error('Unexpected response format from wallet_sendCalls');
  }

  return transactionHash;
}

/**
 * Manages the complete payment flow with SDK lifecycle
 * @param requestParams - The wallet_sendCalls request parameters
 * @param testnet - Whether to use testnet
 * @returns The transaction hash
 */
export async function executePaymentWithSDK(requestParams: WalletSendCallsRequestParams, testnet: boolean): Promise<Hex> {
  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];

  const sdk = createEphemeralSDK(chainId);
  const provider = sdk.getProvider();

  try {
    const transactionHash = await executePayment(sdk, requestParams);
    return transactionHash;
  } finally {
    // Clean up provider state for subsequent payments
    await provider.disconnect();
  }
}
