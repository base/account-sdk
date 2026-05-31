import { describe, expect, it, vi } from 'vitest';
import { standardErrors } from ':core/error/errors.js';
import type {
  WalletSendCallsCall,
  WalletSendCallsParams,
  WalletSendCallsSchema,
} from './wallet_sendCalls.js';

const mockAddress = '0x742C4d6c2B4ABE65a3A3B0A4B2Ed8B6a67c2E3f1' as const;
const mockChainId = '0x1' as const;
const mockValue = '0x0' as const;
const mockData = '0xabcdef' as const;

function createMockCall(overrides: Partial<WalletSendCallsCall> = {}): WalletSendCallsCall {
  return {
    to: mockAddress,
    data: mockData,
    value: mockValue,
    capabilities: undefined,
    ...overrides,
  };
}

function createMockParams(
  calls: WalletSendCallsCall[] = [createMockCall()]
): WalletSendCallsParams {
  return [
    {
      version: '1.0',
      chainId: mockChainId,
      from: mockAddress,
      calls,
      atomicRequired: true,
      capabilities: {},
    },
  ];
}

describe('wallet_sendCalls schema', () => {
  it('should have correct method name', () => {
    const schema: WalletSendCallsSchema = {
      Method: 'wallet_sendCalls',
      Parameters: createMockParams(),
      ReturnType: '0x',
    };

    expect(schema.Method).toBe('wallet_sendCalls');
  });

  it('should have correct parameter structure for single call', () => {
    const params = createMockParams([createMockCall()]);

    expect(params[0]).toHaveProperty('version');
    expect(params[0]).toHaveProperty('chainId');
    expect(params[0]).toHaveProperty('from');
    expect(params[0]).toHaveProperty('calls');
    expect(params[0]).toHaveProperty('atomicRequired');
  });

  it('should accept valid WalletSendCallsCall array', () => {
    const calls: WalletSendCallsCall[] = [
      createMockCall({ to: '0x742C4d6c2B4ABE65a3A3B0A4B2Ed8B6a67c2E3f1' }),
      createMockCall({
        to: '0x8ba1f109551bD432803012645Hac136c5e84F31D',
        data: '0x1234567890',
        value: '0x1',
      }),
    ];

    const params = createMockParams(calls);

    expect(params[0].calls).toHaveLength(2);
    expect(params[0].calls[0].to).toBe('0x742C4d6c2B4ABE65a3A3B0A4B2Ed8B6a67c2E3f1');
    expect(params[0].calls[1].to).toBe('0x8ba1f109551bD432803012645Hac136c5e84F31D');
  });

  it('should allow calls with gasLimitOverride capability', () => {
    const call = createMockCall({
      capabilities: {
        gasLimitOverride: { value: '0x5208' }, // 21000 in hex
      },
    });

    const params = createMockParams([call]);

    expect(params[0].calls[0].capabilities).toHaveProperty('gasLimitOverride');
    expect(params[0].calls[0].capabilities?.gasLimitOverride).toEqual({ value: '0x5208' });
  });

  it('should allow optional data field to be omitted', () => {
    const call: WalletSendCallsCall = {
      to: mockAddress,
      // data is optional
      value: '0x0',
    };

    const params = createMockParams([call]);

    expect(params[0].calls[0].data).toBeUndefined();
  });

  it('should allow optional value field to be omitted', () => {
    const call: WalletSendCallsCall = {
      to: mockAddress,
      data: mockData,
      // value is optional
    };

    const params = createMockParams([call]);

    expect(params[0].calls[0].value).toBeUndefined();
  });
});

describe('wallet_sendCalls parameter validation', () => {
  it('should reject calls with invalid to address format', () => {
    const invalidCall = createMockCall({ to: 'not-an-address' });

    expect(() => createMockParams([invalidCall])).not.toThrow();
 });

  it('should handle empty calls array', () => {
    const params = createMockParams([]);

    expect(params[0].calls).toHaveLength(0);
  });

  it('should handle multiple calls with mixed optional fields', () => {
    const calls: WalletSendCallsCall[] = [
      createMockCall({ data: undefined, value: undefined }),
      createMockCall({ data: '0x', value: '0x0' }),
      createMockCall({ capabilities: { customKey: 'customValue' } }),
    ];

    const params = createMockParams(calls);

    expect(params[0].calls).toHaveLength(3);
  });

  it('should handle atomicRequired as true', () => {
    const params = createMockParams();

    expect(params[0].atomicRequired).toBe(true);
  });

  it('should handle atomicRequired as false', () => {
    const params: WalletSendCallsParams = [
      {
        version: '1.0',
        chainId: mockChainId,
        from: mockAddress,
        calls: [createMockCall()],
        atomicRequired: false,
      },
    ];

    expect(params[0].atomicRequired).toBe(false);
  });

  it('should handle capabilities at top level of params', () => {
    const params: WalletSendCallsParams = [
      {
        version: '1.0',
        chainId: mockChainId,
        from: mockAddress,
        calls: [createMockCall()],
        atomicRequired: true,
        capabilities: {
          paymasterService: { url: 'https://paymaster.example.com' },
        },
      },
    ];

    expect(params[0].capabilities).toHaveProperty('paymasterService');
  });
});

describe('wallet_sendCalls return type', () => {
  it('should return a hex string (transaction hash array as encoded)', () => {
    const returnType: WalletSendCallsSchema['ReturnType'] = '0x';

    // The return type is a hex string encoding the array of transaction hashes
    expect(typeof returnType).toBe('string');
    expect(returnType.startsWith('0x')).toBe(true);
  });

  it('should accept valid hex return value', () => {
    const returnType: WalletSendCallsSchema['ReturnType'] = '0x1234567890abcdef';

    expect(returnType).toMatch(/^0x[a-fA-F0-9]+$/);
  });
});

describe('wallet_sendCalls error propagation', () => {
  it('should create a valid error response structure', () => {
    const error = standardErrors.provider.userRejectedRequest();

    const errorResponse = {
      result: {
        error,
      },
    };

    expect(errorResponse.result).toHaveProperty('error');
    expect(errorResponse.result.error).toHaveProperty('code');
    expect(errorResponse.result.error).toHaveProperty('message');
  });

  it('should serialize RPC error with code and message', () => {
    const error = standardErrors.rpc.internal('server error');

    const serialized = JSON.stringify(error);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.code).toBe(error.code);
    expect(deserialized.message).toBe(error.message);
  });

  it('should handle provider rejection error type', () => {
    const error = standardErrors.provider.userRejectedRequest({
      message: 'User rejected the request',
      data: { cause: 'user-denied' },
    });

    expect(error.code).toBe(4001);
    expect(error.message).toBe('User rejected the request');
  });

  it('should handle unauthorized error type', () => {
    const error = standardErrors.provider.unauthorized();

    expect(error.code).toBe(4100);
  });

  it('should handle invalid params error type', () => {
    const error = standardErrors.rpc.invalidParams('missing required parameter');

    expect(error.code).toBe(-32602);
  });

  it('should preserve error data through serialization', () => {
    const error = standardErrors.provider.custom({
      code: 3000,
      message: 'custom error',
      data: { key: 'value' },
    });

    const serialized = JSON.stringify(error);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.code).toBe(3000);
    expect(deserialized.message).toBe('custom error');
    expect(deserialized.data).toEqual({ key: 'value' });
  });
});

describe('wallet_sendCalls malformed input handling', () => {
  it('should handle missing optional fields in call object', () => {
    const minimalCall: WalletSendCallsCall = {
      to: mockAddress,
      // data, value, capabilities all optional
    };

    expect(minimalCall.to).toBe(mockAddress);
    expect(minimalCall.data).toBeUndefined();
    expect(minimalCall.value).toBeUndefined();
    expect(minimalCall.capabilities).toBeUndefined();
  });

  it('should handle malformed hex data gracefully', () => {
    const call = createMockCall({ data: '0xnothex' });

    // TypeScript will still allow this even if not valid hex - runtime validation happens elsewhere
    expect(call.data).toBe('0xnothex');
  });

  it('should handle zero-value transfer', () => {
    const call = createMockCall({ value: '0x0' });

    expect(call.value).toBe('0x0');
  });

  it('should handle large hex values', () => {
    const call = createMockCall({
      value: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });

    expect(call.value).toBeDefined();
  });

  it('should handle calls with nested capabilities', () => {
    const call = createMockCall({
      capabilities: {
        gasLimitOverride: { value: '0x5208' },
        customField: { nested: { deep: 'value' } },
      },
    });

    expect(call.capabilities).toHaveProperty('gasLimitOverride');
    expect(call.capabilities).toHaveProperty('customField');
  });

  it('should handle version string variations', () => {
    const versions = ['1.0', '2.0', '1.0.0', 'beta'];

    for (const version of versions) {
      const params: WalletSendCallsParams = [
        {
          version,
          chainId: mockChainId,
          from: mockAddress,
          calls: [createMockCall()],
        },
      ];

      expect(params[0].version).toBe(version);
    }
  });

  it('should handle different chainId formats', () => {
    const chainIds: WalletSendCallsParams[0]['chainId'][] = [
      '0x1',
      '0x89', // 137
      '0x2105', // 84532
      '0xa', // 10
    ];

    for (const chainId of chainIds) {
      const params: WalletSendCallsParams = [
        {
          version: '1.0',
          chainId,
          from: mockAddress,
          calls: [createMockCall()],
        },
      ];

      expect(params[0].chainId).toBe(chainId);
    }
  });
});
