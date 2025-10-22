import { spendPermissions } from ':store/store.js';
import { encodeFunctionData, hexToBigInt } from 'viem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createWalletSendCallsRequest,
  injectRequestCapabilities,
  isEthSendTransactionParams,
  isSendCallsParams,
  waitForCallsTransactionHash,
} from '../utils.js';
import { routeThroughGlobalAccount } from './routeThroughGlobalAccount.js';

// Mock all dependencies
vi.mock(':store/store.js', () => ({
  spendPermissions: {
    set: vi.fn(),
    get: vi.fn().mockReturnValue([]),
  },
}));

vi.mock('viem', () => ({
  encodeFunctionData: vi.fn(),
  hexToBigInt: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  createWalletSendCallsRequest: vi.fn(),
  injectRequestCapabilities: vi.fn(),
  isEthSendTransactionParams: vi.fn(),
  isSendCallsParams: vi.fn(),
  waitForCallsTransactionHash: vi.fn(),
}));

vi.mock('./constants.js', () => ({
  abi: [
    {
      name: 'executeBatch',
      type: 'function',
      inputs: [],
    },
  ],
}));

describe('routeThroughGlobalAccount', () => {
  const globalAccountAddress = '0xe6c7D51b0d5ECC217BE74019447aeac4580Afb54';
  const subAccountAddress = '0x7838d2724FC686813CAf81d4429beff1110c739a';
  const chainId = 84532;

  let mockClient: any;
  let mockGlobalAccountRequest: any;
  let args: Parameters<typeof routeThroughGlobalAccount>[0];

  beforeEach(() => {
    mockClient = {
      chain: { id: chainId },
    };

    mockGlobalAccountRequest = vi.fn();

    args = {
      request: {
        method: 'wallet_sendCalls',
        params: [
          {
            calls: [
              {
                to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                data: '0x',
                value: '0x1',
              },
            ],
            from: subAccountAddress,
          },
        ],
      },
      globalAccountAddress,
      subAccountAddress,
      client: mockClient,
      globalAccountRequest: mockGlobalAccountRequest,
      chainId,
    };

    // Setup default mocks
    vi.mocked(isSendCallsParams).mockReturnValue(true);
    vi.mocked(isEthSendTransactionParams).mockReturnValue(false);
    vi.mocked(encodeFunctionData).mockReturnValue('0x34fcd5be000...');
    vi.mocked(hexToBigInt).mockImplementation((hex) => BigInt(hex));
    vi.mocked(injectRequestCapabilities).mockImplementation((request) => request);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('wallet_sendCalls requests', () => {
    it('should route wallet_sendCalls through global account successfully', async () => {
      const mockCallsId = '0x1234ca11';
      mockGlobalAccountRequest.mockResolvedValue(mockCallsId);

      const result = await routeThroughGlobalAccount(args);

      expect(isSendCallsParams).toHaveBeenCalledWith(args.request.params);
      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: expect.any(Array),
        functionName: 'executeBatch',
        args: [
          [
            {
              target: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              value: BigInt('0x1'),
              data: '0x',
            },
          ],
        ],
      });

      expect(mockGlobalAccountRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'wallet_sendCalls',
          params: [
            expect.objectContaining({
              from: globalAccountAddress,
            }),
          ],
        })
      );

      expect(result).toBe(mockCallsId);
    });

    it('should handle new format response with capabilities', async () => {
      const mockPermissions = [
        {
          createdAt: 1234567890,
          permissionHash: '0xabcd1234',
          signature: '0x1234567890abcdef',
          chainId: chainId,
          permission: {
            account: globalAccountAddress,
            spender: subAccountAddress,
            token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            allowance: '1000000000000000000',
            period: 86400,
            start: 0,
            end: 281474976710655,
            salt: '0',
            extraData: '0x',
          },
        },
      ];

      const mockResponse = {
        id: '0x1234ca11',
        capabilities: {
          spendPermissions: {
            permissions: mockPermissions,
          },
        },
      };
      mockGlobalAccountRequest.mockResolvedValue(mockResponse);

      const result = await routeThroughGlobalAccount(args);

      expect(spendPermissions.set).toHaveBeenCalledWith(mockPermissions);
      expect(result).toBe(mockResponse);
    });

    it('should include prepend calls when provided', async () => {
      const prependCalls = [
        {
          to: '0x1234567890123456789012345678901234567890' as const,
          data: '0xabcd' as const,
          value: '0x100' as const,
        },
      ];

      args.prependCalls = prependCalls;
      mockGlobalAccountRequest.mockResolvedValue('0x1234ca11');

      await routeThroughGlobalAccount(args);

      expect(injectRequestCapabilities).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'wallet_sendCalls',
          params: [
            expect.objectContaining({
              calls: [
                ...prependCalls,
                expect.objectContaining({
                  data: '0x34fcd5be000...',
                  to: subAccountAddress,
                  value: '0x0',
                }),
              ],
              from: globalAccountAddress,
              atomicRequired: true,
              version: '2.0.0',
            }),
          ],
        }),
        {
          spendPermissions: {
            request: {
              spender: subAccountAddress,
            },
          },
        }
      );
    });

    it('should store returned spend permissions in cache', async () => {
      const mockSpendPermissions = [
        {
          createdAt: 1234567890,
          permissionHash: '0xabcd1234',
          signature: '0x1234567890abcdef',
          chainId: chainId,
          permission: {
            account: globalAccountAddress,
            spender: subAccountAddress,
            token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            allowance: '1000000000000000000',
            period: 86400,
            start: 0,
            end: 281474976710655,
            salt: '0',
            extraData: '0x',
          },
        },
        {
          createdAt: 1234567891,
          permissionHash: '0xefgh5678',
          signature: '0x5678901234abcdef',
          chainId: chainId,
          permission: {
            account: globalAccountAddress,
            spender: subAccountAddress,
            token: '0x1234567890123456789012345678901234567890',
            allowance: '2000000000000000000',
            period: 86400,
            start: 0,
            end: 281474976710655,
            salt: '1',
            extraData: '0x',
          },
        },
      ];

      const mockResponse = {
        id: '0x1234ca11',
        capabilities: {
          spendPermissions: {
            permissions: mockSpendPermissions,
          },
        },
      };

      mockGlobalAccountRequest.mockResolvedValue(mockResponse);

      await routeThroughGlobalAccount(args);

      expect(spendPermissions.set).toHaveBeenCalledTimes(1);
      expect(spendPermissions.set).toHaveBeenCalledWith(mockSpendPermissions);
    });

    it('should not store spend permissions when not present in response', async () => {
      const mockResponse = {
        id: '0x1234ca11',
        // No capabilities
      };

      mockGlobalAccountRequest.mockResolvedValue(mockResponse);

      await routeThroughGlobalAccount(args);

      expect(spendPermissions.set).not.toHaveBeenCalled();
    });
  });

  describe('eth_sendTransaction requests', () => {
    beforeEach(() => {
      args.request = {
        method: 'eth_sendTransaction',
        params: [
          {
            from: subAccountAddress,
            to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
            value: '0x1',
            data: '0x',
          },
        ],
      };

      vi.mocked(isSendCallsParams).mockReturnValue(false);
      vi.mocked(isEthSendTransactionParams).mockReturnValue(true);
      vi.mocked(createWalletSendCallsRequest).mockReturnValue({
        params: [
          {
            calls: [
              {
                to: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
                data: '0x',
                value: '0x1',
              },
            ],
            from: subAccountAddress,
          },
        ],
      } as any);
    });

    it('should convert eth_sendTransaction to wallet_sendCalls and wait for transaction hash', async () => {
      const mockCallsId = '0x1234ca11';
      const mockTxHash = '0xabcdef...';

      mockGlobalAccountRequest.mockResolvedValue({ id: mockCallsId });
      vi.mocked(waitForCallsTransactionHash).mockResolvedValue(mockTxHash);

      const result = await routeThroughGlobalAccount(args);

      expect(createWalletSendCallsRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          calls: expect.any(Array),
          chainId,
          from: subAccountAddress,
        })
      );

      expect(waitForCallsTransactionHash).toHaveBeenCalledWith({
        client: mockClient,
        id: mockCallsId,
      });

      expect(result).toBe(mockTxHash);
    });
  });

  describe('error handling', () => {
    it('should throw error for unsupported request method', async () => {
      args.request = {
        method: 'eth_sign',
        params: ['0x123', '0xmessage'],
      };

      vi.mocked(isSendCallsParams).mockReturnValue(false);
      vi.mocked(isEthSendTransactionParams).mockReturnValue(false);

      await expect(routeThroughGlobalAccount(args)).rejects.toThrow('Could not get original call');
    });
  });

  describe('backwards compatibility', () => {
    it('should handle string response (old format)', async () => {
      const mockCallsId = '0x1234ca11';
      mockGlobalAccountRequest.mockResolvedValue(mockCallsId);

      const result = await routeThroughGlobalAccount(args);

      expect(result).toBe(mockCallsId);
      expect(spendPermissions.set).not.toHaveBeenCalled();
    });

    it('should handle object response without capabilities', async () => {
      const mockResponse = {
        id: '0x1234ca11',
      };
      mockGlobalAccountRequest.mockResolvedValue(mockResponse);

      const result = await routeThroughGlobalAccount(args);

      expect(result).toBe(mockResponse);
      expect(spendPermissions.set).not.toHaveBeenCalled();
    });
  });

  describe('call construction', () => {
    it('should handle calls with no value', async () => {
      // @ts-ignore - testing edge case
      args.request.params[0].calls[0].value = undefined;
      mockGlobalAccountRequest.mockResolvedValue('0x1234ca11');

      await routeThroughGlobalAccount(args);

      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: expect.any(Array),
        functionName: 'executeBatch',
        args: [
          [
            {
              target: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              value: BigInt('0x0'),
              data: '0x',
            },
          ],
        ],
      });
    });

    it('should handle calls with no data', async () => {
      // @ts-ignore - testing edge case
      args.request.params[0].calls[0].data = undefined;
      mockGlobalAccountRequest.mockResolvedValue('0x1234ca11');

      await routeThroughGlobalAccount(args);

      expect(encodeFunctionData).toHaveBeenCalledWith({
        abi: expect.any(Array),
        functionName: 'executeBatch',
        args: [
          [
            {
              target: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              value: BigInt('0x1'),
              data: '0x',
            },
          ],
        ],
      });
    });
  });
});
