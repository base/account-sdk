import { isAddress } from 'viem';

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
 */
export function validateAddress(address: string): void {
  if (!address) {
    throw new Error('Invalid recipient: address is required');
  }
  
  if (!isAddress(address)) {
    throw new Error('Invalid recipient: must be a valid Ethereum address');
  }
}