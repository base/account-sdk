import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentStatus } from './getPaymentStatus.js';
import type { PaymentStatus } from './types.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock telemetry events
vi.mock(':core/telemetry/events/payment.js', () => ({
  logPaymentStatusCheckStarted: vi.fn(),
  logPaymentStatusCheckCompleted: vi.fn(),
  logPaymentStatusCheckError: vi.fn(),
}));

describe('getPaymentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('mock-correlation-id'),
    });
  });

  it('should return completed status for successful payment from sender wallet', async () => {
    const mockReceipt = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        success: true,
        receipt: {
          transactionHash: '0xabc123',
          logs: [
            {
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              data: '0x0000000000000000000000000000000000000000000000000000000000989680', // 10 USDC (10 * 10^6)
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event topic
                '0x0000000000000000000000004a7c6899cdcb379e284fbfd045462e751da4c7ce', // from address (padded) - matches sender
                '0x000000000000000000000000f1ddf1fc0310cb11f0ca87508207012f4a9cb336', // to address (padded)
              ],
            },
          ],
        },
        sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockReceipt,
    } as Response);

    const status = await getPaymentStatus({
      id: '0x123456',
      testnet: false,
    });

    expect(status).toEqual<PaymentStatus>({
      status: 'completed',
      id: '0x123456',
      message: 'Payment completed successfully',
      sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      amount: '10',
      recipient: '0xf1DdF1fc0310Cb11F0Ca87508207012F4a9CB336',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.developer.coinbase.com/rpc/v1/base/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getUserOperationReceipt',
          params: ['0x123456'],
        }),
      })
    );
  });

  it('should return failed status for failed payment', async () => {
    const mockReceipt = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        success: false,
        receipt: {
          transactionHash: '0xdef456',
        },
        sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
        reason: 'Insufficient USDC balance',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockReceipt,
    } as Response);

    const status = await getPaymentStatus({
      id: '0x789abc',
      testnet: false,
    });

    expect(status).toEqual<PaymentStatus>({
      status: 'failed',
      id: '0x789abc',
      message: 'Payment failed',
      sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      reason: 'Insufficient USDC balance',
    });
  });

  it('should return pending status when userOp exists but no receipt', async () => {
    // First call returns no receipt
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: null }),
    } as Response);

    // Second call returns userOp
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        jsonrpc: '2.0',
        id: 2,
        result: {
          sender: '0xpendingSender',
          // other userOp fields...
        },
      }),
    } as Response);

    const status = await getPaymentStatus({
      id: '0xpending123',
      testnet: false,
    });

    expect(status).toEqual<PaymentStatus>({
      status: 'pending',
      id: '0xpending123',
      message: 'Your payment is being processed. This usually takes a few seconds.',
      sender: '0xpendingSender',
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should return not_found status when payment does not exist', async () => {
    // Both calls return null
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({ jsonrpc: '2.0', id: 1, result: null }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ jsonrpc: '2.0', id: 2, result: null }),
      } as Response);

    const status = await getPaymentStatus({
      id: '0xnotfound',
      testnet: false,
    });

    expect(status).toEqual<PaymentStatus>({
      status: 'not_found',
      id: '0xnotfound',
      message: 'Payment not found. Please check your transaction ID.',
    });
  });

  it('should handle RPC errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32602,
          message: 'Invalid params',
        },
      }),
    } as Response);

    await expect(
      getPaymentStatus({
        id: '0xinvalid',
        testnet: false,
      })
    ).rejects.toThrow('RPC error: Invalid params');
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      getPaymentStatus({
        id: '0xnetworkerror',
        testnet: false,
      })
    ).rejects.toThrow('Network error');
  });

  it('should use testnet bundler URL when testnet is true', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ jsonrpc: '2.0', id: 1, result: null }),
    } as Response);
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({ jsonrpc: '2.0', id: 2, result: null }),
    } as Response);

    await getPaymentStatus({
      id: '0xtestnet',
      testnet: true,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
      expect.any(Object)
    );
  });

  it('should parse user-friendly failure reasons', async () => {
    const testCases = [
      { reason: 'execution reverted: insufficient balance', expected: 'Insufficient USDC balance' },
      { reason: 'transaction reverted', expected: 'transaction reverted' },
      { reason: 'custom error message', expected: 'custom error message' },
    ];

    for (const { reason, expected } of testCases) {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: {
            success: false,
            receipt: { transactionHash: '0xfailed' },
            sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
            reason,
          },
        }),
      } as Response);

      const status = await getPaymentStatus({
        id: '0xfailedreason',
        testnet: false,
      });

      expect(status.reason).toBe(expected);
    }
  });

  it('should handle logs with different USDC addresses on testnet', async () => {
    const mockReceipt = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        success: true,
        receipt: {
          transactionHash: '0xabc123',
          logs: [
            {
              address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // testnet USDC
              data: '0x0000000000000000000000000000000000000000000000000000000000989680', // 10 USDC
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x0000000000000000000000004a7c6899cdcb379e284fbfd045462e751da4c7ce', // from address (padded) - matches sender
                '0x000000000000000000000000f1ddf1fc0310cb11f0ca87508207012f4a9cb336', // to address (padded)
              ],
            },
          ],
        },
        sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockReceipt,
    } as Response);

    const status = await getPaymentStatus({
      id: '0x123456',
      testnet: true,
    });

    expect(status.amount).toBe('10');
    expect(status.recipient).toBe('0xf1DdF1fc0310Cb11F0Ca87508207012F4a9CB336');
  });

  it('should throw error when no USDC transfer from sender wallet is found', async () => {
    const mockReceipt = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        success: true,
        receipt: {
          transactionHash: '0xabc123',
          logs: [
            {
              // USDC transfer but not from sender
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              data: '0x0000000000000000000000000000000000000000000000000000000000989680',
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x000000000000000000000000bbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb', // from different address
                '0x000000000000000000000000f1ddf1fc0310cb11f0ca87508207012f4a9cb336',
              ],
            },
          ],
        },
        sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockReceipt,
    } as Response);

    await expect(
      getPaymentStatus({
        id: '0x123456',
        testnet: false,
      })
    ).rejects.toThrow(
      'Unable to find USDC transfer from sender wallet 0x4A7c6899cdcB379e284fBFd045462e751da4C7ce'
    );
  });

  it('should throw error when multiple USDC transfers from sender wallet are found', async () => {
    const mockReceipt = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        success: true,
        receipt: {
          transactionHash: '0xabc123',
          logs: [
            {
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              data: '0x0000000000000000000000000000000000000000000000000000000000989680', // 10 USDC
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x0000000000000000000000004a7c6899cdcb379e284fbfd045462e751da4c7ce', // from sender
                '0x000000000000000000000000f1ddf1fc0310cb11f0ca87508207012f4a9cb336',
              ],
            },
            {
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              data: '0x00000000000000000000000000000000000000000000000000000000000f4240', // 1 USDC
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x0000000000000000000000004a7c6899cdcb379e284fbfd045462e751da4c7ce', // from sender
                '0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
              ],
            },
          ],
        },
        sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockReceipt,
    } as Response);

    await expect(
      getPaymentStatus({
        id: '0x123456',
        testnet: false,
      })
    ).rejects.toThrow(
      /Found multiple USDC transfers from sender wallet.*Expected exactly one transfer/
    );
  });

  it('should correctly identify transfer from sender in complex transaction with multiple USDC transfers', async () => {
    const mockReceipt = {
      jsonrpc: '2.0',
      id: 1,
      result: {
        success: true,
        receipt: {
          transactionHash: '0xabc123',
          logs: [
            {
              // Gas payment transfer (not from sender)
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              data: '0x00000000000000000000000000000000000000000000000000000010c388d00', // 4500 USDC
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x000000000000000000000000bbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb',
                '0x000000000000000000000000cccccccccccccccccccccccccccccccccccccccc',
              ],
            },
            {
              // Actual user payment (from sender)
              address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
              data: '0x00000000000000000000000000000000000000000000000000000000000f4240', // 1 USDC
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                '0x0000000000000000000000004a7c6899cdcb379e284fbfd045462e751da4c7ce',
                '0x000000000000000000000000f1ddf1fc0310cb11f0ca87508207012f4a9cb336',
              ],
            },
          ],
        },
        sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => mockReceipt,
    } as Response);

    const status = await getPaymentStatus({
      id: '0x123456',
      testnet: false,
    });

    expect(status).toEqual<PaymentStatus>({
      status: 'completed',
      id: '0x123456',
      message: 'Payment completed successfully',
      sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
      amount: '1', // Should pick the 1 USDC from sender, not the 4500 USDC gas payment
      recipient: '0xf1DdF1fc0310Cb11F0Ca87508207012F4a9CB336',
    });
  });

  describe('telemetry', () => {
    it('should not log telemetry when telemetry is disabled', async () => {
      const mockReceipt = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          success: true,
          receipt: {
            transactionHash: '0xabc123',
            logs: [],
          },
          sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockReceipt,
      } as Response);

      await getPaymentStatus({
        id: '0x123456',
        testnet: false,
        telemetry: false,
      });

      // Verify telemetry events were NOT called
      const {
        logPaymentStatusCheckStarted,
        logPaymentStatusCheckCompleted,
        logPaymentStatusCheckError,
      } = await import(':core/telemetry/events/payment.js');
      expect(logPaymentStatusCheckStarted).not.toHaveBeenCalled();
      expect(logPaymentStatusCheckCompleted).not.toHaveBeenCalled();
      expect(logPaymentStatusCheckError).not.toHaveBeenCalled();
    });

    it('should log telemetry by default when telemetry is not specified', async () => {
      const mockReceipt = {
        jsonrpc: '2.0',
        id: 1,
        result: {
          success: true,
          receipt: {
            transactionHash: '0xabc123',
            logs: [],
          },
          sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockReceipt,
      } as Response);

      await getPaymentStatus({
        id: '0x123456',
        testnet: false,
        // telemetry not specified - should default to true
      });

      // Verify telemetry events WERE called
      const { logPaymentStatusCheckStarted, logPaymentStatusCheckCompleted } = await import(
        ':core/telemetry/events/payment.js'
      );
      expect(logPaymentStatusCheckStarted).toHaveBeenCalledWith({
        testnet: false,
        correlationId: 'mock-correlation-id',
      });
      expect(logPaymentStatusCheckCompleted).toHaveBeenCalledWith({
        testnet: false,
        status: 'completed',
        correlationId: 'mock-correlation-id',
      });
    });

    it('should not log telemetry error when telemetry is disabled and status check fails', async () => {
      const mockError = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32000,
          message: 'Network error',
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => mockError,
      } as Response);

      await expect(
        getPaymentStatus({
          id: '0x123456',
          testnet: false,
          telemetry: false,
        })
      ).rejects.toThrow('RPC error: Network error');

      // Verify telemetry error was NOT called
      const { logPaymentStatusCheckError } = await import(':core/telemetry/events/payment.js');
      expect(logPaymentStatusCheckError).not.toHaveBeenCalled();
    });

    it('should log different telemetry events based on status', async () => {
      // Test pending status
      const mockNoReceipt = {
        jsonrpc: '2.0',
        id: 1,
        result: null,
      };
      const mockUserOp = {
        jsonrpc: '2.0',
        id: 2,
        result: {
          sender: '0x4A7c6899cdcB379e284fBFd045462e751da4C7ce',
        },
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          json: async () => mockNoReceipt,
        } as Response)
        .mockResolvedValueOnce({
          json: async () => mockUserOp,
        } as Response);

      await getPaymentStatus({
        id: '0x123456',
        testnet: true,
        telemetry: true,
      });

      const { logPaymentStatusCheckCompleted } = await import(':core/telemetry/events/payment.js');
      expect(logPaymentStatusCheckCompleted).toHaveBeenCalledWith({
        testnet: true,
        status: 'pending',
        correlationId: 'mock-correlation-id',
      });
    });
  });
});
