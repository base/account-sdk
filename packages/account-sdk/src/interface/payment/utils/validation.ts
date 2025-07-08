import { isAddress } from 'viem';

/**
 * Checks if a string is a valid ENS name
 * @param name - The string to check
 * @returns True if the string appears to be an ENS name
 */
export function isENSName(name: string): boolean {
  // Must have content
  if (!name) {
    return false;
  }
  
  // Must contain a dot
  if (!name.includes('.')) {
    return false;
  }
  
  // Cannot be just a dot or have leading/trailing dots
  if (name === '.' || name.startsWith('.') || name.endsWith('.')) {
    return false;
  }
  
  // Must not be a valid address
  return !isAddress(name);
}

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
 * Validates that the recipient is a valid Ethereum address or ENS name
 * @param recipient - The recipient address or ENS name to validate
 * @throws Error if recipient is invalid
 */
export function validateRecipient(recipient: string): void {
  if (!recipient) {
    throw new Error('Invalid recipient: address or ENS name is required');
  }

  // Check if it's a valid ENS name
  if (isENSName(recipient)) {
    return; // ENS names are valid, will be resolved later
  }

  // Check if it's a valid Ethereum address
  if (!isAddress(recipient)) {
    throw new Error('Invalid recipient: must be a valid Ethereum address or ENS name');
  }
}

/**
 * @deprecated Use validateRecipient instead
 * Validates that the address is a valid Ethereum address
 * @param address - The address to validate
 * @throws Error if address is invalid
 */
export function validateAddress(address: string): void {
  validateRecipient(address);
}
