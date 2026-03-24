import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBalance } from './index.js';

const mockReadContract = vi.fn();
const mockGetBalance = vi.fn();

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: () => ({
      readContract: mockReadContract,
      getBalance: mockGetBalance,
    }),
    http: () => 'http-transport',
  };
});

vi.mock('viem/chains', () => ({
  base: { id: 8453 },
  baseSepolia: { id: 84532 },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getBalance', () => {
  const address = '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01' as `0x${string}`;
  const contract = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`;

  describe('ERC-20 token balance', () => {
    it('returns balance when contract address is provided', async () => {
      mockReadContract.mockResolvedValue(1000000n);

      const result = await getBalance(address, 8453, contract);

      expect(result).toEqual({
        address,
        contract,
        balance: '1000000',
      });
      expect(mockReadContract).toHaveBeenCalledWith({
        address: contract,
        abi: expect.any(Array),
        functionName: 'balanceOf',
        args: [address],
      });
    });

    it('returns zero balance', async () => {
      mockReadContract.mockResolvedValue(0n);

      const result = await getBalance(address, 84532, contract);

      expect(result.balance).toBe('0');
    });

    it('propagates RPC errors from readContract', async () => {
      mockReadContract.mockRejectedValue(new Error('execution reverted'));

      await expect(getBalance(address, 8453, contract)).rejects.toThrow('execution reverted');
    });
  });

  describe('native token balance', () => {
    it('returns native balance when no contract address is provided', async () => {
      mockGetBalance.mockResolvedValue(5000000000000000000n);

      const result = await getBalance(address, 8453);

      expect(result).toEqual({
        address,
        contract: 'native',
        balance: '5000000000000000000',
      });
      expect(mockGetBalance).toHaveBeenCalledWith({ address });
    });

    it('returns zero native balance', async () => {
      mockGetBalance.mockResolvedValue(0n);

      const result = await getBalance(address, 8453);

      expect(result.balance).toBe('0');
      expect(result.contract).toBe('native');
    });

    it('propagates RPC errors from getBalance', async () => {
      mockGetBalance.mockRejectedValue(new Error('network timeout'));

      await expect(getBalance(address, 8453)).rejects.toThrow('network timeout');
    });
  });

  describe('unsupported chain', () => {
    it('throws UNSUPPORTED_CHAIN for unknown chain ID', async () => {
      await expect(getBalance(address, 999999)).rejects.toThrow(
        expect.objectContaining({
          code: 'UNSUPPORTED_CHAIN',
        })
      );
    });
  });
});
