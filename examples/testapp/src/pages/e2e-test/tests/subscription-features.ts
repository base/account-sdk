/**
 * Subscription Features Tests
 * 
 * Tests for recurring payment functionality via base.subscribe() and
 * related subscription management methods.
 */

import type { TestContext, TestHandlers } from '../types';
import { runTest } from '../utils/test-helpers';

/**
 * Test creating a subscription with base.subscribe()
 */
export async function testSubscribe(
  handlers: TestHandlers,
  context: TestContext
): Promise<{ id: string } | undefined> {
  return runTest(
    {
      category: 'Subscription Features',
      name: 'subscribe() function',
      requiresSDK: true,
      requiresUserInteraction: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Testing subscribe() function...');
      
      const result = await ctx.loadedSDK.base.subscribe({
        recurringCharge: '9.99',
        subscriptionOwner: '0x0000000000000000000000000000000000000001',
        periodInDays: 30,
        testnet: true,
      });

      handlers.updateTestStatus(
        'Subscription Features',
        'subscribe() function',
        'passed',
        undefined,
        `Subscription ID: ${result.id}`
      );
      handlers.addLog('success', `Subscription created: ${result.id}`);
      
      return result;
    },
    handlers,
    context
  );
}

/**
 * Test checking subscription status with base.subscription.getStatus()
 */
export async function testGetSubscriptionStatus(
  handlers: TestHandlers,
  context: TestContext
): Promise<any> {
  // Check if subscription ID is available
  if (!context.subscriptionId) {
    handlers.updateTestStatus(
      'Subscription Features',
      'base.subscription.getStatus()',
      'skipped',
      'No subscription ID available'
    );
    return undefined;
  }

  return runTest(
    {
      category: 'Subscription Features',
      name: 'base.subscription.getStatus()',
      requiresSDK: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Checking subscription status...');
      
      const status = await ctx.loadedSDK.base.subscription.getStatus({
        id: ctx.subscriptionId!,
        testnet: true,
      });

      const details = [
        `Active: ${status.isSubscribed}`,
        `Recurring: $${status.recurringCharge}`,
        status.remainingChargeInPeriod ? `Remaining: $${status.remainingChargeInPeriod}` : null,
        status.periodInDays ? `Period: ${status.periodInDays} days` : null,
      ].filter(Boolean).join(', ');
      
      handlers.updateTestStatus(
        'Subscription Features',
        'base.subscription.getStatus()',
        'passed',
        undefined,
        details
      );
      handlers.addLog('success', 'Subscription status retrieved successfully');
      handlers.addLog('info', `  - Active: ${status.isSubscribed}`);
      handlers.addLog('info', `  - Recurring charge: $${status.recurringCharge}`);
      
      if (status.remainingChargeInPeriod) {
        handlers.addLog('info', `  - Remaining in period: $${status.remainingChargeInPeriod}`);
      }
      if (status.periodInDays) {
        handlers.addLog('info', `  - Period: ${status.periodInDays} days`);
      }
      if (status.nextPeriodStart) {
        handlers.addLog('info', `  - Next period: ${status.nextPeriodStart.toISOString()}`);
      }
      
      return status;
    },
    handlers,
    context
  );
}

/**
 * Test preparing charge data with base.subscription.prepareCharge()
 */
export async function testPrepareCharge(
  handlers: TestHandlers,
  context: TestContext
): Promise<void> {
  // Check if subscription ID is available
  if (!context.subscriptionId) {
    handlers.updateTestStatus(
      'Subscription Features',
      'prepareCharge() with amount',
      'skipped',
      'No subscription ID available'
    );
    handlers.updateTestStatus(
      'Subscription Features',
      'prepareCharge() max-remaining-charge',
      'skipped',
      'No subscription ID available'
    );
    return;
  }

  // Test with specific amount
  await runTest(
    {
      category: 'Subscription Features',
      name: 'prepareCharge() with amount',
      requiresSDK: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Preparing charge with specific amount...');
      
      const chargeCalls = await ctx.loadedSDK.base.subscription.prepareCharge({
        id: ctx.subscriptionId!,
        amount: '1.00',
        testnet: true,
      });

      handlers.updateTestStatus(
        'Subscription Features',
        'prepareCharge() with amount',
        'passed',
        undefined,
        `Generated ${chargeCalls.length} call(s)`
      );
      handlers.addLog('success', `Charge prepared: ${chargeCalls.length} calls`);
      
      return chargeCalls;
    },
    handlers,
    context
  );

  // Test with max-remaining-charge
  await runTest(
    {
      category: 'Subscription Features',
      name: 'prepareCharge() max-remaining-charge',
      requiresSDK: true,
    },
    async (ctx) => {
      handlers.addLog('info', 'Preparing charge with max-remaining-charge...');
      
      const maxChargeCalls = await ctx.loadedSDK.base.subscription.prepareCharge({
        id: ctx.subscriptionId!,
        amount: 'max-remaining-charge',
        testnet: true,
      });

      handlers.updateTestStatus(
        'Subscription Features',
        'prepareCharge() max-remaining-charge',
        'passed',
        undefined,
        `Generated ${maxChargeCalls.length} call(s)`
      );
      handlers.addLog('success', `Max charge prepared: ${maxChargeCalls.length} calls`);
      
      return maxChargeCalls;
    },
    handlers,
    context
  );
}

