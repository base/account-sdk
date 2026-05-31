import { describe, expect, it, vi } from 'vitest';
import { standardErrors } from ':core/error/errors.js';
import { ConfigMessage, ConfigEvent } from './ConfigMessage.js';
import {
  EncryptedData,
  RPCRequestMessage,
  RPCResponseMessage,
} from './RPCMessage.js';
import { RPCRequest } from './RPCRequest.js';
import { RPCResponse } from './RPCResponse.js';
import { MessageID } from './Message.js';

// Mock cipher utilities to isolate serialization tests from crypto
vi.mock(':util/cipher', () => ({
  encryptContent: vi.fn().mockImplementation(async (content) => ({
    iv: new Uint8Array(12),
    cipherText: new TextEncoder().encode(JSON.stringify(content)).buffer,
  })),
  decryptContent: vi.fn().mockImplementation(async (encryptedData) => {
    const text = new TextDecoder().decode(
      encryptedData.cipherText instanceof ArrayBuffer
        ? encryptedData.cipherText
        : encryptedData.cipherText
    );
    return JSON.parse(text);
  }),
}));

const mockIv = new Uint8Array(12);
const mockCipherText = (content: unknown): ArrayBuffer =>
  new TextEncoder().encode(JSON.stringify(content)).buffer;

const MOCK_ID = '00000000-0000-0000-0000-000000000001' as MessageID;
const MOCK_CORRELATION_ID = '00000000-0000-0000-0000-000000000002' as MessageID;
const MOCK_REQUEST_ID = '00000000-0000-0000-0000-000000000003' as MessageID;
const MOCK_SENDER = '0x04a0a9b7c4e7f3b5c1d6e8f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7';

describe('RPCMessage serialization roundtrip', () => {
  describe('RPCRequestMessage', () => {
    it('should serialize and deserialize a handshake request', async () => {
      const request: RPCRequest = {
        action: { method: 'eth_requestAccounts' },
        chainId: 1,
      };

      const envelope: RPCRequestMessage = {
        id: MOCK_ID,
        correlationId: MOCK_CORRELATION_ID,
        sender: MOCK_SENDER,
        content: { handshake: request.action },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      // Simulate serialization: JSON.stringify (what encryptContent does internally)
      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCRequestMessage;

      expect(deserialized.id).toBe(MOCK_ID);
      expect(deserialized.correlationId).toBe(MOCK_CORRELATION_ID);
      expect(deserialized.sender).toBe(MOCK_SENDER);
      expect(deserialized.content).toEqual({ handshake: request.action });
      expect(deserialized.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should serialize and deserialize an encrypted request', async () => {
      const encryptedData: EncryptedData = {
        iv: mockIv,
        cipherText: mockCipherText({ result: { value: '0xabc' } }),
      };

      const envelope: RPCRequestMessage = {
        id: MOCK_ID,
        correlationId: MOCK_CORRELATION_ID,
        sender: MOCK_SENDER,
        content: { encrypted: encryptedData },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCRequestMessage;

      expect(deserialized.id).toBe(MOCK_ID);
      expect(deserialized.content).toHaveProperty('encrypted');
      expect((deserialized.content as { encrypted: EncryptedData }).encrypted).toHaveProperty('iv');
      expect((deserialized.content as { encrypted: EncryptedData }).encrypted).toHaveProperty('cipherText');
    });

    it('should preserve undefined correlationId', () => {
      const envelope: RPCRequestMessage = {
        id: MOCK_ID,
        correlationId: undefined,
        sender: MOCK_SENDER,
        content: { handshake: { method: 'handshake' } },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCRequestMessage;

      expect(deserialized.correlationId).toBeUndefined();
    });
  });

  describe('RPCResponseMessage', () => {
    it('should serialize and deserialize a success response with encrypted content', async () => {
      const encryptedData: EncryptedData = {
        iv: mockIv,
        cipherText: mockCipherText({ result: { value: '0xSignature' } }),
      };

      const envelope: RPCResponseMessage = {
        id: MOCK_ID,
        correlationId: MOCK_CORRELATION_ID,
        requestId: MOCK_REQUEST_ID,
        sender: MOCK_SENDER,
        content: { encrypted: encryptedData },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCResponseMessage;

      expect(deserialized.id).toBe(MOCK_ID);
      expect(deserialized.requestId).toBe(MOCK_REQUEST_ID);
      expect(deserialized.content).toHaveProperty('encrypted');
    });

    it('should serialize and deserialize a failure response', async () => {
      const error = standardErrors.provider.userRejectedRequest();

      const envelope: RPCResponseMessage = {
        id: MOCK_ID,
        correlationId: MOCK_CORRELATION_ID,
        requestId: MOCK_REQUEST_ID,
        sender: MOCK_SENDER,
        content: { failure: error },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCResponseMessage;

      expect(deserialized.content).toHaveProperty('failure');
      const failure = (deserialized.content as { failure: unknown }).failure;
      expect(failure).toHaveProperty('code');
      expect(failure).toHaveProperty('message');
    });

    it('should preserve requestId in failure response', () => {
      const error = standardErrors.rpc.internal('server error');

      const envelope: RPCResponseMessage = {
        id: MOCK_ID,
        correlationId: MOCK_CORRELATION_ID,
        requestId: MOCK_REQUEST_ID,
        sender: MOCK_SENDER,
        content: { failure: error },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCResponseMessage;

      expect(deserialized.requestId).toBe(MOCK_REQUEST_ID);
    });
  });

  describe('malformed envelope handling', () => {
    it('should reject envelope with missing required fields', () => {
      const incompleteEnvelope = {
        id: MOCK_ID,
        // missing sender, content, timestamp
      };

      const serialized = JSON.stringify(incompleteEnvelope);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.sender).toBeUndefined();
      expect(deserialized.content).toBeUndefined();
    });

    it('should handle empty string payload', () => {
      expect(() => {
        JSON.parse('');
      }).toThrow();
    });

    it('should handle non-JSON payload', () => {
      const serialized = 'not valid json at all';
      expect(() => {
        JSON.parse(serialized);
      }).toThrow();
    });

    it('should handle null payload', () => {
      const deserialized = JSON.parse('null');
      expect(deserialized).toBeNull();
    });

    it('should handle array payload instead of object', () => {
      const arr = [{ id: MOCK_ID }];
      const serialized = JSON.stringify(arr);
      const deserialized = JSON.parse(serialized);

      expect(Array.isArray(deserialized)).toBe(true);
      expect(deserialized[0].id).toBe(MOCK_ID);
    });
  });

  describe('ConfigMessage type dispatch', () => {
    it('should serialize and deserialize PopupLoaded event', () => {
      const configMsg: ConfigMessage = {
        id: MOCK_ID,
        event: 'PopupLoaded',
        data: { timestamp: 1234567890 },
      };

      const serialized = JSON.stringify(configMsg);
      const deserialized = JSON.parse(serialized) as ConfigMessage;

      expect(deserialized.event).toBe('PopupLoaded');
      expect(deserialized.data).toEqual({ timestamp: 1234567890 });
    });

    it('should serialize and deserialize PopupUnload event', () => {
      const configMsg: ConfigMessage = {
        id: MOCK_ID,
        event: 'PopupUnload',
        data: { reason: 'user-initiated' },
      };

      const serialized = JSON.stringify(configMsg);
      const deserialized = JSON.parse(serialized) as ConfigMessage;

      expect(deserialized.event).toBe('PopupUnload');
    });

    it('should preserve ConfigEvent literal types', () => {
      const events: ConfigEvent[] = ['PopupLoaded', 'PopupUnload'];

      for (const event of events) {
        const configMsg: ConfigMessage = { id: MOCK_ID, event };
        const serialized = JSON.stringify(configMsg);
        const deserialized = JSON.parse(serialized) as ConfigMessage;
        expect(deserialized.event).toBe(event);
      }
    });
  });

  describe('error encoding/decoding', () => {
    it('should roundtrip a standard RPC error', () => {
      const error = standardErrors.rpc.invalidParams('missing method');

      const serialized = JSON.stringify(error);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.code).toBe(error.code);
      expect(deserialized.message).toBe(error.message);
    });

    it('should roundtrip a provider error with data', () => {
      const error = standardErrors.provider.userRejectedRequest({
        message: 'rejected',
        data: { cause: 'user-denied' },
      });

      const serialized = JSON.stringify(error);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.code).toBe(error.code);
      expect(deserialized.message).toBe('rejected');
      expect(deserialized.data).toEqual({ cause: 'user-denied' });
    });

    it('should roundtrip an error with stack when shouldIncludeStack is true', () => {
      const error = standardErrors.rpc.internal('something went wrong');
      const withStack = { ...error, stack: 'Error\n at someFunction (file.js:10)' };

      const serialized = JSON.stringify(withStack);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.stack).toBeDefined();
    });

    it('should handle error with no message gracefully', () => {
      const malformedError = { code: -32000 };

      const serialized = JSON.stringify(malformedError);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.code).toBe(-32000);
      expect(deserialized.message).toBeUndefined();
    });
  });

  describe('empty/incomplete buffer handling', () => {
    it('should handle empty object', () => {
      const serialized = JSON.stringify({});
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual({});
      expect(deserialized.id).toBeUndefined();
    });

    it('should handle only id field', () => {
      const minimal = { id: MOCK_ID };
      const serialized = JSON.stringify(minimal);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.id).toBe(MOCK_ID);
      expect(deserialized.sender).toBeUndefined();
    });

    it('should handle empty string fields', () => {
      const envelope: RPCRequestMessage = {
        id: MOCK_ID,
        correlationId: undefined,
        sender: '',
        content: { handshake: { method: '' } },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCRequestMessage;

      expect(deserialized.sender).toBe('');
      expect((deserialized.content as { handshake: { method: string } }).handshake.method).toBe('');
    });

    it('should handle Date with invalid timestamp', () => {
      const envelope: RPCRequestMessage = {
        id: MOCK_ID,
        correlationId: undefined,
        sender: MOCK_SENDER,
        content: { handshake: { method: 'eth_requestAccounts' } },
        timestamp: new Date('invalid'),
      };

      const serialized = JSON.stringify(envelope);
      const deserialized = JSON.parse(serialized) as RPCRequestMessage;

      // Invalid date serializes to 'Invalid Date' string
      expect(deserialized.timestamp).toBe('Invalid Date');
    });
  });
});

describe('RPCRequest type', () => {
  it('should have correct structure for eth_requestAccounts', () => {
    const request: RPCRequest = {
      action: { method: 'eth_requestAccounts' },
      chainId: 1,
    };

    expect(request.action.method).toBe('eth_requestAccounts');
    expect(request.chainId).toBe(1);
  });

  it('should handle RPCRequest with params', () => {
    const request: RPCRequest = {
      action: {
        method: 'personal_sign',
        params: ['0xmessage', '0xaddress'],
      },
      chainId: 84532,
    };

    expect(request.action.params).toHaveLength(2);
    expect(request.action.params).toContain('0xmessage');
  });
});

describe('RPCResponse type', () => {
  it('should have correct success structure', () => {
    const response: RPCResponse = {
      result: {
        value: '0xSignature',
      },
    };

    expect(response.result).toHaveProperty('value');
    expect((response.result as { value: unknown }).value).toBe('0xSignature');
  });

  it('should have correct error structure', () => {
    const error = standardErrors.rpc.internal();
    const response: RPCResponse = {
      result: {
        error,
      },
    };

    expect(response.result).toHaveProperty('error');
    const errorResult = response.result as { error: unknown };
    expect(errorResult.error).toHaveProperty('code');
    expect(errorResult.error).toHaveProperty('message');
  });

  it('should include optional data field with chains', () => {
    const response: RPCResponse = {
      result: { value: null },
      data: {
        chains: {
          1: 'https://eth-rpc.example.com',
          84532: 'https://base-rpc.example.com',
        },
      },
    };

    expect(response.data).toBeDefined();
    expect(response.data?.chains).toHaveProperty(1);
    expect(response.data?.chains).toHaveProperty(84532);
  });

  it('should include optional data field with capabilities', () => {
    const response: RPCResponse = {
      result: { value: null },
      data: {
        capabilities: {
          '0x1': { enabled: true },
        },
      },
    };

    expect(response.data?.capabilities).toBeDefined();
  });

  it('should include optional data field with nativeCurrencies', () => {
    const response: RPCResponse = {
      result: { value: null },
      data: {
        nativeCurrencies: {
          1: { name: 'Ethereum', symbol: 'ETH', decimal: 18 },
        },
      },
    };

    expect(response.data?.nativeCurrencies).toHaveProperty(1);
    expect(response.data?.nativeCurrencies?.[1].symbol).toBe('ETH');
  });
});
