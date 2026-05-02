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

  // Simple validation - in production, you'd want EIP-55 checksum validation
  return address.toLowerCase() as Address;
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
 * Trim leading zeros from bytes
 */
export function trim(bytes: Uint8Array): Uint8Array {
  let start = 0;
  for (; start < bytes.length && bytes[start] === 0; start++);
  return bytes.slice(start);
}
