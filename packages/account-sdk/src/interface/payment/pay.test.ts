import { describe, expect, it, vi } from 'vitest';
import { pay } from './pay.js';
import * as sdkManager from './utils/sdkManager.js';
import * as translatePaymentModule from './utils/translatePayment.js';
import * as validationModule from './utils/validation.js';

// Mock dependencies
vi.mock('./utils/sdkManager.js', () => ({
  executePaymentWithSDK: vi.fn(),
}));

vi.mock('./utils/translatePayment.js', () => ({
  translatePaymentToSendCalls: vi.fn(),
}));

vi.mock('./utils/validation.js', () => ({
  validateStringAmount: vi.fn(),
  normalizeAddress: vi.fn((address: string) => address),
}));

vi.mock(':core/telemetry/events/payment.js', () => ({
  logPaymentStarted: vi.fn(),
  logPaymentCompleted: vi.fn(),
  logPaymentError: vi.fn(),
}));

// Mock crypto.randomUUID for tests
vi.stubGlobal('crypto', {
  randomUUID: () => 'test-uuid-123',
});

describe('pay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset validateStringAmount to not throw by default
    vi.mocked(validationModule.validateStringAmount).mockImplementation(() => undefined);
  });

  it('should successfully process a payment', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    const payment = await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
    });

    expect(payment).toEqual({
      success: true,
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });

    expect(validationModule.validateStringAmount).toHaveBeenCalledWith('10.50', 6);
    expect(translatePaymentModule.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      false,
      undefined
    );
    expect(sdkManager.executePaymentWithSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        version: '2.0.0',
        chainId: 8453,
      }),
      false,
      undefined,
      true
    );
  });

  it('should normalize address before processing', async () => {
    const normalizedAddress = '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51';
    const lowercaseAddress = '0xfe21034794a5a574b94fe4fdfd16e005f1c96e51';

    vi.mocked(validationModule.normalizeAddress).mockReturnValue(normalizedAddress);
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    // Test with lowercase non-checksummed address
    const payment = await pay({
      amount: '10.50',
      to: lowercaseAddress,
      testnet: false,
    });

    expect(payment.to).toBe(normalizedAddress);
    expect(validationModule.normalizeAddress).toHaveBeenCalledWith(lowercaseAddress);
    expect(translatePaymentModule.translatePaymentToSendCalls).toHaveBeenCalledWith(
      normalizedAddress,
      '10.50',
      false,
      undefined
    );
  });

  it('should validate amount format', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    // Test with 6 decimal places
    const payment = await pay({
      amount: '10.123456',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
    });

    expect(validationModule.validateStringAmount).toHaveBeenCalledWith('10.123456', 6);
    expect(payment.amount).toBe('10.123456');
  });

  it('should throw error when validation fails', async () => {
    const validationError = new Error('Invalid amount format');
    vi.mocked(validationModule.validateStringAmount).mockImplementation(() => {
      throw validationError;
    });

    await expect(
      pay({
        amount: 'invalid',
        to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
        testnet: false,
      })
    ).rejects.toThrow(validationError);

    expect(sdkManager.executePaymentWithSDK).not.toHaveBeenCalled();
  });

  it('should throw error when SDK execution fails', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockRejectedValue(
      new Error('User rejected the request')
    );

    await expect(
      pay({
        amount: '10.50',
        to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
        testnet: false,
      })
    ).rejects.toThrow('User rejected the request');
  });

  it('should work with testnet', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 84532,
      calls: [
        {
          to: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    const payment = await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: true,
    });

    expect(payment.success).toBe(true);
    expect(translatePaymentModule.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      true,
      undefined
    );
    expect(sdkManager.executePaymentWithSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 84532,
      }),
      true,
      undefined,
      true
    );
  });

  it('should include payerInfo when provided', async () => {
    const payerInfo = {
      requests: [{ type: 'email' as const }],
      callbackURL: 'https://example.com/callback',
    };

    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    const payment = await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
      payerInfo,
    });

    expect(payment.success).toBe(true);
    expect(translatePaymentModule.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      false,
      payerInfo
    );
  });

  it('should use custom wallet URL when provided', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
      walletUrl: 'https://custom.wallet.com',
    });

    expect(sdkManager.executePaymentWithSDK).toHaveBeenCalledWith(
      expect.any(Object),
      false,
      'https://custom.wallet.com',
      true
    );
  });

  it('should disable telemetry when requested', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
      telemetry: false,
    });

    // Verify SDK manager was called with telemetry = false
    expect(sdkManager.executePaymentWithSDK).toHaveBeenCalledWith(
      expect.any(Object),
      false,
      undefined,
      false
    );
  });

  it('should include paymasterUrl capability when on testnet', async () => {
    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 84532,
      calls: [
        {
          to: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {
        paymasterService: {
          url: 'https://paymaster.testnet.com',
        },
      },
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    });

    const payment = await pay({
      amount: '5.00',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: true,
    });

    expect(payment.success).toBe(true);
    expect(translatePaymentModule.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '5.00',
      true,
      undefined
    );
    expect(sdkManager.executePaymentWithSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        chainId: 84532,
        capabilities: expect.objectContaining({
          paymasterService: expect.any(Object),
        }),
      }),
      true,
      undefined,
      true
    );
  });

  it('should return payerInfoResponses when available', async () => {
    const payerInfoResponses = {
      email: 'user@example.com',
      name: {
        firstName: 'John',
        familyName: 'Doe',
      },
    };

    vi.mocked(translatePaymentModule.translatePaymentToSendCalls).mockReturnValue({
      version: '2.0.0',
      chainId: 8453,
      calls: [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xabcdef',
          value: '0x0',
        },
      ],
      capabilities: {
        dataCallback: {
          requests: [{ type: 'email', optional: false }],
        },
      },
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      payerInfoResponses,
    });

    const payment = await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
      payerInfo: {
        requests: [{ type: 'email' }],
      },
    });

    expect(payment.success).toBe(true);
    expect(payment.payerInfoResponses).toEqual(payerInfoResponses);
  });
});