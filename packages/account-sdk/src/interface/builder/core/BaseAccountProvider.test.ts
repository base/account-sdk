import { CB_WALLET_RPC_URL } from ':core/constants.js';
import { standardErrorCodes } from ':core/error/constants.js';
import { standardErrors } from ':core/error/errors.js';
import { RequestArguments } from ':core/provider/interface.js';
import { store } from ':store/store.js';
import * as providerUtil from ':util/provider.js';
import { BaseAccountProvider } from './BaseAccountProvider.js';

function createProvider() {
  return new BaseAccountProvider({
    metadata: { appName: 'Test App', appLogoUrl: null, appChainIds: [1] },
    preference: { options: 'all' },
  });
}

const mockHandshake = vi.fn();
const mockRequest = vi.fn();
const mockCleanup = vi.fn();
const mockFetchRPCRequest = vi.fn();

let provider: BaseAccountProvider;

beforeEach(() => {
  vi.resetAllMocks();

  vi.spyOn(providerUtil, 'fetchRPCRequest').mockImplementation(mockFetchRPCRequest);

  provider = createProvider();
  provider['signer'].request = mockRequest;
  provider['signer'].handshake = mockHandshake;
  provider['signer'].cleanup = mockCleanup;
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
