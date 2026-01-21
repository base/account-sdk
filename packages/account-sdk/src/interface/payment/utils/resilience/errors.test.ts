import { describe, expect, it } from 'vitest';
import {
  ResilienceError,
  MaxRetriesExceededError,
  UnrecoverableTransactionError,
  InvalidResilienceConfigError,
  isResilienceError,
  isMaxRetriesExceededError,
  isUnrecoverableTransactionError,
} from './errors.js';
import type { FailureAnalysis, RecoveryAction } from './types.js';

describe('ResilienceError', () => {
  it('should create error with message and code', () => {
    const error = new ResilienceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('ResilienceError');
    expect(error instanceof Error).toBe(true);
  });

  it('should have proper stack trace', () => {
    const error = new ResilienceError('Test error', 'TEST_CODE');
    expect(error.stack).toBeDefined();
  });
});

describe('MaxRetriesExceededError', () => {
  const createTestError = () => {
    const lastError = new Error('Final failure');
    const failureAnalysis: FailureAnalysis = {
      type: 'NETWORK_ERROR',
      isRecoverable: true,
      description: 'Network connectivity issue',
      originalMessage: 'fetch failed',
    };
    const recoveryActions: RecoveryAction[] = [
      { type: 'retry', description: 'Retry attempt 1', timestamp: new Date() },
      { type: 'retry', description: 'Retry attempt 2', timestamp: new Date() },
    ];

    return new MaxRetriesExceededError(lastError, failureAnalysis, 3, 5000, recoveryActions);
  };

  it('should create error with all properties', () => {
    const error = createTestError();

    expect(error.message).toContain('3 attempts');
    expect(error.message).toContain('5000ms');
    expect(error.code).toBe('MAX_RETRIES_EXCEEDED');
    expect(error.name).toBe('MaxRetriesExceededError');
    expect(error.attempts).toBe(3);
    expect(error.totalTimeMs).toBe(5000);
    expect(error.recoveryActions).toHaveLength(2);
    expect(error.lastError.message).toBe('Final failure');
    expect(error.lastFailureAnalysis.type).toBe('NETWORK_ERROR');
  });

  it('should generate recovery summary', () => {
    const error = createTestError();
    const summary = error.getRecoverySummary();

    expect(summary).toContain('Retry attempt 1');
    expect(summary).toContain('Retry attempt 2');
  });

  it('should handle empty recovery actions', () => {
    const error = new MaxRetriesExceededError(
      new Error('Test'),
      {
        type: 'UNKNOWN',
        isRecoverable: false,
        description: 'Unknown',
        originalMessage: 'test',
      },
      1,
      100,
      []
    );

    expect(error.getRecoverySummary()).toBe('No recovery actions were attempted.');
  });
});

describe('UnrecoverableTransactionError', () => {
  it('should create error with failure analysis', () => {
    const originalError = new Error('User rejected');
    const failureAnalysis: FailureAnalysis = {
      type: 'USER_REJECTED',
      isRecoverable: false,
      description: 'User rejected the transaction',
      originalMessage: 'User rejected',
    };

    const error = new UnrecoverableTransactionError(originalError, failureAnalysis, 1);

    expect(error.message).toContain('Unrecoverable');
    expect(error.code).toBe('UNRECOVERABLE_ERROR');
    expect(error.name).toBe('UnrecoverableTransactionError');
    expect(error.originalError).toBe(originalError);
    expect(error.failureAnalysis).toBe(failureAnalysis);
    expect(error.attempts).toBe(1);
  });

  it('should provide suggested actions for USER_REJECTED', () => {
    const error = new UnrecoverableTransactionError(
      new Error('rejected'),
      {
        type: 'USER_REJECTED',
        isRecoverable: false,
        description: 'User rejected',
        originalMessage: 'rejected',
      },
      1
    );

    const actions = error.getSuggestedActions();
    expect(actions).toContain('Please approve the transaction in your wallet');
  });

  it('should provide suggested actions for INSUFFICIENT_TOKEN_BALANCE', () => {
    const error = new UnrecoverableTransactionError(
      new Error('insufficient'),
      {
        type: 'INSUFFICIENT_TOKEN_BALANCE',
        isRecoverable: false,
        description: 'Insufficient balance',
        originalMessage: 'insufficient',
      },
      1
    );

    const actions = error.getSuggestedActions();
    expect(actions).toContain('Ensure you have sufficient token balance');
  });

  it('should provide suggested actions for CONTRACT_REVERT', () => {
    const error = new UnrecoverableTransactionError(
      new Error('reverted'),
      {
        type: 'CONTRACT_REVERT',
        isRecoverable: false,
        description: 'Contract reverted',
        originalMessage: 'reverted',
      },
      1
    );

    const actions = error.getSuggestedActions();
    expect(actions).toContain('The smart contract rejected the transaction');
  });

  it('should provide suggested actions for PERMISSION_DENIED', () => {
    const error = new UnrecoverableTransactionError(
      new Error('denied'),
      {
        type: 'PERMISSION_DENIED',
        isRecoverable: false,
        description: 'Permission denied',
        originalMessage: 'denied',
      },
      1
    );

    const actions = error.getSuggestedActions();
    expect(actions).toContain('You do not have permission to perform this action');
  });

  it('should provide default actions for unknown types', () => {
    const error = new UnrecoverableTransactionError(
      new Error('unknown'),
      {
        type: 'UNKNOWN',
        isRecoverable: false,
        description: 'Unknown error',
        originalMessage: 'unknown',
      },
      1
    );

    const actions = error.getSuggestedActions();
    expect(actions).toContain('Please try again or contact support');
  });
});

describe('InvalidResilienceConfigError', () => {
  it('should create error with config details', () => {
    const error = new InvalidResilienceConfigError('maxRetries', -1, 'must be non-negative');

    expect(error.message).toContain('maxRetries');
    expect(error.message).toContain('-1');
    expect(error.message).toContain('must be non-negative');
    expect(error.code).toBe('INVALID_CONFIG');
    expect(error.field).toBe('maxRetries');
    expect(error.value).toBe(-1);
    expect(error.constraint).toBe('must be non-negative');
  });
});

describe('Type guards', () => {
  describe('isResilienceError', () => {
    it('should return true for ResilienceError', () => {
      const error = new ResilienceError('test', 'TEST');
      expect(isResilienceError(error)).toBe(true);
    });

    it('should return true for MaxRetriesExceededError', () => {
      const error = new MaxRetriesExceededError(
        new Error('test'),
        { type: 'UNKNOWN', isRecoverable: false, description: '', originalMessage: '' },
        1,
        100,
        []
      );
      expect(isResilienceError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      expect(isResilienceError(new Error('test'))).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isResilienceError('not an error')).toBe(false);
      expect(isResilienceError(null)).toBe(false);
      expect(isResilienceError(undefined)).toBe(false);
    });
  });

  describe('isMaxRetriesExceededError', () => {
    it('should return true for MaxRetriesExceededError', () => {
      const error = new MaxRetriesExceededError(
        new Error('test'),
        { type: 'UNKNOWN', isRecoverable: false, description: '', originalMessage: '' },
        1,
        100,
        []
      );
      expect(isMaxRetriesExceededError(error)).toBe(true);
    });

    it('should return false for other ResilienceErrors', () => {
      const error = new ResilienceError('test', 'TEST');
      expect(isMaxRetriesExceededError(error)).toBe(false);
    });
  });

  describe('isUnrecoverableTransactionError', () => {
    it('should return true for UnrecoverableTransactionError', () => {
      const error = new UnrecoverableTransactionError(
        new Error('test'),
        { type: 'USER_REJECTED', isRecoverable: false, description: '', originalMessage: '' },
        1
      );
      expect(isUnrecoverableTransactionError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      expect(isUnrecoverableTransactionError(new Error('test'))).toBe(false);
    });
  });
});
