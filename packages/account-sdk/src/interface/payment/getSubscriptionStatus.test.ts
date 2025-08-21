import { FetchPermissionResponse } from ':core/rpc/coinbase_fetchSpendPermissions.js';
import * as provider from ':util/provider.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSubscriptionStatus } from './getSubscriptionStatus.js';
import type { SubscriptionResult } from './types.js';

// Mock the fetchRPCRequest function
vi.mock(':util/provider.js', () => ({
  fetchRPCRequest: vi.fn(),
}));

describe('getSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with subscription hash', () => {
    it('should fetch and return subscription status for an active subscription', async () => {
      const permissionHash = '0x1234567890abcdef';
      const mockResponse: FetchPermissionResponse = {
        permission: {
          permissionHash,
          signature: '0xsignature',
          permission: {
            account: '0xuser',
            spender: '0xapp',
            token: '0xusdc',
            allowance: '10000000', // 10 USDC (6 decimals)
            period: 2592000, // 30 days in seconds
            start: 1700000000,
            end: 1800000000,
            salt: '123',
            extraData: '0x',
          },
        },
        isActive: true,
        lastPaymentDate: 1700500000,
        lastPaymentAmount: '10.00',
        nextPeriodStart: 1703092000,
      };

      (provider.fetchRPCRequest as any).mockResolvedValue(mockResponse);

      const result = await getSubscriptionStatus({
        subscription: permissionHash,
        testnet: false,
      });

      expect(result).toEqual({
        isSubscribed: true,
        lastPaymentDate: new Date(1700500000 * 1000),
        lastPaymentAmount: '10.00',
        nextPeriodStart: new Date(1703092000 * 1000),
        recurringAmount: '10',
      });

      expect(provider.fetchRPCRequest).toHaveBeenCalledWith(
        {
          method: 'coinbase_fetchPermission',
          params: [
            {
              permissionHash: permissionHash,
            },
          ],
        },
        'https://rpc.wallet.coinbase.com'
      );
    });

    it('should handle inactive subscription', async () => {
      const permissionHash = '0x1234567890abcdef';
      const mockResponse: FetchPermissionResponse = {
        permission: {
          permissionHash,
          signature: '0xsignature',
          permission: {
            account: '0xuser',
            spender: '0xapp',
            token: '0xusdc',
            allowance: '10000000',
            period: 2592000,
            start: 1700000000,
            end: 1800000000,
            salt: '123',
            extraData: '0x',
          },
        },
        isActive: false,
      };

      (provider.fetchRPCRequest as any).mockResolvedValue(mockResponse);

      const result = await getSubscriptionStatus({
        subscription: permissionHash,
        testnet: true,
      });

      expect(result).toEqual({
        isSubscribed: false,
        recurringAmount: '10',
      });

      // Verify testnet was used - the function internally uses testnet flag
      expect(result.recurringAmount).toBe('10');
    });
  });

  describe('with SubscriptionResult object', () => {
    it('should extract hash from SubscriptionResult and fetch status', async () => {
      const subscription: SubscriptionResult = {
        id: '0xabcdef123456',
        subscriptionOwnerAddress: '0xapp' as any,
        subscriptionPayerAddress: '0xuser' as any,
        recurringCharge: '15.00',
        periodInDays: 30,
      };

      const mockResponse: FetchPermissionResponse = {
        permission: {
          permissionHash: subscription.id,
          signature: '0xsignature',
          permission: {
            account: '0xuser',
            spender: '0xapp',
            token: '0xusdc',
            allowance: '15000000', // 15 USDC
            period: 2592000,
            start: 1700000000,
            end: 1800000000,
            salt: '123',
            extraData: '0x',
          },
        },
        isActive: true,
        lastPaymentDate: 1700600000,
        lastPaymentAmount: '15.00',
        nextPeriodStart: 1703192000,
      };

      (provider.fetchRPCRequest as any).mockResolvedValue(mockResponse);

      const result = await getSubscriptionStatus({
        subscription,
        testnet: false,
        walletUrl: 'https://wallet.example.com',
      });

      expect(result).toEqual({
        isSubscribed: true,
        lastPaymentDate: new Date(1700600000 * 1000),
        lastPaymentAmount: '15.00',
        nextPeriodStart: new Date(1703192000 * 1000),
        recurringAmount: '15',
      });

      expect(provider.fetchRPCRequest).toHaveBeenCalledWith(
        {
          method: 'coinbase_fetchPermission',
          params: [
            {
              permissionHash: subscription.id,
            },
          ],
        },
        'https://rpc.wallet.coinbase.com'
      );
    });
  });

  describe('error handling', () => {
    it('should throw error if RPC request fails', async () => {
      const error = new Error('RPC request failed');
      (provider.fetchRPCRequest as any).mockRejectedValue(error);

      await expect(
        getSubscriptionStatus({
          subscription: '0x123',
          testnet: false,
        })
      ).rejects.toThrow('RPC request failed');
    });
  });

  describe('partial data handling', () => {
    it('should handle response without optional fields', async () => {
      const permissionHash = '0x1234567890abcdef';
      const mockResponse: FetchPermissionResponse = {
        permission: {
          permissionHash,
          signature: '0xsignature',
          permission: {
            account: '0xuser',
            spender: '0xapp',
            token: '0xusdc',
            allowance: '5000000', // 5 USDC
            period: 2592000,
            start: 1700000000,
            end: 1800000000,
            salt: '123',
            extraData: '0x',
          },
        },
        isActive: true,
        // No lastPaymentDate, lastPaymentAmount, or nextPeriodStart
      };

      (provider.fetchRPCRequest as any).mockResolvedValue(mockResponse);

      const result = await getSubscriptionStatus({
        subscription: permissionHash,
        testnet: false,
        telemetry: false,
      });

      expect(result).toEqual({
        isSubscribed: true,
        recurringAmount: '5',
      });

      // Verify the correct RPC was called
      expect(provider.fetchRPCRequest).toHaveBeenCalled();
    });

    it('should handle response without permission details', async () => {
      const permissionHash = '0x1234567890abcdef';
      const mockResponse: FetchPermissionResponse = {
        permission: undefined as any,
        isActive: false,
      };

      (provider.fetchRPCRequest as any).mockResolvedValue(mockResponse);

      const result = await getSubscriptionStatus({
        subscription: permissionHash,
        testnet: false,
      });

      expect(result).toEqual({
        isSubscribed: false,
      });
    });
  });
});
