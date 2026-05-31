import { describe, it, expect } from 'vitest';
import {
  isActionableHttpRequestError,
  isViemError,
  viemHttpErrorToProviderError,
} from './errors.js';

describe('isActionableHttpRequestError', () => {
  it('returns true for error with code -32090 and INSUFFICIENT_FUNDS type', () => {
    const error = {
      code: -32090,
      message: 'insufficient funds',
      data: { type: 'INSUFFICIENT_FUNDS' },
    };
    expect(isActionableHttpRequestError(error)).toBe(true);
  });

  it('returns false for error with wrong code', () => {
    const error = {
      code: -32000,
      message: 'execution reverted',
      data: { type: 'INSUFFICIENT_FUNDS' },
    };
    expect(isActionableHttpRequestError(error)).toBe(false);
  });

  it('returns false for error without data field', () => {
    const error = { code: -32090, message: 'insufficient funds' };
    expect(isActionableHttpRequestError(error)).toBe(false);
  });

  it('returns false for null input', () => {
    expect(isActionableHttpRequestError(null)).toBe(false);
  });

  it('returns false for primitive types', () => {
    expect(isActionableHttpRequestError('not an object')).toBe(false);
    expect(isActionableHttpRequestError(42)).toBe(false);
  });
});

describe('isViemError', () => {
  it('returns true for object with details property', () => {
    const error = { details: 'some error details', code: -32090 };
    expect(isViemError(error)).toBe(true);
  });

  it('returns false for object without details', () => {
    const error = { code: -32090, message: 'error' };
    expect(isViemError(error)).toBe(false);
  });

  it('returns false for null', () => {
    expect(isViemError(null)).toBe(false);
  });

  it('returns false for primitive string', () => {
    expect(isViemError('error string')).toBe(false);
  });
});

describe('viemHttpErrorToProviderError', () => {
  it('parses valid JSON details and returns EthereumRpcError', () => {
    const error = {
      details: JSON.stringify({
        code: -32000,
        message: 'execution reverted',
        data: '0x',
      }),
    } as any;
    const result = viemHttpErrorToProviderError(error);
    expect(result).not.toBeNull();
    expect(result?.code).toBe(-32000);
    expect(result?.message).toBe('execution reverted');
  });

  it('returns null for non-parseable details string', () => {
    const error = { details: 'not valid json' } as any;
    expect(viemHttpErrorToProviderError(error)).toBeNull();
  });

  it('returns null for empty details', () => {
    const error = { details: '' } as any;
    expect(viemHttpErrorToProviderError(error)).toBeNull();
  });
});
