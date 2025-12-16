import { Communicator } from ':core/communicator/Communicator.js';
import { CB_WALLET_RPC_URL } from ':core/constants.js';
import { standardErrorCodes } from ':core/error/constants.js';
import { standardErrors } from ':core/error/errors.js';
import { serializeError } from ':core/error/serialize.js';
import {
  ConstructorOptions,
  ProviderEventEmitter,
  ProviderInterface,
  RequestArguments,
} from ':core/provider/interface.js';
import {
  logRequestError,
  logRequestResponded,
  logRequestStarted,
} from ':core/telemetry/events/provider.js';
import { parseErrorMessageFromAny } from ':core/telemetry/utils.js';
import { hexStringFromNumber } from ':core/type/util.js';
import { EphemeralSigner } from ':sign/base-account/EphemeralSigner.js';
import { correlationIds } from ':store/correlation-ids/store.js';
import { createStoreInstance, type StoreInstance } from ':store/store.js';
import { fetchRPCRequest } from ':util/provider.js';

/**
 * EphemeralBaseAccountProvider is a provider designed for single-use payment flows.
 *
 * Key differences from BaseAccountProvider:
 * 1. Creates its own isolated store instance (no persistence, no global state pollution)
 * 2. Uses EphemeralSigner with the isolated store to prevent concurrent operation interference
 * 3. Cleanup clears the entire ephemeral store instance
 * 4. Optimized for one-shot operations like pay() and subscribe()
 *
 * This prevents:
 * - Race conditions when multiple ephemeral payment flows run concurrently
 * - KeyManager interference (each instance has its own isolated keys)
 * - Memory leaks (store instance is garbage collected after cleanup)
 */
export class EphemeralBaseAccountProvider
  extends ProviderEventEmitter
  implements ProviderInterface
{
  private readonly communicator: Communicator;
  private readonly signer: EphemeralSigner;
  private readonly ephemeralStore: StoreInstance;

  constructor({
    metadata,
    preference: { walletUrl, ...preference },
  }: Readonly<ConstructorOptions>) {
    super();
    this.communicator = new Communicator({
      url: walletUrl,
      metadata,
      preference,
    });
    // Create an isolated ephemeral store for this provider instance
    // persist: false means no localStorage persistence
    this.ephemeralStore = createStoreInstance({ persist: false });

    this.signer = new EphemeralSigner({
      metadata,
      communicator: this.communicator,
      callback: this.emit.bind(this),
      storeInstance: this.ephemeralStore,
    });
  }

  public async request<T>(args: RequestArguments): Promise<T> {
    // correlation id across the entire request lifecycle
    const correlationId = crypto.randomUUID();
    correlationIds.set(args, correlationId);
    logRequestStarted({ method: args.method, correlationId });

    try {
      const result = await this._request(args);
      logRequestResponded({
        method: args.method,
        correlationId,
      });
      return result as T;
    } catch (error) {
      logRequestError({
        method: args.method,
        correlationId,
        errorMessage: parseErrorMessageFromAny(error),
      });
      throw error;
    } finally {
      correlationIds.delete(args);
    }
  }

  private async _request<T>(args: RequestArguments): Promise<T> {
    try {
      // For ephemeral providers, we only support a subset of methods
      // that are needed for payment flows
      switch (args.method) {
        case 'wallet_sendCalls':
        case 'wallet_sign': {
          try {
            await this.signer.handshake({ method: 'handshake' }); // exchange session keys
            const result = await this.signer.request(args); // send diffie-hellman encrypted request
            return result as T;
          } finally {
            await this.signer.cleanup(); // clean up (rotate) the ephemeral session keys
          }
        }
        case 'wallet_getCallsStatus': {
          const result = await fetchRPCRequest(args, CB_WALLET_RPC_URL);
          return result as T;
        }
        case 'eth_accounts': {
          return [] as T;
        }
        case 'net_version': {
          const result = 1 as T; // default value
          return result;
        }
        case 'eth_chainId': {
          const result = hexStringFromNumber(1) as T; // default value
          return result;
        }
        default: {
          throw standardErrors.provider.unauthorized(
            `Method '${args.method}' is not supported by ephemeral provider. Ephemeral providers only support: wallet_sendCalls, wallet_sign, wallet_getCallsStatus`
          );
        }
      }
    } catch (error) {
      const { code } = error as { code?: number };
      if (code === standardErrorCodes.provider.unauthorized) {
        await this.disconnect();
      }
      return Promise.reject(serializeError(error));
    }
  }

  async disconnect() {
    // Cleanup ephemeral signer state and its isolated store
    await this.signer.cleanup();
    // Note: The ephemeral store instance will be garbage collected
    // when this provider instance is no longer referenced
    this.emit('disconnect', standardErrors.provider.disconnected('User initiated disconnection'));
  }

  readonly isBaseAccount = true;
}
