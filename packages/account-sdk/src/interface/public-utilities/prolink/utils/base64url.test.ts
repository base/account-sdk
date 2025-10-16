// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { describe, expect, it } from 'vitest';
import { decodeBase64url, encodeBase64url } from './base64url.js';

describe('base64url', () => {
  describe('encodeBase64url', () => {
    it('should encode empty array', () => {
      const result = encodeBase64url(new Uint8Array([]));
      expect(result).toBe('');
    });

    it('should encode single byte', () => {
      const result = encodeBase64url(new Uint8Array([0x00]));
      expect(result).toBe('AA');
    });

    it('should encode without padding', () => {
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const result = encodeBase64url(data);
      expect(result).not.toContain('=');
      expect(result).toBe('SGVsbG8');
    });

    it('should use URL-safe characters', () => {
      // This input would produce + and / in standard base64
      const data = new Uint8Array([0xfb, 0xff, 0xfe]);
      const result = encodeBase64url(data);
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).toBe('-__-'); // + becomes -, / becomes _
    });

    it('should roundtrip correctly', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const encoded = encodeBase64url(data);
      const decoded = decodeBase64url(encoded);
      expect(decoded).toEqual(data);
    });
  });

  describe('decodeBase64url', () => {
    it('should decode empty string', () => {
      const result = decodeBase64url('');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('should decode without padding', () => {
      const result = decodeBase64url('SGVsbG8');
      expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it('should decode with padding', () => {
      const result = decodeBase64url('SGVsbG8=');
      expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it('should decode URL-safe characters', () => {
      const result = decodeBase64url('-__-');
      expect(result).toEqual(new Uint8Array([0xfb, 0xff, 0xfe]));
    });

    it('should throw on invalid characters', () => {
      expect(() => decodeBase64url('ABC@DEF')).toThrow(/Invalid Base64url character/);
      expect(() => decodeBase64url('ABC DEF')).toThrow(/Invalid Base64url character/);
      expect(() => decodeBase64url('ABC+DEF')).toThrow(/Invalid Base64url character/);
    });

    it('should throw on invalid padding', () => {
      expect(() => decodeBase64url('ABC=DEF')).toThrow(/Invalid Base64url/);
      expect(() => decodeBase64url('ABCD===')).toThrow(/Invalid Base64url padding/);
    });

    it('should handle long strings', () => {
      const data = new Uint8Array(1000).map((_, i) => i % 256);
      const encoded = encodeBase64url(data);
      const decoded = decodeBase64url(encoded);
      expect(decoded).toEqual(data);
    });
  });
});

