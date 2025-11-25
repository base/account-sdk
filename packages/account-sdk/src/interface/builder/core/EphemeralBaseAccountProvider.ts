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
import { fetchRPCRequest } from ':util/provider.js';

/**
 * EphemeralBaseAccountProvider is a provider designed for single-use payment flows.
 *
 * Key differences from BaseAccountProvider:
 * 1. Uses EphemeralSigner which maintains isolated state (doesn't pollute global store)
 * 2. Cleanup only clears instance-specific state, not shared global state
 * 3. Optimized for one-shot operations like pay() and subscribe()
 *
 * This prevents race conditions when multiple ephemeral payment flows
 * are executed concurrently.
 */
export class EphemeralBaseAccountProvider
  extends ProviderEventEmitter
  implements ProviderInterface
{
  private readonly communicator: Communicator;
  private readonly signer: EphemeralSigner;

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
    this.signer = new EphemeralSigner({
      metadata,
      communicator: this.communicator,
      callback: this.emit.bind(this),
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
            `Method '${args.method}' is not supported by ephemeral provider. ` +
              `Ephemeral providers only support: wallet_sendCalls, wallet_sign, wallet_getCallsStatus`
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
    // Only cleanup ephemeral signer state - don't touch global store
    await this.signer.cleanup();
    // Clear only the correlation IDs for this provider instance
    // Note: correlationIds is already scoped per-request, so this is safe
    this.emit('disconnect', standardErrors.provider.disconnected('User initiated disconnection'));
  }

  readonly isBaseAccount = true;
}
