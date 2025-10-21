// Copyright (c) 2018-2025 Coinbase, Inc. <https://www.coinbase.com/>

import { describe, expect, it } from 'vitest';
import { decodeProlink } from './index.js';
import { createProlinkForCalls, createProlinkForPayment, createProlinkForSign } from './utils.js';

describe('createProlinkForPayment', () => {
  it('creates prolink for native transfer', async () => {
    const uri = await createProlinkForPayment({
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      amount: 100000000000000000n, // 0.1 ETH
      chainId: 8453,
    });

    expect(uri).toBeTruthy();
    expect(typeof uri).toBe('string');

    // Decode and verify
    const decoded = await decodeProlink(uri);
    expect(decoded.method).toBe('wallet_sendCalls');
    expect(decoded.chainId).toBe(8453);
    expect(Array.isArray(decoded.params)).toBe(true);

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.chainId).toBe('0x2105');
    expect(params.version).toBe('1.0');

    const calls = params.calls as Array<{ to: string; data: string; value: string }>;
    expect(calls).toHaveLength(1);
    expect(calls[0].to.toLowerCase()).toBe('0xfe21034794a5a574b94fe4fdfd16e005f1c96e51');
    expect(calls[0].data).toBe('0x');
    expect(BigInt(calls[0].value)).toBe(100000000000000000n);
  });

  it('creates prolink for ERC20 transfer', async () => {
    const uri = await createProlinkForPayment({
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      amount: 1000000n, // 1 USDC (6 decimals)
      chainId: 8453,
    });

    expect(uri).toBeTruthy();

    // Decode and verify
    const decoded = await decodeProlink(uri);
    expect(decoded.method).toBe('wallet_sendCalls');

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    const calls = params.calls as Array<{ to: string; data: string; value: string }>;
    expect(calls).toHaveLength(1);
    expect(calls[0].to.toLowerCase()).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
    expect(calls[0].value).toBe('0x0');
    // Should have transfer selector (0xa9059cbb) + encoded params
    expect(calls[0].data).toMatch(/^0xa9059cbb/);
  });

  it('includes from address when provided', async () => {
    const uri = await createProlinkForPayment({
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      amount: 1000000000000000n,
      chainId: 8453,
      from: '0x1111111111111111111111111111111111111111',
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.from?.toString().toLowerCase()).toBe(
      '0x1111111111111111111111111111111111111111'
    );
  });

  it('includes capabilities when provided', async () => {
    const uri = await createProlinkForPayment({
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      amount: 1000000000000000n,
      chainId: 8453,
      capabilities: {
        dataCallback: {
          callbackURL: 'https://example.com/callback',
        },
      },
    });

    const decoded = await decodeProlink(uri);
    expect(decoded.capabilities).toBeDefined();
    expect(decoded.capabilities?.dataCallback).toBeDefined();
  });

  it('validates recipient address', async () => {
    await expect(
      createProlinkForPayment({
        recipient: 'invalid' as `0x${string}`,
        amount: 1000000n,
        chainId: 8453,
      })
    ).rejects.toThrow('recipient must be a valid Ethereum address');
  });

  it('validates token address', async () => {
    await expect(
      createProlinkForPayment({
        token: 'invalid' as `0x${string}`,
        recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
        amount: 1000000n,
        chainId: 8453,
      })
    ).rejects.toThrow('token must be a valid Ethereum address');
  });

  it('validates amount is non-negative', async () => {
    await expect(
      createProlinkForPayment({
        recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
        amount: -1n,
        chainId: 8453,
      })
    ).rejects.toThrow('amount must be non-negative');
  });

  it('handles zero amount', async () => {
    const uri = await createProlinkForPayment({
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      amount: 0n,
      chainId: 8453,
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    const calls = params.calls as Array<{ value: string }>;
    expect(calls[0].value).toBe('0x0');
  });
});

describe('createProlinkForSign', () => {
  it('creates prolink for typed data', async () => {
    const uri = await createProlinkForSign({
      typedData: {
        domain: {
          name: 'Test App',
          version: '1',
          chainId: 8453,
          verifyingContract: '0x1111111111111111111111111111111111111111',
        },
        types: {
          Message: [{ name: 'content', type: 'string' }],
        },
        primaryType: 'Message',
        message: {
          content: 'Hello World',
        },
      },
      chainId: 8453,
    });

    expect(uri).toBeTruthy();
    expect(typeof uri).toBe('string');

    // Decode and verify
    const decoded = await decodeProlink(uri);
    expect(decoded.method).toBe('wallet_sign');
    expect(decoded.chainId).toBe(8453);
    expect(Array.isArray(decoded.params)).toBe(true);

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.chainId).toBe('0x2105');
    expect(params.version).toBe('1');
    expect(params.type).toBe('0x01');
    expect(params.data).toBeDefined();
  });

  it('includes custom version when provided', async () => {
    const uri = await createProlinkForSign({
      typedData: {
        domain: {
          name: 'Test',
          version: '1',
          chainId: 8453,
        },
        types: {
          Message: [{ name: 'text', type: 'string' }],
        },
        primaryType: 'Message',
        message: { text: 'test' },
      },
      chainId: 8453,
      version: '2.0',
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.version).toBe('2.0');
  });

  it('includes capabilities when provided', async () => {
    const uri = await createProlinkForSign({
      typedData: {
        domain: {
          name: 'Test',
          version: '1',
          chainId: 8453,
        },
        types: {
          Message: [{ name: 'text', type: 'string' }],
        },
        primaryType: 'Message',
        message: { text: 'test' },
      },
      chainId: 8453,
      capabilities: {
        custom: 'value',
      },
    });

    const decoded = await decodeProlink(uri);
    expect(decoded.capabilities).toBeDefined();
  });

  it('validates typed data has required fields', async () => {
    await expect(
      createProlinkForSign({
        typedData: {} as never,
        chainId: 8453,
      })
    ).rejects.toThrow('typedData must include types, domain, and message');
  });
});

describe('createProlinkForCalls', () => {
  it('creates prolink for single call', async () => {
    const uri = await createProlinkForCalls({
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000000f4240',
          value: 0n,
        },
      ],
      chainId: 8453,
    });

    expect(uri).toBeTruthy();

    // Decode and verify
    const decoded = await decodeProlink(uri);
    expect(decoded.method).toBe('wallet_sendCalls');
    expect(decoded.chainId).toBe(8453);

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.chainId).toBe('0x2105');
    expect(params.version).toBe('1.0');

    const calls = params.calls as Array<{ to: string; data: string; value: string }>;
    expect(calls).toHaveLength(1);
    expect(calls[0].to.toLowerCase()).toBe('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
    expect(calls[0].data).toMatch(/^0xa9059cbb/);
    expect(calls[0].value).toBe('0x0');
  });

  it('creates prolink for multiple calls', async () => {
    const uri = await createProlinkForCalls({
      calls: [
        {
          to: '0x1111111111111111111111111111111111111111',
          data: '0xabcd',
        },
        {
          to: '0x2222222222222222222222222222222222222222',
          data: '0xef01',
          value: 1000n,
        },
      ],
      chainId: 8453,
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    const calls = params.calls as Array<{ to: string; data: string; value: string }>;
    expect(calls).toHaveLength(2);
    expect(calls[0].to.toLowerCase()).toBe('0x1111111111111111111111111111111111111111');
    expect(calls[1].to.toLowerCase()).toBe('0x2222222222222222222222222222222222222222');
    expect(BigInt(calls[1].value)).toBe(1000n);
  });

  it('normalizes calls with missing data and value', async () => {
    const uri = await createProlinkForCalls({
      calls: [
        {
          to: '0x1111111111111111111111111111111111111111',
        },
      ],
      chainId: 8453,
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    const calls = params.calls as Array<{ data: string; value: string }>;
    expect(calls[0].data).toBe('0x');
    expect(calls[0].value).toBe('0x0');
  });

  it('includes from address when provided', async () => {
    const uri = await createProlinkForCalls({
      calls: [
        {
          to: '0x1111111111111111111111111111111111111111',
          data: '0x',
        },
      ],
      chainId: 8453,
      from: '0x2222222222222222222222222222222222222222',
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.from?.toString().toLowerCase()).toBe(
      '0x2222222222222222222222222222222222222222'
    );
  });

  it('includes custom version when provided', async () => {
    const uri = await createProlinkForCalls({
      calls: [
        {
          to: '0x1111111111111111111111111111111111111111',
        },
      ],
      chainId: 8453,
      version: '2.0.0',
    });

    const decoded = await decodeProlink(uri);
    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.version).toBe('2.0.0');
  });

  it('includes capabilities when provided', async () => {
    const uri = await createProlinkForCalls({
      calls: [
        {
          to: '0x1111111111111111111111111111111111111111',
        },
      ],
      chainId: 8453,
      capabilities: {
        dataCallback: {
          callbackURL: 'https://example.com',
        },
      },
    });

    const decoded = await decodeProlink(uri);
    expect(decoded.capabilities).toBeDefined();
  });

  it('validates calls array is not empty', async () => {
    await expect(
      createProlinkForCalls({
        calls: [],
        chainId: 8453,
      })
    ).rejects.toThrow('calls must be a non-empty array');
  });

  it('validates call addresses', async () => {
    await expect(
      createProlinkForCalls({
        calls: [
          {
            to: 'invalid' as `0x${string}`,
          },
        ],
        chainId: 8453,
      })
    ).rejects.toThrow('call.to must be a valid Ethereum address');
  });

  it('validates call values are non-negative', async () => {
    await expect(
      createProlinkForCalls({
        calls: [
          {
            to: '0x1111111111111111111111111111111111111111',
            value: -1n,
          },
        ],
        chainId: 8453,
      })
    ).rejects.toThrow('call.value must be non-negative');
  });
});

describe('Round-trip encoding/decoding', () => {
  it('round-trips payment correctly', async () => {
    const original = {
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51' as `0x${string}`,
      amount: 123456789n,
      chainId: 8453,
    };

    const uri = await createProlinkForPayment(original);
    const decoded = await decodeProlink(uri);

    expect(decoded.method).toBe('wallet_sendCalls');
    expect(decoded.chainId).toBe(original.chainId);

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    const calls = params.calls as Array<{ to: string; value: string }>;
    expect(calls[0].to.toLowerCase()).toBe(original.recipient.toLowerCase());
    expect(BigInt(calls[0].value)).toBe(original.amount);
  });

  it('round-trips sign correctly', async () => {
    const original = {
      typedData: {
        domain: {
          name: 'Test',
          version: '1',
          chainId: 8453,
        },
        types: {
          Message: [{ name: 'text', type: 'string' }],
        },
        primaryType: 'Message',
        message: { text: 'Hello' },
      },
      chainId: 8453,
    };

    const uri = await createProlinkForSign(original);
    const decoded = await decodeProlink(uri);

    expect(decoded.method).toBe('wallet_sign');
    expect(decoded.chainId).toBe(original.chainId);

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    expect(params.type).toBe('0x01');
  });

  it('round-trips calls correctly', async () => {
    const original = {
      calls: [
        {
          to: '0x1111111111111111111111111111111111111111' as `0x${string}`,
          data: '0xabcd' as `0x${string}`,
          value: 999n,
        },
      ],
      chainId: 8453,
    };

    const uri = await createProlinkForCalls(original);
    const decoded = await decodeProlink(uri);

    expect(decoded.method).toBe('wallet_sendCalls');
    expect(decoded.chainId).toBe(original.chainId);

    const params = (decoded.params as unknown[])[0] as Record<string, unknown>;
    const calls = params.calls as Array<{ to: string; data: string; value: string }>;
    expect(calls[0].to.toLowerCase()).toBe(original.calls[0].to.toLowerCase());
    expect(calls[0].data).toBe(original.calls[0].data);
    expect(BigInt(calls[0].value)).toBe(original.calls[0].value);
  });
});
