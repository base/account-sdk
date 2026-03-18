import { describe, expect, it } from 'vitest';
import { CHAIN_IDS, TOKENS } from '../constants.js';
import type { PayerInfo } from '../types.js';
import {
  buildSendCallsRequest,
  encodeTransferCall,
  translatePaymentToSendCalls,
} from './translatePayment.js';

describe('translatePayment', () => {
  describe('encodeTransferCall', () => {
    it('should encode a transfer call correctly', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';

      const result = encodeTransferCall(recipient, amount);

      expect(result).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(result.length).toBeGreaterThan(2);
      // Standard transfer calldata is 4 (selector) + 32 (address) + 32 (uint256) = 68 bytes = 138 hex chars
      expect(result.length).toBe(2 + 68 * 2); // 0x prefix + 136 hex chars
    });

    it('should append dataSuffix to the transfer calldata', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const dataSuffix = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

      const withoutSuffix = encodeTransferCall(recipient, amount);
      const withSuffix = encodeTransferCall(recipient, amount, dataSuffix);

      // The result should start with the same transfer calldata
      expect(withSuffix.startsWith(withoutSuffix)).toBe(true);
      // And be longer by the suffix (32 bytes = 64 hex chars)
      expect(withSuffix.length).toBe(withoutSuffix.length + 64);
      // The suffix should appear at the end
      expect(withSuffix.endsWith(dataSuffix.slice(2))).toBe(true);
    });

    it('should return unchanged calldata when dataSuffix is undefined', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';

      const result = encodeTransferCall(recipient, amount, undefined);
      const baseline = encodeTransferCall(recipient, amount);

      expect(result).toBe(baseline);
    });
  });

  describe('buildSendCallsRequest', () => {
    it('should build request without payerInfo', () => {
      const transferData = '0xabcdef';
      const testnet = false;

      const result = buildSendCallsRequest(transferData, testnet);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.base,
        calls: [
          {
            to: TOKENS.USDC.addresses.base,
            data: transferData,
            value: '0x0',
          },
        ],
        capabilities: {},
      });
    });

    it('should build request with payerInfo', () => {
      const transferData = '0xabcdef';
      const testnet = false;
      const payerInfo: PayerInfo = {
        requests: [{ type: 'email' }, { type: 'physicalAddress', optional: true }],
        callbackURL: 'https://example.com/callback',
      };

      const result = buildSendCallsRequest(transferData, testnet, payerInfo);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.base,
        calls: [
          {
            to: TOKENS.USDC.addresses.base,
            data: transferData,
            value: '0x0',
          },
        ],
        capabilities: {
          dataCallback: {
            requests: [
              { type: 'email', optional: false },
              { type: 'physicalAddress', optional: true },
            ],
            callbackURL: 'https://example.com/callback',
          },
        },
      });
    });

    it('should build request for testnet', () => {
      const transferData = '0xabcdef';
      const testnet = true;

      const result = buildSendCallsRequest(transferData, testnet);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.baseSepolia,
        calls: [
          {
            to: TOKENS.USDC.addresses.baseSepolia,
            data: transferData,
            value: '0x0',
          },
        ],
        capabilities: {},
      });
    });

    it('should handle payerInfo without callbackURL', () => {
      const transferData = '0xabcdef';
      const testnet = false;
      const payerInfo: PayerInfo = {
        requests: [{ type: 'email' }],
      };

      const result = buildSendCallsRequest(transferData, testnet, payerInfo);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.base,
        calls: [
          {
            to: TOKENS.USDC.addresses.base,
            data: transferData,
            value: '0x0',
          },
        ],
        capabilities: {
          dataCallback: {
            requests: [{ type: 'email', optional: false }],
          },
        },
      });
    });

    it('should handle empty payerInfo array', () => {
      const transferData = '0xabcdef';
      const testnet = false;
      const payerInfo: PayerInfo = {
        requests: [],
        callbackURL: 'https://example.com/callback',
      };

      const result = buildSendCallsRequest(transferData, testnet, payerInfo);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.base,
        calls: [
          {
            to: TOKENS.USDC.addresses.base,
            data: transferData,
            value: '0x0',
          },
        ],
        capabilities: {},
      });
    });

    it('should default optional to false when not specified', () => {
      const transferData = '0xabcdef';
      const testnet = false;
      const payerInfo: PayerInfo = {
        requests: [{ type: 'email' }, { type: 'name', optional: undefined }],
        callbackURL: 'https://example.com/callback',
      };

      const result = buildSendCallsRequest(transferData, testnet, payerInfo);

      expect(result.capabilities).toEqual({
        dataCallback: {
          requests: [
            { type: 'email', optional: false },
            { type: 'name', optional: false },
          ],
          callbackURL: 'https://example.com/callback',
        },
      });
    });
  });

  describe('translatePaymentToSendCalls', () => {
    it('should translate payment without payerInfo', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const testnet = false;

      const result = translatePaymentToSendCalls(recipient, amount, testnet);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.base,
        calls: [
          {
            to: TOKENS.USDC.addresses.base,
            data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
            value: '0x0',
          },
        ],
        capabilities: {},
      });
    });

    it('should translate payment with payerInfo', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const testnet = false;
      const payerInfo: PayerInfo = {
        requests: [
          { type: 'email' },
          { type: 'physicalAddress', optional: true },
          { type: 'phoneNumber', optional: false },
        ],
        callbackURL: 'https://example.com/callback',
      };

      const result = translatePaymentToSendCalls(recipient, amount, testnet, payerInfo);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.base,
        calls: [
          {
            to: TOKENS.USDC.addresses.base,
            data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
            value: '0x0',
          },
        ],
        capabilities: {
          dataCallback: {
            requests: [
              { type: 'email', optional: false },
              { type: 'physicalAddress', optional: true },
              { type: 'phoneNumber', optional: false },
            ],
            callbackURL: 'https://example.com/callback',
          },
        },
      });
    });

    it('should translate payment for testnet with payerInfo', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '5.00';
      const testnet = true;
      const payerInfo: PayerInfo = {
        requests: [{ type: 'name', optional: true }],
        callbackURL: 'https://example.com/callback',
      };

      const result = translatePaymentToSendCalls(recipient, amount, testnet, payerInfo);

      expect(result).toEqual({
        version: '2.0.0',
        chainId: CHAIN_IDS.baseSepolia,
        calls: [
          {
            to: TOKENS.USDC.addresses.baseSepolia,
            data: expect.stringMatching(/^0x[a-fA-F0-9]+$/),
            value: '0x0',
          },
        ],
        capabilities: {
          dataCallback: {
            requests: [{ type: 'name', optional: true }],
            callbackURL: 'https://example.com/callback',
          },
        },
      });
    });

    it('should append dataSuffix to the inner transfer calldata', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const testnet = true;
      const dataSuffix = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

      const withSuffix = translatePaymentToSendCalls(recipient, amount, testnet, undefined, dataSuffix);
      const withoutSuffix = translatePaymentToSendCalls(recipient, amount, testnet);

      const callDataWith = withSuffix.calls[0].data;
      const callDataWithout = withoutSuffix.calls[0].data;

      // Inner calldata should be longer when dataSuffix is provided
      expect(callDataWith.length).toBeGreaterThan(callDataWithout.length);
      // Should start with the same transfer encoding
      expect(callDataWith.startsWith(callDataWithout)).toBe(true);
      // Suffix should be appended at the end
      expect(callDataWith.endsWith(dataSuffix.slice(2))).toBe(true);
    });

    it('should not modify calldata when dataSuffix is not provided', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const testnet = false;

      const result = translatePaymentToSendCalls(recipient, amount, testnet, undefined, undefined);
      const baseline = translatePaymentToSendCalls(recipient, amount, testnet);

      expect(result.calls[0].data).toBe(baseline.calls[0].data);
    });
  });
});
