import { describe, expect, it } from 'vitest';
import { validateAddress, validateStringAmount } from './validation.js';

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
    expect(() => validateStringAmount('10.123', 2)).toThrow(
      'Invalid amount: pay only supports up to 2 decimal places'
    );
  });

  it('should reject non-string amounts', () => {
    expect(() => validateStringAmount(10 as any, 2)).toThrow('Invalid amount: must be a string');
  });
});

describe('validateAddress', () => {
  it('should throw error for empty address', () => {
    expect(() => validateAddress('')).toThrow('Invalid address: address is required');
  });

  it('should throw error for invalid address', () => {
    expect(() => validateAddress('not-an-address')).toThrow(
      'Invalid address: must be a valid Ethereum address'
    );
    expect(() => validateAddress('0x123')).toThrow(
      'Invalid address: must be a valid Ethereum address'
    );
  });

  it('should accept and return checksummed address for valid checksummed address', () => {
    const checksummedAddress = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = validateAddress(checksummedAddress);
    expect(result).toBe(checksummedAddress);
  });

  it('should accept non-checksummed address and return checksummed version', () => {
    const nonChecksummedAddress = '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51';
    const expectedChecksummed = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = validateAddress(nonChecksummedAddress);
    expect(result).toBe(expectedChecksummed);
  });

  it('should accept all uppercase address and return checksummed version', () => {
    const upperCaseAddress = '0xFE21034794A5A574B94FE4FDFD16E005F1C96E51';
    const expectedChecksummed = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = validateAddress(upperCaseAddress);
    expect(result).toBe(expectedChecksummed);
  });

  it('should accept mixed case non-checksummed address and return checksummed version', () => {
    const mixedCaseAddress = '0xfE21034794a5A574b94fe4FDfD16E005f1C96e51';
    const expectedChecksummed = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = validateAddress(mixedCaseAddress);
    expect(result).toBe(expectedChecksummed);
  });
});
