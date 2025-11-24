import { describe, expect, it } from 'vitest';

import { CHAIN_IDS } from '../constants.js';
import {
  decodePaymentId,
  encodePaymentId,
  getChainShortName,
  isERC3770Format,
} from './erc3770.js';

describe('ERC-3770 utilities', () => {
  describe('getChainShortName', () => {
    it('returns the short name for a supported chain', () => {
      expect(getChainShortName(CHAIN_IDS.base)).toBe('base');
    });

    it('returns null for unsupported chains', () => {
      expect(getChainShortName(999999)).toBeNull();
    });
  });

  describe('encodePaymentId', () => {
    it('encodes chainId and transaction hash', () => {
      const encoded = encodePaymentId(CHAIN_IDS.base, '0xabc123');
      expect(encoded).toBe('base:0xabc123');
    });

    it('throws for unsupported chain IDs', () => {
      expect(() => encodePaymentId(999999, '0xabc123')).toThrow('Unsupported chain ID');
    });

    it('throws for invalid transaction hashes', () => {
      expect(() => encodePaymentId(CHAIN_IDS.base, 'abc123')).toThrow('Invalid transaction hash');
    });
  });

  describe('decodePaymentId', () => {
    it('returns null for legacy IDs without a short name', () => {
      expect(decodePaymentId('0xabc123')).toBeNull();
    });

    it('decodes ERC-3770 formatted IDs', () => {
      expect(decodePaymentId('base:0xabc123')).toEqual({
        chainId: CHAIN_IDS.base,
        transactionHash: '0xabc123',
      });
    });

    it('throws when the short name is missing', () => {
      expect(() => decodePaymentId(':0xabc123')).toThrow('Invalid ERC-3770 format');
    });

    it('throws when the transaction hash is invalid', () => {
      expect(() => decodePaymentId('base:not-a-hash')).toThrow('Invalid ERC-3770 format');
    });
  });

  describe('isERC3770Format', () => {
    it('detects ERC-3770 IDs', () => {
      expect(isERC3770Format('base:0xabc123')).toBe(true);
    });

    it('detects legacy IDs', () => {
      expect(isERC3770Format('0xabc123')).toBe(false);
    });
  });
});


