import { standardErrors } from ':core/error/errors.js';
import { createStoreInstance } from ':store/store.js';
import {
  decryptContent,
  encryptContent,
  exportKeyToHexString,
  importKeyFromHexString,
} from ':util/cipher.js';
import { Mock, Mocked, beforeEach, describe, expect, it, vi } from 'vitest';
import { Communicator } from ':core/communicator/Communicator.js';
import { SCWKeyManager } from './SCWKeyManager.js';
import { EphemeralSigner } from './EphemeralSigner.js';

vi.mock(':store/chain-clients/utils.js', () => ({
  createClients: vi.fn(),
}));

vi.mock(':util/cipher', () => ({
  decryptContent: vi.fn(),
  encryptContent: vi.fn(),
  exportKeyToHexString: vi.fn(),
  importKeyFromHexString: vi.fn(),
}));

vi.mock('./SCWKeyManager.js');

describe('EphemeralSigner', () => {
  const mockCryptoKey = {} as CryptoKey;
  const encryptedData = {} as { iv: string; v: string };

  let signer: EphemeralSigner;
  let mockCommunicator: Mocked<Communicator>;
  let mockKeyManager: Mocked<SCWKeyManager>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCommunicator = {
      waitForPopupLoaded: vi.fn().mockResolvedValue({} as Window),
      postRequestAndWaitForResponse: vi.fn().mockResolvedValue({
        id: '1',
        correlationId: 'corr',
        requestId: 'req',
        sender: '0xPublicKey',
        content: { encrypted: encryptedData },
        timestamp: new Date(),
      }),
    } as unknown as Mocked<Communicator>;

    mockKeyManager = {
      getSharedSecret: vi.fn().mockResolvedValue(mockCryptoKey),
      getOwnPublicKey: vi.fn().mockResolvedValue(mockCryptoKey),
      setPeerPublicKey: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<SCWKeyManager>;

    (SCWKeyManager as Mock).mockImplementation(() => mockKeyManager);
    (exportKeyToHexString as Mock).mockResolvedValue('0xOwnPublicKey');
    (encryptContent as Mock).mockResolvedValue(encryptedData);
    (decryptContent as Mock).mockResolvedValue({
      result: {
        value: '0xsignature',
      },
    });
    (importKeyFromHexString as Mock).mockResolvedValue(mockCryptoKey);

    const storeInstance = createStoreInstance({ persist: false });
    signer = new EphemeralSigner({
      metadata: { appName: 'test', appLogoUrl: null, appChainIds: [8453] },
      communicator: mockCommunicator,
      callback: null,
      storeInstance,
    });
  });

  it('returns decrypted value for supported methods', async () => {
    const result = await signer.request({
      method: 'wallet_sign',
      params: [{ foo: 'bar' }],
    });

    expect(result).toEqual('0xsignature');
    expect(mockCommunicator.postRequestAndWaitForResponse).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported methods', async () => {
    await expect(signer.request({ method: 'eth_requestAccounts' })).rejects.toMatchObject(
      standardErrors.provider.unauthorized(
        "Method 'eth_requestAccounts' is not supported by ephemeral signer"
      )
    );
  });

  it('cleanup clears signer-local store state', async () => {
    const storeInstance = createStoreInstance({ persist: false });
    storeInstance.setState({
      account: { accounts: ['0x1234567890123456789012345678901234567890'] },
      chains: [{ id: 8453 }],
      spendPermissions: [{} as any],
      subAccount: { address: '0x1234567890123456789012345678901234567890' },
      subAccountConfig: { defaultAccount: 'sub' },
    });

    const localSigner = new EphemeralSigner({
      metadata: { appName: 'test', appLogoUrl: null, appChainIds: [8453] },
      communicator: mockCommunicator,
      callback: null,
      storeInstance,
    });

    await localSigner.cleanup();

    expect(mockKeyManager.clear).toHaveBeenCalled();
    const state = storeInstance.getState();
    expect(state.account).toEqual({});
    expect(state.chains).toEqual([]);
    expect(state.spendPermissions).toEqual([]);
    expect(state.subAccount).toBeUndefined();
    expect(state.subAccountConfig).toEqual({});
  });
});
