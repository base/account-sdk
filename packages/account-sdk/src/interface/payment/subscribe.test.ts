import { describe, expect, it, vi } from 'vitest';
import { subscribe } from './subscribe.js';
import type { SubscriptionOptions } from './types.js';

// Mock the dependencies
vi.mock(':core/telemetry/events/subscription.js', () => ({
  logSubscriptionStarted: vi.fn(),
  logSubscriptionCompleted: vi.fn(),
  logSubscriptionError: vi.fn(),
}));

vi.mock('./utils/sdkManager.js', () => ({
  createEphemeralSDK: vi.fn(() => ({
    getProvider: vi.fn(() => ({
      request: vi.fn(),
      disconnect: vi.fn(),
    })),
  })),
}));

vi.mock('../public-utilities/spend-permission/index.js', () => ({
  getHash: vi.fn(() => Promise.resolve('0xmockhash')),
}));

describe('subscribe with periodInSeconds', () => {
  it('should throw error when periodInSeconds is used without testnet', async () => {
    const options: SubscriptionOptions = {
      recurringCharge: '10.00',
      subscriptionOwner: '0x1234567890123456789012345678901234567890',
      periodInSeconds: 300, // 5 minutes
      testnet: false, // This should cause an error
    };

    await expect(subscribe(options)).rejects.toThrow(
      'periodInSeconds is only available for testing on testnet'
    );
  });

  it('should accept periodInSeconds when testnet is true and include it in result', async () => {
    const options: SubscriptionOptions = {
      recurringCharge: '0.01',
      subscriptionOwner: '0x1234567890123456789012345678901234567890',
      periodInSeconds: 300, // 5 minutes for testing
      testnet: true, // Required for periodInSeconds
    };

    // Mock the provider response
    const mockProvider = {
      request: vi.fn().mockResolvedValue({
        signature: '0xsignature',
        signedData: {
          message: {
            account: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            spender: '0x1234567890123456789012345678901234567890',
            token: '0xtoken',
            allowance: '10000',
            period: 300, // Should be 300 seconds, not converted to days
            start: 1234567890,
            end: 999999999,
            salt: '0xsalt',
            extraData: '0x',
          },
        },
      }),
      disconnect: vi.fn(),
    };

    const { createEphemeralSDK } = await import('./utils/sdkManager.js');
    vi.mocked(createEphemeralSDK).mockReturnValue({
      getProvider: () => mockProvider as any,
    } as any);

    const result = await subscribe(options);
    
    // Verify the result includes periodInSeconds
    expect(result).toBeDefined();
    expect(result.periodInSeconds).toBe(300);
    expect(result.periodInDays).toBe(1); // 300 seconds = 5 minutes = ceil(300/86400) = 1 day
  });

  it('should use periodInDays when periodInSeconds is not provided on testnet', async () => {
    const options: SubscriptionOptions = {
      recurringCharge: '10.00',
      subscriptionOwner: '0x1234567890123456789012345678901234567890',
      periodInDays: 7, // Weekly subscription
      testnet: true,
    };

    // Mock the provider response
    const mockProvider = {
      request: vi.fn().mockResolvedValue({
        signature: '0xsignature',
        signedData: {
          message: {
            account: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            spender: '0x1234567890123456789012345678901234567890',
            token: '0xtoken',
            allowance: '10000000',
            period: 604800, // 7 days in seconds
            start: 1234567890,
            end: 999999999,
            salt: '0xsalt',
            extraData: '0x',
          },
        },
      }),
      disconnect: vi.fn(),
    };

    const { createEphemeralSDK } = await import('./utils/sdkManager.js');
    vi.mocked(createEphemeralSDK).mockReturnValue({
      getProvider: () => mockProvider as any,
    } as any);

    const result = await subscribe(options);
    expect(result.periodInDays).toBe(7);
    expect(result.periodInSeconds).toBeUndefined(); // Should not have periodInSeconds when not provided
  });

  it('should include periodInSeconds in result and calculate periodInDays correctly', async () => {
    const options: SubscriptionOptions = {
      recurringCharge: '0.01',
      subscriptionOwner: '0x1234567890123456789012345678901234567890',
      periodInSeconds: 172800, // Exactly 2 days
      testnet: true,
    };

    // Mock the provider response
    const mockProvider = {
      request: vi.fn().mockResolvedValue({
        signature: '0xsignature',
        signedData: {
          message: {
            account: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            spender: '0x1234567890123456789012345678901234567890',
            token: '0xtoken',
            allowance: '10000',
            period: 172800, // 2 days in seconds
            start: 1234567890,
            end: 999999999,
            salt: '0xsalt',
            extraData: '0x',
          },
        },
      }),
      disconnect: vi.fn(),
    };

    const { createEphemeralSDK } = await import('./utils/sdkManager.js');
    vi.mocked(createEphemeralSDK).mockReturnValue({
      getProvider: () => mockProvider as any,
    } as any);

    const result = await subscribe(options);
    expect(result.periodInSeconds).toBe(172800); // Should include the exact periodInSeconds
    expect(result.periodInDays).toBe(2); // Should be exactly 2 days
  });

  it('should not include periodInSeconds when using mainnet', async () => {
    const options: SubscriptionOptions = {
      recurringCharge: '10.00',
      subscriptionOwner: '0x1234567890123456789012345678901234567890',
      periodInDays: 30, // Monthly subscription
      testnet: false, // Mainnet
    };

    // Mock the provider response
    const mockProvider = {
      request: vi.fn().mockResolvedValue({
        signature: '0xsignature',
        signedData: {
          message: {
            account: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            spender: '0x1234567890123456789012345678901234567890',
            token: '0xtoken',
            allowance: '10000000',
            period: 2592000, // 30 days in seconds
            start: 1234567890,
            end: 999999999,
            salt: '0xsalt',
            extraData: '0x',
          },
        },
      }),
      disconnect: vi.fn(),
    };

    const { createEphemeralSDK } = await import('./utils/sdkManager.js');
    vi.mocked(createEphemeralSDK).mockReturnValue({
      getProvider: () => mockProvider as any,
    } as any);

    const result = await subscribe(options);
    expect(result.periodInDays).toBe(30);
    expect(result.periodInSeconds).toBeUndefined(); // Should not have periodInSeconds on mainnet
  });
});
