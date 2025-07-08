import { describe, expect, it } from 'vitest';
import { CHAIN_IDS, TOKENS } from '../constants.js';
import type { InfoRequest } from '../types.js';
import { buildSendCallsRequest, encodeTransferCall, translatePaymentToSendCalls } from './translatePayment.js';

describe('translatePayment', () => {
  describe('encodeTransferCall', () => {
    it('should encode a transfer call correctly', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';

      const result = encodeTransferCall(recipient, amount);

      expect(result).toMatch(/^0x[a-fA-F0-9]+$/);
      expect(result.length).toBeGreaterThan(2);
    });
  });

  describe('buildSendCallsRequest', () => {
    it('should build request without infoRequests', () => {
      const transferData = '0xabcdef';
      const testnet = false;

      const result = buildSendCallsRequest(transferData, testnet);

      expect(result).toEqual({
        version: '1.0',
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

    it('should build request with infoRequests', () => {
      const transferData = '0xabcdef';
      const testnet = false;
      const infoRequests: InfoRequest[] = [
        { request: 'email' },
        { request: 'physicalAddress', optional: true },
      ];

      const result = buildSendCallsRequest(transferData, testnet, infoRequests);

      expect(result).toEqual({
        version: '1.0',
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
          },
        },
      });
    });

    it('should build request for testnet', () => {
      const transferData = '0xabcdef';
      const testnet = true;

      const result = buildSendCallsRequest(transferData, testnet);

      expect(result).toEqual({
        version: '1.0',
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

    it('should handle empty infoRequests array', () => {
      const transferData = '0xabcdef';
      const testnet = false;
      const infoRequests: InfoRequest[] = [];

      const result = buildSendCallsRequest(transferData, testnet, infoRequests);

      expect(result).toEqual({
        version: '1.0',
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
      const infoRequests: InfoRequest[] = [
        { request: 'email' },
        { request: 'name', optional: undefined },
      ];

      const result = buildSendCallsRequest(transferData, testnet, infoRequests);

      expect(result.capabilities).toEqual({
        dataCallback: {
          requests: [
            { type: 'email', optional: false },
            { type: 'name', optional: false },
          ],
        },
      });
    });
  });

  describe('translatePaymentToSendCalls', () => {
    it('should translate payment without infoRequests', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const testnet = false;

      const result = translatePaymentToSendCalls(recipient, amount, testnet);

      expect(result).toEqual({
        version: '1.0',
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

    it('should translate payment with infoRequests', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '10.50';
      const testnet = false;
      const infoRequests: InfoRequest[] = [
        { request: 'email' },
        { request: 'physicalAddress', optional: true },
        { request: 'phoneNumber', optional: false },
      ];

      const result = translatePaymentToSendCalls(recipient, amount, testnet, infoRequests);

      expect(result).toEqual({
        version: '1.0',
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
          },
        },
      });
    });

    it('should translate payment for testnet with infoRequests', () => {
      const recipient = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
      const amount = '5.00';
      const testnet = true;
      const infoRequests: InfoRequest[] = [
        { request: 'name', optional: true },
      ];

      const result = translatePaymentToSendCalls(recipient, amount, testnet, infoRequests);

      expect(result).toEqual({
        version: '1.0',
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
            requests: [
              { type: 'name', optional: true },
            ],
          },
        },
      });
    });
  });
});
