import type { Hex } from 'viem';
import { createBaseAccountSDK } from '../../../index.js';
import { CHAIN_IDS } from '../constants.js';

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
      telemetry: false,
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
  requestParams: any
): Promise<Hex> {
  const provider = sdk.getProvider();

  const result = await provider.request({
    method: 'wallet_sendCalls',
    params: [requestParams],
  });

  let transactionHash: Hex;

  if (Array.isArray(result) && result.length > 0) {
    transactionHash = result[0] as Hex;
  } else if (typeof result === 'string') {
    transactionHash = result as Hex;
  } else {
    throw new Error('Unexpected response format from wallet_sendCalls');
  }

  if (transactionHash.length > 66) {
    transactionHash = transactionHash.slice(0, 66) as Hex;
  }

  return transactionHash;
}

/**
 * Manages the complete payment flow with SDK lifecycle
 * @param requestParams - The wallet_sendCalls request parameters
 * @param testnet - Whether to use testnet
 * @returns The transaction hash
 */
export async function executePaymentWithSDK(requestParams: any, testnet: boolean): Promise<Hex> {
  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];

  const sdk = createEphemeralSDK(chainId);

  try {
    const transactionHash = await executePayment(sdk, requestParams);
    return transactionHash;
  } finally {
    // TODO: SDK cleanup
  }
}
