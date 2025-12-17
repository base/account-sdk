import { ChevronDownIcon } from '@chakra-ui/icons';
import {
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Code,
    Container,
    Flex,
    Grid,
    Heading,
    Link,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Radio,
    RadioGroup,
    Stack,
    Stat,
    StatGroup,
    StatLabel,
    StatNumber,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Tooltip,
    useColorMode,
    useToast,
    VStack
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPublicClient, http, parseUnits, toHex } from 'viem';
import { baseSepolia } from 'viem/chains';
import { UserInteractionModal } from '../../components/UserInteractionModal';
import { useUserInteraction } from '../../hooks/useUserInteraction';
import { loadSDK, type LoadedSDK, type SDKSource } from '../../utils/sdkLoader';

// Test result types
type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface TestResult {
  name: string;
  status: TestStatus;
  error?: string;
  details?: string;
  duration?: number;
}

interface TestCategory {
  name: string;
  tests: TestResult[];
  expanded: boolean;
}

interface HeaderProps {
  sdkVersion: string;
  sdkSource: SDKSource;
  onSourceChange: (source: SDKSource) => void;
  isLoadingSDK?: boolean;
}

const PLAYGROUND_PAGES = [
  { path: '/', name: 'SDK Playground' },
  { path: '/add-sub-account', name: 'Add Sub-Account' },
  { path: '/import-sub-account', name: 'Import Sub-Account' },
  { path: '/auto-sub-account', name: 'Auto Sub-Account' },
  { path: '/spend-permission', name: 'Spend Permission' },
  { path: '/payment', name: 'Payment' },
  { path: '/pay-playground', name: 'Pay Playground' },
  { path: '/subscribe-playground', name: 'Subscribe Playground' },
  { path: '/prolink-playground', name: 'Prolink Playground' },
];

function Header({
  sdkVersion,
  sdkSource,
  onSourceChange,
  isLoadingSDK,
}: HeaderProps) {
  return (
    <Box
      py={3}
      px={4}
      bg="gray.800"
      color="white"
      borderBottom="1px solid"
      borderColor="gray.700"
    >
      <Container maxW="container.xl">
        <Flex justify="space-between" align="center" gap={4}>
          {/* Left side - Title and Navigation */}
          <Flex align="center" gap={4}>
            <Heading size="md" fontFamily="mono">
              E2E Test Suite
            </Heading>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="sm"
                variant="outline"
                colorScheme="whiteAlpha"
              >
                Navigate
              </MenuButton>
              <MenuList>
                {PLAYGROUND_PAGES.map((page) => (
                  <MenuItem
                    key={page.path}
                    as={NextLink}
                    href={page.path}
                    color="gray.800"
                  >
                    {page.name}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          </Flex>

          {/* Right side - SDK Config */}
          <Flex align="center" gap={3}>
            <RadioGroup
              value={sdkSource}
              onChange={(value) => onSourceChange(value as SDKSource)}
              size="sm"
              isDisabled={isLoadingSDK}
            >
              <Stack direction="row" spacing={3}>
                <Radio value="local" colorScheme="purple">
                  <Text fontSize="xs">Local</Text>
                </Radio>
                <Radio value="npm" colorScheme="purple">
                  <Text fontSize="xs">NPM Latest</Text>
                </Radio>
              </Stack>
            </RadioGroup>

            {isLoadingSDK && (
              <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                Loading...
              </Badge>
            )}

            <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
              v{sdkVersion}
            </Badge>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}

export default function E2ETestPage() {
  const toast = useToast();
  const { colorMode } = useColorMode();
  const {
    isModalOpen,
    currentTestName,
    requestUserInteraction,
    handleContinue,
    handleCancel,
  } = useUserInteraction();

  // Track whether we're running an individual section (skip modal) vs full suite (show modal)
  const isRunningSectionRef = useRef(false);

  // SDK version management
  const [sdkSource, setSdkSource] = useState<SDKSource>('local');
  const [loadedSDK, setLoadedSDK] = useState<LoadedSDK | null>(null);
  const [isLoadingSDK, setIsLoadingSDK] = useState(false);
  const [sdkLoadError, setSdkLoadError] = useState<string | null>(null);

  // SDK state
  const [sdk, setSdk] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // Test data refs (use refs instead of state to avoid async state update issues)
  const paymentIdRef = useRef<string | null>(null);
  const subscriptionIdRef = useRef<string | null>(null);
  const permissionHashRef = useRef<string | null>(null);
  const subAccountAddressRef = useRef<string | null>(null);

  // Test state
  const [testCategories, setTestCategories] = useState<TestCategory[]>([
    {
      name: 'SDK Initialization & Exports',
      tests: [],
      expanded: true,
    },
    {
      name: 'Wallet Connection',
      tests: [],
      expanded: true,
    },
    {
      name: 'Payment Features',
      tests: [],
      expanded: true,
    },
    {
      name: 'Subscription Features',
      tests: [],
      expanded: true,
    },
    {
      name: 'Prolink Features',
      tests: [],
      expanded: true,
    },
    {
      name: 'Spend Permissions',
      tests: [],
      expanded: true,
    },
    {
      name: 'Sub-Account Features',
      tests: [],
      expanded: true,
    },
    {
      name: 'Sign & Send',
      tests: [],
      expanded: true,
    },
    {
      name: 'Provider Events',
      tests: [],
      expanded: true,
    },
  ]);

  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  });

  // Console logs
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: string; message: string }>>([]);

  const formatError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  };

  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setConsoleLogs((prev) => [...prev, { type, message }]);
  };

  const copyConsoleOutput = async () => {
    const consoleText = consoleLogs.map(log => log.message).join('\n');
    try {
      await navigator.clipboard.writeText(consoleText);
      toast({
        title: 'Copied!',
        description: 'Console output copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const copyTestResults = async () => {
    const totalTests = testCategories.reduce((acc, cat) => acc + cat.tests.length, 0);
    const passedTests = testCategories.reduce(
      (acc, cat) => acc + cat.tests.filter((t) => t.status === 'passed').length,
      0
    );
    const failedTests = testCategories.reduce(
      (acc, cat) => acc + cat.tests.filter((t) => t.status === 'failed').length,
      0
    );
    const skippedTests = testCategories.reduce(
      (acc, cat) => acc + cat.tests.filter((t) => t.status === 'skipped').length,
      0
    );

    let resultsText = '=== E2E Test Results ===\n\n';
    resultsText += `SDK Version: ${loadedSDK?.VERSION || 'Not Loaded'}\n`;
    resultsText += `SDK Source: ${sdkSource === 'npm' ? 'NPM Latest' : 'Local Workspace'}\n`;
    resultsText += `Timestamp: ${new Date().toISOString()}\n\n`;
    resultsText += `Summary:\n`;
    resultsText += `  Total: ${totalTests}\n`;
    resultsText += `  Passed: ${passedTests}\n`;
    resultsText += `  Failed: ${failedTests}\n`;
    resultsText += `  Skipped: ${skippedTests}\n\n`;

    testCategories.forEach((category) => {
      if (category.tests.length > 0) {
        resultsText += `\n${category.name}\n`;
        resultsText += '='.repeat(category.name.length) + '\n\n';

        category.tests.forEach((test) => {
          const statusSymbol = getStatusIcon(test.status);
          resultsText += `${statusSymbol} ${test.name}\n`;
          resultsText += `   Status: ${test.status.toUpperCase()}\n`;
          
          if (test.duration) {
            resultsText += `   Duration: ${test.duration}ms\n`;
          }
          
          if (test.details) {
            resultsText += `   Details: ${test.details}\n`;
          }
          
          if (test.error) {
            resultsText += `   ERROR: ${test.error}\n`;
          }
          
          resultsText += '\n';
        });
      }
    });

    if (failedTests > 0) {
      resultsText += '\n=== Failed Tests Summary ===\n\n';
      testCategories.forEach((category) => {
        const failedInCategory = category.tests.filter((t) => t.status === 'failed');
        if (failedInCategory.length > 0) {
          resultsText += `${category.name}:\n`;
          failedInCategory.forEach((test) => {
            resultsText += `  ❌ ${test.name}\n`;
            resultsText += `     Reason: ${test.error || 'Unknown error'}\n`;
            if (test.details) {
              resultsText += `     Details: ${test.details}\n`;
            }
          });
          resultsText += '\n';
        }
      });
    }

    try {
      await navigator.clipboard.writeText(resultsText);
      toast({
        title: 'Copied!',
        description: 'Test results copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const copyAbbreviatedResults = async () => {
    let resultsText = '';

    testCategories.forEach((category) => {
      // Filter out skipped tests - only show passed and failed
      const relevantTests = category.tests.filter((t) => t.status === 'passed' || t.status === 'failed');
      
      if (relevantTests.length > 0) {
        // Special handling for SDK Initialization & Exports - collapse exports
        if (category.name === 'SDK Initialization & Exports') {
          const initTest = relevantTests.find((t) => t.name === 'SDK can be initialized');
          const exportTests = relevantTests.filter((t) => t.name.includes('is exported'));
          const otherTests = relevantTests.filter((t) => t !== initTest && !exportTests.includes(t));
          
          // Show SDK initialization test
          if (initTest) {
            // Skip showing initialization test in abbreviated results
            // const icon = initTest.status === 'passed' ? ':check:' : ':failure_icon:';
            // resultsText += `${icon} ${initTest.name}\n`;
          }
          
          // Collapse export tests
          if (exportTests.length > 0) {
            const allExportsPassed = exportTests.every((t) => t.status === 'passed');
            const anyExportsFailed = exportTests.some((t) => t.status === 'failed');
            
            if (allExportsPassed) {
              // Skip showing exports summary in abbreviated results
              // resultsText += `:check: All required exports are available\n`;
            } else if (anyExportsFailed) {
              // Show which exports failed
              exportTests.forEach((test) => {
                if (test.status === 'failed') {
                  resultsText += `:failure_icon: ${test.name}\n`;
                }
              });
            }
          }
          
          // Show any other tests
          otherTests.forEach((test) => {
            const icon = test.status === 'passed' ? ':check:' : ':failure_icon:';
            resultsText += `${icon} ${test.name}\n`;
          });
        } else if (category.name === 'Provider Events') {
          // Collapse provider events listeners
          const listenerTests = relevantTests.filter((t) => t.name.includes('listener'));
          
          if (listenerTests.length > 0) {
            const allListenersPassed = listenerTests.every((t) => t.status === 'passed');
            const anyListenersFailed = listenerTests.some((t) => t.status === 'failed');
            
            if (allListenersPassed) {
              // Skip showing listeners summary in abbreviated results
              // resultsText += `:check: Provider event listeners\n`;
            } else if (anyListenersFailed) {
              // Show which listeners failed
              listenerTests.forEach((test) => {
                if (test.status === 'failed') {
                  resultsText += `:failure_icon: ${test.name}\n`;
                }
              });
            }
          }
        } else {
          // For other categories, show all tests individually
          relevantTests.forEach((test) => {
            const icon = test.status === 'passed' ? ':check:' : ':failure_icon:';
            resultsText += `${icon} ${test.name}\n`;
          });
        }
      }
    });

    try {
      await navigator.clipboard.writeText(resultsText);
      toast({
        title: 'Copied!',
        description: 'Abbreviated results copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const copySectionResults = async (categoryName: string) => {
    const category = testCategories.find((cat) => cat.name === categoryName);
    if (!category || category.tests.length === 0) {
      toast({
        title: 'No Results',
        description: 'No test results to copy for this section',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const passedTests = category.tests.filter((t) => t.status === 'passed').length;
    const failedTests = category.tests.filter((t) => t.status === 'failed').length;
    const skippedTests = category.tests.filter((t) => t.status === 'skipped').length;

    let resultsText = `=== ${categoryName} Test Results ===\n\n`;
    resultsText += `SDK Version: ${loadedSDK?.VERSION || 'Not Loaded'}\n`;
    resultsText += `SDK Source: ${sdkSource === 'npm' ? 'NPM Latest' : 'Local Workspace'}\n`;
    resultsText += `Timestamp: ${new Date().toISOString()}\n\n`;
    resultsText += `Summary:\n`;
    resultsText += `  Total: ${category.tests.length}\n`;
    resultsText += `  Passed: ${passedTests}\n`;
    resultsText += `  Failed: ${failedTests}\n`;
    resultsText += `  Skipped: ${skippedTests}\n\n`;

    resultsText += `${categoryName}\n`;
    resultsText += '='.repeat(categoryName.length) + '\n\n';

    category.tests.forEach((test) => {
      const statusSymbol = getStatusIcon(test.status);
      resultsText += `${statusSymbol} ${test.name}\n`;
      resultsText += `   Status: ${test.status.toUpperCase()}\n`;
      
      if (test.duration) {
        resultsText += `   Duration: ${test.duration}ms\n`;
      }
      
      if (test.details) {
        resultsText += `   Details: ${test.details}\n`;
      }
      
      if (test.error) {
        resultsText += `   ERROR: ${test.error}\n`;
      }
      
      resultsText += '\n';
    });

    if (failedTests > 0) {
      resultsText += '\n=== Failed Tests ===\n\n';
      category.tests.filter((t) => t.status === 'failed').forEach((test) => {
        resultsText += `  ❌ ${test.name}\n`;
        resultsText += `     Reason: ${test.error || 'Unknown error'}\n`;
        if (test.details) {
          resultsText += `     Details: ${test.details}\n`;
        }
        resultsText += '\n';
      });
    }

    try {
      await navigator.clipboard.writeText(resultsText);
      toast({
        title: 'Copied!',
        description: `${categoryName} results copied to clipboard`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Load SDK based on source
  const handleLoadSDK = async () => {
    setIsLoadingSDK(true);
    setSdkLoadError(null);
    
    try {
      const sourceLabel = sdkSource === 'npm' ? 'NPM Latest' : 'Local Workspace';
      addLog('info', `Loading SDK from ${sourceLabel}...`);
      
      const sdk = await loadSDK({
        source: sdkSource,
      });
      
      setLoadedSDK(sdk);
      addLog('success', `SDK loaded successfully (v${sdk.VERSION})`);
      
      // Initialize SDK instance
      const sdkInstance = sdk.createBaseAccountSDK({
        appName: 'E2E Test Suite',
        appLogoUrl: undefined,
        appChainIds: [84532], // Base Sepolia
      });
      setSdk(sdkInstance);
      const providerInstance = sdkInstance.getProvider();
      setProvider(providerInstance);
      
      toast({
        title: 'SDK Loaded',
        description: `${sourceLabel} (v${sdk.VERSION})`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSdkLoadError(errorMessage);
      addLog('error', `Failed to load SDK: ${errorMessage}`);
      
      toast({
        title: 'SDK Load Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoadingSDK(false);
    }
  };

  // Initialize SDK on mount with local version
  useEffect(() => {
    handleLoadSDK();
  }, []);

  // Reload SDK when source changes
  useEffect(() => {
    if (loadedSDK) {
      handleLoadSDK();
    }
  }, [sdkSource]);

  // Helper to update test status
  const updateTestStatus = (
    categoryName: string,
    testName: string,
    status: TestStatus,
    error?: string,
    details?: string,
    duration?: number
  ) => {
    setTestCategories((prev) =>
      prev.map((category) => {
        if (category.name === categoryName) {
          const existingTestIndex = category.tests.findIndex((t) => t.name === testName);
          if (existingTestIndex >= 0) {
            const updatedTests = [...category.tests];
            updatedTests[existingTestIndex] = {
              name: testName,
              status,
              error,
              details,
              duration,
            };
            return { ...category, tests: updatedTests };
          }
          return {
            ...category,
            tests: [...category.tests, { name: testName, status, error, details, duration }],
          };
        }
        return category;
      })
    );

    // Update totals
    if (status === 'passed' || status === 'failed' || status === 'skipped') {
      setTestResults((prev) => ({
        total: prev.total + (prev.passed === 0 && prev.failed === 0 && prev.skipped === 0 ? 1 : 0),
        passed: prev.passed + (status === 'passed' ? 1 : 0),
        failed: prev.failed + (status === 'failed' ? 1 : 0),
        skipped: prev.skipped + (status === 'skipped' ? 1 : 0),
      }));
    }
  };

  // Test: SDK Initialization
  const testSDKInitialization = async () => {
    const category = 'SDK Initialization & Exports';

    if (!loadedSDK) {
      updateTestStatus(category, 'SDK can be initialized', 'skipped', 'SDK not loaded');
      return;
    }

    try {
      updateTestStatus(category, 'SDK can be initialized', 'running');
      const start = Date.now();
      const sdkInstance = loadedSDK.createBaseAccountSDK({
        appName: 'E2E Test Suite',
        appLogoUrl: undefined,
        appChainIds: [84532], // Base Sepolia
      });
      const duration = Date.now() - start;
      setSdk(sdkInstance);
      const providerInstance = sdkInstance.getProvider();
      setProvider(providerInstance);
      updateTestStatus(
        category,
        'SDK can be initialized',
        'passed',
        undefined,
        `SDK v${loadedSDK.VERSION}`,
        duration
      );
      addLog('success', `SDK initialized successfully (v${loadedSDK.VERSION})`);
    } catch (error) {
      updateTestStatus(
        category,
        'SDK can be initialized',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `SDK initialization failed: ${formatError(error)}`);
    }

    // Test exports - core functions always available
    const coreExports = [
      { name: 'createBaseAccountSDK', value: loadedSDK.createBaseAccountSDK },
      { name: 'base.pay', value: loadedSDK.base?.pay },
      { name: 'base.subscribe', value: loadedSDK.base?.subscribe },
      { name: 'base.subscription.getStatus', value: loadedSDK.base?.subscription?.getStatus },
      { name: 'base.subscription.prepareCharge', value: loadedSDK.base?.subscription?.prepareCharge },
      { name: 'getPaymentStatus', value: loadedSDK.getPaymentStatus },
      { name: 'TOKENS', value: loadedSDK.TOKENS },
      { name: 'CHAIN_IDS', value: loadedSDK.CHAIN_IDS },
      { name: 'VERSION', value: loadedSDK.VERSION },
    ];

    for (const exp of coreExports) {
      updateTestStatus(category, `${exp.name} is exported`, 'running');
      if (exp.value !== undefined && exp.value !== null) {
        updateTestStatus(category, `${exp.name} is exported`, 'passed');
      } else {
        updateTestStatus(
          category,
          `${exp.name} is exported`,
          'failed',
          `${exp.name} is undefined`
        );
      }
    }

    // Test optional exports (only available in local SDK, not npm CDN)
    const optionalExports = [
      { name: 'encodeProlink', value: loadedSDK.encodeProlink },
      { name: 'decodeProlink', value: loadedSDK.decodeProlink },
      { name: 'createProlinkUrl', value: loadedSDK.createProlinkUrl },
      { name: 'spendPermission.requestSpendPermission', value: loadedSDK.spendPermission?.requestSpendPermission },
      { name: 'spendPermission.fetchPermissions', value: loadedSDK.spendPermission?.fetchPermissions },
    ];

    for (const exp of optionalExports) {
      updateTestStatus(category, `${exp.name} is exported`, 'running');
      if (exp.value !== undefined && exp.value !== null) {
        updateTestStatus(category, `${exp.name} is exported`, 'passed', undefined, 'Available');
      } else {
        updateTestStatus(
          category,
          `${exp.name} is exported`,
          'skipped',
          'Not available (local SDK only)'
        );
      }
    }
  };

  // Test: Connect Wallet
  const testConnectWallet = async () => {
    const category = 'Wallet Connection';

    if (!provider) {
      updateTestStatus(category, 'Connect wallet', 'skipped', 'SDK not initialized');
      return;
    }

    try {
      updateTestStatus(category, 'Connect wallet', 'running');
      addLog('info', 'Requesting wallet connection...');
      
      // No need for user interaction modal - the "Run All Tests" button click provides the gesture
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });

      if (accounts && accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        setConnected(true);
        updateTestStatus(
          category,
          'Connect wallet',
          'passed',
          undefined,
          `Connected: ${accounts[0].slice(0, 10)}...`
        );
        addLog('success', `Connected to wallet: ${accounts[0]}`);
      } else {
        updateTestStatus(category, 'Connect wallet', 'failed', 'No accounts returned');
        addLog('error', 'No accounts returned from wallet');
      }
    } catch (error) {
      updateTestStatus(
        category,
        'Connect wallet',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Wallet connection failed: ${formatError(error)}`);
    }
  };

  // Test: Get Accounts
  const testGetAccounts = async () => {
    const category = 'Wallet Connection';

    if (!provider) {
      updateTestStatus(category, 'Get accounts', 'skipped', 'SDK not initialized');
      return;
    }

    try {
      updateTestStatus(category, 'Get accounts', 'running');
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });

      // Update connection state if accounts are found
      if (accounts && accounts.length > 0) {
        setCurrentAccount(accounts[0]);
        setConnected(true);
        addLog('success', `Connected account found: ${accounts[0]}`);
      }

      updateTestStatus(
        category,
        'Get accounts',
        'passed',
        undefined,
        `Found ${accounts.length} account(s)`
      );
      addLog('info', `Found ${accounts.length} account(s)`);
    } catch (error) {
      updateTestStatus(
        category,
        'Get accounts',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Test: Get Chain ID
  const testGetChainId = async () => {
    const category = 'Wallet Connection';

    if (!provider) {
      updateTestStatus(category, 'Get chain ID', 'skipped', 'SDK not initialized');
      return;
    }

    try {
      updateTestStatus(category, 'Get chain ID', 'running');
      const chainIdHex = await provider.request({
        method: 'eth_chainId',
        params: [],
      });

      const chainIdNum = parseInt(chainIdHex, 16);
      setChainId(chainIdNum);
      updateTestStatus(
        category,
        'Get chain ID',
        'passed',
        undefined,
        `Chain ID: ${chainIdNum}`
      );
      addLog('info', `Chain ID: ${chainIdNum}`);
    } catch (error) {
      updateTestStatus(
        category,
        'Get chain ID',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Test: Sign Message
  const testSignMessage = async () => {
    const category = 'Wallet Connection';

    if (!provider) {
      updateTestStatus(category, 'Sign message (personal_sign)', 'skipped', 'Provider not available');
      return;
    }

    try {
      updateTestStatus(category, 'Sign message (personal_sign)', 'running');
      
      // Check current connection status directly from provider
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      
      if (!accounts || accounts.length === 0) {
        updateTestStatus(category, 'Sign message (personal_sign)', 'skipped', 'Not connected');
        return;
      }
      
      const account = accounts[0];
      
      // Request user interaction before opening popup
      await requestUserInteraction('Sign message (personal_sign)', isRunningSectionRef.current);
      
      const message = 'Hello from Base Account SDK E2E Test!';
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account],
      });

      updateTestStatus(
        category,
        'Sign message (personal_sign)',
        'passed',
        undefined,
        `Sig: ${signature.slice(0, 20)}...`
      );
      addLog('success', `Message signed: ${signature.slice(0, 20)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'Sign message (personal_sign)', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'Sign message (personal_sign)', 'failed', errorMessage);
    }
  };

  // Test: Pay
  const testPay = async () => {
    const category = 'Payment Features';

    if (!loadedSDK) {
      updateTestStatus(category, 'pay() function', 'skipped', 'SDK not loaded');
      return;
    }

    try {
      updateTestStatus(category, 'pay() function', 'running');
      addLog('info', 'Testing pay() function...');
      
      // Request user interaction before opening popup
      await requestUserInteraction('pay() function', isRunningSectionRef.current);
      
      const result = await loadedSDK.base.pay({
        amount: '0.01',
        to: '0x0000000000000000000000000000000000000001',
        testnet: true,
      });

      paymentIdRef.current = result.id;
      updateTestStatus(
        category,
        'pay() function',
        'passed',
        undefined,
        `Payment ID: ${result.id}`
      );
      addLog('success', `Payment created: ${result.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'pay() function', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'pay() function', 'failed', errorMessage);
      addLog('error', `Payment failed: ${formatError(error)}`);
    }
  };

  // Test: Subscribe
  const testSubscribe = async () => {
    const category = 'Subscription Features';

    if (!loadedSDK) {
      updateTestStatus(category, 'subscribe() function', 'skipped', 'SDK not loaded');
      return;
    }

    try {
      updateTestStatus(category, 'subscribe() function', 'running');
      addLog('info', 'Testing subscribe() function...');
      
      // Request user interaction before opening popup
      await requestUserInteraction('subscribe() function', isRunningSectionRef.current);
      
      const result = await loadedSDK.base.subscribe({
        recurringCharge: '9.99',
        subscriptionOwner: '0x0000000000000000000000000000000000000001',
        periodInDays: 30,
        testnet: true,
      });

      subscriptionIdRef.current = result.id;
      updateTestStatus(
        category,
        'subscribe() function',
        'passed',
        undefined,
        `Subscription ID: ${result.id}`
      );
      addLog('success', `Subscription created: ${result.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'subscribe() function', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'subscribe() function', 'failed', errorMessage);
      addLog('error', `Subscription failed: ${formatError(error)}`);
    }
  };

  // Test: Prolink Encode/Decode
  const testProlinkEncodeDecode = async () => {
    const category = 'Prolink Features';

    if (!loadedSDK) {
      updateTestStatus(category, 'encodeProlink()', 'skipped', 'SDK not loaded');
      updateTestStatus(category, 'decodeProlink()', 'skipped', 'SDK not loaded');
      updateTestStatus(category, 'createProlinkUrl()', 'skipped', 'SDK not loaded');
      return;
    }

    // Check if Prolink functions are available
    if (!loadedSDK.encodeProlink || !loadedSDK.decodeProlink || !loadedSDK.createProlinkUrl) {
      updateTestStatus(category, 'encodeProlink()', 'skipped', 'Prolink API not available');
      updateTestStatus(category, 'decodeProlink()', 'skipped', 'Prolink API not available');
      updateTestStatus(category, 'createProlinkUrl()', 'skipped', 'Prolink API not available');
      addLog('warning', 'Prolink API not available - failed to load from CDN');
      return;
    }

    try {
      updateTestStatus(category, 'encodeProlink()', 'running');
      const testRequest = {
        method: 'wallet_sendCalls',
        params: [
          {
            version: '1',
            from: '0x0000000000000000000000000000000000000001',
            calls: [
              {
                to: '0x0000000000000000000000000000000000000002',
                data: '0x',
                value: '0x0',
              },
            ],
            chainId: '0x2105',
          },
        ],
      };

      const encoded = await loadedSDK.encodeProlink(testRequest);
      updateTestStatus(
        category,
        'encodeProlink()',
        'passed',
        undefined,
        `Encoded: ${encoded.slice(0, 30)}...`
      );
      addLog('success', `Prolink encoded: ${encoded.slice(0, 30)}...`);

      updateTestStatus(category, 'decodeProlink()', 'running');
      const decoded = await loadedSDK.decodeProlink(encoded);
      
      if (decoded.method === 'wallet_sendCalls') {
        updateTestStatus(category, 'decodeProlink()', 'passed', undefined, 'Decoded successfully');
        addLog('success', 'Prolink decoded successfully');
      } else {
        updateTestStatus(category, 'decodeProlink()', 'failed', 'Decoded method mismatch');
      }

      updateTestStatus(category, 'createProlinkUrl()', 'running');
      const url = loadedSDK.createProlinkUrl(encoded);
      if (url.startsWith('https://base.app/base-pay')) {
        updateTestStatus(category, 'createProlinkUrl()', 'passed', undefined, `URL: ${url.slice(0, 50)}...`);
        addLog('success', `Prolink URL created: ${url.slice(0, 80)}...`);
      } else {
        updateTestStatus(category, 'createProlinkUrl()', 'failed', `Invalid URL format: ${url}`);
        addLog('error', `Expected URL to start with https://base.app/base-pay but got: ${url}`);
      }
    } catch (error) {
      updateTestStatus(
        category,
        'Prolink encode/decode',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Prolink test failed: ${formatError(error)}`);
    }
  };

  // Test: Create Sub-Account
  const testCreateSubAccount = async () => {
    const category = 'Sub-Account Features';

    if (!provider || !loadedSDK) {
      updateTestStatus(category, 'wallet_addSubAccount', 'skipped', 'Provider not available');
      return;
    }

    try {
      updateTestStatus(category, 'wallet_addSubAccount', 'running');
      addLog('info', 'Creating sub-account...');
      
      // Request user interaction before opening popup
      addLog('info', 'Step 1: Requesting user interaction...');
      await requestUserInteraction('wallet_addSubAccount', isRunningSectionRef.current);
      
      // Check if getCryptoKeyAccount is available
      addLog('info', 'Step 2: Checking getCryptoKeyAccount availability...');
      console.log('[wallet_addSubAccount] loadedSDK keys:', Object.keys(loadedSDK));
      console.log('[wallet_addSubAccount] getCryptoKeyAccount:', loadedSDK.getCryptoKeyAccount);
      console.log('[wallet_addSubAccount] getCryptoKeyAccount type:', typeof loadedSDK.getCryptoKeyAccount);
      
      if (!loadedSDK.getCryptoKeyAccount) {
        updateTestStatus(category, 'wallet_addSubAccount', 'skipped', 'getCryptoKeyAccount not available (local SDK only)');
        addLog('warning', 'Sub-account creation requires local SDK');
        console.error('[wallet_addSubAccount] getCryptoKeyAccount is not available. LoadedSDK:', loadedSDK);
        return;
      }
      
      // Get or create a signer using getCryptoKeyAccount
      addLog('info', 'Step 3: Getting owner account from getCryptoKeyAccount...');
      const { account } = await loadedSDK.getCryptoKeyAccount();
      
      if (!account) {
        throw new Error('Could not get owner account from getCryptoKeyAccount');
      }
      
      const accountType = account.type as string;
      addLog('info', `Step 4: Got account of type: ${accountType || 'address'}`);
      addLog('info', `Step 4a: Account has address: ${account.address ? 'yes' : 'no'}`);
      addLog('info', `Step 4b: Account has publicKey: ${account.publicKey ? 'yes' : 'no'}`);

      // Switch to Base Sepolia
      addLog('info', 'Step 5: Switching to Base Sepolia (chainId: 0x14a34 / 84532)...');
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14a34' }], // 84532 in hex
      });
      addLog('info', 'Step 5: Chain switched successfully');

      // Prepare keys
      addLog('info', 'Step 6: Preparing wallet_addSubAccount params...');
      const keys = accountType === 'webAuthn'
        ? [{ type: 'webauthn-p256', publicKey: account.publicKey }]
        : [{ type: 'address', publicKey: account.address }];
      
      addLog('info', `Step 7: Calling wallet_addSubAccount with ${keys.length} key(s) of type: ${keys[0].type}...`);
      
      // Create sub-account with keys
      const response = await provider.request({
        method: 'wallet_addSubAccount',
        params: [
          {
            version: '1',
            account: {
              type: 'create',
              keys,
            },
          },
        ],
      }) as { address: string };

      if (!response || !response.address) {
        throw new Error('wallet_addSubAccount returned invalid response (no address)');
      }

      subAccountAddressRef.current = response.address;
      
      updateTestStatus(
        category,
        'wallet_addSubAccount',
        'passed',
        undefined,
        `Address: ${response.address.slice(0, 10)}...`
      );
      addLog('success', `Sub-account created: ${response.address}`);
    } catch (error) {
      const errorMessage = formatError(error);
      
      // Log the full error object for debugging
      console.error('[wallet_addSubAccount] Full error:', error);
      addLog('error', `Create sub-account failed: ${errorMessage}`);
      
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'wallet_addSubAccount', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      
      updateTestStatus(category, 'wallet_addSubAccount', 'failed', errorMessage);
    }
  };

  // Test: Get Sub-Accounts
  const testGetSubAccounts = async () => {
    const category = 'Sub-Account Features';

    if (!provider || !subAccountAddressRef.current) {
      updateTestStatus(category, 'wallet_getSubAccounts', 'skipped', 'No sub-account available');
      return;
    }

    try {
      updateTestStatus(category, 'wallet_getSubAccounts', 'running');
      addLog('info', 'Fetching sub-accounts...');
      
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      }) as string[];
      
      if (!accounts || accounts.length < 2) {
        throw new Error('No sub-account found in accounts list');
      }

      const response = await provider.request({
        method: 'wallet_getSubAccounts',
        params: [
          {
            account: accounts[1],
            domain: window.location.origin,
          },
        ],
      }) as { subAccounts: Array<{ address: string; factory: string; factoryData: string }> };

      const subAccounts = response.subAccounts || [];
      
      updateTestStatus(
        category,
        'wallet_getSubAccounts',
        'passed',
        undefined,
        `Found ${subAccounts.length} sub-account(s)`
      );
      addLog('success', `Retrieved ${subAccounts.length} sub-account(s)`);
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('[wallet_getSubAccounts] Full error:', error);
      addLog('error', `Get sub-accounts failed: ${errorMessage}`);
      updateTestStatus(category, 'wallet_getSubAccounts', 'failed', errorMessage);
    }
  };

  // Test: Sign with Sub-Account
  const testSignWithSubAccount = async () => {
    const category = 'Sub-Account Features';

    if (!provider || !subAccountAddressRef.current) {
      updateTestStatus(category, 'personal_sign (sub-account)', 'skipped', 'No sub-account available');
      return;
    }

    try {
      updateTestStatus(category, 'personal_sign (sub-account)', 'running');
      addLog('info', 'Signing message with sub-account...');
      
      await requestUserInteraction('personal_sign (sub-account)', isRunningSectionRef.current);
      
      const message = 'Hello from sub-account!';
      const signature = await provider.request({
        method: 'personal_sign',
        params: [toHex(message), subAccountAddressRef.current],
      }) as string;

      // Verify signature
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const isValid = await publicClient.verifyMessage({
        address: subAccountAddressRef.current as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });

      updateTestStatus(
        category,
        'personal_sign (sub-account)',
        isValid ? 'passed' : 'failed',
        isValid ? undefined : 'Signature verification failed',
        `Verified: ${isValid}`
      );
      addLog('success', `Sub-account signature verified: ${isValid}`);
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('[personal_sign (sub-account)] Full error:', error);
      addLog('error', `Sub-account sign failed: ${errorMessage}`);
      
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'personal_sign (sub-account)', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      
      updateTestStatus(category, 'personal_sign (sub-account)', 'failed', errorMessage);
    }
  };

  // Test: Send Calls from Sub-Account
  const testSendCallsFromSubAccount = async () => {
    const category = 'Sub-Account Features';

    if (!provider || !subAccountAddressRef.current) {
      updateTestStatus(category, 'wallet_sendCalls (sub-account)', 'skipped', 'No sub-account available');
      return;
    }

    try {
      updateTestStatus(category, 'wallet_sendCalls (sub-account)', 'running');
      addLog('info', 'Sending calls from sub-account...');
      
      await requestUserInteraction('wallet_sendCalls (sub-account)', isRunningSectionRef.current);
      
      const result = await provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x14a34', // Base Sepolia
          from: subAccountAddressRef.current,
          calls: [{
            to: '0x000000000000000000000000000000000000dead',
            data: '0x',
            value: '0x0',
          }],
          capabilities: {
            paymasterService: {
              url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
            },
          },
        }],
      });

      updateTestStatus(
        category,
        'wallet_sendCalls (sub-account)',
        'passed',
        undefined,
        'Transaction sent with paymaster'
      );
      addLog('success', 'Sub-account transaction sent successfully');
    } catch (error) {
      const errorMessage = formatError(error);
      console.error('[wallet_sendCalls (sub-account)] Full error:', error);
      addLog('error', `Sub-account send calls failed: ${errorMessage}`);
      
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'wallet_sendCalls (sub-account)', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      
      updateTestStatus(category, 'wallet_sendCalls (sub-account)', 'failed', errorMessage);
    }
  };

  // Test: Payment Status
  const testGetPaymentStatus = async () => {
    const category = 'Payment Features';

    if (!paymentIdRef.current || !loadedSDK) {
      updateTestStatus(category, 'getPaymentStatus()', 'skipped', 'No payment ID available or SDK not loaded');
      return;
    }

    try {
      updateTestStatus(category, 'getPaymentStatus()', 'running');
      addLog('info', 'Checking payment status with polling (up to 5s)...');
      
      const status = await loadedSDK.getPaymentStatus({
        id: paymentIdRef.current,
        testnet: true,
        maxRetries: 10, // Retry up to 10 times
        retryDelayMs: 500, // 500ms between retries = ~5 seconds total
      });

      updateTestStatus(
        category,
        'getPaymentStatus()',
        'passed',
        undefined,
        `Status: ${status.status}`
      );
      addLog('success', `Payment status: ${status.status}`);
    } catch (error) {
      updateTestStatus(
        category,
        'getPaymentStatus()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Get payment status failed: ${formatError(error)}`);
    }
  };

  // Test: Subscription Status
  const testGetSubscriptionStatus = async () => {
    const category = 'Subscription Features';

    if (!subscriptionIdRef.current || !loadedSDK) {
      updateTestStatus(category, 'base.subscription.getStatus()', 'skipped', 'No subscription ID available or SDK not loaded');
      return;
    }

    try {
      updateTestStatus(category, 'base.subscription.getStatus()', 'running');
      addLog('info', 'Checking subscription status...');
      
      // Use the correct API: base.subscription.getStatus()
      const status = await loadedSDK.base.subscription.getStatus({
        id: subscriptionIdRef.current,
        testnet: true,
      });

      const details = [
        `Active: ${status.isSubscribed}`,
        `Recurring: $${status.recurringCharge}`,
        status.remainingChargeInPeriod ? `Remaining: $${status.remainingChargeInPeriod}` : null,
        status.periodInDays ? `Period: ${status.periodInDays} days` : null,
      ].filter(Boolean).join(', ');
      
      updateTestStatus(
        category,
        'base.subscription.getStatus()',
        'passed',
        undefined,
        details
      );
      addLog('success', `Subscription status retrieved successfully`);
      addLog('info', `  - Active: ${status.isSubscribed}`);
      addLog('info', `  - Recurring charge: $${status.recurringCharge}`);
      if (status.remainingChargeInPeriod) {
        addLog('info', `  - Remaining in period: $${status.remainingChargeInPeriod}`);
      }
      if (status.periodInDays) {
        addLog('info', `  - Period: ${status.periodInDays} days`);
      }
      if (status.nextPeriodStart) {
        addLog('info', `  - Next period: ${status.nextPeriodStart.toISOString()}`);
      }
    } catch (error) {
      updateTestStatus(
        category,
        'base.subscription.getStatus()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Get subscription status failed: ${formatError(error)}`);
    }
  };

  // Test: Prepare Charge
  const testPrepareCharge = async () => {
    const category = 'Subscription Features';

    if (!subscriptionIdRef.current || !loadedSDK) {
      updateTestStatus(category, 'prepareCharge() with amount', 'skipped', 'No subscription ID available or SDK not loaded');
      updateTestStatus(category, 'prepareCharge() max-remaining-charge', 'skipped', 'No subscription ID available or SDK not loaded');
      return;
    }

    try {
      updateTestStatus(category, 'prepareCharge() with amount', 'running');
      addLog('info', 'Preparing charge with specific amount...');
      
      const chargeCalls = await loadedSDK.base.subscription.prepareCharge({
        id: subscriptionIdRef.current,
        amount: '1.00',
        testnet: true,
      });

      updateTestStatus(
        category,
        'prepareCharge() with amount',
        'passed',
        undefined,
        `Generated ${chargeCalls.length} call(s)`
      );
      addLog('success', `Charge prepared: ${chargeCalls.length} calls`);
    } catch (error) {
      updateTestStatus(
        category,
        'prepareCharge() with amount',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Prepare charge failed: ${formatError(error)}`);
    }

    try {
      updateTestStatus(category, 'prepareCharge() max-remaining-charge', 'running');
      addLog('info', 'Preparing charge with max-remaining-charge...');
      
      const maxChargeCalls = await loadedSDK.base.subscription.prepareCharge({
        id: subscriptionIdRef.current,
        amount: 'max-remaining-charge',
        testnet: true,
      });

      updateTestStatus(
        category,
        'prepareCharge() max-remaining-charge',
        'passed',
        undefined,
        `Generated ${maxChargeCalls.length} call(s)`
      );
      addLog('success', `Max charge prepared: ${maxChargeCalls.length} calls`);
    } catch (error) {
      updateTestStatus(
        category,
        'prepareCharge() max-remaining-charge',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Prepare max charge failed: ${formatError(error)}`);
    }
  };

  // Test: Request Spend Permission
  const testRequestSpendPermission = async () => {
    const category = 'Spend Permissions';

    if (!provider || !loadedSDK) {
      updateTestStatus(category, 'spendPermission.requestSpendPermission()', 'skipped', 'Provider or SDK not available');
      return;
    }

    // Check if spendPermission is available (only works with local SDK, not npm CDN)
    if (!loadedSDK.spendPermission?.requestSpendPermission) {
      updateTestStatus(
        category, 
        'spendPermission.requestSpendPermission()', 
        'skipped', 
        'Spend permission API not available (only works with local SDK)'
      );
      addLog('warning', 'Spend permission API not available in npm CDN builds');
      return;
    }

    try {
      updateTestStatus(category, 'spendPermission.requestSpendPermission()', 'running');
      addLog('info', 'Requesting spend permission...');
      
      // Get current connection status directly from provider
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      
      if (!accounts || accounts.length === 0) {
        updateTestStatus(category, 'spendPermission.requestSpendPermission()', 'skipped', 'Not connected');
        return;
      }
      
      const account = accounts[0];
      
      // Request user interaction before opening popup
      await requestUserInteraction('spendPermission.requestSpendPermission()', isRunningSectionRef.current);
      
      // Check if TOKENS are available
      if (!loadedSDK.TOKENS?.USDC?.addresses?.baseSepolia) {
        throw new Error('TOKENS.USDC not available');
      }
      
      const permission = await loadedSDK.spendPermission.requestSpendPermission({
        provider,
        account,
        spender: '0x0000000000000000000000000000000000000001',
        token: loadedSDK.TOKENS.USDC.addresses.baseSepolia,
        chainId: 84532,
        allowance: parseUnits('100', 6),
        periodInDays: 30,
      });

      permissionHashRef.current = permission.permissionHash;
      updateTestStatus(
        category,
        'spendPermission.requestSpendPermission()',
        'passed',
        undefined,
        `Hash: ${permission.permissionHash.slice(0, 20)}...`
      );
      addLog('success', `Spend permission created: ${permission.permissionHash}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'spendPermission.requestSpendPermission()', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'spendPermission.requestSpendPermission()', 'failed', errorMessage);
      addLog('error', `Request spend permission failed: ${formatError(error)}`);
    }
  };

  // Test: Get Permission Status
  const testGetPermissionStatus = async () => {
    const category = 'Spend Permissions';

    if (!permissionHashRef.current || !loadedSDK) {
      updateTestStatus(category, 'spendPermission.getPermissionStatus()', 'skipped', 'No permission hash available or SDK not loaded');
      return;
    }

    if (!loadedSDK.spendPermission?.getPermissionStatus || !loadedSDK.spendPermission?.fetchPermission) {
      updateTestStatus(category, 'spendPermission.getPermissionStatus()', 'skipped', 'Spend permission API not available');
      return;
    }

    try {
      updateTestStatus(category, 'spendPermission.getPermissionStatus()', 'running');
      addLog('info', 'Getting permission status...');
      
      // First fetch the full permission object (which includes chainId)
      const permission = await loadedSDK.spendPermission.fetchPermission({
        permissionHash: permissionHashRef.current,
      });

      if (!permission) {
        throw new Error('Permission not found');
      }

      // Now get the status using the full permission object
      const status = await loadedSDK.spendPermission.getPermissionStatus(permission);

      updateTestStatus(
        category,
        'spendPermission.getPermissionStatus()',
        'passed',
        undefined,
        `Remaining: ${status.remainingSpend}`
      );
      addLog('success', `Permission status retrieved: remaining spend ${status.remainingSpend}`);
    } catch (error) {
      updateTestStatus(
        category,
        'spendPermission.getPermissionStatus()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Get permission status failed: ${formatError(error)}`);
    }
  };

  // Test: Fetch Permission
  const testFetchPermission = async () => {
    const category = 'Spend Permissions';

    if (!permissionHashRef.current || !loadedSDK) {
      updateTestStatus(category, 'spendPermission.fetchPermission()', 'skipped', 'No permission hash available or SDK not loaded');
      return;
    }

    if (!loadedSDK.spendPermission?.fetchPermission) {
      updateTestStatus(category, 'spendPermission.fetchPermission()', 'skipped', 'Spend permission API not available');
      return;
    }

    try {
      updateTestStatus(category, 'spendPermission.fetchPermission()', 'running');
      addLog('info', 'Fetching permission...');
      
      const permission = await loadedSDK.spendPermission.fetchPermission({
        permissionHash: permissionHashRef.current,
      });

      if (permission) {
        updateTestStatus(
          category,
          'spendPermission.fetchPermission()',
          'passed',
          undefined,
          `Chain ID: ${permission.chainId}`
        );
        addLog('success', `Permission fetched`);
      } else {
        updateTestStatus(category, 'spendPermission.fetchPermission()', 'failed', 'Permission not found');
      }
    } catch (error) {
      updateTestStatus(
        category,
        'spendPermission.fetchPermission()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Fetch permission failed: ${formatError(error)}`);
    }
  };

  // Test: Fetch Permissions
  const testFetchPermissions = async () => {
    const category = 'Spend Permissions';

    if (!provider || !loadedSDK) {
      updateTestStatus(category, 'spendPermission.fetchPermissions()', 'skipped', 'Provider or SDK not available');
      return;
    }

    if (!loadedSDK.spendPermission?.fetchPermissions) {
      updateTestStatus(category, 'spendPermission.fetchPermissions()', 'skipped', 'Spend permission API not available');
      return;
    }

    try {
      updateTestStatus(category, 'spendPermission.fetchPermissions()', 'running');
      addLog('info', 'Fetching all permissions...');
      
      // Get current connection status directly from provider
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      
      if (!accounts || accounts.length === 0) {
        updateTestStatus(category, 'spendPermission.fetchPermissions()', 'skipped', 'Not connected');
        return;
      }
      
      const account = accounts[0];
      
      // fetchPermissions requires a spender parameter - use the same one we used in requestSpendPermission
      const permissions = await loadedSDK.spendPermission.fetchPermissions({
        provider,
        account,
        spender: '0x0000000000000000000000000000000000000001',
        chainId: 84532,
      });

      updateTestStatus(
        category,
        'spendPermission.fetchPermissions()',
        'passed',
        undefined,
        `Found ${permissions.length} permission(s)`
      );
      addLog('success', `Fetched ${permissions.length} permissions`);
    } catch (error) {
      updateTestStatus(
        category,
        'spendPermission.fetchPermissions()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Fetch permissions failed: ${formatError(error)}`);
    }
  };

  // Test: Prepare Spend Call Data
  const testPrepareSpendCallData = async () => {
    const category = 'Spend Permissions';

    if (!permissionHashRef.current || !loadedSDK) {
      updateTestStatus(category, 'spendPermission.prepareSpendCallData()', 'skipped', 'No permission hash available or SDK not loaded');
      return;
    }

    if (!loadedSDK.spendPermission?.prepareSpendCallData || !loadedSDK.spendPermission?.fetchPermission) {
      updateTestStatus(category, 'spendPermission.prepareSpendCallData()', 'skipped', 'Spend permission API not available');
      return;
    }

    try {
      updateTestStatus(category, 'spendPermission.prepareSpendCallData()', 'running');
      addLog('info', 'Preparing spend call data...');
      
      const permission = await loadedSDK.spendPermission.fetchPermission({ permissionHash: permissionHashRef.current });
      if (!permission) {
        throw new Error('Permission not found');
      }

      const callData = await loadedSDK.spendPermission.prepareSpendCallData(
        permission,
        parseUnits('10', 6)
      );

      updateTestStatus(
        category,
        'spendPermission.prepareSpendCallData()',
        'passed',
        undefined,
        `Generated ${callData.length} call(s)`
      );
      addLog('success', `Spend call data prepared`);
    } catch (error) {
      updateTestStatus(
        category,
        'spendPermission.prepareSpendCallData()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Prepare spend call data failed: ${formatError(error)}`);
    }
  };

  // Test: Prepare Revoke Call Data
  const testPrepareRevokeCallData = async () => {
    const category = 'Spend Permissions';

    if (!permissionHashRef.current || !loadedSDK) {
      updateTestStatus(category, 'spendPermission.prepareRevokeCallData()', 'skipped', 'No permission hash available or SDK not loaded');
      return;
    }

    if (!loadedSDK.spendPermission?.prepareRevokeCallData || !loadedSDK.spendPermission?.fetchPermission) {
      updateTestStatus(category, 'spendPermission.prepareRevokeCallData()', 'skipped', 'Spend permission API not available');
      return;
    }

    try {
      updateTestStatus(category, 'spendPermission.prepareRevokeCallData()', 'running');
      addLog('info', 'Preparing revoke call data...');
      
      const permission = await loadedSDK.spendPermission.fetchPermission({ permissionHash: permissionHashRef.current });
      if (!permission) {
        throw new Error('Permission not found');
      }

      const callData = await loadedSDK.spendPermission.prepareRevokeCallData(permission);

      updateTestStatus(
        category,
        'spendPermission.prepareRevokeCallData()',
        'passed',
        undefined,
        `To: ${callData.to.slice(0, 10)}...`
      );
      addLog('success', `Revoke call data prepared`);
    } catch (error) {
      updateTestStatus(
        category,
        'spendPermission.prepareRevokeCallData()',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Prepare revoke call data failed: ${formatError(error)}`);
    }
  };

  // Test: Sign Typed Data
  const testSignTypedData = async () => {
    const category = 'Sign & Send';

    if (!provider) {
      updateTestStatus(category, 'eth_signTypedData_v4', 'skipped', 'Provider not available');
      return;
    }

    try {
      updateTestStatus(category, 'eth_signTypedData_v4', 'running');
      addLog('info', 'Signing typed data...');
      
      // Get current connection status and chain ID directly from provider
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      
      if (!accounts || accounts.length === 0) {
        updateTestStatus(category, 'eth_signTypedData_v4', 'skipped', 'Not connected');
        return;
      }
      
      const account = accounts[0];
      
      const chainIdHex = await provider.request({
        method: 'eth_chainId',
        params: [],
      });
      const chainIdNum = parseInt(chainIdHex, 16);
      
      // Request user interaction before opening popup
      await requestUserInteraction('eth_signTypedData_v4', isRunningSectionRef.current);
      
      const typedData = {
        domain: {
          name: 'E2E Test',
          version: '1',
          chainId: chainIdNum,
        },
        types: {
          TestMessage: [
            { name: 'message', type: 'string' },
          ],
        },
        primaryType: 'TestMessage',
        message: {
          message: 'Hello from E2E tests!',
        },
      };

      const signature = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [account, JSON.stringify(typedData)],
      });

      updateTestStatus(
        category,
        'eth_signTypedData_v4',
        'passed',
        undefined,
        `Sig: ${signature.slice(0, 20)}...`
      );
      addLog('success', `Typed data signed: ${signature.slice(0, 20)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'eth_signTypedData_v4', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'eth_signTypedData_v4', 'failed', errorMessage);
      addLog('error', `Sign typed data failed: ${formatError(error)}`);
    }
  };

  // Test: Wallet Send Calls
  const testWalletSendCalls = async () => {
    const category = 'Sign & Send';

    if (!provider) {
      updateTestStatus(category, 'wallet_sendCalls', 'skipped', 'Provider not available');
      return;
    }

    try {
      updateTestStatus(category, 'wallet_sendCalls', 'running');
      addLog('info', 'Sending calls via wallet_sendCalls...');
      
      // Get current connection status and chain ID directly from provider
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      
      if (!accounts || accounts.length === 0) {
        updateTestStatus(category, 'wallet_sendCalls', 'skipped', 'Not connected');
        return;
      }
      
      const account = accounts[0];
      
      const chainIdHex = await provider.request({
        method: 'eth_chainId',
        params: [],
      });
      const chainIdNum = parseInt(chainIdHex, 16);
      
      // Request user interaction before opening popup
      await requestUserInteraction('wallet_sendCalls', isRunningSectionRef.current);
      
      const result = await provider.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '2.0.0',
          from: account,
          chainId: `0x${chainIdNum.toString(16)}`,
          calls: [{
            to: '0x0000000000000000000000000000000000000001',
            data: '0x',
            value: '0x0',
          }],
        }],
      });

      updateTestStatus(
        category,
        'wallet_sendCalls',
        'passed',
        undefined,
        `Result: ${JSON.stringify(result).slice(0, 30)}...`
      );
      addLog('success', `Calls sent successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'wallet_sendCalls', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'wallet_sendCalls', 'failed', errorMessage);
      addLog('error', `Send calls failed: ${formatError(error)}`);
    }
  };

  // Test: Wallet Prepare Calls
  const testWalletPrepareCalls = async () => {
    const category = 'Sign & Send';

    if (!provider) {
      updateTestStatus(category, 'wallet_prepareCalls', 'skipped', 'Provider not available');
      return;
    }

    try {
      updateTestStatus(category, 'wallet_prepareCalls', 'running');
      addLog('info', 'Preparing calls via wallet_prepareCalls...');
      
      // Get current connection status and chain ID directly from provider
      const accounts = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      
      if (!accounts || accounts.length === 0) {
        updateTestStatus(category, 'wallet_prepareCalls', 'skipped', 'Not connected');
        return;
      }
      
      const account = accounts[0];
      
      const chainIdHex = await provider.request({
        method: 'eth_chainId',
        params: [],
      });
      const chainIdNum = parseInt(chainIdHex, 16);
      
      // Request user interaction before opening popup
      await requestUserInteraction('wallet_prepareCalls', isRunningSectionRef.current);
      
      const result = await provider.request({
        method: 'wallet_prepareCalls',
        params: [{
          version: '2.0.0',
          from: account,
          chainId: `0x${chainIdNum.toString(16)}`,
          calls: [{
            to: '0x0000000000000000000000000000000000000001',
            data: '0x',
            value: '0x0',
          }],
        }],
      });

      updateTestStatus(
        category,
        'wallet_prepareCalls',
        'passed',
        undefined,
        `Result: ${JSON.stringify(result).slice(0, 30)}...`
      );
      addLog('success', `Calls prepared successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'Test cancelled by user') {
        updateTestStatus(category, 'wallet_prepareCalls', 'skipped', 'Cancelled by user');
        addLog('warning', 'Test cancelled by user');
        throw error;
      }
      updateTestStatus(category, 'wallet_prepareCalls', 'failed', errorMessage);
      addLog('error', `Prepare calls failed: ${formatError(error)}`);
    }
  };

  // Test: Provider Events
  const testProviderEvents = async () => {
    const category = 'Provider Events';

    if (!provider) {
      updateTestStatus(category, 'accountsChanged listener', 'skipped', 'Provider not available');
      updateTestStatus(category, 'chainChanged listener', 'skipped', 'Provider not available');
      updateTestStatus(category, 'disconnect listener', 'skipped', 'Provider not available');
      return;
    }

    try {
      updateTestStatus(category, 'accountsChanged listener', 'running');
      
      let accountsChangedFired = false;
      const accountsChangedHandler = () => {
        accountsChangedFired = true;
      };
      
      provider.on('accountsChanged', accountsChangedHandler);
      
      // Clean up listener
      provider.removeListener('accountsChanged', accountsChangedHandler);
      
      updateTestStatus(
        category,
        'accountsChanged listener',
        'passed',
        undefined,
        'Listener registered successfully'
      );
      addLog('success', 'accountsChanged listener works');
    } catch (error) {
      updateTestStatus(
        category,
        'accountsChanged listener',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    try {
      updateTestStatus(category, 'chainChanged listener', 'running');
      
      const chainChangedHandler = () => {};
      provider.on('chainChanged', chainChangedHandler);
      provider.removeListener('chainChanged', chainChangedHandler);
      
      updateTestStatus(
        category,
        'chainChanged listener',
        'passed',
        undefined,
        'Listener registered successfully'
      );
      addLog('success', 'chainChanged listener works');
    } catch (error) {
      updateTestStatus(
        category,
        'chainChanged listener',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    try {
      updateTestStatus(category, 'disconnect listener', 'running');
      
      const disconnectHandler = () => {};
      provider.on('disconnect', disconnectHandler);
      provider.removeListener('disconnect', disconnectHandler);
      
      updateTestStatus(
        category,
        'disconnect listener',
        'passed',
        undefined,
        'Listener registered successfully'
      );
      addLog('success', 'disconnect listener works');
    } catch (error) {
      updateTestStatus(
        category,
        'disconnect listener',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };


  // Track which section is running
  const [runningSectionName, setRunningSectionName] = useState<string | null>(null);

  // Helper to reset a specific category
  const resetCategory = (categoryName: string) => {
    setTestCategories((prev) =>
      prev.map((cat) => 
        cat.name === categoryName ? { ...cat, tests: [] } : cat
      )
    );
  };

  // Helper to ensure connection is established
  const ensureConnection = async () => {
    if (!provider) {
      addLog('error', 'Provider not available. Please initialize SDK first.');
      throw new Error('Provider not available');
    }

    // Check if already connected
    const accounts = await provider.request({
      method: 'eth_accounts',
      params: [],
    });

    if (accounts && accounts.length > 0) {
      addLog('info', `Already connected to: ${accounts[0]}`);
      setCurrentAccount(accounts[0]);
      setConnected(true);
      return;
    }

    // Not connected, establish connection
    addLog('info', 'No connection found. Establishing connection...');
    await testConnectWallet();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await testGetAccounts();
    await testGetChainId();
  };

  // Run specific test section
  const runTestSection = async (sectionName: string) => {
    setRunningSectionName(sectionName);
    
    // Reset only this category
    resetCategory(sectionName);

    // Skip user interaction modal for individual sections since the button click provides the gesture
    isRunningSectionRef.current = true;

    addLog('info', `🚀 Running ${sectionName} tests...`);
    addLog('info', '');

    try {
      // Sections that require a wallet connection
      const requiresConnection = [
        'Sign & Send',
        'Sub-Account Features',
      ];

      // Ensure connection is established for sections that need it
      if (requiresConnection.includes(sectionName)) {
        await ensureConnection();
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      switch (sectionName) {
        case 'SDK Initialization & Exports':
          await testSDKInitialization();
          break;
        
        case 'Wallet Connection':
          await testConnectWallet();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testGetAccounts();
          await testGetChainId();
          break;
        
        case 'Payment Features':
          await testPay();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testGetPaymentStatus();
          break;
        
        case 'Subscription Features':
          await testSubscribe();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testGetSubscriptionStatus();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testPrepareCharge();
          break;
        
        case 'Prolink Features':
          await testProlinkEncodeDecode();
          break;
        
        case 'Spend Permissions':
          await testRequestSpendPermission();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testGetPermissionStatus();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testFetchPermission();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testFetchPermissions();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testPrepareSpendCallData();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testPrepareRevokeCallData();
          break;
        
        case 'Sub-Account Features':
          await testCreateSubAccount();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testGetSubAccounts();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testSignWithSubAccount();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testSendCallsFromSubAccount();
          break;
        
        case 'Sign & Send':
          await testSignMessage();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testSignTypedData();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testWalletSendCalls();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await testWalletPrepareCalls();
          break;
        
        case 'Provider Events':
          await testProviderEvents();
          break;
      }

      addLog('info', '');
      addLog('success', `✅ ${sectionName} tests completed!`);
      
      toast({
        title: 'Section Complete',
        description: `${sectionName} tests finished`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled by user') {
        addLog('info', '');
        addLog('warning', `⚠️ ${sectionName} tests cancelled by user`);
        toast({
          title: 'Tests Cancelled',
          description: `${sectionName} tests were cancelled`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      } else {
        addLog('error', `❌ ${sectionName} tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setRunningSectionName(null);
      isRunningSectionRef.current = false; // Reset ref after section completes
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({ total: 0, passed: 0, failed: 0, skipped: 0 });
    setConsoleLogs([]);
    
    // Reset all test categories
    setTestCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        tests: [],
      }))
    );

    // Don't skip modal for full test suite - keep user interaction prompts
    isRunningSectionRef.current = false;

    addLog('info', '🚀 Starting E2E Test Suite...');
    addLog('info', '');

    try {
      // Run tests in sequence
      // 1. SDK Initialization
      await testSDKInitialization();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Establish wallet connection
      await testConnectWallet();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testGetAccounts();
      await testGetChainId();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Run connection-dependent tests BEFORE pay/subscribe (which might affect state)
      // Sign & Send tests
      await testSignMessage();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testSignTypedData();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testWalletSendCalls();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testWalletPrepareCalls();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Spend Permission tests (need stable connection)
      await testRequestSpendPermission();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testGetPermissionStatus();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testFetchPermission();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testFetchPermissions();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testPrepareSpendCallData();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testPrepareRevokeCallData();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Sub-Account tests (run BEFORE pay/subscribe to avoid state conflicts)
      await testCreateSubAccount();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testGetSubAccounts();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testSignWithSubAccount();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testSendCallsFromSubAccount();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 5. Payment & Subscription tests (run AFTER sub-account tests)
      await testPay();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testGetPaymentStatus();
      await new Promise((resolve) => setTimeout(resolve, 500));

      await testSubscribe();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testGetSubscriptionStatus();
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      await testPrepareCharge();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 6. Standalone tests (don't require connection)
      // Prolink tests
      await testProlinkEncodeDecode();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Provider Event tests
      await testProviderEvents();
      await new Promise((resolve) => setTimeout(resolve, 500));

      addLog('info', '');
      addLog('success', '✅ Test suite completed!');
    } catch (error) {
      if (error instanceof Error && error.message === 'Test cancelled by user') {
        addLog('info', '');
        addLog('warning', '⚠️ Test suite cancelled by user');
        toast({
          title: 'Tests Cancelled',
          description: 'Test suite was cancelled by user',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsRunningTests(false);

      // Show completion toast (if not cancelled)
      const passed = testCategories.reduce(
        (acc, cat) => acc + cat.tests.filter((t) => t.status === 'passed').length,
        0
      );
      const failed = testCategories.reduce(
        (acc, cat) => acc + cat.tests.filter((t) => t.status === 'failed').length,
        0
      );

      if (passed > 0 || failed > 0) {
        toast({
          title: 'Tests Complete',
          description: `${passed} passed, ${failed} failed`,
          status: failed > 0 ? 'warning' : 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  // Get status icon
  const getStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'running':
        return '⏳';
      case 'skipped':
        return '⊘';
      default:
        return '⏸';
    }
  };

  // Get status color
  const getStatusColor = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return 'green.500';
      case 'failed':
        return 'red.500';
      case 'running':
        return 'blue.500';
      case 'skipped':
        return 'gray.500';
      default:
        return 'gray.400';
    }
  };

  const handleSourceChange = (source: 'local' | 'npm') => {
    setSdkSource(source);
  };

  return (
    <>
      <UserInteractionModal
        isOpen={isModalOpen}
        testName={currentTestName}
        onContinue={handleContinue}
        onCancel={handleCancel}
      />
      <Header
        sdkVersion={loadedSDK?.VERSION || 'Not Loaded'}
        sdkSource={sdkSource}
        onSourceChange={handleSourceChange}
        isLoadingSDK={isLoadingSDK}
      />
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <Heading size="md">Wallet Connection Status</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex align="center" gap={3}>
                <Box
                  w={3}
                  h={3}
                  borderRadius="full"
                  bg={connected ? 'green.500' : 'gray.400'}
                  boxShadow={connected ? '0 0 10px rgba(72, 187, 120, 0.6)' : 'none'}
                />
                <Text fontSize="lg" fontWeight="bold">
                  {connected ? 'Connected' : 'Not Connected'}
                </Text>
                {connected && <Badge colorScheme="green">Active</Badge>}
              </Flex>

              {connected && currentAccount && (
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Connected Account
                    </Text>
                    <Code fontSize="xs" p={2} borderRadius="md" display="block">
                      {currentAccount}
                    </Code>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Chain ID
                    </Text>
                    <Badge colorScheme="blue" fontSize="md" p={2}>
                      {chainId || 'Unknown'}
                    </Badge>
                  </Box>
                </Grid>
              )}

              {!connected && (
                <Box p={4} bg="gray.50" borderRadius="md" _dark={{ bg: 'gray.800' }}>
                  <Text fontSize="sm" color="gray.600">
                    No wallet connected. Run the "Connect wallet" test to establish a connection.
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="md">Test Controls</Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Run all tests or individual test categories
                </Text>
              </Box>
              <Button
                colorScheme="purple"
                size="lg"
                onClick={runAllTests}
                isLoading={isRunningTests}
                loadingText="Running Tests..."
              >
                Run All Tests
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Test Results Summary */}
        <Card>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <Heading size="md">Test Results</Heading>
              <Flex gap={2}>
                <Tooltip label="Copy abbreviated results (passed/failed only)" placement="left">
                  <Button
                    size="sm"
                    colorScheme="purple"
                    variant="outline"
                    onClick={copyAbbreviatedResults}
                    isDisabled={testCategories.reduce((acc, cat) => acc + cat.tests.length, 0) === 0}
                  >
                    📋 Copy Short
                  </Button>
                </Tooltip>
                <Tooltip label="Copy detailed test results with failure reasons" placement="left">
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={copyTestResults}
                    isDisabled={testCategories.reduce((acc, cat) => acc + cat.tests.length, 0) === 0}
                  >
                    📋 Copy Full
                  </Button>
                </Tooltip>
              </Flex>
            </Flex>
          </CardHeader>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel>Total Tests</StatLabel>
                <StatNumber>
                  {testCategories.reduce((acc, cat) => acc + cat.tests.length, 0)}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Passed</StatLabel>
                <StatNumber color="green.500">
                  {testCategories.reduce(
                    (acc, cat) => acc + cat.tests.filter((t) => t.status === 'passed').length,
                    0
                  )}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Failed</StatLabel>
                <StatNumber color="red.500">
                  {testCategories.reduce(
                    (acc, cat) => acc + cat.tests.filter((t) => t.status === 'failed').length,
                    0
                  )}
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Skipped</StatLabel>
                <StatNumber color="gray.500">
                  {testCategories.reduce(
                    (acc, cat) => acc + cat.tests.filter((t) => t.status === 'skipped').length,
                    0
                  )}
                </StatNumber>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>

        {/* Test Categories */}
        <Tabs variant="enclosed" colorScheme="purple">
          <TabList>
            <Tab>Test Categories</Tab>
            <Tab>Console Logs</Tab>
          </TabList>

          <TabPanels>
            {/* Test Categories Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {testCategories.map((category) => (
                  <Card key={category.name}>
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Box flex="1">
                          <Heading size="md">{category.name}</Heading>
                        </Box>
                        <Flex gap={2} align="center">
                          <Badge colorScheme="purple">
                            {category.tests.length} test{category.tests.length !== 1 ? 's' : ''}
                          </Badge>
                          <Tooltip label="Copy section results" placement="top">
                            <Button
                              size="sm"
                              colorScheme="purple"
                              variant="ghost"
                              onClick={() => copySectionResults(category.name)}
                              isDisabled={category.tests.length === 0}
                            >
                              📋
                            </Button>
                          </Tooltip>
                          <Button
                            size="sm"
                            colorScheme="purple"
                            variant="outline"
                            onClick={() => runTestSection(category.name)}
                            isLoading={runningSectionName === category.name}
                            isDisabled={isRunningTests || (runningSectionName !== null && runningSectionName !== category.name)}
                            loadingText="Running..."
                          >
                            ▶ Run Section
                          </Button>
                        </Flex>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      {category.tests.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">
                          No tests run yet
                        </Text>
                      ) : (
                        <VStack spacing={3} align="stretch">
                          {category.tests.map((test) => (
                            <Box
                              key={test.name}
                              p={4}
                              borderWidth="1px"
                              borderRadius="md"
                              borderColor={getStatusColor(test.status)}
                              bg={
                                test.status === 'failed'
                                  ? 'red.50'
                                  : test.status === 'passed'
                                    ? 'green.50'
                                    : 'gray.50'
                              }
                              _dark={{
                                bg:
                                  test.status === 'failed'
                                    ? 'red.900'
                                    : test.status === 'passed'
                                      ? 'green.900'
                                      : 'gray.800',
                              }}
                            >
                              <Flex justify="space-between" align="center">
                                <Flex align="center" gap={2}>
                                  <Text fontSize="lg">{getStatusIcon(test.status)}</Text>
                                  <Text fontWeight="medium">{test.name}</Text>
                                </Flex>
                                {test.duration && (
                                  <Badge colorScheme="gray">{test.duration}ms</Badge>
                                )}
                              </Flex>
                              {test.details && (
                                <Text fontSize="sm" color="gray.600" mt={2}>
                                  {test.details}
                                </Text>
                              )}
                              {test.error && (
                                <Box mt={2} p={2} bg="red.100" borderRadius="md">
                                  <Text fontSize="sm" color="red.700">
                                    Error: {test.error}
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </VStack>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>

            {/* Console Logs Tab */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Console Output</Heading>
                    <Tooltip label="Copy all console output" placement="left">
                      <Button
                        size="sm"
                        colorScheme="purple"
                        onClick={copyConsoleOutput}
                        isDisabled={consoleLogs.length === 0}
                      >
                        📋 Copy
                      </Button>
                    </Tooltip>
                  </Flex>
                </CardHeader>
                <CardBody>
                  <Box
                    p={4}
                    bg="gray.900"
                    borderRadius="md"
                    fontFamily="mono"
                    fontSize="sm"
                    color="green.300"
                    maxH="600px"
                    overflowY="auto"
                  >
                    {consoleLogs.length === 0 ? (
                      <Text color="gray.500">No logs yet. Run tests to see output.</Text>
                    ) : (
                      <VStack spacing={1} align="stretch">
                        {consoleLogs.map((log, index) => (
                          <Text
                            key={index}
                            color={
                              log.type === 'error'
                                ? 'red.300'
                                : log.type === 'warning'
                                  ? 'yellow.300'
                                  : log.type === 'success'
                                    ? 'green.300'
                                    : 'gray.300'
                            }
                          >
                            {log.message}
                          </Text>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Documentation Link */}
        <Card>
          <CardBody>
            <Flex justify="center" align="center" gap={2}>
              <Text>📚 For more information, visit the</Text>
              <Link
                href="https://docs.base.org/base-account"
                isExternal
                color="purple.500"
                fontWeight="bold"
              >
                Base Account Documentation
              </Link>
            </Flex>
          </CardBody>
        </Card>
        </VStack>
      </Container>
    </>
  );
}

// Custom layout for this page - no app header
E2ETestPage.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};

