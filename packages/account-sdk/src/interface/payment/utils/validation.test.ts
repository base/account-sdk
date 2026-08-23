import { describe, expect, it } from 'vitest';
import {
  UINT48_MAX,
  normalizeAddress,
  validatePositiveSafeInteger,
  validateStringAmount,
} from './validation.js';

describe('validateStringAmount', () => {
  it('should validate valid amounts', () => {
    expect(() => validateStringAmount('10.50', 6)).not.toThrow();
    expect(() => validateStringAmount('0.01', 6)).not.toThrow();
    expect(() => validateStringAmount('1000', 6)).not.toThrow();
    expect(() => validateStringAmount('1.2', 6)).not.toThrow();
    expect(() => validateStringAmount('10.123456', 6)).not.toThrow();
    expect(() => validateStringAmount('0.000001', 6)).not.toThrow();
  });

  it('should reject invalid amounts', () => {
    expect(() => validateStringAmount('0', 6)).toThrow('Invalid amount: must be greater than 0');
    // Negative values fail the strict decimal format check before the >0 guard.
    expect(() => validateStringAmount('-10', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('abc', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('10.1234567', 6)).toThrow(
      'Invalid amount: pay only supports up to 6 decimal places'
    );
  });

  it('should reject non-string amounts', () => {
    expect(() => validateStringAmount(10 as any, 6)).toThrow('Invalid amount: must be a string');
  });

  it('should validate amounts with exactly 6 decimal places', () => {
    expect(() => validateStringAmount('1.123456', 6)).not.toThrow();
    expect(() => validateStringAmount('999.999999', 6)).not.toThrow();
    expect(() => validateStringAmount('0.100000', 6)).not.toThrow();
  });

  it('should validate amounts with fewer than 6 decimal places', () => {
    expect(() => validateStringAmount('1.1', 6)).not.toThrow();
    expect(() => validateStringAmount('1.12', 6)).not.toThrow();
    expect(() => validateStringAmount('1.123', 6)).not.toThrow();
    expect(() => validateStringAmount('1.1234', 6)).not.toThrow();
    expect(() => validateStringAmount('1.12345', 6)).not.toThrow();
  });

  // Regression for https://github.com/base/account-sdk/issues/313
  it('should reject malformed numeric prefixes that parseFloat would silently accept', () => {
    expect(() => validateStringAmount('1abc', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('10x', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('1.5usdc', 6)).toThrow(
      'Invalid amount: must be a valid number'
    );
  });

  it('should reject multiple decimal points', () => {
    expect(() => validateStringAmount('1.2.3', 6)).toThrow(
      'Invalid amount: must be a valid number'
    );
    expect(() => validateStringAmount('..1', 6)).toThrow('Invalid amount: must be a valid number');
  });

  it('should reject scientific notation', () => {
    expect(() => validateStringAmount('1e5', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('1E-3', 6)).toThrow('Invalid amount: must be a valid number');
  });

  it('should reject explicit signs and surrounding whitespace', () => {
    expect(() => validateStringAmount('+1', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount(' 1', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('1 ', 6)).toThrow('Invalid amount: must be a valid number');
  });

  it('should reject leading or trailing decimal point', () => {
    expect(() => validateStringAmount('.5', 6)).toThrow('Invalid amount: must be a valid number');
    expect(() => validateStringAmount('5.', 6)).toThrow('Invalid amount: must be a valid number');
  });

  it('should reject the empty string', () => {
    expect(() => validateStringAmount('', 6)).toThrow('Invalid amount: must be a valid number');
  });
});

// Regression for https://github.com/base/account-sdk/issues/314
describe('validatePositiveSafeInteger', () => {
  it('should accept positive integers in range', () => {
    expect(() => validatePositiveSafeInteger(1, 'periodInDays')).not.toThrow();
    expect(() => validatePositiveSafeInteger(30, 'periodInDays')).not.toThrow();
    expect(() =>
      validatePositiveSafeInteger(UINT48_MAX, 'periodInSeconds', UINT48_MAX)
    ).not.toThrow();
  });

  it('should reject zero and negative values', () => {
    expect(() => validatePositiveSafeInteger(0, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
    expect(() => validatePositiveSafeInteger(-1, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
  });

  it('should reject non-integer numeric values', () => {
    expect(() => validatePositiveSafeInteger(1.5, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
    expect(() => validatePositiveSafeInteger(Number.NaN, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
    expect(() => validatePositiveSafeInteger(Infinity, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
  });

  it('should reject non-number types including string-looking numbers', () => {
    expect(() => validatePositiveSafeInteger('30' as unknown as number, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
    expect(() => validatePositiveSafeInteger(null as unknown as number, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
    expect(() =>
      validatePositiveSafeInteger(undefined as unknown as number, 'periodInDays')
    ).toThrow('periodInDays must be a positive integer');
  });

  it('should enforce the optional upper bound', () => {
    expect(() =>
      validatePositiveSafeInteger(UINT48_MAX + 1, 'periodInSeconds', UINT48_MAX)
    ).toThrow(`periodInSeconds must be at most ${UINT48_MAX}`);
  });

  it('should reject unsafe integers above Number.MAX_SAFE_INTEGER even without an upper bound', () => {
    expect(() => validatePositiveSafeInteger(Number.MAX_SAFE_INTEGER + 2, 'periodInDays')).toThrow(
      'periodInDays must be a positive integer'
    );
  });
});

describe('normalizeAddress', () => {
  it('should throw error for empty address', () => {
    expect(() => normalizeAddress('')).toThrow('Invalid address: address is required');
  });

  it('should throw error for invalid address', () => {
    expect(() => normalizeAddress('not-an-address')).toThrow(
      'Invalid address: must be a valid Ethereum address'
    );
    expect(() => normalizeAddress('0x123')).toThrow(
      'Invalid address: must be a valid Ethereum address'
    );
  });

  it('should accept and return checksummed address for valid checksummed address', () => {
    const checksummedAddress = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = normalizeAddress(checksummedAddress);
    expect(result).toBe(checksummedAddress);
  });

  it('should accept non-checksummed address and return checksummed version', () => {
    const nonChecksummedAddress = '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51';
    const expectedChecksummed = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = normalizeAddress(nonChecksummedAddress);
    expect(result).toBe(expectedChecksummed);
  });

  it('should accept all uppercase address and return checksummed version', () => {
    const upperCaseAddress = '0xFE21034794A5A574B94FE4FDFD16E005F1C96E51';
    const expectedChecksummed = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = normalizeAddress(upperCaseAddress);
    expect(result).toBe(expectedChecksummed);
  });

  it('should accept mixed case non-checksummed address and return checksummed version', () => {
    const mixedCaseAddress = '0xfE21034794a5A574b94fe4FDfD16E005f1C96e51';
    const expectedChecksummed = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const result = normalizeAddress(mixedCaseAddress);
    expect(result).toBe(expectedChecksummed);
  });
});
