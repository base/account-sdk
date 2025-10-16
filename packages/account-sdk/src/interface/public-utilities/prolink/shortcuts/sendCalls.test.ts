// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { describe, expect, it } from 'vitest';
import { SendCallsType } from '../types.js';
import { decodeWalletSendCalls, encodeWalletSendCalls } from './sendCalls.js';

describe('sendCalls shortcut', () => {
  describe('ERC20 transfer detection', () => {
    it('should detect ERC20 transfer', () => {
      const params = {
        version: '1.0',
        chainId: '0x2105',
        calls: [
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000004c4b40',
            value: '0x0',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);

      expect(encoded.type).toBe(SendCallsType.ERC20_TRANSFER);
      expect(encoded.transactionData.case).toBe('erc20Transfer');

      if (encoded.transactionData.case === 'erc20Transfer') {
        const { token, recipient, amount } = encoded.transactionData.value;
        expect(token.length).toBe(20);
        expect(recipient.length).toBe(20);
        expect(amount).toEqual(new Uint8Array([0x4c, 0x4b, 0x40]));
      }
    });

    it('should NOT detect ERC20 if multiple calls', () => {
      const params = {
        chainId: '0x1',
        calls: [
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000004c4b40',
            value: '0x0',
          },
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0x',
            value: '0x0',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      expect(encoded.type).toBe(SendCallsType.GENERIC_CALLS);
    });

    it('should NOT detect ERC20 if non-zero value', () => {
      const params = {
        chainId: '0x1',
        calls: [
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000004c4b40',
            value: '0x1',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      expect(encoded.type).toBe(SendCallsType.GENERIC_CALLS);
    });

    it('should NOT detect ERC20 if wrong data length', () => {
      const params = {
        chainId: '0x1',
        calls: [
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0xa9059cbb0000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e51',
            value: '0x0',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      expect(encoded.type).toBe(SendCallsType.GENERIC_CALLS);
    });
  });

  describe('Native transfer detection', () => {
    it('should detect native transfer', () => {
      const params = {
        version: '1.0',
        chainId: '0x1',
        calls: [
          {
            to: '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51',
            data: '0x',
            value: '0xde0b6b3a7640000',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);

      expect(encoded.type).toBe(SendCallsType.NATIVE_TRANSFER);
      expect(encoded.transactionData.case).toBe('nativeTransfer');

      if (encoded.transactionData.case === 'nativeTransfer') {
        const { recipient, amount } = encoded.transactionData.value;
        expect(recipient.length).toBe(20);
        expect(amount).toEqual(new Uint8Array([0x0d, 0xe0, 0xb6, 0xb3, 0xa7, 0x64, 0x00, 0x00]));
      }
    });

    it('should NOT detect native if has data', () => {
      const params = {
        chainId: '0x1',
        calls: [
          {
            to: '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51',
            data: '0x1234',
            value: '0xde0b6b3a7640000',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      expect(encoded.type).toBe(SendCallsType.GENERIC_CALLS);
    });

    it('should NOT detect native if zero value', () => {
      const params = {
        chainId: '0x1',
        calls: [
          {
            to: '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51',
            data: '0x',
            value: '0x0',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      expect(encoded.type).toBe(SendCallsType.GENERIC_CALLS);
    });
  });

  describe('Generic calls', () => {
    it('should encode multiple calls as generic', () => {
      const params = {
        chainId: '0x1',
        calls: [
          {
            to: '0x1111111111111111111111111111111111111111',
            data: '0x1234',
            value: '0x0',
          },
          {
            to: '0x2222222222222222222222222222222222222222',
            data: '0x5678',
            value: '0x100',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);

      expect(encoded.type).toBe(SendCallsType.GENERIC_CALLS);
      expect(encoded.transactionData.case).toBe('genericCalls');

      if (encoded.transactionData.case === 'genericCalls') {
        expect(encoded.transactionData.value.calls.length).toBe(2);
      }
    });
  });

  describe('ERC20 roundtrip', () => {
    it('should roundtrip ERC20 transfer', () => {
      const params = {
        version: '1.0',
        chainId: '0x2105',
        calls: [
          {
            to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000004c4b40',
            value: '0x0',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      const decoded = decodeWalletSendCalls(encoded, 8453);

      expect(decoded.chainId).toBe(params.chainId);
      expect(decoded.version).toBe(params.version);
      expect(decoded.calls.length).toBe(1);

      // Normalize addresses for comparison
      expect(decoded.calls[0].to.toLowerCase()).toBe(params.calls[0].to.toLowerCase());
      expect(decoded.calls[0].data.toLowerCase()).toBe(params.calls[0].data.toLowerCase());
      expect(decoded.calls[0].value).toBe(params.calls[0].value);
    });
  });

  describe('Native transfer roundtrip', () => {
    it('should roundtrip native transfer', () => {
      const params = {
        version: '1.0',
        chainId: '0x1',
        calls: [
          {
            to: '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51',
            data: '0x',
            value: '0xde0b6b3a7640000',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      const decoded = decodeWalletSendCalls(encoded, 1);

      expect(decoded.chainId).toBe(params.chainId);
      expect(decoded.version).toBe(params.version);
      expect(decoded.calls.length).toBe(1);
      expect(decoded.calls[0].to.toLowerCase()).toBe(params.calls[0].to.toLowerCase());
      expect(decoded.calls[0].data).toBe(params.calls[0].data);
      expect(decoded.calls[0].value.toLowerCase()).toBe(params.calls[0].value.toLowerCase());
    });
  });

  describe('Generic calls roundtrip', () => {
    it('should roundtrip generic calls', () => {
      const params = {
        version: '1.0',
        chainId: '0x1',
        calls: [
          {
            to: '0x1111111111111111111111111111111111111111',
            data: '0x1234',
            value: '0x0',
          },
          {
            to: '0x2222222222222222222222222222222222222222',
            data: '0x5678',
            value: '0x100',
          },
        ],
      };

      const encoded = encodeWalletSendCalls(params);
      const decoded = decodeWalletSendCalls(encoded, 1);

      expect(decoded.calls.length).toBe(2);
      expect(decoded.calls[0].to.toLowerCase()).toBe(params.calls[0].to.toLowerCase());
      expect(decoded.calls[1].to.toLowerCase()).toBe(params.calls[1].to.toLowerCase());
    });
  });
});

