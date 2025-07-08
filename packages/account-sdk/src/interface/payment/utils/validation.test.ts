import { describe, expect, it } from 'vitest';
import { validateAddress, validateRecipient, validateStringAmount } from './validation.js';

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

describe('validateRecipient', () => {
  it('should validate valid Ethereum addresses', () => {
    expect(() => validateRecipient('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).not.toThrow();
    expect(() => validateRecipient('0xFe21034794A5a574B94fE4fDfD16e005F1C96e51')).not.toThrow();
  });

  it('should validate ENS names', () => {
    expect(() => validateRecipient('vitalik.eth')).not.toThrow();
    expect(() => validateRecipient('test.xyz')).not.toThrow();
    expect(() => validateRecipient('name.base')).not.toThrow();
    expect(() => validateRecipient('user.cb.id')).not.toThrow();
  });

  it('should reject invalid recipients', () => {
    expect(() => validateRecipient('')).toThrow('Invalid recipient: address or ENS name is required');
    expect(() => validateRecipient('invalid-address')).toThrow('Invalid recipient: must be a valid Ethereum address or ENS name');
    expect(() => validateRecipient('0xinvalid')).toThrow('Invalid recipient: must be a valid Ethereum address or ENS name');
  });
});

describe('validateAddress (deprecated)', () => {
  it('should work the same as validateRecipient', () => {
    expect(() => validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).not.toThrow();
    expect(() => validateAddress('vitalik.eth')).not.toThrow();
    expect(() => validateAddress('invalid')).toThrow('Invalid recipient: must be a valid Ethereum address or ENS name');
  });
}); 