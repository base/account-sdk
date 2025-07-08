import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pay } from './pay.js';
import * as ensResolution from './utils/ensResolution.js';
import * as sdkManager from './utils/sdkManager.js';
import * as translatePayment from './utils/translatePayment.js';
import * as validation from './utils/validation.js';

// Mock the utility modules
vi.mock('./utils/validation.js');
vi.mock('./utils/translatePayment.js');
vi.mock('./utils/sdkManager.js');
vi.mock('./utils/ensResolution.js');

describe('pay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully process a payment', async () => {
    // Setup mocks
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateRecipient).mockReturnValue(undefined);
    vi.mocked(validation.isENSName).mockReturnValue(false);
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
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
    });

    expect(payment).toEqual({
      success: true,
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '10.50',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      infoResponses: undefined,
    });

    expect(validation.validateStringAmount).toHaveBeenCalledWith('10.50', 2);
    expect(validation.validateRecipient).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51'
    );
    expect(translatePayment.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      false,
      undefined
    );
  });

  it('should successfully process a payment with ENS name', async () => {
    const ensName = 'vitalik.eth';
    const resolvedAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

    // Setup mocks
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateRecipient).mockReturnValue(undefined);
    vi.mocked(validation.isENSName).mockReturnValue(true);
    vi.mocked(ensResolution.resolveENS).mockResolvedValue(resolvedAddress);
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
      amount: '5.00',
      recipient: ensName,
      testnet: false,
    });

    expect(payment).toEqual({
      success: true,
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '5.00',
      recipient: resolvedAddress,
      infoResponses: undefined,
    });

    expect(validation.validateStringAmount).toHaveBeenCalledWith('5.00', 2);
    expect(validation.validateRecipient).toHaveBeenCalledWith(ensName);
    expect(ensResolution.resolveENS).toHaveBeenCalledWith(ensName);
    expect(translatePayment.translatePaymentToSendCalls).toHaveBeenCalledWith(
      resolvedAddress,
      '5.00',
      false,
      undefined
    );
  });

  it('should handle ENS resolution failure', async () => {
    const ensName = 'nonexistent.eth';

    // Setup mocks
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateRecipient).mockReturnValue(undefined);
    vi.mocked(validation.isENSName).mockReturnValue(true);
    vi.mocked(ensResolution.resolveENS).mockRejectedValue(
      new Error('Failed to resolve ENS name "nonexistent.eth": ENS name "nonexistent.eth" not found')
    );

    const payment = await pay({
      amount: '10.50',
      recipient: ensName,
      testnet: false,
    });

    expect(payment).toEqual({
      success: false,
      error: 'Failed to resolve ENS name "nonexistent.eth": ENS name "nonexistent.eth" not found',
      amount: '10.50',
      recipient: ensName,
    });

    expect(validation.validateStringAmount).toHaveBeenCalledWith('10.50', 2);
    expect(validation.validateRecipient).toHaveBeenCalledWith(ensName);
    expect(ensResolution.resolveENS).toHaveBeenCalledWith(ensName);
  });

  it('should handle validation errors', async () => {
    vi.mocked(validation.validateStringAmount).mockImplementation(() => {
      throw new Error('Invalid amount: must be greater than 0');
    });

    const payment = await pay({
      amount: '0',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });

    expect(payment).toEqual({
      success: false,
      error: 'Invalid amount: must be greater than 0',
      amount: '0',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });
  });

  it('should handle SDK execution errors', async () => {
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateRecipient).mockReturnValue(undefined);
    vi.mocked(validation.isENSName).mockReturnValue(false);
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
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });

    expect(payment).toEqual({
      success: false,
      error: 'User rejected the request',
      amount: '10.50',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
    });
  });

  it('should support testnet with paymaster', async () => {
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateRecipient).mockReturnValue(undefined);
    vi.mocked(validation.isENSName).mockReturnValue(false);
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
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
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

  it('should successfully process a payment with infoRequests', async () => {
    const infoRequests = [
      { request: 'email' },
      { request: 'physicalAddress', optional: true },
    ];

    const infoResponses = {
      email: 'test@example.com',
      physicalAddress: '123 Main St',
    };

    // Setup mocks
    vi.mocked(validation.validateStringAmount).mockReturnValue(undefined);
    vi.mocked(validation.validateRecipient).mockReturnValue(undefined);
    vi.mocked(validation.isENSName).mockReturnValue(false);
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
        },
      },
    });
    vi.mocked(sdkManager.executePaymentWithSDK).mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      infoResponses,
    });

    const payment = await pay({
      amount: '10.50',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      testnet: false,
      infoRequests,
    });

    expect(payment).toEqual({
      success: true,
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      amount: '10.50',
      recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      infoResponses: infoResponses,
    });

    expect(validation.validateStringAmount).toHaveBeenCalledWith('10.50', 2);
    expect(validation.validateRecipient).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51'
    );
    expect(translatePayment.translatePaymentToSendCalls).toHaveBeenCalledWith(
      '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
      '10.50',
      false,
      infoRequests
    );
  });
});
