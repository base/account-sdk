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
import { hexStringFromNumber } from ':core/type/util.js';
import { Signer } from ':sign/base-account/Signer.js';
import { initSubAccountConfig } from ':sign/base-account/utils.js';
import { correlationIds } from ':store/correlation-ids/store.js';
import { store } from ':store/store.js';
import { checkErrorForInvalidRequestArgs, fetchRPCRequest } from ':util/provider.js';

export class BaseAccountProvider extends ProviderEventEmitter implements ProviderInterface {
  private readonly communicator: Communicator;
  private readonly signer: Signer;

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
    this.signer = new Signer({
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
        errorMessage: error instanceof Error ? error.message : '',
      });
      throw error;
    } finally {
      correlationIds.delete(args);
    }
  }

  private async _request<T>(args: RequestArguments): Promise<T> {
    try {
      checkErrorForInvalidRequestArgs(args);
      if (!this.signer.isConnected) {
        switch (args.method) {
          case 'eth_requestAccounts': {
            await this.signer.handshake({ method: 'handshake' });
            // We are translating eth_requestAccounts to wallet_connect always
            await initSubAccountConfig();
            await this.signer.request({
              method: 'wallet_connect',
              params: [
                {
                  version: '1',
                  capabilities: {
                    ...(store.subAccountsConfig.get()?.capabilities ?? {}),
                  },
                },
              ],
            });

            // wallet_connect will retrieve and save the account info in the store
            // continue to requesting it again at L130 for emitting the connect event +
            // returning the accounts
            break;
          }
          case 'wallet_connect': {
            await this.signer.handshake({ method: 'handshake' }); // exchange session keys
            const result = await this.signer.request(args); // send diffie-hellman encrypted request
            return result as T;
          }
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
              "Must call 'eth_requestAccounts' before other methods"
            );
          }
        }
      }
      const result = await this.signer.request(args);
      return result as T;
    } catch (error) {
      const { code } = error as { code?: number };
      if (code === standardErrorCodes.provider.unauthorized) {
        await this.disconnect();
      }
      return Promise.reject(serializeError(error));
    }
  }

  async disconnect() {
    await this.signer.cleanup();
    correlationIds.clear();
    this.emit('disconnect', standardErrors.provider.disconnected('User initiated disconnection'));
  }

  readonly isBaseAccount = true;
}
