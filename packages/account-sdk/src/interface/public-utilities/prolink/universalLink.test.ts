// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { describe, expect, it } from 'vitest';
import { encodeProlink } from './index.node.js';
import { BASE_APP_URLS, prolinkToUniversalLink } from './universalLink.js';

describe('prolinkToUniversalLink', () => {
  const EXAMPLE_PROLINK = 'CAEQhUIgAigFcn0KFKqqqqqqqqqqqqqqqqqqqqqqqqqqEhQxlx8zf';

  describe('basic functionality', () => {
    it('should create universal link with production URL by default', () => {
      const result = prolinkToUniversalLink(EXAMPLE_PROLINK);
      expect(result).toBe(`https://base.app/base-pay?p=${EXAMPLE_PROLINK}`);
    });

    it('should create universal link with staging URL', () => {
      const result = prolinkToUniversalLink(EXAMPLE_PROLINK, 'staging');
      expect(result).toBe(`https://base-staging.coinbase.com/base-pay?p=${EXAMPLE_PROLINK}`);
    });

    it('should create universal link with development URL', () => {
      const result = prolinkToUniversalLink(EXAMPLE_PROLINK, 'development');
      expect(result).toBe(`https://base-dev.coinbase.com/base-pay?p=${EXAMPLE_PROLINK}`);
    });
  });

  describe('URL encoding', () => {
    it('should handle prolinks with special base64url characters', () => {
      // Base64url uses A-Z, a-z, 0-9, -, _
      const prolinkWithSpecialChars =
        'CAEQ-_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const result = prolinkToUniversalLink(prolinkWithSpecialChars);
      expect(result).toBe(`https://base.app/base-pay?p=${prolinkWithSpecialChars}`);
      // Verify it's a valid URL
      expect(() => new URL(result)).not.toThrow();
    });

    it('should create valid URL object', () => {
      const result = prolinkToUniversalLink(EXAMPLE_PROLINK);
      const url = new URL(result);
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('base.app');
      expect(url.pathname).toBe('/base-pay');
      expect(url.searchParams.get('p')).toBe(EXAMPLE_PROLINK);
    });
  });

  describe('integration with encodeProlink', () => {
    it('should create universal link from encoded wallet_sendCalls', async () => {
      const request = {
        method: 'wallet_sendCalls',
        params: [
          {
            version: '1.0',
            chainId: '0x2105',
            calls: [
              {
                to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000004c4b40',
                value: '0x0',
              },
            ],
          },
        ],
      };

      const prolink = await encodeProlink(request);
      const universalLink = prolinkToUniversalLink(prolink);

      expect(universalLink).toContain('https://base.app/base-pay?p=');
      expect(universalLink).toContain(prolink);

      // Verify the URL is valid
      const url = new URL(universalLink);
      expect(url.searchParams.get('p')).toBe(prolink);
    });

    it('should create universal link from encoded wallet_sign', async () => {
      const request = {
        method: 'wallet_sign',
        params: [
          {
            version: '1',
            chainId: '0x14a34',
            type: '0x01',
            data: {
              types: {
                SpendPermission: [
                  { name: 'account', type: 'address' },
                  { name: 'spender', type: 'address' },
                  { name: 'token', type: 'address' },
                  { name: 'allowance', type: 'uint160' },
                  { name: 'period', type: 'uint48' },
                  { name: 'start', type: 'uint48' },
                  { name: 'end', type: 'uint48' },
                  { name: 'salt', type: 'uint256' },
                  { name: 'extraData', type: 'bytes' },
                ],
              },
              domain: {
                name: 'Spend Permission Manager',
                version: '1',
                chainId: 84532,
                verifyingContract: '0xf85210b21cc50302f477ba56686d2019dc9b67ad',
              },
              primaryType: 'SpendPermission',
              message: {
                account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                spender: '0x8d9F34934dc9619e5DC3Df27D0A40b4A744E7eAa',
                token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
                allowance: '0x2710',
                period: 281474976710655,
                start: 0,
                end: 1914749767655,
                salt: '0x2d6688aae9435fb91ab0a1fe7ea54ec3ffd86e8e18a0c17e1923c467dea4b75f',
                extraData: '0x',
              },
            },
          },
        ],
      };

      const prolink = await encodeProlink(request);
      const universalLink = prolinkToUniversalLink(prolink, 'staging');

      expect(universalLink).toContain('https://base-staging.coinbase.com/base-pay?p=');
      expect(universalLink).toContain(prolink);
    });

    it('should create universal link from encoded generic RPC', async () => {
      const request = {
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0x1111111111111111111111111111111111111111',
            to: '0x2222222222222222222222222222222222222222',
            value: '0x100',
            data: '0x',
          },
        ],
        chainId: 1,
      };

      const prolink = await encodeProlink(request);
      const universalLink = prolinkToUniversalLink(prolink, 'development');

      expect(universalLink).toContain('https://base-dev.coinbase.com/base-pay?p=');
      expect(universalLink).toContain(prolink);
    });
  });

  describe('environment URLs', () => {
    it('should have correct production URL', () => {
      expect(BASE_APP_URLS.production).toBe('https://base.app/base-pay');
    });

    it('should have staging URL', () => {
      expect(BASE_APP_URLS.staging).toBe('https://base-staging.coinbase.com/base-pay');
    });

    it('should have development URL', () => {
      expect(BASE_APP_URLS.development).toBe('https://base-dev.coinbase.com/base-pay');
    });

    it('should have exactly 3 environments', () => {
      const keys = Object.keys(BASE_APP_URLS);
      expect(keys).toHaveLength(3);
      expect(keys).toEqual(['production', 'staging', 'development']);
    });
  });

  describe('edge cases', () => {
    it('should throw on empty prolink string', () => {
      expect(() => prolinkToUniversalLink('')).toThrow('Prolink cannot be empty');
    });

    it('should throw on whitespace-only prolink string', () => {
      expect(() => prolinkToUniversalLink('   ')).toThrow('Prolink cannot be empty');
    });

    it('should handle very long prolinks', () => {
      // Simulate a very long prolink (e.g., from a large transaction)
      const longProlink = 'A'.repeat(1000);
      const result = prolinkToUniversalLink(longProlink);
      expect(result).toContain('https://base.app/base-pay?p=');
      expect(result).toContain(longProlink);
      // Verify it's still a valid URL
      expect(() => new URL(result)).not.toThrow();
    });

    it('should preserve exact prolink value in query param', () => {
      const testCases = [
        'CAEQhUIgAigF',
        'simple',
        'with-dashes',
        'with_underscores',
        '123456789',
        'MixedCase123',
      ];

      for (const prolink of testCases) {
        const result = prolinkToUniversalLink(prolink);
        const url = new URL(result);
        expect(url.searchParams.get('p')).toBe(prolink);
      }
    });
  });
});
