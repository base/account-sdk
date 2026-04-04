import { type Address, type Hex, getAddress, isHex } from 'viem';

import { ValidationError } from ':core/error/sdkErrors.js';

/**
 * Validates that the amount is a positive string with max decimal places
 * @param amount - The amount to validate as a string
 * @param maxDecimals - Maximum number of decimal places allowed
 * @throws ValidationError if amount is invalid
 */
export function validateStringAmount(amount: string, maxDecimals: number): void {
  if (typeof amount !== 'string') {
    throw new ValidationError(
      `Invalid amount: must be a string, received ${typeof amount}`,
      'amount',
      amount,
      'string',
    );
  }

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    throw new ValidationError(
      `Invalid amount: "${amount}" is not a valid number`,
      'amount',
      amount,
      'a positive decimal number (e.g. "10.50")',
    );
  }

  if (numAmount <= 0) {
    throw new ValidationError(
      `Invalid amount: ${amount} must be greater than 0`,
      'amount',
      amount,
      'a positive number greater than 0',
    );
  }

  // Only allow specified decimal places
  const decimalIndex = amount.indexOf('.');
  if (decimalIndex !== -1) {
    const decimalPlaces = amount.length - decimalIndex - 1;
    if (decimalPlaces > maxDecimals) {
      throw new ValidationError(
        `Invalid amount: "${amount}" has ${decimalPlaces} decimal places, maximum is ${maxDecimals}`,
        'amount',
        amount,
        `up to ${maxDecimals} decimal places`,
      );
    }
  }
}

/**
 * Validates that the address is a valid Ethereum address
 * @param address - The address to validate
 * @throws ValidationError if address is invalid
 * @returns The checksummed address
 */
export function normalizeAddress(address: string): Address {
  if (!address) {
    throw new ValidationError(
      'Invalid address: address is required',
      'address',
      address,
      '0x-prefixed 20-byte Ethereum address',
    );
  }

  try {
    // getAddress will normalize the address to its checksummed version
    // It will throw if the address is invalid
    return getAddress(address);
  } catch (_error) {
    throw new ValidationError(
      `Invalid address: "${address}" is not a valid Ethereum address`,
      'address',
      address,
      '0x-prefixed 20-byte Ethereum address (e.g. "0xAb5801a7...")',
    );
  }
}

/**
 * Validates data suffix format.
 * @param dataSuffix - 0x-prefixed hex data suffix
 * @throws ValidationError if data suffix is invalid
 */
export function validateDataSuffix(dataSuffix: string): Hex {
  if (!isHex(dataSuffix)) {
    throw new ValidationError(
      `Invalid dataSuffix: "${dataSuffix}" is not a valid hex string`,
      'dataSuffix',
      dataSuffix,
      '0x-prefixed hex string (e.g. "0x1234abcd")',
    );
  }
  return dataSuffix;
}
