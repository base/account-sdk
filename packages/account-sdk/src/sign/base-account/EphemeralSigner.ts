import { standardErrors } from ':core/error/errors.js';
import { RPCResponse } from ':core/message/RPCResponse.js';
import { RequestArguments } from ':core/provider/interface.js';
import { Signer } from './Signer.js';
import { withSignerRequestMeasurement } from './withSignerMeasurement.js';

/**
 * EphemeralSigner extends Signer for single-use payment flows.
 *
 * Key differences from Signer:
 * 1. isEphemeral: true for telemetry
 * 2. Only supports wallet_sendCalls and wallet_sign methods
 * 3. No-op handleResponse (no state updates)
 * 4. More aggressive cleanup (clears all store state)
 */
export class EphemeralSigner extends Signer {
  // Ephemeral signer uses isEphemeral: true for telemetry
  protected override get isEphemeral(): boolean {
    return true;
  }

  // Override request with limited method support
  override request = withSignerRequestMeasurement(
    () => ({ isEphemeral: this.isEphemeral }),
    async <T>(request: RequestArguments): Promise<T> => {
      switch (request.method) {
        case 'wallet_sendCalls':
        case 'wallet_sign':
          return this.sendRequestToPopup(request) as Promise<T>;
        default:
          throw standardErrors.provider.unauthorized(
            `Method '${request.method}' is not supported by ephemeral signer`
          );
      }
    }
  );

  // No-op handleResponse - ephemeral signer doesn't update state
  protected override async handleResponse(_request: RequestArguments, decrypted: RPCResponse) {
    const result = decrypted.result;
    if ('error' in result) throw result.error;
    return result.value;
  }

  // More aggressive cleanup - clears all store state
  override async cleanup() {
    await this.keyManager.clear();
    this.storeHelpers.account.clear();
    this.storeHelpers.subAccounts.clear();
    this.storeHelpers.spendPermissions.clear();
    this.storeHelpers.chains.clear();
    this.storeHelpers.subAccountsConfig.clear();
  }
}
