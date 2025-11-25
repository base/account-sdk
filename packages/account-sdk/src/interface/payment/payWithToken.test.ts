import { beforeEach, describe, expect, it, vi } from 'vitest';

import { payWithToken } from './payWithToken.js';

vi.mock(':core/telemetry/events/payment.js', () => ({
  logPayWithTokenStarted: vi.fn(),
  logPayWithTokenCompleted: vi.fn(),
  logPayWithTokenError: vi.fn(),
}));

vi.mock('./utils/validation.js', () => ({
  normalizeAddress: vi.fn((address: string) => address),
  validateBaseUnitAmount: vi.fn(() => BigInt(1000)),
}));

vi.mock('./utils/tokenRegistry.js', () => ({
  resolveTokenAddress: vi.fn(() => ({
    address: '0x0000000000000000000000000000000000000001',
    symbol: 'USDC',
    decimals: 6,
    isNativeEth: false,
  })),
}));

vi.mock('./utils/translateTokenPayment.js', () => ({
  buildTokenPaymentRequest: vi.fn(() => ({
    version: '2.0.0',
    chainId: 8453,
    calls: [],
    capabilities: {},
  })),
}));

vi.mock('./utils/sdkManager.js', () => ({
  executePaymentWithSDK: vi.fn(async () => ({
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    payerInfoResponses: { email: 'test@example.com' },
  })),
}));

describe('payWithToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('mock-correlation-id'),
    });
  });

  it('should successfully process a token payment', async () => {
    const result = await payWithToken({
      amount: '1000',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      token: 'USDC',
      testnet: false,
      paymaster: { url: 'https://paymaster.example.com' },
    });

    expect(result).toEqual({
      success: true,
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      token: 'USDC',
      tokenAddress: '0x0000000000000000000000000000000000000001',
      tokenAmount: '1000',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      payerInfoResponses: { email: 'test@example.com' },
    });

    const { buildTokenPaymentRequest } = await import('./utils/translateTokenPayment.js');
    expect(buildTokenPaymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
        amount: BigInt(1000),
        chainId: 8453,
        paymaster: { url: 'https://paymaster.example.com' },
      })
    );
  });

  it('should merge walletUrl into sdkConfig and pass it to the executor', async () => {
    const { executePaymentWithSDK } = await import('./utils/sdkManager.js');

    await payWithToken({
      amount: '500',
      to: '0x0A7c6899cdCb379E284fbFd045462e751dA4C7cE',
      token: 'USDT',
      testnet: false,
      paymaster: { paymasterAndData: '0xdeadbeef' as `0x${string}` },
      walletUrl: 'https://wallet.example.com',
      sdkConfig: {
        preference: {
          telemetry: false,
        },
      },
    });

    expect(executePaymentWithSDK).toHaveBeenCalledWith(
      expect.any(Object),
      false,
      true,
      expect.objectContaining({
        preference: expect.objectContaining({
          telemetry: false,
          walletUrl: 'https://wallet.example.com',
        }),
      })
    );
  });

  it('should propagate errors and log telemetry when execution fails', async () => {
    const { executePaymentWithSDK } = await import('./utils/sdkManager.js');
    const { logPayWithTokenError } = await import(':core/telemetry/events/payment.js');

    vi.mocked(executePaymentWithSDK).mockRejectedValueOnce(new Error('execution reverted'));

    await expect(
      payWithToken({
        amount: '1',
        to: '0x000000000000000000000000000000000000dead',
        token: 'USDC',
        testnet: false,
        paymaster: { url: 'https://paymaster.example.com' },
      })
    ).rejects.toThrow('execution reverted');

    expect(logPayWithTokenError).toHaveBeenCalledWith(
      expect.objectContaining({
        token: 'USDC',
        errorMessage: 'execution reverted',
      })
    );
  });
});
