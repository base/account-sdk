// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

/**
 * Field encoding helpers for canonical encoding
 */

/**
 * Encode an Ethereum address to 20 bytes
 * @param address - Hex address string (with or without 0x prefix)
 * @returns 20-byte address
 * @throws Error if address is not 20 bytes
 */
export function encodeAddress(address: string): Uint8Array {
  // Remove 0x prefix if present and normalize to lowercase
  const normalized = address.toLowerCase().replace(/^0x/, '');
  
  if (normalized.length !== 40) {
    throw new Error(`Invalid address length: expected 40 hex chars, got ${normalized.length}`);
  }

  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

/**
 * Decode 20-byte address to hex string
 * @param bytes - 20-byte address
 * @returns Hex address string with 0x prefix
 */
export function decodeAddress(bytes: Uint8Array): string {
  if (bytes.length !== 20) {
    throw new Error(`Invalid address length: expected 20 bytes, got ${bytes.length}`);
  }

  let hex = '0x';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Encode an amount to minimal big-endian bytes (no leading zeros)
 * @param value - Amount as bigint or hex string
 * @returns Minimal big-endian bytes
 */
export function encodeAmount(value: bigint | string): Uint8Array {
  let bigintValue: bigint;

  if (typeof value === 'string') {
    // Handle hex strings
    const normalized = value.toLowerCase().replace(/^0x/, '');
    if (normalized === '' || normalized === '0') {
      return new Uint8Array([0x00]);
    }
    bigintValue = BigInt(`0x${normalized}`);
  } else {
    bigintValue = value;
  }

  // Handle zero
  if (bigintValue === 0n) {
    return new Uint8Array([0x00]);
  }

  // Handle negative (not allowed)
  if (bigintValue < 0n) {
    throw new Error('Cannot encode negative amounts');
  }

  // Convert to minimal big-endian bytes
  const hex = bigintValue.toString(16);
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  
  for (let i = 0; i < bytes.length; i++) {
    const offset = hex.length - (bytes.length - i) * 2;
    const byteHex = offset < 0 ? hex[0] : hex.slice(offset, offset + 2);
    bytes[i] = Number.parseInt(byteHex, 16);
  }

  return bytes;
}

/**
 * Decode minimal big-endian bytes to bigint
 * @param bytes - Minimal big-endian bytes (or empty for zero)
 * @returns Amount as bigint
 */
export function decodeAmount(bytes: Uint8Array): bigint {
  if (bytes.length === 0) {
    return 0n;
  }

  // Validate no leading zeros (except for single 0x00)
  if (bytes.length > 1 && bytes[0] === 0) {
    throw new Error('Invalid amount encoding: leading zeros not allowed');
  }

  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }

  return BigInt(`0x${hex}`);
}

/**
 * Encode capabilities map to protobuf format
 * @param caps - Capabilities object
 * @returns Map with UTF-8 JSON-encoded values
 */
export function encodeCapabilities(caps: Record<string, unknown>): Map<string, Uint8Array> {
  const map = new Map<string, Uint8Array>();

  for (const [key, value] of Object.entries(caps)) {
    const json = JSON.stringify(value);
    const bytes = new TextEncoder().encode(json);
    map.set(key, bytes);
  }

  return map;
}

/**
 * Decode capabilities map from protobuf format
 * @param map - Map with UTF-8 JSON-encoded values
 * @returns Capabilities object
 */
export function decodeCapabilities(map: Map<string, Uint8Array>): Record<string, unknown> {
  const caps: Record<string, unknown> = {};

  for (const [key, bytes] of map.entries()) {
    try {
      const json = new TextDecoder().decode(bytes);
      caps[key] = JSON.parse(json);
    } catch (error) {
      throw new Error(
        `Failed to decode capability '${key}': ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  return caps;
}

/**
 * Pad a value to 32 bytes (for EIP-712 encoding)
 * @param bytes - Value to pad
 * @returns 32-byte padded value
 */
export function pad32(bytes: Uint8Array): Uint8Array {
  if (bytes.length > 32) {
    throw new Error(`Cannot pad value larger than 32 bytes: ${bytes.length}`);
  }

  const padded = new Uint8Array(32);
  // Left-pad with zeros
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

/**
 * Convert bytes to hex string with 0x prefix
 * Minimal encoding: no leading zeros unless value is zero
 * @param bytes - Bytes to convert
 * @returns Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  if (bytes.length === 0) {
    return '0x0';
  }

  // For single byte 0, return 0x0
  if (bytes.length === 1 && bytes[0] === 0) {
    return '0x0';
  }

  let hex = '0x';
  let foundNonZero = false;

  for (let i = 0; i < bytes.length; i++) {
    // Skip leading zero bytes (but keep the last byte even if it's zero)
    if (!foundNonZero && bytes[i] === 0 && i < bytes.length - 1) {
      continue;
    }
    foundNonZero = true;

    // For the first non-zero byte, don't pad if it's a single digit
    if (foundNonZero && hex === '0x' && bytes[i] < 16) {
      hex += bytes[i].toString(16);
    } else {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
  }

  return hex;
}

/**
 * Convert hex string to bytes
 * @param hex - Hex string (with or without 0x prefix)
 * @returns Bytes
 */
export function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.toLowerCase().replace(/^0x/, '');
  const bytes = new Uint8Array(normalized.length / 2);
  
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  
  return bytes;
}

