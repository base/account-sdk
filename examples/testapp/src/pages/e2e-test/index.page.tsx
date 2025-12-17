import {
    base,
    createBaseAccountSDK,
    createProlinkUrl,
    decodeProlink,
    encodeProlink,
    VERSION,
} from '@base-org/account';
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
    useColorMode,
    useToast,
    VStack
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';

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

export default function E2ETestPage() {
  const toast = useToast();
  const { colorMode } = useColorMode();

  // SDK state
  const [sdk, setSdk] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

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

  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setConsoleLogs((prev) => [...prev, { type, message }]);
  };

  // Initialize SDK on mount
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const sdkInstance = createBaseAccountSDK({
          appName: 'E2E Test Suite',
          appLogoUrl: undefined,
          appChainIds: [84532], // Base Sepolia
        });
        setSdk(sdkInstance);
        const providerInstance = sdkInstance.getProvider();
        setProvider(providerInstance);
        addLog('success', `SDK initialized on mount (v${VERSION})`);
      } catch (error) {
        addLog('error', `SDK initialization failed on mount: ${error}`);
      }
    };

    initializeSDK();
  }, []);

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

    try {
      updateTestStatus(category, 'SDK can be initialized', 'running');
      const start = Date.now();
      const sdkInstance = createBaseAccountSDK({
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
        `SDK v${VERSION}`,
        duration
      );
      addLog('success', `SDK initialized successfully (v${VERSION})`);
    } catch (error) {
      updateTestStatus(
        category,
        'SDK can be initialized',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `SDK initialization failed: ${error}`);
    }

    // Test exports
    const exports = [
      { name: 'createBaseAccountSDK', value: createBaseAccountSDK },
      { name: 'base.pay', value: base.pay },
      { name: 'base.subscribe', value: base.subscribe },
      { name: 'base.prepareCharge', value: base.subscription.prepareCharge },
      { name: 'encodeProlink', value: encodeProlink },
      { name: 'decodeProlink', value: decodeProlink },
      { name: 'createProlinkUrl', value: createProlinkUrl },
      { name: 'VERSION', value: VERSION },
    ];

    for (const exp of exports) {
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
      addLog('error', `Wallet connection failed: ${error}`);
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

    if (!provider || !currentAccount) {
      updateTestStatus(category, 'Sign message (personal_sign)', 'skipped', 'Not connected');
      return;
    }

    try {
      updateTestStatus(category, 'Sign message (personal_sign)', 'running');
      const message = 'Hello from Base Account SDK E2E Test!';
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, currentAccount],
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
      updateTestStatus(
        category,
        'Sign message (personal_sign)',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  // Test: Pay
  const testPay = async () => {
    const category = 'Payment Features';

    try {
      updateTestStatus(category, 'pay() function', 'running');
      addLog('info', 'Testing pay() function...');
      
      const result = await base.pay({
        amount: '0.01',
        to: '0x0000000000000000000000000000000000000001',
        testnet: true,
      });

      updateTestStatus(
        category,
        'pay() function',
        'passed',
        undefined,
        `Payment ID: ${result.id}`
      );
      addLog('success', `Payment created: ${result.id}`);
    } catch (error) {
      updateTestStatus(
        category,
        'pay() function',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Payment failed: ${error}`);
    }
  };

  // Test: Subscribe
  const testSubscribe = async () => {
    const category = 'Subscription Features';

    try {
      updateTestStatus(category, 'subscribe() function', 'running');
      addLog('info', 'Testing subscribe() function...');
      
      const result = await base.subscribe({
        recurringCharge: '9.99',
        subscriptionOwner: '0x0000000000000000000000000000000000000001',
        periodInDays: 30,
        testnet: true,
      });

      updateTestStatus(
        category,
        'subscribe() function',
        'passed',
        undefined,
        `Subscription ID: ${result.id}`
      );
      addLog('success', `Subscription created: ${result.id}`);
    } catch (error) {
      updateTestStatus(
        category,
        'subscribe() function',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      addLog('error', `Subscription failed: ${error}`);
    }
  };

  // Test: Prolink Encode/Decode
  const testProlinkEncodeDecode = async () => {
    const category = 'Prolink Features';

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

      const encoded = await encodeProlink(testRequest);
      updateTestStatus(
        category,
        'encodeProlink()',
        'passed',
        undefined,
        `Encoded: ${encoded.slice(0, 30)}...`
      );
      addLog('success', `Prolink encoded: ${encoded.slice(0, 30)}...`);

      updateTestStatus(category, 'decodeProlink()', 'running');
      const decoded = await decodeProlink(encoded);
      
      if (decoded.method === 'wallet_sendCalls') {
        updateTestStatus(category, 'decodeProlink()', 'passed', undefined, 'Decoded successfully');
        addLog('success', 'Prolink decoded successfully');
      } else {
        updateTestStatus(category, 'decodeProlink()', 'failed', 'Decoded method mismatch');
      }

      updateTestStatus(category, 'createProlinkUrl()', 'running');
      const url = createProlinkUrl(encoded);
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
      addLog('error', `Prolink test failed: ${error}`);
    }
  };

  // Test: Sub-Account
  const testSubAccount = async () => {
    const category = 'Sub-Account Features';

    if (!sdk) {
      updateTestStatus(category, 'Sub-account API exists', 'skipped', 'SDK not initialized');
      return;
    }

    try {
      updateTestStatus(category, 'Sub-account API exists', 'running');
      if (
        sdk.subAccount &&
        typeof sdk.subAccount.create === 'function' &&
        typeof sdk.subAccount.get === 'function'
      ) {
        updateTestStatus(category, 'Sub-account API exists', 'passed');
        addLog('success', 'Sub-account API is available');
      } else {
        updateTestStatus(category, 'Sub-account API exists', 'failed', 'Sub-account API missing');
      }
    } catch (error) {
      updateTestStatus(
        category,
        'Sub-account API exists',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
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

    addLog('info', '🚀 Starting E2E Test Suite...');
    addLog('info', '');

    // Run tests in sequence
    await testSDKInitialization();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testConnectWallet();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testGetAccounts();
    await testGetChainId();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testSignMessage();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testPay();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testSubscribe();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testProlinkEncodeDecode();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testSubAccount();

    addLog('info', '');
    addLog('success', '✅ Test suite completed!');
    setIsRunningTests(false);

    // Show completion toast
    const passed = testCategories.reduce(
      (acc, cat) => acc + cat.tests.filter((t) => t.status === 'passed').length,
      0
    );
    const failed = testCategories.reduce(
      (acc, cat) => acc + cat.tests.filter((t) => t.status === 'failed').length,
      0
    );

    toast({
      title: 'Tests Complete',
      description: `${passed} passed, ${failed} failed`,
      status: failed > 0 ? 'warning' : 'success',
      duration: 5000,
      isClosable: true,
    });
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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box
          p={8}
          borderRadius="xl"
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          color="white"
        >
          <Heading size="xl" mb={2}>
            🧪 E2E Test Suite
          </Heading>
          <Text fontSize="lg">
            Comprehensive end-to-end tests for the Base Account SDK
          </Text>
          <Text fontSize="sm" mt={2} opacity={0.9}>
            SDK Version: {VERSION}
          </Text>
        </Box>

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
            <Heading size="md">Test Results</Heading>
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
                        <Heading size="md">{category.name}</Heading>
                        <Badge colorScheme="purple">
                          {category.tests.length} test{category.tests.length !== 1 ? 's' : ''}
                        </Badge>
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
                  <Heading size="md">Console Output</Heading>
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
  );
}

// Custom layout for this page - no app header
E2ETestPage.getLayout = function getLayout(page: React.ReactElement) {
  return page;
};

