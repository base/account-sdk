import { describe, expect, it } from 'vitest';
import { chainDisplayName, isValidChainId, parseChainId, resolveChainId } from './caip.js';

describe('CAIP helpers', () => {
  describe('parseChainId', () => {
    it('parses an EVM chain ID', () => {
      expect(parseChainId('eip155:8453')).toEqual({ namespace: 'eip155', reference: '8453' });
    });

    it('parses base-sepolia', () => {
      expect(parseChainId('eip155:84532')).toEqual({ namespace: 'eip155', reference: '84532' });
    });

    it('returns null for empty string', () => {
      expect(parseChainId('')).toBeNull();
    });

    it('returns null for missing reference', () => {
      expect(parseChainId('eip155')).toBeNull();
    });

    it('returns null for missing namespace', () => {
      expect(parseChainId(':8453')).toBeNull();
    });
  });

  describe('isValidChainId', () => {
    it('accepts valid CAIP-2 identifiers', () => {
      expect(isValidChainId('eip155:1')).toBe(true);
      expect(isValidChainId('eip155:8453')).toBe(true);
      expect(isValidChainId('eip155:84532')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidChainId('')).toBe(false);
      expect(isValidChainId('eip155')).toBe(false);
      expect(isValidChainId(':8453')).toBe(false);
      expect(isValidChainId('8453')).toBe(false);
    });
  });

  describe('resolveChainId', () => {
    it('resolves known aliases', () => {
      expect(resolveChainId('base')).toBe('eip155:8453');
      expect(resolveChainId('base-sepolia')).toBe('eip155:84532');
    });

    it('passes through valid CAIP-2 identifiers', () => {
      expect(resolveChainId('eip155:8453')).toBe('eip155:8453');
    });

    it('returns null for unknown aliases', () => {
      expect(resolveChainId('notachain')).toBeNull();
    });

    it('returns null for invalid format', () => {
      expect(resolveChainId('')).toBeNull();
    });
  });

  describe('chainDisplayName', () => {
    it('returns alias for known CAIP-2 identifiers', () => {
      expect(chainDisplayName('eip155:8453')).toBe('base');
      expect(chainDisplayName('eip155:84532')).toBe('base-sepolia');
    });

    it('falls back to raw CAIP-2 string for unknown chains', () => {
      expect(chainDisplayName('eip155:1')).toBe('eip155:1');
    });
  });
});
