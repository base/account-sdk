import { type Address, getAddress } from 'viem';

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

  const numAmount = parseFloat(amount);

  if (isNaN(numAmount)) {
    throw new Error('Invalid amount: must be a valid number');
  }

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
 * Validates that a base-unit amount (wei) is provided as a positive integer string
 * @param amount - Amount expressed in smallest unit (e.g., wei)
 * @returns bigint representation of the amount
 */
export function validateBaseUnitAmount(amount: string): bigint {
  if (typeof amount !== 'string') {
    throw new Error('Invalid amount: must be provided as a string');
  }

  const trimmed = amount.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid amount: value is required');
  }

  if (!/^\d+$/.test(trimmed)) {
    throw new Error('Invalid amount: payWithToken expects an integer amount in wei');
  }

  const parsed = BigInt(trimmed);
  if (parsed <= BigInt(0)) {
    throw new Error('Invalid amount: must be greater than 0');
  }

  return parsed;
}

/**
 * Normalizes a user-supplied chain ID (number, decimal string, or hex string)
 * into a positive integer.
 * @param chainId - Chain identifier
 */
export function normalizeChainId(chainId: number | string): number {
  if (typeof chainId === 'number') {
    if (!Number.isFinite(chainId) || !Number.isInteger(chainId) || chainId <= 0) {
      throw new Error('Invalid chainId: must be a positive integer');
    }
    return chainId;
  }

  if (typeof chainId !== 'string') {
    throw new Error('Invalid chainId: must be a number or a string');
  }

  const trimmed = chainId.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid chainId: value is required');
  }

  let parsedValue: number;

  if (/^0x/i.test(trimmed)) {
    try {
      parsedValue = Number(BigInt(trimmed));
    } catch {
      throw new Error('Invalid chainId: hex string could not be parsed');
    }
  } else {
    parsedValue = Number.parseInt(trimmed, 10);
  }

  if (!Number.isFinite(parsedValue) || !Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error('Invalid chainId: must resolve to a positive integer');
  }

  return parsedValue;
}
