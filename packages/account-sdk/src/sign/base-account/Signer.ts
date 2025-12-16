import { CB_WALLET_RPC_URL } from ':core/constants.js';
import { Hex, WalletSendCallsParameters, hexToNumber, isAddressEqual, numberToHex } from 'viem';

import { Communicator } from ':core/communicator/Communicator.js';
import { isActionableHttpRequestError, isViemError, standardErrors } from ':core/error/errors.js';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message/RPCMessage.js';
import { RPCResponse } from ':core/message/RPCResponse.js';
import { AppMetadata, ProviderEventCallback, RequestArguments } from ':core/provider/interface.js';
import {
  FetchPermissionRequest,
  FetchPermissionResponse,
} from ':core/rpc/coinbase_fetchPermission.js';
import { FetchPermissionsResponse } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import { WalletConnectResponse } from ':core/rpc/wallet_connect.js';
import { GetSubAccountsResponse } from ':core/rpc/wallet_getSubAccount.js';
import {
  logAddOwnerCompleted,
  logAddOwnerError,
  logAddOwnerStarted,
  logInsufficientBalanceErrorHandlingCompleted,
  logInsufficientBalanceErrorHandlingError,
  logInsufficientBalanceErrorHandlingStarted,
  logSubAccountRequestCompleted,
  logSubAccountRequestError,
  logSubAccountRequestStarted,
} from ':core/telemetry/events/scw-sub-account.js';
import { parseErrorMessageFromAny } from ':core/telemetry/utils.js';
import { Address } from ':core/type/index.js';
import { ensureIntNumber, hexStringFromNumber } from ':core/type/util.js';
import { SDKChain, createClients, getClient } from ':store/chain-clients/utils.js';
import { correlationIds } from ':store/correlation-ids/store.js';
import { type StoreInstance, createStoreHelpers, spendPermissions, store } from ':store/store.js';
import { assertArrayPresence, assertPresence } from ':util/assertPresence.js';
import { assertSubAccount } from ':util/assertSubAccount.js';
import {
  decryptContent,
  encryptContent,
  exportKeyToHexString,
  importKeyFromHexString,
} from ':util/cipher.js';
import { fetchRPCRequest } from ':util/provider.js';
import { getCryptoKeyAccount } from '../../kms/crypto-key/index.js';
import { SCWKeyManager } from './SCWKeyManager.js';
import {
  addSenderToRequest,
  appendWithoutDuplicates,
  assertFetchPermissionsRequest,
  assertGetCapabilitiesParams,
  assertParamsChainId,
  fillMissingParamsForFetchPermissions,
  getSenderFromRequest,
  initSubAccountConfig,
  injectRequestCapabilities,
  makeDataSuffix,
  prependWithoutDuplicates,
} from './utils.js';
import { createSubAccountSigner } from './utils/createSubAccountSigner.js';
import { findOwnerIndex } from './utils/findOwnerIndex.js';
import { handleAddSubAccountOwner } from './utils/handleAddSubAccountOwner.js';
import { handleInsufficientBalanceError } from './utils/handleInsufficientBalance.js';
import { routeThroughGlobalAccount } from './utils/routeThroughGlobalAccount.js';
import { withHandshakeMeasurement, withSignerRequestMeasurement } from './withSignerMeasurement.js';

type ConstructorOptions = {
  metadata: AppMetadata;
  communicator: Communicator;
  callback: ProviderEventCallback | null;
  storeInstance?: StoreInstance;
};

export class Signer {
  protected readonly communicator: Communicator;
  protected readonly keyManager: SCWKeyManager;
  protected callback: ProviderEventCallback | null;
  protected readonly storeHelpers: ReturnType<typeof createStoreHelpers>;
  protected readonly storeInstance: StoreInstance;

  protected accounts: Address[];
  protected chain: SDKChain;

  constructor(params: ConstructorOptions) {
    this.communicator = params.communicator;
    this.callback = params.callback;
    // Use provided store instance or fall back to global store
    this.storeInstance = params.storeInstance ?? store;
    // Reuse global store helpers if using global store (important for testing/mocking)
    // Otherwise create new helpers for the custom store instance
    const isGloabalStore = this.storeInstance === store;
    this.storeHelpers = isGloabalStore ? store : createStoreHelpers(this.storeInstance);
    this.keyManager = new SCWKeyManager(this.storeInstance);

    const { account, chains } = this.storeInstance.getState();
    this.accounts = account.accounts ?? [];
    this.chain = account.chain ?? {
      id: params.metadata.appChainIds?.[0] ?? 1,
    };

    // Initialize chain clients if chains are provided
    if (chains) {
      createClients(chains);
    }
    // Note: getClient will automatically create fallback clients when needed
  }

  public get isConnected() {
    return this.accounts.length > 0;
  }

  protected get isEphemeral(): boolean {
    return false;
  }

  handshake = withHandshakeMeasurement(
    () => ({ isEphemeral: this.isEphemeral }),
    async (args: RequestArguments): Promise<void> => {
      const correlationId = correlationIds.get(args);

      // Open the popup before constructing the request message.
      // This is to ensure that the popup is not blocked by some browsers (i.e. Safari)
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

      const decrypted = await this.decryptResponseMessage(response);

      this.handleResponse(args, decrypted);
    }
  );

  request = withSignerRequestMeasurement(
    () => ({ isEphemeral: this.isEphemeral }),
    async <T>(request: RequestArguments): Promise<T> => {
      if (this.accounts.length === 0) {
        switch (request.method) {
          case 'wallet_switchEthereumChain': {
            assertParamsChainId(request.params);
            this.chain.id = Number(request.params[0].chainId);
            return undefined as T;
          }
          case 'wallet_connect': {
            // Wait for the popup to be loaded before making async calls
            await this.communicator.waitForPopupLoaded?.();
            await initSubAccountConfig();

            const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
            // Inject capabilities from config (e.g., addSubAccount when creation: 'on-connect')
            const modifiedRequest = injectRequestCapabilities(
              request,
              subAccountsConfig?.capabilities ?? {}
            );
            return this.sendRequestToPopup(modifiedRequest) as Promise<T>;
          }
          case 'experimental_requestInfo':
          case 'wallet_sendCalls':
          case 'wallet_sign': {
            return this.sendRequestToPopup(request) as Promise<T>;
          }
          default:
            throw standardErrors.provider.unauthorized();
        }
      }

      if (this.shouldRequestUseSubAccountSigner(request)) {
        const correlationId = correlationIds.get(request);
        logSubAccountRequestStarted({ method: request.method, correlationId });
        try {
          const result = await this.sendRequestToSubAccountSigner(request);
          logSubAccountRequestCompleted({ method: request.method, correlationId });
          return result as T;
        } catch (error) {
          logSubAccountRequestError({
            method: request.method,
            correlationId,
            errorMessage: parseErrorMessageFromAny(error),
          });
          throw error;
        }
      }

      // Handle all experimental methods
      if (request.method.startsWith('experimental_')) {
        return this.sendRequestToPopup(request) as Promise<T>;
      }

      switch (request.method) {
        case 'eth_requestAccounts':
        case 'eth_accounts': {
          const subAccount = this.storeHelpers.subAccounts.get();
          const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
          if (subAccount?.address) {
            // if defaultAccount is 'sub' and we have a sub account, we need to return it as the first account
            // otherwise, we just append it to the accounts array
            this.accounts =
              subAccountsConfig?.defaultAccount === 'sub'
                ? prependWithoutDuplicates(this.accounts, subAccount.address)
                : appendWithoutDuplicates(this.accounts, subAccount.address);
          }

          this.callback?.('connect', { chainId: numberToHex(this.chain.id) });
          return this.accounts as T;
        }
        case 'eth_coinbase':
          return this.accounts[0] as T;
        case 'net_version':
          return this.chain.id as T;
        case 'eth_chainId':
          return numberToHex(this.chain.id) as T;
        case 'wallet_getCapabilities':
          return this.handleGetCapabilitiesRequest(request) as Promise<T>;
        case 'wallet_switchEthereumChain':
          return this.handleSwitchChainRequest(request) as Promise<T>;
        case 'eth_ecRecover':
        case 'personal_sign':
        case 'wallet_sign':
        case 'personal_ecRecover':
        case 'eth_signTransaction':
        case 'eth_sendTransaction':
        case 'eth_signTypedData_v1':
        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
        case 'eth_signTypedData':
        case 'wallet_addEthereumChain':
        case 'wallet_watchAsset':
        case 'wallet_sendCalls':
        case 'wallet_showCallsStatus':
        case 'wallet_grantPermissions':
          return this.sendRequestToPopup(request) as Promise<T>;
        case 'wallet_connect': {
          // Wait for the popup to be loaded before making async calls
          await this.communicator.waitForPopupLoaded?.();
          await initSubAccountConfig();
          const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
          const modifiedRequest = injectRequestCapabilities(
            request,
            subAccountsConfig?.capabilities ?? {}
          );
          const result = await this.sendRequestToPopup(modifiedRequest);

          this.callback?.('connect', { chainId: numberToHex(this.chain.id) });
          return result as T;
        }
        // Sub Account Support
        case 'wallet_getSubAccounts': {
          const subAccount = this.storeHelpers.subAccounts.get();
          if (subAccount?.address) {
            return {
              subAccounts: [subAccount],
            } as T;
          }

          if (!this.chain.rpcUrl) {
            throw standardErrors.rpc.internal('No RPC URL set for chain');
          }
          const response = (await fetchRPCRequest(
            request,
            this.chain.rpcUrl
          )) as GetSubAccountsResponse;
          assertArrayPresence(response.subAccounts, 'subAccounts');
          if (response.subAccounts.length > 0) {
            // cache the sub account
            assertSubAccount(response.subAccounts[0]);
            const subAccount = response.subAccounts[0];
            this.storeHelpers.subAccounts.set({
              address: subAccount.address,
              factory: subAccount.factory,
              factoryData: subAccount.factoryData,
            });
          }
          return response as T;
        }
        case 'wallet_addSubAccount':
          return this.addSubAccount(request) as Promise<T>;
        case 'coinbase_fetchPermissions': {
          assertFetchPermissionsRequest(request);
          const completeRequest = fillMissingParamsForFetchPermissions(request);
          const permissions = (await fetchRPCRequest(
            completeRequest,
            CB_WALLET_RPC_URL
          )) as FetchPermissionsResponse;
          const requestedChainId = hexToNumber(completeRequest.params?.[0].chainId);
          this.storeHelpers.spendPermissions.set(
            permissions.permissions.map((permission) => ({
              ...permission,
              chainId: requestedChainId,
            }))
          );
          return permissions as T;
        }
        case 'coinbase_fetchPermission': {
          const fetchPermissionRequest = request as FetchPermissionRequest;
          const response = (await fetchRPCRequest(
            fetchPermissionRequest,
            CB_WALLET_RPC_URL
          )) as FetchPermissionResponse;

          // Store the single permission if it has a chainId
          if (response.permission && response.permission.chainId) {
            this.storeHelpers.spendPermissions.set([response.permission]);
          }

          return response as T;
        }
        default:
          if (!this.chain.rpcUrl) {
            throw standardErrors.rpc.internal('No RPC URL set for chain');
          }
          return fetchRPCRequest(request, this.chain.rpcUrl) as Promise<T>;
      }
    }
  );

  protected async sendRequestToPopup(request: RequestArguments) {
    // Open the popup before constructing the request message.
    // This is to ensure that the popup is not blocked by some browsers (i.e. Safari)
    await this.communicator.waitForPopupLoaded?.();

    const response = await this.sendEncryptedRequest(request);
    const decrypted = await this.decryptResponseMessage(response);

    return this.handleResponse(request, decrypted);
  }

  protected async handleResponse(request: RequestArguments, decrypted: RPCResponse) {
    const result = decrypted.result;

    if ('error' in result) throw result.error;

    switch (request.method) {
      case 'eth_requestAccounts': {
        const accounts = result.value as Address[];
        this.accounts = accounts;
        this.storeHelpers.account.set({
          accounts,
          chain: this.chain,
        });
        this.callback?.('accountsChanged', accounts);
        break;
      }
      case 'wallet_connect': {
        const response = result.value as WalletConnectResponse;
        const accounts = response.accounts.map((account) => account.address);
        this.accounts = accounts;
        this.storeHelpers.account.set({
          accounts,
        });

        const account = response.accounts.at(0);
        const capabilities = account?.capabilities;

        if (capabilities?.subAccounts) {
          const capabilityResponse = capabilities?.subAccounts;
          assertArrayPresence(capabilityResponse, 'subAccounts');
          assertSubAccount(capabilityResponse[0]);
          this.storeHelpers.subAccounts.set({
            address: capabilityResponse[0].address,
            factory: capabilityResponse[0].factory,
            factoryData: capabilityResponse[0].factoryData,
          });
        }

        const subAccount = this.storeHelpers.subAccounts.get();
        const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();

        if (subAccount?.address) {
          // Sub account should be returned as the default account if defaultAccount is 'sub'
          this.accounts =
            subAccountsConfig?.defaultAccount === 'sub'
              ? prependWithoutDuplicates(this.accounts, subAccount.address)
              : appendWithoutDuplicates(this.accounts, subAccount.address);
        }

        const spendPermissions = response?.accounts?.[0].capabilities?.spendPermissions;

        if (spendPermissions && 'permissions' in spendPermissions) {
          this.storeHelpers.spendPermissions.set(spendPermissions?.permissions);
        }

        this.callback?.('accountsChanged', this.accounts);
        break;
      }
      case 'wallet_addSubAccount': {
        assertSubAccount(result.value);
        const subAccount = result.value;
        this.storeHelpers.subAccounts.set(subAccount);
        const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
        this.accounts =
          subAccountsConfig?.defaultAccount === 'sub'
            ? prependWithoutDuplicates(this.accounts, subAccount.address)
            : appendWithoutDuplicates(this.accounts, subAccount.address);
        this.callback?.('accountsChanged', this.accounts);
        break;
      }
      default:
        break;
    }
    return result.value;
  }

  async cleanup() {
    const metadata = this.storeHelpers.config.get().metadata;
    await this.keyManager.clear();

    // Clear session-specific store data
    this.storeHelpers.account.clear();
    this.storeHelpers.subAccounts.clear();
    this.storeHelpers.spendPermissions.clear();

    // NOTE: We intentionally do NOT clear this.storeHelpers.chains here.
    // Chains are shared infrastructure used by ChainClients and may be
    // needed by other SDK instances or subsequent operations.
    // Clearing them could cause failures in concurrent or subsequent operations.

    // reset the signer
    this.accounts = [];
    this.chain = {
      id: metadata?.appChainIds?.[0] ?? 1,
    };
  }

  /**
   * @returns `null` if the request was successful.
   * https://eips.ethereum.org/EIPS/eip-3326#wallet_switchethereumchain
   */
  private async handleSwitchChainRequest(request: RequestArguments) {
    assertParamsChainId(request.params);

    const chainId = ensureIntNumber(request.params[0].chainId);
    const localResult = this.updateChain(chainId);
    if (localResult) return null;

    const popupResult = await this.sendRequestToPopup(request);
    if (popupResult === null) {
      this.updateChain(chainId);
    }
    return popupResult;
  }

  private async handleGetCapabilitiesRequest(request: RequestArguments) {
    assertGetCapabilitiesParams(request.params);

    const requestedAccount = request.params[0];
    const filterChainIds = request.params[1]; // Optional second parameter

    if (!this.accounts.some((account) => isAddressEqual(account, requestedAccount))) {
      throw standardErrors.provider.unauthorized(
        'no active account found when getting capabilities'
      );
    }

    const capabilities = this.storeInstance.getState().account.capabilities;

    // Return empty object if capabilities is undefined
    if (!capabilities) {
      return {};
    }

    // If no filter is provided, return all capabilities
    if (!filterChainIds || filterChainIds.length === 0) {
      return capabilities;
    }

    // Convert filter chain IDs to numbers once for efficient lookup
    const filterChainNumbers = new Set(filterChainIds.map((chainId) => hexToNumber(chainId)));

    // Filter capabilities
    const filteredCapabilities = Object.fromEntries(
      Object.entries(capabilities).filter(([capabilityKey]) => {
        try {
          const capabilityChainNumber = hexToNumber(capabilityKey as `0x${string}`);
          return filterChainNumbers.has(capabilityChainNumber);
        } catch {
          // If capabilityKey is not a valid hex string, exclude it
          return false;
        }
      })
    );

    return filteredCapabilities;
  }

  protected async sendEncryptedRequest(request: RequestArguments): Promise<RPCResponseMessage> {
    const sharedSecret = await this.keyManager.getSharedSecret();
    if (!sharedSecret) {
      throw standardErrors.provider.unauthorized('No shared secret found when encrypting request');
    }

    const encrypted = await encryptContent(
      {
        action: request,
        chainId: this.chain.id,
      },
      sharedSecret
    );
    const correlationId = correlationIds.get(request);
    const message = await this.createRequestMessage({ encrypted }, correlationId);

    return this.communicator.postRequestAndWaitForResponse(message);
  }

  protected async createRequestMessage(
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

  protected async decryptResponseMessage(message: RPCResponseMessage): Promise<RPCResponse> {
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

      this.storeHelpers.chains.set(chains);

      this.updateChain(this.chain.id, chains);
      createClients(chains);
    }

    const walletCapabilities = response.data?.capabilities;
    if (walletCapabilities) {
      this.storeHelpers.account.set({
        capabilities: walletCapabilities,
      });
    }
    return response;
  }

  private updateChain(chainId: number, newAvailableChains?: SDKChain[]): boolean {
    const state = this.storeInstance.getState();
    const chains = newAvailableChains ?? state.chains;
    const chain = chains?.find((chain) => chain.id === chainId);
    if (!chain) return false;

    if (chain !== this.chain) {
      this.chain = chain;
      this.storeHelpers.account.set({
        chain,
      });
      this.callback?.('chainChanged', hexStringFromNumber(chain.id));
    }
    return true;
  }

  private async addSubAccount(request: RequestArguments): Promise<{
    address: Address;
    factory?: Address;
    factoryData?: Hex;
  }> {
    const state = this.storeInstance.getState();
    const cachedSubAccount = state.subAccount;
    const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();

    // Extract requested address from params (for deployed/undeployed types)
    const requestedAddress =
      Array.isArray(request.params) &&
      request.params.length > 0 &&
      request.params[0]?.account?.address
        ? request.params[0].account.address
        : undefined;

    // Only return cached if:
    // 1. Cache exists AND
    // 2. No specific address requested (create type) OR requested address matches cached
    if (cachedSubAccount?.address) {
      const shouldUseCache =
        !requestedAddress || isAddressEqual(requestedAddress, cachedSubAccount.address);

      if (shouldUseCache) {
        this.accounts =
          subAccountsConfig?.defaultAccount === 'sub'
            ? prependWithoutDuplicates(this.accounts, cachedSubAccount.address)
            : appendWithoutDuplicates(this.accounts, cachedSubAccount.address);
        this.callback?.('accountsChanged', this.accounts);
        return cachedSubAccount;
      }
    }

    // Wait for the popup to be loaded before sending the request
    await this.communicator.waitForPopupLoaded?.();

    if (
      Array.isArray(request.params) &&
      request.params.length > 0 &&
      request.params[0].account &&
      request.params[0].account.type === 'create'
    ) {
      let keys: { type: string; publicKey: string }[];
      if (request.params[0].account.keys && request.params[0].account.keys.length > 0) {
        keys = request.params[0].account.keys;
      } else {
        const config = this.storeHelpers.subAccountsConfig.get() ?? {};
        const { account: ownerAccount } = config.toOwnerAccount
          ? await config.toOwnerAccount()
          : await getCryptoKeyAccount();

        if (!ownerAccount) {
          throw standardErrors.provider.unauthorized(
            'could not get subaccount owner account when adding sub account'
          );
        }

        keys = [
          {
            type: ownerAccount.address ? 'address' : 'webauthn-p256',
            publicKey: ownerAccount.address || ownerAccount.publicKey,
          },
        ];
      }
      request.params[0].account.keys = keys;
    }

    const response = await this.sendRequestToPopup(request);
    assertSubAccount(response);
    return response;
  }

  private shouldRequestUseSubAccountSigner(request: RequestArguments) {
    const sender = getSenderFromRequest(request);
    const subAccount = this.storeHelpers.subAccounts.get();
    if (sender) {
      return sender.toLowerCase() === subAccount?.address.toLowerCase();
    }
    return false;
  }

  private async sendRequestToSubAccountSigner(request: RequestArguments) {
    const subAccount = this.storeHelpers.subAccounts.get();
    const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
    const config = this.storeHelpers.config.get();

    assertPresence(
      subAccount?.address,
      standardErrors.provider.unauthorized(
        'no active sub account when sending request to sub account signer'
      )
    );

    // Get the owner account from the config
    const ownerAccount = subAccountsConfig?.toOwnerAccount
      ? await subAccountsConfig.toOwnerAccount()
      : await getCryptoKeyAccount();

    assertPresence(
      ownerAccount?.account,
      standardErrors.provider.unauthorized(
        'no active sub account owner when sending request to sub account signer'
      )
    );

    const sender = getSenderFromRequest(request);
    // if sender is undefined, we inject the active sub account
    // address into the params for the supported request methods
    if (sender === undefined) {
      request = addSenderToRequest(request, subAccount.address);
    }

    const globalAccountAddress = this.accounts.find(
      (account) => account.toLowerCase() !== subAccount.address.toLowerCase()
    );

    assertPresence(
      globalAccountAddress,
      standardErrors.provider.unauthorized(
        'no global account found when sending request to sub account signer'
      )
    );
    const dataSuffix = makeDataSuffix({
      attribution: config.preference?.attribution,
      dappOrigin: window.location.origin,
    });

    // Determine effective chainId - use request chainId for wallet_sendCalls, default otherwise
    const walletSendCallsChainId =
      request.method === 'wallet_sendCalls' &&
      (request.params as WalletSendCallsParameters)?.[0]?.chainId;
    const chainId = walletSendCallsChainId ? hexToNumber(walletSendCallsChainId) : this.chain.id;

    const client = getClient(chainId);
    assertPresence(
      client,
      standardErrors.rpc.internal(
        `client not found for chainId ${chainId} when sending request to sub account signer`
      )
    );

    if (['eth_sendTransaction', 'wallet_sendCalls'].includes(request.method)) {
      // If we have never had a spend permission, we need to do this tx through the global account
      // Only perform this check if funding mode is 'spend-permissions'
      const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
      if (subAccountsConfig?.funding === 'spend-permissions') {
        const storedSpendPermissions = spendPermissions.get();
        if (storedSpendPermissions.length === 0) {
          const result = await routeThroughGlobalAccount({
            request,
            globalAccountAddress,
            subAccountAddress: subAccount.address,
            client,
            globalAccountRequest: this.sendRequestToPopup.bind(this),
            chainId,
          });
          return result;
        }
      }
    }

    const publicKey =
      ownerAccount.account.type === 'local'
        ? ownerAccount.account.address
        : ownerAccount.account.publicKey;

    let ownerIndex = await findOwnerIndex({
      address: subAccount.address,
      factory: subAccount.factory,
      factoryData: subAccount.factoryData,
      publicKey,
      client,
    });

    if (ownerIndex === -1) {
      const correlationId = correlationIds.get(request);
      logAddOwnerStarted({ method: request.method, correlationId });
      try {
        ownerIndex = await handleAddSubAccountOwner({
          ownerAccount: ownerAccount.account,
          globalAccountRequest: this.sendRequestToPopup.bind(this),
          chainId: chainId,
        });
        logAddOwnerCompleted({ method: request.method, correlationId });
      } catch (error) {
        logAddOwnerError({
          method: request.method,
          correlationId,
          errorMessage: parseErrorMessageFromAny(error),
        });
        return standardErrors.provider.unauthorized(
          'failed to add sub account owner when sending request to sub account signer'
        );
      }
    }

    const { request: subAccountRequest } = await createSubAccountSigner({
      address: subAccount.address,
      owner: ownerAccount.account,
      client: client,
      factory: subAccount.factory,
      factoryData: subAccount.factoryData,
      parentAddress: globalAccountAddress,
      attribution: dataSuffix ? { suffix: dataSuffix } : undefined,
      ownerIndex,
    });

    try {
      const result = await subAccountRequest(request);
      return result;
    } catch (error) {
      // Skip insufficient balance error handling if funding mode is 'manual'
      const subAccountsConfig = this.storeHelpers.subAccountsConfig.get();
      if (subAccountsConfig?.funding === 'manual') {
        throw error;
      }

      let errorObject: unknown;

      if (isViemError(error)) {
        errorObject = JSON.parse(error.details);
      } else if (isActionableHttpRequestError(error)) {
        errorObject = error;
      } else {
        throw error;
      }

      if (!(isActionableHttpRequestError(errorObject) && errorObject.data)) {
        throw error;
      }

      if (!errorObject.data) {
        throw error;
      }

      const correlationId = correlationIds.get(request);
      logInsufficientBalanceErrorHandlingStarted({ method: request.method, correlationId });
      try {
        const result = await handleInsufficientBalanceError({
          errorData: errorObject.data,
          globalAccountAddress,
          subAccountAddress: subAccount.address,
          client,
          request,
          globalAccountRequest: this.request.bind(this),
        });
        logInsufficientBalanceErrorHandlingCompleted({ method: request.method, correlationId });
        return result;
      } catch (handlingError) {
        console.error(handlingError);
        logInsufficientBalanceErrorHandlingError({
          method: request.method,
          correlationId,
          errorMessage: parseErrorMessageFromAny(handlingError),
        });
        throw error;
      }
    }
  }
}
