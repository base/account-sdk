import { type Address, type Hex, getAddress, isHex } from 'viem';

/**
 * Maximum value for uint48, the on-chain slot width used by spend
 * permissions for period and timestamp fields. Exposed so callers can
 * bound user input (e.g. periodInDays, periodInSeconds) against the
 * exact range the contract accepts.
 */
export const UINT48_MAX = 281474976710655; // 2^48 - 1

/**
 * Strict decimal-string format: one or more digits, optionally followed
 * by a single '.' and one or more decimal digits. Rejects negatives,
 * explicit '+', scientific notation, leading/trailing '.', surrounding
 * whitespace, the empty string, and trailing non-numeric characters that
 * `parseFloat` would silently truncate (e.g. "1abc", "1.2.3").
 *
 * Pattern carries no anchors-by-default behavior—`test()` already
 * anchors via the explicit '^' and '$'.
 */
const STRICT_DECIMAL_RE = /^\d+(\.\d+)?$/;

/**
 * Validates that the amount is a positive string with max decimal places.
 *
 * Format rules (see {@link STRICT_DECIMAL_RE} for the regex):
 *   - Must be a `string`.
 *   - Must match a strict decimal literal—no signs, whitespace, or
 *     scientific notation. This closes a gap where `parseFloat` would
 *     accept "1abc" or "1.2.3" by reading only the numeric prefix.
 *   - Numeric value must be greater than 0.
 *   - Fractional part, if present, must be at most `maxDecimals` digits.
 *
 * @param amount - The amount to validate as a string
 * @param maxDecimals - Maximum number of decimal places allowed
 * @throws Error if amount is invalid
 */
export function validateStringAmount(amount: string, maxDecimals: number): void {
  if (typeof amount !== 'string') {
    throw new Error('Invalid amount: must be a string');
  }

  if (!STRICT_DECIMAL_RE.test(amount)) {
    throw new Error('Invalid amount: must be a valid number');
  }

  // Safe to parse now that the format is known to be a plain decimal.
  const numAmount = Number(amount);

  if (numAmount <= 0) {
    throw new Error('Invalid amount: must be greater than 0');
  }

  // Only allow specified decimal places
  const decimalIndex = amount.indexOf('.');
  if (decimalIndex !== -1) {
    const decimalPlaces = amount.length - decimalIndex - 1;
    if (decimalPlaces > maxDecimals) {
      throw new Error(`Invalid amount: pay only supports up to ${maxDecimals} decimal places`);
    }
  }
}

/**
 * Validates that `value` is a positive, finite, safe integer—and optionally
 * within an inclusive upper bound. Used to harden parameters that eventually
 * land in EIP-712 typed data slots (e.g. spend-permission period fields), so
 * malformed inputs can't reach the wallet signing step.
 *
 * @param value - Candidate value (untyped on purpose; this is a runtime guard)
 * @param fieldName - Human-readable field name surfaced in the error message
 * @param max - Optional inclusive upper bound (e.g. {@link UINT48_MAX})
 * @throws Error if `value` is not a positive safe integer, or exceeds `max`
 */
export function validatePositiveSafeInteger(value: unknown, fieldName: string, max?: number): void {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }

  if (max !== undefined && value > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }
}

/**
 * Validates that the address is a valid Ethereum address
 * @param address - The address to validate
 * @throws Error if address is invalid
 * @returns The checksummed address
 */
export function normalizeAddress(address: string): Address {
  if (!address) {
    throw new Error('Invalid address: address is required');
  }

  try {
    // getAddress will normalize the address to its checksummed version
    // It will throw if the address is invalid
    return getAddress(address);
  } catch (_error) {
    throw new Error('Invalid address: must be a valid Ethereum address');
  }
}

/**
 * Validates data suffix format.
 * @param dataSuffix - 0x-prefixed hex data suffix
 * @throws Error if data suffix is invalid
 */
export function validateDataSuffix(dataSuffix: string): Hex {
  if (!isHex(dataSuffix)) {
    throw new Error('Invalid dataSuffix: expected a 0x-prefixed hex string');
  }
  return dataSuffix;
}
