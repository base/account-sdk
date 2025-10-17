// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { describe, expect, it } from 'vitest';
import {
  bytesToHex,
  decodeAddress,
  decodeAmount,
  decodeCapabilities,
  encodeAddress,
  encodeAmount,
  encodeCapabilities,
  hexToBytes,
  pad32,
} from './encoding.js';

describe('encoding', () => {
  describe('encodeAddress / decodeAddress', () => {
    it('should encode and decode address', () => {
      const address = '0x1234567890123456789012345678901234567890';
      const encoded = encodeAddress(address);
      expect(encoded.length).toBe(20);
      const decoded = decodeAddress(encoded);
      expect(decoded).toBe(address);
    });

    it('should normalize address to lowercase', () => {
      const address = '0xABCDEF1234567890123456789012345678901234';
      const encoded = encodeAddress(address);
      const decoded = decodeAddress(encoded);
      expect(decoded).toBe(address.toLowerCase());
    });

    it('should handle address without 0x prefix', () => {
      const address = '1234567890123456789012345678901234567890';
      const encoded = encodeAddress(address);
      expect(encoded.length).toBe(20);
    });

    it('should throw on invalid address length', () => {
      expect(() => encodeAddress('0x1234')).toThrow(/Invalid address length/);
      expect(() => decodeAddress(new Uint8Array(10))).toThrow(/Invalid address length/);
    });
  });

  describe('encodeAmount / decodeAmount', () => {
    it('should encode zero', () => {
      const encoded = encodeAmount(0n);
      expect(encoded).toEqual(new Uint8Array([0x00]));
      expect(decodeAmount(encoded)).toBe(0n);
    });

    it('should encode zero from string', () => {
      const encoded = encodeAmount('0x0');
      expect(encoded).toEqual(new Uint8Array([0x00]));
    });

    it('should decode empty bytes as zero', () => {
      const decoded = decodeAmount(new Uint8Array([]));
      expect(decoded).toBe(0n);
    });

    it('should encode small amounts minimally', () => {
      const encoded = encodeAmount(255n);
      expect(encoded).toEqual(new Uint8Array([0xff]));
      expect(decodeAmount(encoded)).toBe(255n);
    });

    it('should encode large amounts minimally', () => {
      const encoded = encodeAmount(5000000n); // 0x4c4b40
      expect(encoded).toEqual(new Uint8Array([0x4c, 0x4b, 0x40]));
      expect(decodeAmount(encoded)).toBe(5000000n);
    });

    it('should encode from hex string', () => {
      const encoded = encodeAmount('0x4c4b40');
      expect(encoded).toEqual(new Uint8Array([0x4c, 0x4b, 0x40]));
      expect(decodeAmount(encoded)).toBe(5000000n);
    });

    it('should reject leading zeros in decoding', () => {
      const invalidEncoding = new Uint8Array([0x00, 0x01]);
      expect(() => decodeAmount(invalidEncoding)).toThrow(/leading zeros/);
    });

    it('should reject negative amounts', () => {
      expect(() => encodeAmount(-1n)).toThrow(/negative/);
    });

    it('should handle 1 ETH (18 decimals)', () => {
      const oneEth = 10n ** 18n; // 0xde0b6b3a7640000
      const encoded = encodeAmount(oneEth);
      expect(encoded).toEqual(new Uint8Array([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]));
      expect(decodeAmount(encoded)).toBe(oneEth);
    });
  });

  describe('encodeCapabilities / decodeCapabilities', () => {
    it('should encode empty capabilities', () => {
      const encoded = encodeCapabilities({});
      expect(encoded.size).toBe(0);
    });

    it('should encode string capability', () => {
      const caps = { orderId: 'ORDER-123' };
      const encoded = encodeCapabilities(caps);
      expect(encoded.size).toBe(1);
      const decoded = decodeCapabilities(encoded);
      expect(decoded).toEqual(caps);
    });

    it('should encode object capability', () => {
      const caps = {
        dataCallback: {
          callbackURL: 'https://example.com',
          events: ['initiated'],
        },
      };
      const encoded = encodeCapabilities(caps);
      const decoded = decodeCapabilities(encoded);
      expect(decoded).toEqual(caps);
    });

    it('should encode multiple capabilities', () => {
      const caps = {
        order_id: 'ORDER-123',
        tip_bps: 50,
        dataCallback: { callbackURL: 'https://example.com' },
      };
      const encoded = encodeCapabilities(caps);
      const decoded = decodeCapabilities(encoded);
      expect(decoded).toEqual(caps);
    });

    it('should throw on invalid JSON in decode', () => {
      const invalidMap = new Map<string, Uint8Array>();
      invalidMap.set('test', new Uint8Array([0xff, 0xfe])); // Invalid UTF-8
      expect(() => decodeCapabilities(invalidMap)).toThrow();
    });
  });

  describe('pad32', () => {
    it('should pad address to 32 bytes', () => {
      const address = new Uint8Array(20).fill(0x42);
      const padded = pad32(address);
      expect(padded.length).toBe(32);
      expect(padded.slice(0, 12)).toEqual(new Uint8Array(12).fill(0));
      expect(padded.slice(12)).toEqual(address);
    });

    it('should pad amount to 32 bytes', () => {
      const amount = new Uint8Array([0x01, 0x02, 0x03]);
      const padded = pad32(amount);
      expect(padded.length).toBe(32);
      expect(padded[29]).toBe(0x01);
      expect(padded[30]).toBe(0x02);
      expect(padded[31]).toBe(0x03);
    });

    it('should not modify 32-byte input', () => {
      const data = new Uint8Array(32).fill(0x42);
      const padded = pad32(data);
      expect(padded).toEqual(data);
    });

    it('should throw on input larger than 32 bytes', () => {
      const tooLarge = new Uint8Array(33);
      expect(() => pad32(tooLarge)).toThrow(/larger than 32 bytes/);
    });
  });

  describe('bytesToHex / hexToBytes', () => {
    it('should convert bytes to hex', () => {
      const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('0x12345678');
    });

    it('should convert zero to 0x0', () => {
      const bytes = new Uint8Array([0x00]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('0x0');
    });

    it('should remove leading zeros (minimal encoding)', () => {
      const bytes = new Uint8Array([0x00, 0x00, 0x12, 0x34]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('0x1234');
    });

    it('should handle single leading zero byte', () => {
      const bytes = new Uint8Array([0x00, 0x12]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('0x12');
    });

    it('should convert hex to bytes', () => {
      const hex = '0x12345678';
      const bytes = hexToBytes(hex);
      expect(bytes).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
    });

    it('should handle hex without 0x prefix', () => {
      const bytes = hexToBytes('12345678');
      expect(bytes).toEqual(new Uint8Array([0x12, 0x34, 0x56, 0x78]));
    });

    it('should roundtrip correctly with leading zeros handled', () => {
      const original = new Uint8Array([1, 2, 255, 254, 253]);
      const hex = bytesToHex(original);
      // bytesToHex strips leading zeros, so we need to compare values
      expect(BigInt(hex)).toBe(
        BigInt(
          `0x${Array.from(original)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')}`
        )
      );
    });
  });
});
