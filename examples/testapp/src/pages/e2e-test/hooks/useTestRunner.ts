/**
 * Hook for running E2E tests
 * 
 * Encapsulates the test execution orchestration logic for both individual sections
 * and the full test suite. Uses the test registry to execute tests in sequence.
 */

import { useToast } from '@chakra-ui/react';
import { useCallback, useRef } from 'react';
import { TEST_DELAYS } from '../../../utils/e2e-test-config/test-config';
import { categoryRequiresConnection, getTestsByCategory, type TestFn } from '../tests';
import type { TestContext, TestHandlers } from '../types';
import type { UseConnectionStateReturn } from './useConnectionState';
import type { UseTestStateReturn } from './useTestState';

// ============================================================================
// Types
// ============================================================================

export interface UseTestRunnerOptions {
  // State management
  testState: UseTestStateReturn;
  connectionState: UseConnectionStateReturn;
  
  // SDK state
  loadedSDK: any;
  provider: any;
  
  // User interaction
  requestUserInteraction: (testName: string, skipModal?: boolean) => Promise<void>;
  
  // Test data refs
  paymentIdRef: React.MutableRefObject<string | null>;
  subscriptionIdRef: React.MutableRefObject<string | null>;
  permissionHashRef: React.MutableRefObject<string | null>;
  subAccountAddressRef: React.MutableRefObject<string | null>;
}

export interface UseTestRunnerReturn {
  runAllTests: () => Promise<void>;
  runTestSection: (sectionName: string) => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

export function useTestRunner(options: UseTestRunnerOptions): UseTestRunnerReturn {
  const {
    testState,
    connectionState,
    loadedSDK,
    provider,
    requestUserInteraction,
    paymentIdRef,
    subscriptionIdRef,
    permissionHashRef,
    subAccountAddressRef,
  } = options;

  const toast = useToast();
  
  // Track whether we've shown the first modal for the current test run
  // The first modal should be skipped since the user's button click provides the gesture
  const hasShownFirstModalRef = useRef(false);

  /**
   * Build test context from current state
   */
  const buildTestContext = useCallback((): TestContext => {
    // Skip the first modal since the user's button click provides the gesture
    // After that, show modals for subsequent user interactions
    const skipModal = !hasShownFirstModalRef.current;
    
    return {
      provider,
      loadedSDK,
      connected: connectionState.connected,
      currentAccount: connectionState.currentAccount,
      chainId: connectionState.chainId,
      paymentId: paymentIdRef.current,
      subscriptionId: subscriptionIdRef.current,
      permissionHash: permissionHashRef.current,
      subAccountAddress: subAccountAddressRef.current,
      skipModal,
    };
  }, [
    provider,
    loadedSDK,
    connectionState.connected,
    connectionState.currentAccount,
    connectionState.chainId,
    paymentIdRef,
    subscriptionIdRef,
    permissionHashRef,
    subAccountAddressRef,
  ]);


  /**
   * Execute a single test function and capture return values to update refs
   */
  const executeTest = useCallback(
    async (testFn: TestFn): Promise<void> => {
      const context = buildTestContext();
      
      // Track which test ran by wrapping updateTestStatus
      let testCategory = '';
      let testName = '';
      let requiresUserInteraction = false;
      
      const handlers: TestHandlers = {
        updateTestStatus: (category, name, status, error, details, duration) => {
          testCategory = category;
          testName = name;
          testState.updateTestStatus(category, name, status, error, details, duration);
        },
        requestUserInteraction: async (testName: string, skipModal?: boolean) => {
          requiresUserInteraction = true;
          await requestUserInteraction(testName, skipModal);
          // After the first modal opportunity (whether shown or skipped), 
          // mark that we've passed it so subsequent modals will be shown
          hasShownFirstModalRef.current = true;
        },
      };
      
      try {
        const result = await testFn(handlers, context);
        
        // Update refs and test details based on test results and test identity
        if (result) {
          // Payment features
          if (testName === 'pay() function' && result.id) {
            paymentIdRef.current = result.id;
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Payment ID: ${result.id}`);
          }
          
          // Subscription features
          if (testName === 'subscribe() function' && result.id) {
            subscriptionIdRef.current = result.id;
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Subscription ID: ${result.id}`);
          }
          
          if (testName === 'base.subscription.getStatus()' && result.details) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, result.details);
          }
          
          if (testName === 'prepareCharge() with amount' && Array.isArray(result)) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Generated ${result.length} call(s)`);
          }
          
          if (testName === 'prepareCharge() max-remaining-charge' && Array.isArray(result)) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Generated ${result.length} call(s)`);
          }
          
          // Sub-account features
          if (testName === 'wallet_addSubAccount' && result.address) {
            subAccountAddressRef.current = result.address;
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Address: ${result.address}`);
          }
          
          if (testName === 'wallet_getSubAccounts' && result.subAccounts) {
            const addresses = result.addresses || result.subAccounts.map((sa: any) => sa.address);
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, addresses.join(', '));
          }
          
          if (testName === 'wallet_sendCalls (sub-account)' && result.txHash) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Tx: ${result.txHash}`);
          }
          
          if (testName === 'personal_sign (sub-account)' && result.isValid !== undefined) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Verified: ${result.isValid}`);
          }
          
          // Spend permission features
          if (testName === 'spendPermission.requestSpendPermission()' && result.permissionHash) {
            permissionHashRef.current = result.permissionHash;
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Hash: ${result.permissionHash}`);
          }
          
          if (testName === 'spendPermission.getPermissionStatus()' && result.remainingSpend) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Remaining: ${result.remainingSpend}`);
          }
          
          if (testName === 'spendPermission.fetchPermission()' && result.permissionHash) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Hash: ${result.permissionHash}`);
          }
          
          if (testName === 'spendPermission.fetchPermissions()' && Array.isArray(result)) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Found ${result.length} permission(s)`);
          }
          
          if (testName === 'spendPermission.prepareSpendCallData()' && Array.isArray(result)) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Generated ${result.length} call(s)`);
          }
          
          if (testName === 'spendPermission.prepareRevokeCallData()' && result.to) {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `To: ${result.to}`);
          }
          
          // Wallet connection
          if (testName === 'Connect wallet' && Array.isArray(result) && result.length > 0) {
            connectionState.setCurrentAccount(result[0]);
            connectionState.setConnected(true);
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Connected: ${result[0]}`);
          }
          
          if (testName === 'Get accounts' && Array.isArray(result)) {
            if (result.length > 0 && !connectionState.connected) {
              connectionState.setCurrentAccount(result[0]);
              connectionState.setConnected(true);
            }
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, result.join(', '));
          }
          
          if (testName === 'Get chain ID' && typeof result === 'number') {
            connectionState.setChainId(result);
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Chain ID: ${result}`);
          }
          
          if (testName === 'Sign message (personal_sign)' && typeof result === 'string') {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Sig: ${result}`);
          }
          
          // Sign & Send
          if (testName === 'eth_signTypedData_v4' && typeof result === 'string') {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Sig: ${result}`);
          }
          
          if (testName === 'wallet_sendCalls') {
            let hash: string | undefined;
            if (typeof result === 'string') {
              hash = result;
            } else if (typeof result === 'object' && result !== null && 'id' in result) {
              hash = result.id;
            }
            if (hash) {
              testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Hash: ${hash}`);
            }
          }
          
          // Prolink features
          if (testName === 'encodeProlink()' && typeof result === 'string') {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `Encoded: ${result}`);
          }
          
          if (testName === 'createProlinkUrl()' && typeof result === 'string') {
            testState.updateTestStatus(testCategory, testName, 'passed', undefined, `URL: ${result}`);
          }
        }
      } catch (error) {
        // Test functions handle their own errors, but we catch here to prevent
        // uncaught promise rejections. If error is 'Test cancelled by user',
        // it will be re-thrown by the test function to stop execution.
        if (error instanceof Error && error.message === 'Test cancelled by user') {
          throw error;
        }
        // Other errors are already logged by the test function
      }
    },
    [buildTestContext, paymentIdRef, subscriptionIdRef, subAccountAddressRef, permissionHashRef, testState, connectionState, requestUserInteraction]
  );

  /**
   * Ensure wallet connection for tests that require it
   */
  const ensureConnectionForTests = useCallback(async (): Promise<void> => {
    if (!provider) {
      throw new Error('Provider not available');
    }

    // Check if already connected
    const accounts = await provider.request({
      method: 'eth_accounts',
      params: [],
    });

    if (accounts && accounts.length > 0) {
      connectionState.setCurrentAccount(accounts[0]);
      connectionState.setConnected(true);
      return;
    }

    // Not connected - run wallet connection tests to establish connection
    const walletTests = getTestsByCategory('Wallet Connection');
    for (const testFn of walletTests) {
      await executeTest(testFn);
      await delay(TEST_DELAYS.BETWEEN_TESTS);
    }
  }, [provider, connectionState, executeTest]);

  /**
   * Run a specific test section
   */
  const runTestSection = useCallback(
    async (sectionName: string): Promise<void> => {
      testState.setRunningSectionName(sectionName);
      testState.resetCategory(sectionName);

      // Reset modal tracking for this test run
      // The first modal will be skipped since the button click provides the gesture
      hasShownFirstModalRef.current = false;

      try {
        // Check if section requires connection
        if (categoryRequiresConnection(sectionName)) {
          await ensureConnectionForTests();
          await delay(TEST_DELAYS.BETWEEN_TESTS);
        }

        // Get tests for this section
        const tests = getTestsByCategory(sectionName);
        
        if (tests.length === 0) {
          return;
        }

        // Execute tests in sequence
        for (let i = 0; i < tests.length; i++) {
          await executeTest(tests[i]);
          
          // Add delay between tests (except after last test)
          if (i < tests.length - 1) {
            await delay(TEST_DELAYS.BETWEEN_TESTS);
          }
        }

        toast({
          title: 'Section Complete',
          description: `${sectionName} tests finished`,
          status: 'success',
          duration: TEST_DELAYS.TOAST_SUCCESS_DURATION,
          isClosable: true,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Test cancelled by user') {
          toast({
            title: 'Tests Cancelled',
            description: `${sectionName} tests were cancelled`,
            status: 'warning',
            duration: TEST_DELAYS.TOAST_WARNING_DURATION,
            isClosable: true,
          });
        }
      } finally {
        testState.setRunningSectionName(null);
      }
    },
    [testState, toast, ensureConnectionForTests, executeTest]
  );

  /**
   * Run all tests in the complete test suite
   */
  const runAllTests = useCallback(async (): Promise<void> => {
    testState.startTests();
    testState.resetAllCategories();

    // Reset modal tracking for this test run
    // The first modal will be skipped since the button click provides the gesture
    hasShownFirstModalRef.current = false;

    try {
      // Execute tests following the optimized sequence from the original implementation
      // This sequence is designed to minimize flakiness and ensure proper test dependencies
      
      // 1. SDK Initialization (must be first)
      await runTestCategory('SDK Initialization & Exports');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      // 2. Establish wallet connection
      await runTestCategory('Wallet Connection');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      // 3. Run connection-dependent tests BEFORE pay/subscribe
      // These need a stable connection state
      
      // Sign & Send tests
      await runTestCategory('Sign & Send');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      // Spend Permission tests
      await runTestCategory('Spend Permissions');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      // 4. Sub-Account tests (run BEFORE pay/subscribe to avoid state conflicts)
      await runTestCategory('Sub-Account Features');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      // 5. Payment & Subscription tests (run AFTER sub-account tests)
      await runTestCategory('Payment Features');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      await runTestCategory('Subscription Features');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      // 6. Standalone tests (don't require connection)
      await runTestCategory('Prolink Features');
      await delay(TEST_DELAYS.BETWEEN_TESTS);

      await runTestCategory('Provider Events');
      await delay(TEST_DELAYS.BETWEEN_TESTS);
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled by user') {
        toast({
          title: 'Tests Cancelled',
          description: 'Test suite was cancelled by user',
          status: 'warning',
          duration: TEST_DELAYS.TOAST_WARNING_DURATION,
          isClosable: true,
        });
      }
    } finally {
      testState.stopTests();

      // Show completion toast (if not cancelled)
      const passed = testState.testCategories.reduce(
        (acc, cat) => acc + cat.tests.filter((t) => t.status === 'passed').length,
        0
      );
      const failed = testState.testCategories.reduce(
        (acc, cat) => acc + cat.tests.filter((t) => t.status === 'failed').length,
        0
      );

      if (passed > 0 || failed > 0) {
        toast({
          title: 'Tests Complete',
          description: `${passed} passed, ${failed} failed`,
          status: failed > 0 ? 'warning' : 'success',
          duration: TEST_DELAYS.TOAST_INFO_DURATION,
          isClosable: true,
        });
      }
    }
  }, [testState, toast, executeTest]);

  /**
   * Helper to run all tests in a category
   */
  const runTestCategory = useCallback(
    async (categoryName: string): Promise<void> => {
      const tests = getTestsByCategory(categoryName);
      
      for (let i = 0; i < tests.length; i++) {
        await executeTest(tests[i]);
        
        // Add delay between tests (except after last test)
        if (i < tests.length - 1) {
          await delay(TEST_DELAYS.BETWEEN_TESTS);
        }
      }
    },
    [executeTest]
  );

  return {
    runAllTests,
    runTestSection,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Delay helper for test sequencing
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

