import { type Address, type Hex, getAddress, isHex } from 'viem';

/**
 * Validates that the amount is a positive string with max decimal places
 * @param amount - The amount to validate as a string
 * @param maxDecimals - Maximum number of decimal places allowed
 * @throws Error if amount is invalid
 */
export function validateStringAmount(amount: string, maxDecimals: number): void {
  if (typeof amount !== 'string') {
    throw new Error('Invalid amount: must be a string');
  }

  // Use a regex to validate the format before parsing
  // This prevents parseFloat from accepting malformed strings like "1abc"
  const trimmed = amount.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error('Invalid amount: must be a valid decimal number');
  }

  const numAmount = parseFloat(trimmed);

  if (isNaN(numAmount) || !isFinite(numAmount)) {
    throw new Error('Invalid amount: must be a valid number');
  }

  if (numAmount <= 0) {
    throw new Error('Invalid amount: must be greater than 0');
  }

  // Only allow specified decimal places
  const decimalIndex = trimmed.indexOf('.');
  if (decimalIndex !== -1) {
    const decimalPlaces = trimmed.length - decimalIndex - 1;
    if (decimalPlaces > maxDecimals) {
      throw new Error(`Invalid amount: pay only supports up to ${maxDecimals} decimal places`);
    }
  }
}

/**
 * Validates that periodInDays is a positive safe integer
 * @param periodInDays - The period in days to validate
 * @throws Error if period is invalid
 */
export function validatePeriodInDays(periodInDays: number): void {
  if (!Number.isSafeInteger(periodInDays) || periodInDays <= 0) {
    throw new Error(
      `Invalid periodInDays: must be a positive integer (received ${periodInDays})`
    );
  }
}

/**
 * Validates that periodInSeconds is a positive safe integer
 * @param periodInSeconds - The period in seconds to validate
 * @throws Error if period is invalid
 */
export function validatePeriodInSeconds(periodInSeconds: number): void {
  if (!Number.isSafeInteger(periodInSeconds) || periodInSeconds <= 0) {
    throw new Error(
      `Invalid periodInSeconds: must be a positive integer (received ${periodInSeconds})`
    );
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
