/**
 * Payment Features Tests
 * 
 * Tests for one-time payment functionality via base.pay() and status checking.
 */

import type { TestContext, TestHandlers } from '../types';
import { runTest } from '../utils/test-helpers';

/**
 * Test creating a payment with base.pay()
 */
export async function testPay(
  handlers: TestHandlers,
  context: TestContext
): Promise<{ id: string } | undefined> {
  return runTest(
    {
      category: 'Payment Features',
      name: 'pay() function',
      requiresSDK: true,
      requiresUserInteraction: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Testing pay() function...');
      
      const result = await ctx.loadedSDK.base.pay({
        amount: '0.01',
        to: '0x0000000000000000000000000000000000000001',
        testnet: true,
      });

      handlers.updateTestStatus(
        'Payment Features',
        'pay() function',
        'passed',
        undefined,
        `Payment ID: ${result.id}`
      );
      handlers.addLog('success', `Payment created: ${result.id}`);
      
      return result;
    },
    handlers,
    context
  );
}

/**
 * Test checking payment status with getPaymentStatus()
 */
export async function testGetPaymentStatus(
  handlers: TestHandlers,
  context: TestContext
): Promise<any> {
  // Check if payment ID is available
  if (!context.paymentId) {
    handlers.updateTestStatus(
      'Payment Features',
      'getPaymentStatus()',
      'skipped',
      'No payment ID available'
    );
    return undefined;
  }

  return runTest(
    {
      category: 'Payment Features',
      name: 'getPaymentStatus()',
      requiresSDK: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Checking payment status with polling (up to 5s)...');
      
      const status = await ctx.loadedSDK.getPaymentStatus({
        id: ctx.paymentId!,
        testnet: true,
        maxRetries: 10, // Retry up to 10 times
        retryDelayMs: 500, // 500ms between retries = ~5 seconds total
      });

      handlers.updateTestStatus(
        'Payment Features',
        'getPaymentStatus()',
        'passed',
        undefined,
        `Status: ${status.status}`
      );
      handlers.addLog('success', `Payment status: ${status.status}`);
      
      return status;
    },
    handlers,
    context
  );
}

