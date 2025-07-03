import { describe, expect, it } from 'vitest';
import { base } from './base.js';
import { CHAIN_IDS, USDC_ADDRESS } from './constants.js';
import { pay } from './pay.js';

describe('base namespace', () => {
  it('should export pay function', () => {
    expect(base.pay).toBe(pay);
    expect(typeof base.pay).toBe('function');
  });

  it('should export constants', () => {
    expect(base.constants.CHAIN_IDS).toEqual(CHAIN_IDS);
    expect(base.constants.USDC_ADDRESS).toEqual(USDC_ADDRESS);
  });

  it('should have the expected structure', () => {
    expect(base).toHaveProperty('pay');
    expect(base).toHaveProperty('constants');
    expect(base.constants).toHaveProperty('CHAIN_IDS');
    expect(base.constants).toHaveProperty('USDC_ADDRESS');
  });
});
