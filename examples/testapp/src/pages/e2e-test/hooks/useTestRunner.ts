/**
 * Hook for running E2E tests
 * 
 * Encapsulates the test execution orchestration logic for both individual sections
 * and the full test suite. Uses the test registry to execute tests in sequence.
 */

import { useRef, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import type { TestContext, TestHandlers } from '../types';
import { testRegistry, getTestsByCategory, categoryRequiresConnection, type TestFn } from '../tests';
import { TEST_DELAYS } from '../../../utils/e2e-test-config/test-config';
import type { UseTestStateReturn } from './useTestState';
import type { UseConnectionStateReturn } from './useConnectionState';

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
  
  // Track whether we're running an individual section (skip modal) vs full suite (show modal)
  const isRunningSectionRef = useRef(false);

  /**
   * Build test context from current state
   */
  const buildTestContext = useCallback((): TestContext => {
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
      skipModal: isRunningSectionRef.current,
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
      const handlers: TestHandlers = {
        updateTestStatus: (category, name, status, error, details, duration) => {
          testCategory = category;
          testName = name;
          testState.updateTestStatus(category, name, status, error, details, duration);
        },
        addLog: testState.addLog,
        requestUserInteraction,
      };
      
      try {
        const result = await testFn(handlers, context);
        
        // Update refs based on test results and test identity
        if (result) {
          // Payment features
          if (testName === 'pay() function' && result.id) {
            paymentIdRef.current = result.id;
            testState.addLog('info', `💾 Saved payment ID: ${result.id}`);
          }
          
          // Subscription features
          if (testName === 'subscribe() function' && result.id) {
            subscriptionIdRef.current = result.id;
            testState.addLog('info', `💾 Saved subscription ID: ${result.id}`);
          }
          
          // Sub-account features
          if (testName === 'wallet_addSubAccount' && result.address) {
            subAccountAddressRef.current = result.address;
            testState.addLog('info', `💾 Saved sub-account address: ${result.address}`);
          }
          
          // Spend permission features
          if (testName === 'spendPermission.requestSpendPermission()' && result.permissionHash) {
            permissionHashRef.current = result.permissionHash;
            testState.addLog('info', `💾 Saved permission hash: ${result.permissionHash}`);
          }
          
          // Wallet connection - update connection state
          if (testName === 'Connect wallet' && Array.isArray(result) && result.length > 0) {
            connectionState.setCurrentAccount(result[0]);
            connectionState.setConnected(true);
            testState.addLog('info', `💾 Connected to: ${result[0]}`);
          }
          
          // Get accounts test - also update connection state to be sure
          if (testName === 'Get accounts' && Array.isArray(result) && result.length > 0) {
            if (!connectionState.connected) {
              connectionState.setCurrentAccount(result[0]);
              connectionState.setConnected(true);
              testState.addLog('info', `💾 Updated connection state: ${result[0]}`);
            }
          }
          
          // Get chain ID test - update chain ID state
          if (testName === 'Get chain ID' && typeof result === 'number') {
            connectionState.setChainId(result);
            testState.addLog('info', `💾 Chain ID: ${result}`);
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
      testState.addLog('error', 'Provider not available. Please initialize SDK first.');
      throw new Error('Provider not available');
    }

    // Check if already connected
    const accounts = await provider.request({
      method: 'eth_accounts',
      params: [],
    });

    if (accounts && accounts.length > 0) {
      testState.addLog('info', `Already connected to: ${accounts[0]}`);
      connectionState.setCurrentAccount(accounts[0]);
      connectionState.setConnected(true);
      return;
    }

    // Not connected - run wallet connection tests to establish connection
    testState.addLog('info', 'No connection found. Establishing connection...');
    
    const walletTests = getTestsByCategory('Wallet Connection');
    for (const testFn of walletTests) {
      await executeTest(testFn);
      await delay(TEST_DELAYS.BETWEEN_TESTS);
    }
  }, [provider, testState, connectionState, executeTest]);

  /**
   * Run a specific test section
   */
  const runTestSection = useCallback(
    async (sectionName: string): Promise<void> => {
      testState.setRunningSectionName(sectionName);
      testState.resetCategory(sectionName);

      // Skip user interaction modal for individual sections since the button click provides the gesture
      isRunningSectionRef.current = true;

      testState.addLog('info', `🚀 Running ${sectionName} tests...`);
      testState.addLog('info', '');

      try {
        // Check if section requires connection
        if (categoryRequiresConnection(sectionName)) {
          await ensureConnectionForTests();
          await delay(TEST_DELAYS.BETWEEN_TESTS);
        }

        // Get tests for this section
        const tests = getTestsByCategory(sectionName);
        
        if (tests.length === 0) {
          testState.addLog('warning', `No tests found for section: ${sectionName}`);
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

        testState.addLog('info', '');
        testState.addLog('success', `✅ ${sectionName} tests completed!`);

        toast({
          title: 'Section Complete',
          description: `${sectionName} tests finished`,
          status: 'success',
          duration: TEST_DELAYS.TOAST_SUCCESS_DURATION,
          isClosable: true,
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'Test cancelled by user') {
          testState.addLog('info', '');
          testState.addLog('warning', `⚠️ ${sectionName} tests cancelled by user`);
          
          toast({
            title: 'Tests Cancelled',
            description: `${sectionName} tests were cancelled`,
            status: 'warning',
            duration: TEST_DELAYS.TOAST_WARNING_DURATION,
            isClosable: true,
          });
        } else {
          testState.addLog('error', `❌ ${sectionName} tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        testState.setRunningSectionName(null);
        isRunningSectionRef.current = false;
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
    testState.clearLogs();

    // Don't skip modal for full test suite - keep user interaction prompts
    isRunningSectionRef.current = false;

    testState.addLog('info', '🚀 Starting E2E Test Suite...');
    testState.addLog('info', '');

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

      testState.addLog('info', '');
      testState.addLog('success', '✅ Test suite completed!');
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled by user') {
        testState.addLog('info', '');
        testState.addLog('warning', '⚠️ Test suite cancelled by user');
        
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

