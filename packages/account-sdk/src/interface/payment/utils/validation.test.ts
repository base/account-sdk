import { describe, expect, it } from 'vitest';
import { validateStringAmount } from './validation.js';

describe('validateStringAmount', () => {
  it('should validate valid amounts', () => {
    expect(() => validateStringAmount('10.50', 2)).not.toThrow();
    expect(() => validateStringAmount('0.01', 2)).not.toThrow();
    expect(() => validateStringAmount('1000', 2)).not.toThrow();
    expect(() => validateStringAmount('1.2', 2)).not.toThrow();
  });

  it('should reject invalid amounts', () => {
    expect(() => validateStringAmount('0', 2)).toThrow('Invalid amount: must be greater than 0');
    expect(() => validateStringAmount('-10', 2)).toThrow('Invalid amount: must be greater than 0');
    expect(() => validateStringAmount('abc', 2)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('10.123', 2)).toThrow('Invalid amount: pay only supports up to 2 decimal places');
  });

  it('should reject non-string amounts', () => {
    expect(() => validateStringAmount(10 as any, 2)).toThrow('Invalid amount: must be a string');
  });
});