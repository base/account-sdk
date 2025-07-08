import { describe, expect, it } from 'vitest';
import { base } from './base.js';
import { CHAIN_IDS, TOKENS, VERSION, WALLET_RPC_URL } from './constants.js';

describe('base', () => {
  it('should export pay function', () => {
    expect(base.pay).toBeDefined();
    expect(typeof base.pay).toBe('function');
  });

  it('should export constants', () => {
    expect(base.constants).toBeDefined();
    expect(base.constants.CHAIN_IDS).toEqual(CHAIN_IDS);
    expect(base.constants.TOKENS).toEqual(TOKENS);
    expect(base.constants.WALLET_RPC_URL).toEqual(WALLET_RPC_URL);
    expect(base.constants.VERSION).toEqual(VERSION);
  });

  it('should have expected structure', () => {
    expect(base).toHaveProperty('pay');
    expect(base).toHaveProperty('constants');
    expect(base.constants).toHaveProperty('CHAIN_IDS');
    expect(base.constants).toHaveProperty('TOKENS');
    expect(base.constants).toHaveProperty('WALLET_RPC_URL');
    expect(base.constants).toHaveProperty('VERSION');
  });
});
