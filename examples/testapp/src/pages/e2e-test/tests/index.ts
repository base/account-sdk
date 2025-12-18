/**
 * Test Registry
 * 
 * Central registry of all E2E tests organized by category.
 * This provides a structured way to access and run tests.
 */

import type { TestContext, TestHandlers } from '../types';

// Import all test functions
import { testSDKInitialization } from './sdk-initialization';
import {
  testConnectWallet,
  testGetAccounts,
  testGetChainId,
  testSignMessage,
} from './wallet-connection';
import {
  testPay,
  testGetPaymentStatus,
} from './payment-features';
import {
  testSubscribe,
  testGetSubscriptionStatus,
  testPrepareCharge,
} from './subscription-features';
import {
  testRequestSpendPermission,
  testGetPermissionStatus,
  testFetchPermission,
  testFetchPermissions,
  testPrepareSpendCallData,
  testPrepareRevokeCallData,
} from './spend-permissions';
import {
  testCreateSubAccount,
  testGetSubAccounts,
  testSignWithSubAccount,
  testSendCallsFromSubAccount,
} from './sub-account-features';
import {
  testSignTypedData,
  testWalletSendCalls,
  testWalletPrepareCalls,
} from './sign-and-send';
import { testProlinkEncodeDecode } from './prolink-features';
import { testProviderEvents } from './provider-events';

/**
 * Test function type
 */
export type TestFn = (handlers: TestHandlers, context: TestContext) => Promise<any>;

/**
 * Test category definition
 */
export interface TestCategoryDefinition {
  name: string;
  tests: TestFn[];
  requiresConnection?: boolean; // Category-level requirement
}

/**
 * Complete test registry organized by category
 */
export const testRegistry: TestCategoryDefinition[] = [
  {
    name: 'SDK Initialization & Exports',
    tests: [testSDKInitialization],
    requiresConnection: false,
  },
  {
    name: 'Wallet Connection',
    tests: [
      testConnectWallet,
      testGetAccounts,
      testGetChainId,
      testSignMessage,
    ],
    requiresConnection: false, // Connection is established during these tests
  },
  {
    name: 'Payment Features',
    tests: [
      testPay,
      testGetPaymentStatus,
    ],
    requiresConnection: false, // pay() doesn't require explicit connection
  },
  {
    name: 'Subscription Features',
    tests: [
      testSubscribe,
      testGetSubscriptionStatus,
      testPrepareCharge,
    ],
    requiresConnection: false, // subscribe() doesn't require explicit connection
  },
  {
    name: 'Prolink Features',
    tests: [testProlinkEncodeDecode],
    requiresConnection: false,
  },
  {
    name: 'Spend Permissions',
    tests: [
      testRequestSpendPermission,
      testGetPermissionStatus,
      testFetchPermission,
      testFetchPermissions,
      testPrepareSpendCallData,
      testPrepareRevokeCallData,
    ],
    requiresConnection: true,
  },
  {
    name: 'Sub-Account Features',
    tests: [
      testCreateSubAccount,
      testGetSubAccounts,
      testSignWithSubAccount,
      testSendCallsFromSubAccount,
    ],
    requiresConnection: true,
  },
  {
    name: 'Sign & Send',
    tests: [
      testSignTypedData,
      testWalletSendCalls,
      testWalletPrepareCalls,
    ],
    requiresConnection: true,
  },
  {
    name: 'Provider Events',
    tests: [testProviderEvents],
    requiresConnection: false,
  },
];

/**
 * Get all test functions in a flat array
 */
export function getAllTests(): TestFn[] {
  return testRegistry.flatMap(category => category.tests);
}

/**
 * Get tests for a specific category by name
 */
export function getTestsByCategory(categoryName: string): TestFn[] {
  const category = testRegistry.find(cat => cat.name === categoryName);
  return category?.tests || [];
}

/**
 * Get all category names
 */
export function getCategoryNames(): string[] {
  return testRegistry.map(cat => cat.name);
}

/**
 * Check if a category requires connection
 */
export function categoryRequiresConnection(categoryName: string): boolean {
  const category = testRegistry.find(cat => cat.name === categoryName);
  return category?.requiresConnection || false;
}

// Export all test functions for direct use
export { testSDKInitialization } from './sdk-initialization';
export {
  testConnectWallet,
  testGetAccounts,
  testGetChainId,
  testSignMessage,
} from './wallet-connection';
export {
  testPay,
  testGetPaymentStatus,
} from './payment-features';
export {
  testSubscribe,
  testGetSubscriptionStatus,
  testPrepareCharge,
} from './subscription-features';
export {
  testRequestSpendPermission,
  testGetPermissionStatus,
  testFetchPermission,
  testFetchPermissions,
  testPrepareSpendCallData,
  testPrepareRevokeCallData,
} from './spend-permissions';
export {
  testCreateSubAccount,
  testGetSubAccounts,
  testSignWithSubAccount,
  testSendCallsFromSubAccount,
} from './sub-account-features';
export {
  testSignTypedData,
  testWalletSendCalls,
  testWalletPrepareCalls,
} from './sign-and-send';
export { testProlinkEncodeDecode } from './prolink-features';
export { testProviderEvents } from './provider-events';

