import { describe, expect, it, vi } from 'vitest';
import {
  analyzeFailure,
  calculateBackoffDelay,
  sleep,
  validateResilienceConfig,
  shouldIncreaseGas,
  shouldRefreshNonce,
  shouldFallbackToSponsored,
  formatDuration,
} from './utils.js';
import { InvalidResilienceConfigError } from './errors.js';

describe('analyzeFailure', () => {
  describe('recoverable errors', () => {
    it('should identify OUT_OF_GAS errors', () => {
      const testCases = [
        'out of gas',
        'gas too low',
        'intrinsic gas too low',
        'gas limit reached',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('OUT_OF_GAS');
        expect(result.isRecoverable).toBe(true);
        expect(result.suggestedAction).toBeDefined();
      }
    });

    it('should identify user operation failures as RPC_ERROR', () => {
      const testCases = ['User operation failed: 0xhash123', 'No transaction hash received'];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('RPC_ERROR');
        expect(result.isRecoverable).toBe(true);
      }
    });

    it('should identify NONCE_TOO_LOW errors', () => {
      const testCases = ['nonce too low', 'nonce has already been used', 'invalid nonce'];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('NONCE_TOO_LOW');
        expect(result.isRecoverable).toBe(true);
      }
    });

    it('should identify NONCE_TOO_HIGH errors', () => {
      const result = analyzeFailure(new Error('nonce too high'));
      expect(result.type).toBe('NONCE_TOO_HIGH');
      expect(result.isRecoverable).toBe(true);
    });

    it('should identify REPLACEMENT_UNDERPRICED errors', () => {
      const testCases = [
        'replacement transaction underpriced',
        'transaction underpriced',
        'gas price too low',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('REPLACEMENT_UNDERPRICED');
        expect(result.isRecoverable).toBe(true);
      }
    });

    it('should identify INSUFFICIENT_FUNDS_FOR_GAS errors', () => {
      const testCases = [
        'insufficient funds for gas',
        'insufficient balance for transfer',
        "sender doesn't have enough funds",
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('INSUFFICIENT_FUNDS_FOR_GAS');
        expect(result.isRecoverable).toBe(true);
      }
    });

    it('should identify TIMEOUT errors', () => {
      const testCases = ['timeout', 'timed out', 'deadline exceeded', 'request timeout'];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('TIMEOUT');
        expect(result.isRecoverable).toBe(true);
      }
    });

    it('should identify NETWORK_ERROR errors', () => {
      const testCases = [
        'network error',
        'connection refused',
        'ECONNREFUSED',
        'ENOTFOUND',
        'fetch failed',
        'network request failed',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('NETWORK_ERROR');
        expect(result.isRecoverable).toBe(true);
      }
    });

    it('should identify RPC_ERROR errors', () => {
      const testCases = [
        'rpc error',
        'internal json-rpc error',
        'error code -32000',
        'error -32603',
        'server error',
        'bad gateway',
        'service unavailable',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('RPC_ERROR');
        expect(result.isRecoverable).toBe(true);
      }
    });
  });

  describe('unrecoverable errors', () => {
    it('should identify USER_REJECTED errors', () => {
      const testCases = [
        'user rejected',
        'user denied',
        'user cancelled',
        'rejected by user',
        'action_rejected',
        'error code 4001',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('USER_REJECTED');
        expect(result.isRecoverable).toBe(false);
      }
    });

    it('should identify CONTRACT_REVERT errors', () => {
      const testCases = ['execution reverted', 'revert', 'VM Exception', 'call revert exception'];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('CONTRACT_REVERT');
        expect(result.isRecoverable).toBe(false);
      }
    });

    it('should identify INSUFFICIENT_TOKEN_BALANCE errors', () => {
      const testCases = [
        'insufficient token balance',
        'transfer amount exceeds balance',
        'ERC20: transfer amount exceeds balance',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('INSUFFICIENT_TOKEN_BALANCE');
        expect(result.isRecoverable).toBe(false);
      }
    });

    it('should identify PERMISSION_DENIED errors', () => {
      const testCases = [
        'permission denied',
        'not authorized',
        'unauthorized',
        'access denied',
        'forbidden',
      ];

      for (const message of testCases) {
        const result = analyzeFailure(new Error(message));
        expect(result.type).toBe('PERMISSION_DENIED');
        expect(result.isRecoverable).toBe(false);
      }
    });

    it('should return UNKNOWN for unrecognized errors', () => {
      const result = analyzeFailure(new Error('some random error'));
      expect(result.type).toBe('UNKNOWN');
      expect(result.isRecoverable).toBe(false);
    });
  });

  it('should extract error code from error object', () => {
    const error = new Error('test error') as Error & { code: number };
    error.code = -32000;
    const result = analyzeFailure(error);
    expect(result.code).toBe(-32000);
  });

  it('should preserve original message', () => {
    const originalMessage = 'The specific error message';
    const result = analyzeFailure(new Error(originalMessage));
    expect(result.originalMessage).toBe(originalMessage);
  });

  it('should prioritize unrecoverable over recoverable when both match', () => {
    // "execution reverted: out of gas" matches both CONTRACT_REVERT and OUT_OF_GAS
    // but user rejection should take priority
    const result = analyzeFailure(new Error('user rejected transaction'));
    expect(result.type).toBe('USER_REJECTED');
    expect(result.isRecoverable).toBe(false);
  });
});

describe('calculateBackoffDelay', () => {
  describe('exponential backoff', () => {
    it('should calculate exponential delays', () => {
      // With jitter disabled conceptually, check the base calculation
      const delay1 = calculateBackoffDelay(1, 'exponential', 1000, 30000);
      const delay2 = calculateBackoffDelay(2, 'exponential', 1000, 30000);
      const delay3 = calculateBackoffDelay(3, 'exponential', 1000, 30000);

      // Allow for jitter (±10%)
      expect(delay1).toBeGreaterThanOrEqual(900);
      expect(delay1).toBeLessThanOrEqual(1100);

      expect(delay2).toBeGreaterThanOrEqual(1800);
      expect(delay2).toBeLessThanOrEqual(2200);

      expect(delay3).toBeGreaterThanOrEqual(3600);
      expect(delay3).toBeLessThanOrEqual(4400);
    });

    it('should respect maxDelayMs', () => {
      const delay = calculateBackoffDelay(10, 'exponential', 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  describe('linear backoff', () => {
    it('should calculate linear delays', () => {
      const delay1 = calculateBackoffDelay(1, 'linear', 1000, 30000);
      const delay2 = calculateBackoffDelay(2, 'linear', 1000, 30000);
      const delay3 = calculateBackoffDelay(3, 'linear', 1000, 30000);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(3000);
    });
  });

  describe('fixed backoff', () => {
    it('should return constant delay', () => {
      const delay1 = calculateBackoffDelay(1, 'fixed', 1000, 30000);
      const delay2 = calculateBackoffDelay(5, 'fixed', 1000, 30000);
      const delay3 = calculateBackoffDelay(10, 'fixed', 1000, 30000);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(1000);
      expect(delay3).toBe(1000);
    });
  });
});

describe('sleep', () => {
  it('should delay for specified milliseconds', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(95); // Allow some margin
    expect(elapsed).toBeLessThan(200);
  });
});

describe('validateResilienceConfig', () => {
  it('should accept valid configuration', () => {
    expect(() =>
      validateResilienceConfig({
        maxRetries: 3,
        backoff: 'exponential',
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        gasMultiplier: 1.2,
      })
    ).not.toThrow();
  });

  it('should accept empty configuration', () => {
    expect(() => validateResilienceConfig({})).not.toThrow();
  });

  describe('maxRetries validation', () => {
    it('should reject negative maxRetries', () => {
      expect(() => validateResilienceConfig({ maxRetries: -1 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should reject non-integer maxRetries', () => {
      expect(() => validateResilienceConfig({ maxRetries: 1.5 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should reject maxRetries > 10', () => {
      expect(() => validateResilienceConfig({ maxRetries: 11 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should accept maxRetries = 0', () => {
      expect(() => validateResilienceConfig({ maxRetries: 0 })).not.toThrow();
    });
  });

  describe('initialDelayMs validation', () => {
    it('should reject negative initialDelayMs', () => {
      expect(() => validateResilienceConfig({ initialDelayMs: -100 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should accept initialDelayMs = 0', () => {
      expect(() => validateResilienceConfig({ initialDelayMs: 0 })).not.toThrow();
    });
  });

  describe('maxDelayMs validation', () => {
    it('should reject negative maxDelayMs', () => {
      expect(() => validateResilienceConfig({ maxDelayMs: -100 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should reject initialDelayMs > maxDelayMs', () => {
      expect(() =>
        validateResilienceConfig({
          initialDelayMs: 5000,
          maxDelayMs: 1000,
        })
      ).toThrow(InvalidResilienceConfigError);
    });
  });

  describe('gasMultiplier validation', () => {
    it('should reject gasMultiplier < 1', () => {
      expect(() => validateResilienceConfig({ gasMultiplier: 0.5 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should reject gasMultiplier > 3', () => {
      expect(() => validateResilienceConfig({ gasMultiplier: 4 })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should accept gasMultiplier = 1', () => {
      expect(() => validateResilienceConfig({ gasMultiplier: 1 })).not.toThrow();
    });
  });

  describe('fallbackToSponsored validation', () => {
    it('should reject fallbackToSponsored without fallbackPaymasterUrl', () => {
      expect(() => validateResilienceConfig({ fallbackToSponsored: true })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should accept fallbackToSponsored with fallbackPaymasterUrl', () => {
      expect(() =>
        validateResilienceConfig({
          fallbackToSponsored: true,
          fallbackPaymasterUrl: 'https://paymaster.example.com',
        })
      ).not.toThrow();
    });
  });

  describe('backoff validation', () => {
    it('should reject invalid backoff strategy', () => {
      expect(() => validateResilienceConfig({ backoff: 'invalid' as any })).toThrow(
        InvalidResilienceConfigError
      );
    });

    it('should accept valid backoff strategies', () => {
      expect(() => validateResilienceConfig({ backoff: 'linear' })).not.toThrow();
      expect(() => validateResilienceConfig({ backoff: 'exponential' })).not.toThrow();
      expect(() => validateResilienceConfig({ backoff: 'fixed' })).not.toThrow();
    });
  });
});

describe('helper functions', () => {
  describe('shouldIncreaseGas', () => {
    it('should return true for OUT_OF_GAS', () => {
      expect(shouldIncreaseGas('OUT_OF_GAS')).toBe(true);
    });

    it('should return false for other types', () => {
      expect(shouldIncreaseGas('NETWORK_ERROR')).toBe(false);
      expect(shouldIncreaseGas('USER_REJECTED')).toBe(false);
    });
  });

  describe('shouldRefreshNonce', () => {
    it('should return true for nonce errors', () => {
      expect(shouldRefreshNonce('NONCE_TOO_LOW')).toBe(true);
      expect(shouldRefreshNonce('NONCE_TOO_HIGH')).toBe(true);
    });

    it('should return false for other types', () => {
      expect(shouldRefreshNonce('NETWORK_ERROR')).toBe(false);
    });
  });

  describe('shouldFallbackToSponsored', () => {
    it('should return true for INSUFFICIENT_FUNDS_FOR_GAS', () => {
      expect(shouldFallbackToSponsored('INSUFFICIENT_FUNDS_FOR_GAS')).toBe(true);
    });

    it('should return false for other types', () => {
      expect(shouldFallbackToSponsored('OUT_OF_GAS')).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1500)).toBe('1.5s');
      expect(formatDuration(30000)).toBe('30.0s');
    });

    it('should format minutes', () => {
      expect(formatDuration(90000)).toBe('1.5m');
      expect(formatDuration(120000)).toBe('2.0m');
    });
  });
});
