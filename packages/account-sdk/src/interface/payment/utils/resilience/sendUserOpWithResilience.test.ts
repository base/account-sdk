import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  sendUserOpWithResilience,
  sendUserOpAndWaitWithResilience,
} from './sendUserOpWithResilience.js';
import { MaxRetriesExceededError, UnrecoverableTransactionError } from './errors.js';
import type { PrepareChargeCall } from '../../types.js';

// Mock network smart wallet
const createMockNetworkSmartWallet = () => ({
  sendUserOperation: vi.fn(),
  waitForUserOperation: vi.fn(),
});

describe('sendUserOpWithResilience', () => {
  let mockNetworkSmartWallet: ReturnType<typeof createMockNetworkSmartWallet>;
  let mockCalls: PrepareChargeCall[];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    mockNetworkSmartWallet = createMockNetworkSmartWallet();
    mockCalls = [
      {
        to: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        data: '0xabcdef' as `0x${string}`,
        value: 0n,
      },
    ];
  });

  afterEach(async () => {
    // Run all pending timers to avoid unhandled rejections
    await vi.runAllTimersAsync();
    vi.useRealTimers();
  });

  describe('successful operations', () => {
    it('should succeed on first attempt', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
        userOpHash: '0xhash123',
        status: 'broadcast',
      });
      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      const result = await sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        context: 'test',
      });

      expect(result.transactionHash).toBe('0xtxhash456');
      expect(result.attempts).toBe(1);
      expect(result.recoveryActionsUsed).toBe(false);
      expect(result.recoveryActions).toHaveLength(0);
      expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenCalledTimes(1);
    });

    it('should succeed after retry on recoverable error', async () => {
      // First attempt fails with network error
      mockNetworkSmartWallet.sendUserOperation
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce({
          userOpHash: '0xhash123',
          status: 'broadcast',
        });

      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      const onRetry = vi.fn();

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        context: 'test',
        resilience: {
          maxRetries: 3,
          initialDelayMs: 100,
          onRetry,
        },
      });

      // Advance timers to handle the sleep
      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result.transactionHash).toBe('0xtxhash456');
      expect(result.attempts).toBe(2);
      expect(result.recoveryActionsUsed).toBe(true);
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 1,
          maxAttempts: 4, // maxRetries + 1
        })
      );
    });

    it('should include paymaster URL when provided', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
        userOpHash: '0xhash123',
        status: 'broadcast',
      });
      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      await sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        paymasterUrl: 'https://paymaster.example.com',
        timeoutSeconds: 60,
      });

      expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenCalledWith({
        calls: mockCalls,
        paymasterUrl: 'https://paymaster.example.com',
      });
    });
  });

  describe('retry behavior', () => {
    it('should retry up to maxRetries times', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockRejectedValue(new Error('network error'));

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 2,
          initialDelayMs: 100,
          backoff: 'fixed',
        },
      });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000);

      await expect(resultPromise).rejects.toThrow(MaxRetriesExceededError);
      expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should use exponential backoff by default', async () => {
      const delays: number[] = [];
      const originalSetTimeout = globalThis.setTimeout;

      mockNetworkSmartWallet.sendUserOperation.mockRejectedValue(new Error('network error'));

      const onRetry = vi.fn().mockImplementation(({ delayMs }) => {
        delays.push(delayMs);
      });

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 3,
          initialDelayMs: 1000,
          onRetry,
        },
      });

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(30000);

      await expect(resultPromise).rejects.toThrow(MaxRetriesExceededError);

      // Verify exponential pattern (with jitter, so check ranges)
      expect(delays[0]).toBeGreaterThanOrEqual(900);
      expect(delays[0]).toBeLessThanOrEqual(1100);
      expect(delays[1]).toBeGreaterThanOrEqual(1800);
      expect(delays[1]).toBeLessThanOrEqual(2200);
      expect(delays[2]).toBeGreaterThanOrEqual(3600);
      expect(delays[2]).toBeLessThanOrEqual(4400);
    });
  });

  describe('unrecoverable errors', () => {
    it('should throw immediately on user rejection', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockRejectedValue(new Error('user rejected'));

      await expect(
        sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
          timeoutSeconds: 60,
        })
      ).rejects.toThrow(UnrecoverableTransactionError);

      expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenCalledTimes(1);
    });

    it('should throw immediately on contract revert', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockRejectedValue(
        new Error('execution reverted: insufficient balance')
      );

      await expect(
        sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
          timeoutSeconds: 60,
        })
      ).rejects.toThrow(UnrecoverableTransactionError);

      expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenCalledTimes(1);
    });

    it('should include failure analysis in unrecoverable error', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockRejectedValue(new Error('user rejected'));

      try {
        await sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
          timeoutSeconds: 60,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnrecoverableTransactionError);
        const unrecoverableError = error as UnrecoverableTransactionError;
        expect(unrecoverableError.failureAnalysis.type).toBe('USER_REJECTED');
        expect(unrecoverableError.failureAnalysis.isRecoverable).toBe(false);
      }
    });
  });

  describe('recovery actions', () => {
    it('should record recovery actions for gas-related failures', async () => {
      mockNetworkSmartWallet.sendUserOperation
        .mockRejectedValueOnce(new Error('out of gas'))
        .mockResolvedValueOnce({
          userOpHash: '0xhash123',
          status: 'broadcast',
        });

      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      const onRecoveryAction = vi.fn();

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          autoGasAdjust: true,
          initialDelayMs: 100,
          onRecoveryAction,
        },
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result.recoveryActionsUsed).toBe(true);
      expect(result.recoveryActions.some((a) => a.type === 'gas_increase')).toBe(true);
      expect(onRecoveryAction).toHaveBeenCalled();
    });

    it('should switch to sponsored on insufficient funds when configured', async () => {
      mockNetworkSmartWallet.sendUserOperation
        .mockRejectedValueOnce(new Error('insufficient funds for gas'))
        .mockResolvedValueOnce({
          userOpHash: '0xhash123',
          status: 'broadcast',
        });

      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      const onFallbackToSponsored = vi.fn();

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          fallbackToSponsored: true,
          fallbackPaymasterUrl: 'https://paymaster.example.com',
          initialDelayMs: 100,
          onFallbackToSponsored,
        },
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;

      expect(result.recoveryActions.some((a) => a.type === 'sponsored_fallback')).toBe(true);
      expect(onFallbackToSponsored).toHaveBeenCalled();

      // Verify second call includes paymaster URL
      expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenNthCalledWith(2, {
        calls: mockCalls,
        paymasterUrl: 'https://paymaster.example.com',
      });
    });
  });

  describe('callbacks', () => {
    it('should call onRetry with correct context', async () => {
      mockNetworkSmartWallet.sendUserOperation
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce({
          userOpHash: '0xhash123',
          status: 'broadcast',
        });

      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      const onRetry = vi.fn();

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 3,
          initialDelayMs: 100,
          onRetry,
        },
      });

      await vi.advanceTimersByTimeAsync(200);

      await resultPromise;

      expect(onRetry).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 1,
          maxAttempts: 4,
          error: expect.any(Error),
          failureAnalysis: expect.objectContaining({
            type: 'TIMEOUT',
            isRecoverable: true,
          }),
          nextAction: expect.any(String),
          delayMs: expect.any(Number),
        })
      );
    });

    it('should call onGasAdjusted when gas is increased', async () => {
      mockNetworkSmartWallet.sendUserOperation
        .mockRejectedValueOnce(new Error('out of gas'))
        .mockResolvedValueOnce({
          userOpHash: '0xhash123',
          status: 'broadcast',
        });

      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'complete',
        transactionHash: '0xtxhash456',
      });

      const onRecoveryAction = vi.fn();

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          autoGasAdjust: true,
          gasMultiplier: 1.5,
          initialDelayMs: 100,
          onRecoveryAction,
        },
      });

      await vi.advanceTimersByTimeAsync(200);

      await resultPromise;

      expect(onRecoveryAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gas_increase',
        })
      );
    });
  });

  describe('failed user operations', () => {
    it('should retry on failed waitForUserOperation status', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
        userOpHash: '0xhash123',
        status: 'broadcast',
      });
      // First attempt fails, second succeeds
      mockNetworkSmartWallet.waitForUserOperation
        .mockResolvedValueOnce({
          status: 'failed',
        })
        .mockResolvedValueOnce({
          status: 'complete',
          transactionHash: '0xtxhash456',
        });

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 2,
          initialDelayMs: 100,
        },
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;
      expect(result.transactionHash).toBe('0xtxhash456');
      expect(result.attempts).toBe(2);
    });

    it('should retry on missing transaction hash', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
        userOpHash: '0xhash123',
        status: 'broadcast',
      });
      // First attempt has no hash, second succeeds
      mockNetworkSmartWallet.waitForUserOperation
        .mockResolvedValueOnce({
          status: 'complete',
          transactionHash: null,
        })
        .mockResolvedValueOnce({
          status: 'complete',
          transactionHash: '0xtxhash456',
        });

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 2,
          initialDelayMs: 100,
        },
      });

      await vi.advanceTimersByTimeAsync(200);

      const result = await resultPromise;
      expect(result.transactionHash).toBe('0xtxhash456');
      expect(result.attempts).toBe(2);
    });

    it('should throw MaxRetriesExceededError after all retries exhausted', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
        userOpHash: '0xhash123',
        status: 'broadcast',
      });
      mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
        status: 'failed',
      });

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 2,
          initialDelayMs: 100,
          backoff: 'fixed',
        },
      });

      await vi.advanceTimersByTimeAsync(500);

      await expect(resultPromise).rejects.toThrow(MaxRetriesExceededError);
    });
  });

  describe('configuration validation', () => {
    it('should throw on invalid config', async () => {
      await expect(
        sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
          resilience: {
            maxRetries: -1,
          },
        })
      ).rejects.toThrow('Invalid resilience config');
    });
  });

  describe('max retries exceeded error', () => {
    it('should include all recovery actions in error', async () => {
      mockNetworkSmartWallet.sendUserOperation.mockRejectedValue(new Error('network error'));

      const resultPromise = sendUserOpWithResilience(mockNetworkSmartWallet as any, mockCalls, {
        timeoutSeconds: 60,
        resilience: {
          maxRetries: 2,
          initialDelayMs: 100,
          backoff: 'fixed',
        },
      });

      await vi.advanceTimersByTimeAsync(1000);

      try {
        await resultPromise;
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MaxRetriesExceededError);
        const maxRetriesError = error as MaxRetriesExceededError;
        expect(maxRetriesError.attempts).toBe(3);
        expect(maxRetriesError.recoveryActions.length).toBeGreaterThan(0);
        expect(maxRetriesError.totalTimeMs).toBeGreaterThan(0);
      }
    });
  });
});

describe('sendUserOpAndWaitWithResilience', () => {
  let mockNetworkSmartWallet: ReturnType<typeof createMockNetworkSmartWallet>;
  let mockCalls: PrepareChargeCall[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNetworkSmartWallet = createMockNetworkSmartWallet();
    mockCalls = [
      {
        to: '0x1234567890123456789012345678901234567890' as `0x${string}`,
        data: '0xabcdef' as `0x${string}`,
        value: 0n,
      },
    ];
  });

  it('should return transaction hash directly', async () => {
    mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
      userOpHash: '0xhash123',
      status: 'broadcast',
    });
    mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
      status: 'complete',
      transactionHash: '0xtxhash456',
    });

    const result = await sendUserOpAndWaitWithResilience(
      mockNetworkSmartWallet as any,
      mockCalls,
      undefined,
      60,
      'test'
    );

    expect(result).toBe('0xtxhash456');
  });

  it('should pass paymaster URL to underlying function', async () => {
    mockNetworkSmartWallet.sendUserOperation.mockResolvedValue({
      userOpHash: '0xhash123',
      status: 'broadcast',
    });
    mockNetworkSmartWallet.waitForUserOperation.mockResolvedValue({
      status: 'complete',
      transactionHash: '0xtxhash456',
    });

    await sendUserOpAndWaitWithResilience(
      mockNetworkSmartWallet as any,
      mockCalls,
      'https://paymaster.example.com',
      60,
      'test'
    );

    expect(mockNetworkSmartWallet.sendUserOperation).toHaveBeenCalledWith({
      calls: mockCalls,
      paymasterUrl: 'https://paymaster.example.com',
    });
  });
});
