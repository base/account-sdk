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

  it('should accept periodInSeconds when testnet is true', async () => {
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

    // This should not throw
    await expect(subscribe(options)).resolves.toBeDefined();
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
  });

  it('should properly calculate periodInDays from periodInSeconds for display', async () => {
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
    expect(result.periodInDays).toBe(2); // Should be exactly 2 days
  });
});
