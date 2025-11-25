import { Communicator } from ':core/communicator/Communicator.js';
import { standardErrors } from ':core/error/errors.js';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message/RPCMessage.js';
import { RPCResponse } from ':core/message/RPCResponse.js';
import { AppMetadata, ProviderEventCallback, RequestArguments } from ':core/provider/interface.js';
import {
  logHandshakeCompleted,
  logHandshakeError,
  logHandshakeStarted,
  logRequestCompleted,
  logRequestError,
  logRequestStarted,
} from ':core/telemetry/events/scw-signer.js';
import { parseErrorMessageFromAny } from ':core/telemetry/utils.js';
import { SDKChain, createClients } from ':store/chain-clients/utils.js';
import { correlationIds } from ':store/correlation-ids/store.js';
import { store } from ':store/store.js';
import {
  decryptContent,
  encryptContent,
  exportKeyToHexString,
  importKeyFromHexString,
} from ':util/cipher.js';
import { SCWKeyManager } from './SCWKeyManager.js';

type ConstructorOptions = {
  metadata: AppMetadata;
  communicator: Communicator;
  callback: ProviderEventCallback | null;
};

/**
 * EphemeralSigner is designed for single-use payment flows.
 *
 * Key differences from Signer:
 * 1. Maintains isolated instance state instead of relying on global store
 * 2. Cleanup only clears instance-specific state (key manager)
 * 3. Does NOT clear global store state (chains, accounts, etc.)
 * 4. Optimized for one-shot operations like wallet_sendCalls and wallet_sign
 *
 * This prevents:
 * - Race conditions when multiple ephemeral flows run concurrently
 * - Pollution of global store state by ephemeral operations
 * - Accidental clearing of shared chain client configurations
 */
export class EphemeralSigner {
  private readonly communicator: Communicator;
  private readonly keyManager: SCWKeyManager;

  // Instance-local state (isolated from global store)
  private readonly chainId: number;

  constructor(params: ConstructorOptions) {
    this.communicator = params.communicator;
    this.keyManager = new SCWKeyManager();
    // Note: We intentionally don't use the callback for ephemeral operations
    // as we don't need to emit events for one-shot payment flows

    // Use the first chain from metadata as default
    this.chainId = params.metadata.appChainIds?.[0] ?? 1;

    // Ensure chain clients exist for this chain
    // This uses the shared ChainClients store which is fine to share
    const chains = store.getState().chains;
    if (chains && chains.length > 0) {
      createClients(chains);
    }
  }

  async handshake(args: RequestArguments) {
    const correlationId = correlationIds.get(args);
    logHandshakeStarted({ method: args.method, correlationId });

    try {
      // Open the popup before constructing the request message.
      await this.communicator.waitForPopupLoaded?.();

      const handshakeMessage = await this.createRequestMessage(
        {
          handshake: {
            method: args.method,
            params: args.params ?? [],
          },
        },
        correlationId
      );
      const response: RPCResponseMessage =
        await this.communicator.postRequestAndWaitForResponse(handshakeMessage);

      // store peer's public key
      if ('failure' in response.content) {
        throw response.content.failure;
      }

      const peerPublicKey = await importKeyFromHexString('public', response.sender);
      await this.keyManager.setPeerPublicKey(peerPublicKey);

      await this.decryptResponseMessage(response);

      logHandshakeCompleted({ method: args.method, correlationId });
    } catch (error) {
      logHandshakeError({
        method: args.method,
        correlationId,
        errorMessage: parseErrorMessageFromAny(error),
      });
      throw error;
    }
  }

  async request(request: RequestArguments) {
    const correlationId = correlationIds.get(request);
    logRequestStarted({ method: request.method, correlationId });

    try {
      const result = await this._request(request);
      logRequestCompleted({ method: request.method, correlationId });
      return result;
    } catch (error) {
      logRequestError({
        method: request.method,
        correlationId,
        errorMessage: parseErrorMessageFromAny(error),
      });
      throw error;
    }
  }

  private async _request(request: RequestArguments) {
    // Ephemeral signer only supports sending requests to popup
    // for wallet_sendCalls and wallet_sign methods
    switch (request.method) {
      case 'wallet_sendCalls':
      case 'wallet_sign': {
        return this.sendRequestToPopup(request);
      }
      default:
        throw standardErrors.provider.unauthorized(
          `Method '${request.method}' is not supported by ephemeral signer`
        );
    }
  }

  private async sendRequestToPopup(request: RequestArguments) {
    // Open the popup before constructing the request message.
    await this.communicator.waitForPopupLoaded?.();

    const response = await this.sendEncryptedRequest(request);
    const decrypted = await this.decryptResponseMessage(response);

    return this.handleResponse(decrypted);
  }

  private handleResponse(decrypted: RPCResponse) {
    const result = decrypted.result;

    if ('error' in result) throw result.error;

    // For ephemeral signer, we don't update global store with response data
    // We simply return the result value
    return result.value;
  }

  /**
   * Cleanup only clears instance-specific state.
   * Does NOT clear global store state to prevent affecting other SDK instances.
   */
  async cleanup() {
    // Only clear the key manager (instance-specific cryptographic state)
    await this.keyManager.clear();

    // NOTE: We intentionally do NOT clear:
    // - store.account
    // - store.subAccounts
    // - store.spendPermissions
    // - store.chains
    // These are shared global state that other SDK instances may depend on.
  }

  private async sendEncryptedRequest(request: RequestArguments): Promise<RPCResponseMessage> {
    const sharedSecret = await this.keyManager.getSharedSecret();
    if (!sharedSecret) {
      throw standardErrors.provider.unauthorized('No shared secret found when encrypting request');
    }

    const encrypted = await encryptContent(
      {
        action: request,
        chainId: this.chainId,
      },
      sharedSecret
    );
    const correlationId = correlationIds.get(request);
    const message = await this.createRequestMessage({ encrypted }, correlationId);

    return this.communicator.postRequestAndWaitForResponse(message);
  }

  private async createRequestMessage(
    content: RPCRequestMessage['content'],
    correlationId: string | undefined
  ): Promise<RPCRequestMessage> {
    const publicKey = await exportKeyToHexString('public', await this.keyManager.getOwnPublicKey());

    return {
      id: crypto.randomUUID(),
      correlationId,
      sender: publicKey,
      content,
      timestamp: new Date(),
    };
  }

  private async decryptResponseMessage(message: RPCResponseMessage): Promise<RPCResponse> {
    const content = message.content;

    // throw protocol level error
    if ('failure' in content) {
      throw content.failure;
    }

    const sharedSecret = await this.keyManager.getSharedSecret();
    if (!sharedSecret) {
      throw standardErrors.provider.unauthorized(
        'Invalid session: no shared secret found when decrypting response'
      );
    }

    const response: RPCResponse = await decryptContent(content.encrypted, sharedSecret);

    // Process chain data from response if available
    // We still update the shared ChainClients store since chain clients are meant to be shared
    const availableChains = response.data?.chains;
    if (availableChains) {
      const nativeCurrencies = response.data?.nativeCurrencies;
      const chains: SDKChain[] = Object.entries(availableChains).map(([id, rpcUrl]) => {
        const nativeCurrency = nativeCurrencies?.[Number(id)];
        return {
          id: Number(id),
          rpcUrl,
          ...(nativeCurrency ? { nativeCurrency } : {}),
        };
      });

      // Update shared chain clients (this is intentionally shared)
      createClients(chains);
    }

    return response;
  }
}
