import { CB_WALLET_RPC_URL } from ':core/constants.js';
import { standardErrorCodes } from ':core/error/constants.js';
import { standardErrors } from ':core/error/errors.js';
import { RequestArguments } from ':core/provider/interface.js';
import * as signerUtils from ':sign/base-account/utils.js';
import { store } from ':store/store.js';
import * as providerUtil from ':util/provider.js';
import { BaseAccountProvider } from './BaseAccountProvider.js';

function createProvider() {
  return new BaseAccountProvider({
    metadata: { appName: 'Test App', appLogoUrl: null, appChainIds: [1] },
    preference: { telemetry: false },
  });
}

const mockHandshake = vi.fn();
const mockRequest = vi.fn();
const mockCleanup = vi.fn();
const mockFetchRPCRequest = vi.fn();
const mockInitSubAccountConfig = vi.fn();

let provider: BaseAccountProvider;

beforeEach(() => {
  vi.resetAllMocks();

  vi.spyOn(providerUtil, 'fetchRPCRequest').mockImplementation(mockFetchRPCRequest);
  vi.spyOn(signerUtils, 'initSubAccountConfig').mockImplementation(mockInitSubAccountConfig);

  provider = createProvider();
  provider['signer'].request = mockRequest;
  provider['signer'].handshake = mockHandshake;
  provider['signer'].cleanup = mockCleanup;

  // Ensure signer is not connected initially
  Object.defineProperty(provider['signer'], 'isConnected', {
    value: false,
    writable: true,
  });
});

describe('Event handling', () => {
  it('emits disconnect event on user initiated disconnection', async () => {
    const disconnectListener = vi.fn();
    provider.on('disconnect', disconnectListener);

    await provider.disconnect();

    expect(disconnectListener).toHaveBeenCalledWith(
      standardErrors.provider.disconnected('User initiated disconnection')
    );
  });

  it('should emit chainChanged event on chainId change', async () => {
    const chainChangedListener = vi.fn();
    provider.on('chainChanged', chainChangedListener);

    provider['signer']?.['callback']?.('chainChanged', '0x1');

    expect(chainChangedListener).toHaveBeenCalledWith('0x1');
  });

  it('should emit accountsChanged event on account change', async () => {
    const accountsChangedListener = vi.fn();
    provider.on('accountsChanged', accountsChangedListener);

    provider['signer']?.['callback']?.('accountsChanged', ['0x123']);

    expect(accountsChangedListener).toHaveBeenCalledWith(['0x123']);
  });
});

describe('Request Handling', () => {
  it('returns default chain id even without signer set up', async () => {
    await expect(provider.request({ method: 'eth_chainId' })).resolves.toBe('0x1');
    await expect(provider.request({ method: 'net_version' })).resolves.toBe(1);
  });

  it('throws error when handling invalid request', async () => {
    await expect(provider.request({} as RequestArguments)).rejects.toMatchObject({
      code: standardErrorCodes.rpc.invalidParams,
      message: "'args.method' must be a non-empty string.",
    });
  });

  it('throws error for requests with unsupported or deprecated method', async () => {
    const deprecated = ['eth_sign', 'eth_signTypedData_v2'];
    const unsupported = ['eth_subscribe', 'eth_unsubscribe'];

    for (const method of [...deprecated, ...unsupported]) {
      await expect(provider.request({ method })).rejects.toMatchObject({
        code: standardErrorCodes.provider.unsupportedMethod,
      });
    }
  });
});

describe('Ephemeral methods', () => {
  it('should post requests to wallet rpc url for wallet_getCallsStatus', async () => {
    const args = { method: 'wallet_getCallsStatus' };
    await provider.request(args);
    expect(mockFetchRPCRequest).toHaveBeenCalledWith(args, CB_WALLET_RPC_URL);
  });

  it.each(['wallet_sendCalls', 'wallet_sign'])(
    'should perform a successful request after handshake',
    async (method) => {
      const args = { method, params: ['0xdeadbeef'] };
      await provider.request(args);
      expect(mockHandshake).toHaveBeenCalledWith({ method: 'handshake' });
      expect(mockRequest).toHaveBeenCalledWith(args);
      expect(mockCleanup).toHaveBeenCalled();
    }
  );
});

describe('Auto sub account', () => {
  it('call handshake without method when enableAutoSubAccounts is true', async () => {
    vi.spyOn(store.subAccountsConfig, 'get').mockReturnValue({
      enableAutoSubAccounts: true,
    });

    await provider.request({ method: 'eth_requestAccounts' });
    expect(mockHandshake).toHaveBeenCalledWith({ method: 'handshake' });
  });
});

describe('Auto translate eth_requestAccounts to wallet_connect', () => {
  it('should call handshake, initSubAccountConfig, and request with proper parameters', async () => {
    const mockCapabilities = {
      subAccounts: { enabled: true },
      spendPermissions: { enabled: true },
    };

    vi.spyOn(store.subAccountsConfig, 'get').mockReturnValue({
      capabilities: mockCapabilities,
    });

    await provider.request({ method: 'eth_requestAccounts' });

    // Verify handshake is called first
    expect(mockHandshake).toHaveBeenCalledWith({ method: 'handshake' });

    // Verify initSubAccountConfig is called
    expect(mockInitSubAccountConfig).toHaveBeenCalled();

    // Verify wallet_connect is called with correct parameters
    expect(mockRequest).toHaveBeenNthCalledWith(1, {
      method: 'wallet_connect',
      params: [
        {
          version: '1',
          capabilities: mockCapabilities,
        },
      ],
    });

    // Verify eth_requestAccounts is called after wallet_connect
    expect(mockRequest).toHaveBeenNthCalledWith(2, {
      method: 'eth_requestAccounts',
    });

    // Verify the order of operations and total calls
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('should handle empty capabilities from store', async () => {
    vi.spyOn(store.subAccountsConfig, 'get').mockReturnValue({
      capabilities: undefined,
    });

    await provider.request({ method: 'eth_requestAccounts' });

    expect(mockRequest).toHaveBeenNthCalledWith(1, {
      method: 'wallet_connect',
      params: [
        {
          version: '1',
          capabilities: {},
        },
      ],
    });
  });

  it('should handle undefined subAccountsConfig from store', async () => {
    vi.spyOn(store.subAccountsConfig, 'get').mockReturnValue(undefined);

    await provider.request({ method: 'eth_requestAccounts' });

    expect(mockRequest).toHaveBeenNthCalledWith(1, {
      method: 'wallet_connect',
      params: [
        {
          version: '1',
          capabilities: {},
        },
      ],
    });
  });
});
