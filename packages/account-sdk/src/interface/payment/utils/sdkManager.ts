import type { Hex } from 'viem';
import { EphemeralBaseAccountProvider } from '../../builder/core/EphemeralBaseAccountProvider.js';
import { ProviderInterface } from ':core/provider/interface.js';
import { loadTelemetryScript } from ':core/telemetry/initCCA.js';
import { checkCrossOriginOpenerPolicy } from ':util/checkCrossOriginOpenerPolicy.js';
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

//  ====================================================================
//  One-time initialization for ephemeral SDK operations
//  ====================================================================

let ephemeralInitialized = false;

function initializeEphemeralOnce(telemetryEnabled: boolean): void {
  if (ephemeralInitialized) return;
  ephemeralInitialized = true;

  // Check COOP policy once
  void checkCrossOriginOpenerPolicy();

  // Load telemetry script once if enabled
  if (telemetryEnabled) {
    void loadTelemetryScript();
  }
}

/**
 * Resets the ephemeral initialization state.
 * @internal This is only intended for testing purposes.
 */
export function _resetEphemeralInitialization(): void {
  ephemeralInitialized = false;
}

//  ====================================================================
//  Request queuing to prevent race conditions
//  ====================================================================

/**
 * Queue of pending payment operations.
 * Keyed by a combination of network and wallet URL to prevent
 * concurrent operations to the same destination from interfering.
 */
const paymentQueue = new Map<string, Promise<PaymentExecutionResult>>();

function getQueueKey(testnet: boolean, walletUrl?: string): string {
  const network = testnet ? 'testnet' : 'mainnet';
  return `payment:${network}:${walletUrl ?? 'default'}`;
}

/**
 * Waits for any pending operation with the same queue key to complete.
 * This prevents race conditions from concurrent payment calls.
 */
async function waitForPendingOperation(queueKey: string): Promise<void> {
  const pending = paymentQueue.get(queueKey);
  if (pending) {
    // Wait for the pending operation to complete, ignoring any errors
    // (we still want to proceed even if the previous one failed)
    await pending.catch(() => {});
  }
}

//  ====================================================================
//  Ephemeral SDK creation
//  ====================================================================

/**
 * Creates an ephemeral provider configured for payments.
 *
 * Uses EphemeralBaseAccountProvider which:
 * - Maintains isolated state (doesn't pollute global store)
 * - Only supports payment-related methods (wallet_sendCalls, wallet_sign)
 * - Cleans up without affecting other SDK instances
 *
 * @param chainId - The chain ID to use
 * @param walletUrl - Optional wallet URL to use
 * @param telemetry - Whether to enable telemetry (defaults to true)
 * @returns The configured ephemeral provider
 */
export function createEphemeralSDK(
  chainId: number,
  walletUrl?: string,
  telemetry: boolean = true
): { getProvider: () => ProviderInterface } {
  const appName = typeof window !== 'undefined' ? window.location.origin : 'Base Pay SDK';

  // Perform one-time initialization
  initializeEphemeralOnce(telemetry);

  // Create ephemeral provider with isolated state
  const provider = new EphemeralBaseAccountProvider({
    metadata: {
      appName,
      appLogoUrl: '',
      appChainIds: [chainId],
    },
    preference: {
      telemetry,
      walletUrl,
    },
  });

  // Return SDK-like interface for compatibility
  return {
    getProvider: () => provider,
  };
}

/**
 * Executes a payment using the provider
 * @param provider - The provider instance
 * @param requestParams - The wallet_sendCalls request parameters
 * @returns The payment execution result with transaction hash and optional info responses
 */
export async function executePaymentWithProvider(
  provider: ProviderInterface,
  requestParams: WalletSendCallsRequestParams
): Promise<PaymentExecutionResult> {
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
 * Executes a payment using the SDK (legacy compatibility wrapper)
 * @param sdk - The SDK instance
 * @param requestParams - The wallet_sendCalls request parameters
 * @returns The payment execution result with transaction hash and optional info responses
 * @deprecated Use executePaymentWithProvider instead
 */
export async function executePayment(
  sdk: { getProvider: () => ProviderInterface },
  requestParams: WalletSendCallsRequestParams
): Promise<PaymentExecutionResult> {
  return executePaymentWithProvider(sdk.getProvider(), requestParams);
}

/**
 * Manages the complete payment flow with SDK lifecycle and request queuing.
 *
 * Features:
 * - Uses ephemeral provider with isolated state
 * - Queues concurrent requests to prevent race conditions
 * - Properly cleans up resources after each payment
 *
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
  const queueKey = getQueueKey(testnet, walletUrl);

  // Wait for any pending operation to the same destination
  await waitForPendingOperation(queueKey);

  const network = testnet ? 'baseSepolia' : 'base';
  const chainId = CHAIN_IDS[network];

  const sdk = createEphemeralSDK(chainId, walletUrl, telemetry);
  const provider = sdk.getProvider();

  // Create the execution promise and add it to the queue
  const execution = (async (): Promise<PaymentExecutionResult> => {
    try {
      const result = await executePaymentWithProvider(provider, requestParams);
      return result;
    } finally {
      // Clean up provider state for subsequent payments
      await provider.disconnect();
    }
  })();

  // Track this operation in the queue
  paymentQueue.set(queueKey, execution);

  try {
    return await execution;
  } finally {
    // Remove from queue when complete
    paymentQueue.delete(queueKey);
  }
}
