import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pay } from './pay.js';
import * as sdkManager from './utils/sdkManager.js';
import * as translatePayment from './utils/translatePayment.js';
import * as validation from './utils/validation.js';

// Mock the utility modules
vi.mock('./utils/validation.js');
vi.mock('./utils/translatePayment.js');
vi.mock('./utils/sdkManager.js');

// Mock telemetry events
vi.mock(':core/telemetry/events/payment.js', () => ({
  logPaymentStarted: vi.fn(),
  logPaymentError: vi.fn(),
  logPaymentCompleted: vi.fn(),
}));

describe('pay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.randomUUID
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn().mockReturnValue('mock-correlation-id'),
    });
  });

  it('should successfully process a payment', async () => {
    // Setup mocks
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateAddress).mockReturnValue(undefined);
    vi.mocked(translatePayment.translatePaymentToSendCalls).mockReturnValue({
      version: '1.0',
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
      payerInfoResponses: undefined,
    });

    expect(validation.validateStringAmount).toHaveBeenCalledWith('10.50', 2);
    expect(validation.validateAddress).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51'
    );
    expect(translatePayment.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      false,
      undefined
    );

    // Verify telemetry events
    const { logPaymentStarted, logPaymentCompleted } = await import(':core/telemetry/events/payment.js');
    expect(logPaymentStarted).toHaveBeenCalledWith({
      amount: '10.50',
      testnet: false,
      correlationId: 'mock-correlation-id',
    });
    expect(logPaymentCompleted).toHaveBeenCalledWith({
      amount: '10.50',
      testnet: false,
      correlationId: 'mock-correlation-id',
    });
  });

  it('should handle validation errors', async () => {
    vi.mocked(validation.validateStringAmount).mockImplementation(() => {
      throw new Error('Invalid amount: must be greater than 0');
    });

    const payment = await pay({
      amount: '0',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });

    expect(payment).toEqual({
      success: false,
      error: 'Invalid amount: must be greater than 0',
      amount: '0',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });

    // Verify telemetry events
    const { logPaymentStarted, logPaymentError } = await import(':core/telemetry/events/payment.js');
    expect(logPaymentStarted).toHaveBeenCalledWith({
      amount: '0',
      testnet: false,
      correlationId: 'mock-correlation-id',
    });
    expect(logPaymentError).toHaveBeenCalledWith({
      amount: '0',
      testnet: false,
      correlationId: 'mock-correlation-id',
      errorMessage: 'Invalid amount: must be greater than 0',
    });
  });

  it('should handle SDK execution errors', async () => {
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateAddress).mockReturnValue(undefined);
    vi.mocked(translatePayment.translatePaymentToSendCalls).mockReturnValue({
      version: '1.0',
      chainId: 8453,
      calls: [],
      capabilities: {},
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockRejectedValue(
      new Error('User rejected the request')
    );

    const payment = await pay({
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });

    expect(payment).toEqual({
      success: false,
      error: 'User rejected the request',
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });
  });

  it('should support testnet with paymaster', async () => {
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateAddress).mockReturnValue(undefined);
    vi.mocked(translatePayment.translatePaymentToSendCalls).mockReturnValue({
      version: '1.0',
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
          url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
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
    expect(translatePayment.translatePaymentToSendCalls).toHaveBeenCalledWith(
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
      true
    );
  });

  it('should successfully process a payment with payerInfo', async () => {
    const payerInfo = {
      requests: [
        { type: 'email' },
        { type: 'physicalAddress', optional: true },
      ],
      callbackURL: 'https://example.com/callback'
    };

    const payerInfoResponses = {
      email: 'test@example.com',
      physicalAddress: {
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        countryCode: 'US',
      },
    };

    // Setup mocks
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateAddress).mockReturnValue(undefined);
    vi.mocked(translatePayment.translatePaymentToSendCalls).mockReturnValue({
      version: '1.0',
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
          requests: [
            { type: 'email', optional: false },
            { type: 'physicalAddress', optional: true },
          ],
                      callbackURL: 'https://example.com/callback',
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
      payerInfo,
    });

    expect(payment).toEqual({
      success: true,
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '10.50',
      to: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      payerInfoResponses: payerInfoResponses,
    });

    expect(validation.validateStringAmount).toHaveBeenCalledWith('10.50', 2);
    expect(validation.validateAddress).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51'
    );
    expect(translatePayment.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      false,
      payerInfo
    );
  });
});
