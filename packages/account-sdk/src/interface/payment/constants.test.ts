import { describe, expect, it } from 'vitest';
import { CHAIN_IDS, TOKENS, VERSION, WALLET_RPC_URL } from './constants.js';
import { isENSName } from './utils/validation.js';

describe('constants', () => {
  describe('TOKENS', () => {
    it('should have correct USDC configuration', () => {
      expect(TOKENS.USDC.decimals).toBe(6);
      expect(TOKENS.USDC.addresses.base).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(TOKENS.USDC.addresses.baseSepolia).toBe('0x036CbD53842c5426634e7929541eC2318f3dCF7e');
    });
  });

  describe('CHAIN_IDS', () => {
    it('should have correct chain IDs', () => {
      expect(CHAIN_IDS.base).toBe(8453);
      expect(CHAIN_IDS.baseSepolia).toBe(84532);
    });
  });

  describe('WALLET_RPC_URL', () => {
    it('should have correct wallet RPC URL', () => {
      expect(WALLET_RPC_URL).toBe('https://api.wallet.coinbase.com/rpc');
    });
  });

  describe('VERSION', () => {
    it('should have correct API version', () => {
      expect(VERSION).toBe('v2');
    });
  });
});

describe('validation utils', () => {
  describe('isENSName', () => {
    it('should return true for strings with dots that are not valid addresses', () => {
      expect(isENSName('vitalik.eth')).toBe(true);
      expect(isENSName('test.xyz')).toBe(true);
      expect(isENSName('name.base')).toBe(true);
      expect(isENSName('user.cb.id')).toBe(true);
      expect(isENSName('example.eth')).toBe(true);
      expect(isENSName('longname.xyz')).toBe(true);
      expect(isENSName('test.com')).toBe(true);
      expect(isENSName('example.org')).toBe(true);
      expect(isENSName('sub.domain.eth')).toBe(true);
      expect(isENSName('my-name.test')).toBe(true);
    });

    it('should return false for strings without dots', () => {
      expect(isENSName('notanensname')).toBe(false);
      expect(isENSName('test')).toBe(false);
      expect(isENSName('example')).toBe(false);
    });

    it('should return false for valid Ethereum addresses', () => {
      expect(isENSName('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(false);
      expect(isENSName('0xFe21034794A5a574B94fE4fDfD16e005F1C96e51')).toBe(false);
    });

    it('should return false for empty strings or edge cases', () => {
      expect(isENSName('')).toBe(false);
      expect(isENSName('test.')).toBe(false);
      expect(isENSName('.eth')).toBe(false);
      expect(isENSName('.')).toBe(false);
    });
  });
}); 