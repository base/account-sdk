/**
 * Lightweight encoding utilities
 * Minimal replacements for viem functions to reduce bundle size
 */

export type Hex = `0x${string}`;
export type Address = `0x${string}`;
export type ByteArray = Uint8Array;

const hexes = Array.from({ length: 256 }, (_v, i) =>
  i.toString(16).padStart(2, '0')
);

/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): Hex {
  let hex = '0x';
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex as Hex;
}

/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex: Hex | string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new TypeError('Expected string');
  }

  const hexString = hex.startsWith('0x') ? hex.slice(2) : hex;

  if (hexString.length % 2 !== 0) {
    throw new Error('Hex string must have an even number of characters');
  }

  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const j = i * 2;
    bytes[i] = Number.parseInt(hexString.slice(j, j + 2), 16);
  }

  return bytes;
}

/**
 * Convert string to bytes (UTF-8)
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert number to hex string
 */
export function numberToHex(num: number | bigint, opts?: { size?: number }): Hex {
  const hex = num.toString(16);

  if (opts?.size) {
    return `0x${hex.padStart(opts.size * 2, '0')}` as Hex;
  }

  // Special case for 0 to match viem behavior
  if (num === 0 || num === 0n) {
    return '0x0' as Hex;
  }

  return `0x${hex.length % 2 === 0 ? hex : `0${hex}`}` as Hex;
}

/**
 * Convert value to hex
 */
export function toHex(
  value: string | number | bigint | boolean | Uint8Array,
  opts?: { size?: number }
): Hex {
  if (typeof value === 'number' || typeof value === 'bigint') {
    return numberToHex(value, opts);
  }

  if (typeof value === 'boolean') {
    return value ? '0x1' : '0x0';
  }

  if (value instanceof Uint8Array) {
    return bytesToHex(value);
  }

  return bytesToHex(stringToBytes(value));
}

/**
 * Check if value is hex string
 */
export function isHex(value: unknown): value is Hex {
  return typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value);
}

/**
 * Validate and normalize address (EIP-55 checksum)
 */
export function getAddress(address: string): Address {
  if (!isHex(address) || address.length !== 42) {
    throw new Error('Invalid address');
  }

  // Import keccak256 dynamically to avoid circular dependencies
  // This is needed for proper EIP-55 checksumming
  const { keccak256 } = require('viem');

  // Remove 0x prefix and convert to lowercase
  const addressWithoutPrefix = address.slice(2).toLowerCase();

  // Hash the lowercase address
  const hash = keccak256(stringToBytes(addressWithoutPrefix)).slice(2);

  // Apply EIP-55 checksum
  let checksummed = '0x';
  for (let i = 0; i < 40; i++) {
    // If hash byte is >= 8, uppercase the address character
    const hashByte = parseInt(hash[i], 16);
    if (hashByte >= 8) {
      checksummed += addressWithoutPrefix[i].toUpperCase();
    } else {
      checksummed += addressWithoutPrefix[i];
    }
  }

  return checksummed as Address;
}

/**
 * Check if value is valid address
 */
export function isAddress(value: unknown): value is Address {
  return (
    typeof value === 'string' &&
    /^0x[0-9a-fA-F]{40}$/.test(value)
  );
}

/**
 * Check if two addresses are equal
 */
export function isAddressEqual(a: Address, b: Address): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Parse unit string to bigint (e.g., "1.5" with 6 decimals -> 1500000n)
 */
export function parseUnits(value: string, decimals: number): bigint {
  let [integer, fraction = ''] = value.split('.');

  const negative = integer.startsWith('-');
  if (negative) {
    integer = integer.slice(1);
  }

  // Pad or truncate fraction
  fraction = fraction.padEnd(decimals, '0').slice(0, decimals);

  const result = BigInt(`${integer}${fraction}`);
  return negative ? -result : result;
}

/**
 * Format bigint to unit string (e.g., 1500000n with 6 decimals -> "1.5")
 */
export function formatUnits(value: bigint, decimals: number): string {
  let display = value.toString();
  const negative = display.startsWith('-');

  if (negative) {
    display = display.slice(1);
  }

  display = display.padStart(decimals + 1, '0');

  const integer = display.slice(0, display.length - decimals) || '0';
  const fraction = display.slice(display.length - decimals);

  const formatted = `${integer}.${fraction}`.replace(/\.?0+$/, '');
  return negative ? `-${formatted}` : formatted;
}

/**
 * Trim leading zeros from hex or bytes
 */
export function trim(value: Hex): Hex;
export function trim(value: Uint8Array): Uint8Array;
export function trim(value: Hex | Uint8Array): Hex | Uint8Array {
  if (typeof value === 'string') {
    // Trim leading zeros from hex string
    let hex = value.startsWith('0x') ? value.slice(2) : value;
    hex = hex.replace(/^0+/, '') || '0';
    return `0x${hex}` as Hex;
  }

  // Trim leading zeros from bytes
  let start = 0;
  for (; start < value.length && value[start] === 0; start++);
  return value.slice(start);
}
