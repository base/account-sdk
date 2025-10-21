import {
  createProlinkForCalls,
  createProlinkForPayment,
  createProlinkForSign,
  decodeProlink,
  encodeProlink,
} from '@base-org/account';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Code,
  Container,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Input,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';

export default function ProlinkPlayground() {
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const codeBgColor = useColorModeValue('gray.50', 'gray.900');

  // Method selection
  const [methodType, setMethodType] = useState<'wallet_sendCalls' | 'wallet_sign' | 'generic'>(
    'wallet_sendCalls'
  );

  // Utility function selection
  const [utilityMode, setUtilityMode] = useState<'utilities' | 'advanced'>('utilities');

  // Utility: createProlinkForPayment fields
  const [utilPaymentRecipient, setUtilPaymentRecipient] = useState(
    '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51'
  );
  const [utilPaymentAmount, setUtilPaymentAmount] = useState('1000000'); // 1 USDC in smallest unit
  const [utilPaymentChainId, setUtilPaymentChainId] = useState('8453');
  const [utilPaymentToken, setUtilPaymentToken] = useState(
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  ); // USDC on Base
  const [utilPaymentUseToken, setUtilPaymentUseToken] = useState(true);
  const [utilPaymentFrom, setUtilPaymentFrom] = useState('');

  // Utility: createProlinkForSign fields
  const [utilSignTypedData, setUtilSignTypedData] = useState(
    JSON.stringify(
      {
        domain: {
          name: 'Test App',
          version: '1',
          chainId: 8453,
          verifyingContract: '0x1111111111111111111111111111111111111111',
        },
        types: {
          Message: [{ name: 'content', type: 'string' }],
        },
        primaryType: 'Message',
        message: { content: 'Hello World' },
      },
      null,
      2
    )
  );
  const [utilSignChainId, setUtilSignChainId] = useState('8453');

  // Utility: createProlinkForCalls fields
  const [utilCallsData, setUtilCallsData] = useState(
    JSON.stringify(
      [
        {
          to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000000f4240',
          value: '0',
        },
      ],
      null,
      2
    )
  );
  const [utilCallsChainId, setUtilCallsChainId] = useState('8453');
  const [utilCallsFrom, setUtilCallsFrom] = useState('');

  // Common fields
  const [chainId, setChainId] = useState('8453'); // Base mainnet

  // wallet_sendCalls fields
  const [callsTo, setCallsTo] = useState('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'); // USDC on Base
  const [callsData, setCallsData] = useState(
    '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000004c4b40'
  ); // ERC20 transfer
  const [callsValue, setCallsValue] = useState('0x0');
  const [callsVersion, setCallsVersion] = useState('1.0');

  // wallet_sign fields (SpendPermission example)
  const [signVersion, setSignVersion] = useState('1');
  const [signChainId, setSignChainId] = useState('84532'); // Base Sepolia
  const [spAccount, setSpAccount] = useState('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  const [spSpender, setSpSpender] = useState('0x8d9F34934dc9619e5DC3Df27D0A40b4A744E7eAa');
  const [spToken, setSpToken] = useState('0x036CbD53842c5426634e7929541eC2318f3dCF7e');
  const [spAllowance, setSpAllowance] = useState('0x2710');
  const [spPeriod, setSpPeriod] = useState('281474976710655');
  const [spStart, setSpStart] = useState('0');
  const [spEnd, setSpEnd] = useState('1914749767655');
  const [spSalt, setSpSalt] = useState(
    '0x2d6688aae9435fb91ab0a1fe7ea54ec3ffd86e8e18a0c17e1923c467dea4b75f'
  );
  const [spVerifyingContract, setSpVerifyingContract] = useState(
    '0xf85210b21cc50302f477ba56686d2019dc9b67ad'
  );

  // Generic JSON-RPC fields
  const [genericMethod, setGenericMethod] = useState('eth_sendTransaction');
  const [genericParams, setGenericParams] = useState(
    JSON.stringify(
      [
        {
          from: '0x1111111111111111111111111111111111111111',
          to: '0x2222222222222222222222222222222222222222',
          value: '0x100',
          data: '0x',
        },
      ],
      null,
      2
    )
  );

  // Capabilities
  const [useCapabilities, setUseCapabilities] = useState(false);
  const [capabilitiesJson, setCapabilitiesJson] = useState(
    JSON.stringify(
      {
        dataCallback: {
          callbackURL: 'https://example.com/callback',
          events: ['initiated', 'postSign'],
        },
      },
      null,
      2
    )
  );

  // Results
  const [loading, setLoading] = useState(false);
  const [encodedPayload, setEncodedPayload] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [decodedResult, setDecodedResult] = useState<unknown>(null);

  const generateProlink = async () => {
    setLoading(true);
    setError(null);
    setEncodedPayload('');
    setDecodedResult(null);

    try {
      let request: {
        method: string;
        params: unknown;
        chainId?: number;
        capabilities?: Record<string, unknown>;
      };

      if (methodType === 'wallet_sendCalls') {
        request = {
          method: 'wallet_sendCalls',
          params: [
            {
              version: callsVersion,
              chainId: `0x${Number.parseInt(chainId).toString(16)}`,
              calls: [
                {
                  to: callsTo,
                  data: callsData,
                  value: callsValue,
                },
              ],
            },
          ],
        };
      } else if (methodType === 'wallet_sign') {
        request = {
          method: 'wallet_sign',
          params: [
            {
              version: signVersion,
              chainId: `0x${Number.parseInt(signChainId).toString(16)}`,
              type: '0x01',
              data: {
                types: {
                  SpendPermission: [
                    { name: 'account', type: 'address' },
                    { name: 'spender', type: 'address' },
                    { name: 'token', type: 'address' },
                    { name: 'allowance', type: 'uint160' },
                    { name: 'period', type: 'uint48' },
                    { name: 'start', type: 'uint48' },
                    { name: 'end', type: 'uint48' },
                    { name: 'salt', type: 'uint256' },
                    { name: 'extraData', type: 'bytes' },
                  ],
                },
                domain: {
                  name: 'Spend Permission Manager',
                  version: '1',
                  chainId: Number.parseInt(signChainId),
                  verifyingContract: spVerifyingContract,
                },
                primaryType: 'SpendPermission',
                message: {
                  account: spAccount,
                  spender: spSpender,
                  token: spToken,
                  allowance: spAllowance,
                  period: Number.parseInt(spPeriod),
                  start: Number.parseInt(spStart),
                  end: Number.parseInt(spEnd),
                  salt: spSalt,
                  extraData: '0x',
                },
              },
            },
          ],
        };
      } else {
        // generic
        request = {
          method: genericMethod,
          params: JSON.parse(genericParams),
          chainId: Number.parseInt(chainId),
        };
      }

      // Add capabilities if enabled
      if (useCapabilities) {
        try {
          request.capabilities = JSON.parse(capabilitiesJson);
        } catch (e) {
          throw new Error(
            `Invalid capabilities JSON: ${e instanceof Error ? e.message : 'unknown'}`
          );
        }
      }

      // Encode the prolink
      const payload = await encodeProlink(request);
      setEncodedPayload(payload);

      // Decode to verify
      const decoded = await decodeProlink(payload);
      setDecodedResult(decoded);

      toast({
        title: 'Prolink generated!',
        description: `Payload size: ${payload.length} characters`,
        status: 'success',
        duration: 3000,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error generating prolink',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(encodedPayload);
    toast({
      title: 'Copied!',
      description: 'Payload copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  const generateUtilityProlink = async (utilType: 'payment' | 'sign' | 'calls') => {
    setLoading(true);
    setError(null);
    setEncodedPayload('');
    setDecodedResult(null);

    try {
      let uri: string;

      if (utilType === 'payment') {
        const options: Parameters<typeof createProlinkForPayment>[0] = {
          recipient: utilPaymentRecipient as `0x${string}`,
          amount: BigInt(utilPaymentAmount),
          chainId: Number.parseInt(utilPaymentChainId),
        };

        if (utilPaymentUseToken && utilPaymentToken) {
          options.token = utilPaymentToken as `0x${string}`;
        }

        if (utilPaymentFrom) {
          options.from = utilPaymentFrom as `0x${string}`;
        }

        if (useCapabilities) {
          try {
            options.capabilities = JSON.parse(capabilitiesJson);
          } catch (e) {
            throw new Error(
              `Invalid capabilities JSON: ${e instanceof Error ? e.message : 'unknown'}`
            );
          }
        }

        uri = await createProlinkForPayment(options);
      } else if (utilType === 'sign') {
        const typedData = JSON.parse(utilSignTypedData);
        const options: Parameters<typeof createProlinkForSign>[0] = {
          typedData,
          chainId: Number.parseInt(utilSignChainId),
        };

        if (useCapabilities) {
          try {
            options.capabilities = JSON.parse(capabilitiesJson);
          } catch (e) {
            throw new Error(
              `Invalid capabilities JSON: ${e instanceof Error ? e.message : 'unknown'}`
            );
          }
        }

        uri = await createProlinkForSign(options);
      } else {
        // calls
        const calls = JSON.parse(utilCallsData).map((call: { value?: string }) => ({
          ...call,
          value: call.value ? BigInt(call.value) : undefined,
        }));

        const options: Parameters<typeof createProlinkForCalls>[0] = {
          calls,
          chainId: Number.parseInt(utilCallsChainId),
        };

        if (utilCallsFrom) {
          options.from = utilCallsFrom as `0x${string}`;
        }

        if (useCapabilities) {
          try {
            options.capabilities = JSON.parse(capabilitiesJson);
          } catch (e) {
            throw new Error(
              `Invalid capabilities JSON: ${e instanceof Error ? e.message : 'unknown'}`
            );
          }
        }

        uri = await createProlinkForCalls(options);
      }

      setEncodedPayload(uri);

      // Decode to verify
      const decoded = await decodeProlink(uri);
      setDecodedResult(decoded);

      toast({
        title: 'Prolink generated!',
        description: `Payload size: ${uri.length} characters`,
        status: 'success',
        duration: 3000,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error generating prolink',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Prolink URI Generator</Heading>
        <Text color="gray.600">
          Generate compressed, URL-safe payloads for wallet_sendCalls, wallet_sign, and generic
          JSON-RPC requests
        </Text>

        {/* Utility Functions Quick Demo */}
        <Box borderWidth="1px" borderRadius="lg" p={6} bg={bgColor} borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <Heading size="md">Quick Start: Utility Functions</Heading>
            <Text fontSize="sm" color="gray.600">
              Use these high-level utilities for common use cases. They handle all the complexity
              internally.
            </Text>

            <Tabs size="sm">
              <TabList>
                <Tab>Payment (ERC20/Native)</Tab>
                <Tab>Sign (EIP-712)</Tab>
                <Tab>Generic Calls</Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="sm">
                      createProlinkForPayment()
                    </Text>
                    <Code
                      p={3}
                      bg={codeBgColor}
                      borderRadius="md"
                      fontSize="xs"
                      whiteSpace="pre"
                      display="block"
                    >
                      {`// Native transfer (ETH)
const uri = await createProlinkForPayment({
  recipient: '0xFe21...6e51',
  amount: 100000000000000000n, // 0.1 ETH
  chainId: 8453,
});

// ERC20 transfer (USDC)
const uri = await createProlinkForPayment({
  token: '0x8335...2913', // USDC
  recipient: '0xFe21...6e51',
  amount: 1000000n, // 1 USDC
  chainId: 8453,
});`}
                    </Code>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const uri = await createProlinkForPayment({
                            token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                            recipient: '0xFe21034794A5a574B94fE4fDfD16e005F1C96e51',
                            amount: BigInt(1000000),
                            chainId: 8453,
                          });
                          setEncodedPayload(uri);
                          const decoded = await decodeProlink(uri);
                          setDecodedResult(decoded);
                          toast({
                            title: 'Generated!',
                            description: 'USDC payment prolink created',
                            status: 'success',
                            duration: 2000,
                          });
                        } catch (e) {
                          toast({
                            title: 'Error',
                            description: e instanceof Error ? e.message : 'Unknown error',
                            status: 'error',
                            duration: 3000,
                          });
                        }
                      }}
                    >
                      Try It: Generate USDC Payment
                    </Button>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="sm">
                      createProlinkForSign()
                    </Text>
                    <Code
                      p={3}
                      bg={codeBgColor}
                      borderRadius="md"
                      fontSize="xs"
                      whiteSpace="pre"
                      display="block"
                    >
                      {`const uri = await createProlinkForSign({
  typedData: {
    domain: {
      name: 'MyApp',
      version: '1',
      chainId: 8453,
      verifyingContract: '0x...',
    },
    types: {
      Message: [
        { name: 'content', type: 'string' }
      ],
    },
    primaryType: 'Message',
    message: { content: 'Hello' },
  },
  chainId: 8453,
});`}
                    </Code>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const uri = await createProlinkForSign({
                            typedData: {
                              domain: {
                                name: 'Test App',
                                version: '1',
                                chainId: 8453,
                                verifyingContract: '0x1111111111111111111111111111111111111111',
                              },
                              types: {
                                Message: [{ name: 'content', type: 'string' }],
                              },
                              primaryType: 'Message',
                              message: { content: 'Hello World' },
                            },
                            chainId: 8453,
                          });
                          setEncodedPayload(uri);
                          const decoded = await decodeProlink(uri);
                          setDecodedResult(decoded);
                          toast({
                            title: 'Generated!',
                            description: 'Signature request prolink created',
                            status: 'success',
                            duration: 2000,
                          });
                        } catch (e) {
                          toast({
                            title: 'Error',
                            description: e instanceof Error ? e.message : 'Unknown error',
                            status: 'error',
                            duration: 3000,
                          });
                        }
                      }}
                    >
                      Try It: Generate Signature Request
                    </Button>
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    <Text fontWeight="bold" fontSize="sm">
                      createProlinkForCalls()
                    </Text>
                    <Code
                      p={3}
                      bg={codeBgColor}
                      borderRadius="md"
                      fontSize="xs"
                      whiteSpace="pre"
                      display="block"
                    >
                      {`const uri = await createProlinkForCalls({
  calls: [
    {
      to: '0x...',
      data: '0xa9059cbb...',
      value: 0n,
    },
  ],
  chainId: 8453,
});`}
                    </Code>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const uri = await createProlinkForCalls({
                            calls: [
                              {
                                to: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                                data: '0xa9059cbb000000000000000000000000fe21034794a5a574b94fe4fdfd16e005f1c96e5100000000000000000000000000000000000000000000000000000000000f4240',
                                value: BigInt(0),
                              },
                            ],
                            chainId: 8453,
                          });
                          setEncodedPayload(uri);
                          const decoded = await decodeProlink(uri);
                          setDecodedResult(decoded);
                          toast({
                            title: 'Generated!',
                            description: 'Generic calls prolink created',
                            status: 'success',
                            duration: 2000,
                          });
                        } catch (e) {
                          toast({
                            title: 'Error',
                            description: e instanceof Error ? e.message : 'Unknown error',
                            status: 'error',
                            duration: 3000,
                          });
                        }
                      }}
                    >
                      Try It: Generate Generic Calls
                    </Button>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>

        {/* Mode Selection */}
        <Box borderWidth="1px" borderRadius="lg" p={6} bg={bgColor} borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Generation Mode</FormLabel>
              <Select
                value={utilityMode}
                onChange={(e) => setUtilityMode(e.target.value as 'utilities' | 'advanced')}
                size="lg"
              >
                <option value="utilities">🚀 Utilities (Simple)</option>
                <option value="advanced">⚙️ Advanced (Full Control)</option>
              </Select>
              <Text fontSize="xs" color="gray.500" mt={2}>
                {utilityMode === 'utilities'
                  ? 'Use high-level utility functions for common use cases'
                  : 'Manually construct JSON-RPC requests with full control'}
              </Text>
            </FormControl>

            <Divider />

            {utilityMode === 'utilities' ? (
              // Utility Functions Mode
              <Tabs>
                <TabList>
                  <Tab>Payment</Tab>
                  <Tab>Sign</Tab>
                  <Tab>Calls</Tab>
                </TabList>

                <TabPanels>
                  {/* Payment Utility */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">createProlinkForPayment()</Heading>
                      <FormControl>
                        <FormLabel>Chain ID</FormLabel>
                        <Select
                          value={utilPaymentChainId}
                          onChange={(e) => setUtilPaymentChainId(e.target.value)}
                        >
                          <option value="8453">Base (8453)</option>
                          <option value="84532">Base Sepolia (84532)</option>
                          <option value="1">Ethereum (1)</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Recipient Address</FormLabel>
                        <Input
                          fontFamily="mono"
                          value={utilPaymentRecipient}
                          onChange={(e) => setUtilPaymentRecipient(e.target.value)}
                          placeholder="0x..."
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Amount (in smallest unit - wei/token units)</FormLabel>
                        <Input
                          fontFamily="mono"
                          value={utilPaymentAmount}
                          onChange={(e) => setUtilPaymentAmount(e.target.value)}
                          placeholder="1000000"
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          For USDC (6 decimals): 1000000 = 1 USDC. For ETH (18 decimals):
                          1000000000000000000 = 1 ETH
                        </Text>
                      </FormControl>
                      <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">ERC20 Transfer (vs Native)</FormLabel>
                        <input
                          type="checkbox"
                          checked={utilPaymentUseToken}
                          onChange={(e) => setUtilPaymentUseToken(e.target.checked)}
                        />
                      </FormControl>
                      {utilPaymentUseToken && (
                        <FormControl>
                          <FormLabel>Token Address</FormLabel>
                          <Input
                            fontFamily="mono"
                            value={utilPaymentToken}
                            onChange={(e) => setUtilPaymentToken(e.target.value)}
                            placeholder="0x..."
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            USDC on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
                          </Text>
                        </FormControl>
                      )}
                      <FormControl>
                        <FormLabel>From Address (optional)</FormLabel>
                        <Input
                          fontFamily="mono"
                          value={utilPaymentFrom}
                          onChange={(e) => setUtilPaymentFrom(e.target.value)}
                          placeholder="0x... (optional)"
                        />
                      </FormControl>
                      <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={() => generateUtilityProlink('payment')}
                        isLoading={loading}
                        loadingText="Generating..."
                      >
                        Generate Payment Prolink
                      </Button>
                    </VStack>
                  </TabPanel>

                  {/* Sign Utility */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">createProlinkForSign()</Heading>
                      <FormControl>
                        <FormLabel>Chain ID</FormLabel>
                        <Select
                          value={utilSignChainId}
                          onChange={(e) => setUtilSignChainId(e.target.value)}
                        >
                          <option value="8453">Base (8453)</option>
                          <option value="84532">Base Sepolia (84532)</option>
                          <option value="1">Ethereum (1)</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Typed Data (EIP-712 JSON)</FormLabel>
                        <Textarea
                          fontFamily="mono"
                          value={utilSignTypedData}
                          onChange={(e) => setUtilSignTypedData(e.target.value)}
                          rows={15}
                          placeholder='{ "domain": { ... }, "types": { ... }, "message": { ... } }'
                        />
                      </FormControl>
                      <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={() => generateUtilityProlink('sign')}
                        isLoading={loading}
                        loadingText="Generating..."
                      >
                        Generate Sign Prolink
                      </Button>
                    </VStack>
                  </TabPanel>

                  {/* Calls Utility */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Heading size="sm">createProlinkForCalls()</Heading>
                      <FormControl>
                        <FormLabel>Chain ID</FormLabel>
                        <Select
                          value={utilCallsChainId}
                          onChange={(e) => setUtilCallsChainId(e.target.value)}
                        >
                          <option value="8453">Base (8453)</option>
                          <option value="84532">Base Sepolia (84532)</option>
                          <option value="1">Ethereum (1)</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Calls Array (JSON)</FormLabel>
                        <Textarea
                          fontFamily="mono"
                          value={utilCallsData}
                          onChange={(e) => setUtilCallsData(e.target.value)}
                          rows={10}
                          placeholder='[{ "to": "0x...", "data": "0x...", "value": "0" }]'
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          value should be a string representing the amount in wei
                        </Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>From Address (optional)</FormLabel>
                        <Input
                          fontFamily="mono"
                          value={utilCallsFrom}
                          onChange={(e) => setUtilCallsFrom(e.target.value)}
                          placeholder="0x... (optional)"
                        />
                      </FormControl>
                      <Button
                        colorScheme="blue"
                        size="lg"
                        onClick={() => generateUtilityProlink('calls')}
                        isLoading={loading}
                        loadingText="Generating..."
                      >
                        Generate Calls Prolink
                      </Button>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            ) : (
              // Advanced Mode (original functionality)
              <>
                <FormControl>
                  <FormLabel>Method Type</FormLabel>
                  <Select
                    value={methodType}
                    onChange={(e) =>
                      setMethodType(
                        e.target.value as 'wallet_sendCalls' | 'wallet_sign' | 'generic'
                      )
                    }
                    size="lg"
                  >
                    <option value="wallet_sendCalls">wallet_sendCalls (EIP-5792)</option>
                    <option value="wallet_sign">wallet_sign (EIP-7871)</option>
                    <option value="generic">Generic JSON-RPC</option>
                  </Select>
                </FormControl>

                <Divider />

                {/* Method-specific fields */}
                {methodType === 'wallet_sendCalls' && (
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">wallet_sendCalls Parameters</Heading>
                    <FormControl>
                      <FormLabel>Chain ID</FormLabel>
                      <Select value={chainId} onChange={(e) => setChainId(e.target.value)}>
                        <option value="8453">Base (8453)</option>
                        <option value="84532">Base Sepolia (84532)</option>
                        <option value="1">Ethereum (1)</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Version</FormLabel>
                      <Input
                        value={callsVersion}
                        onChange={(e) => setCallsVersion(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>To Address</FormLabel>
                      <Input
                        fontFamily="mono"
                        value={callsTo}
                        onChange={(e) => setCallsTo(e.target.value)}
                        placeholder="0x..."
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Data (hex)</FormLabel>
                      <Textarea
                        fontFamily="mono"
                        value={callsData}
                        onChange={(e) => setCallsData(e.target.value)}
                        placeholder="0x..."
                        rows={3}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Value (hex)</FormLabel>
                      <Input
                        fontFamily="mono"
                        value={callsValue}
                        onChange={(e) => setCallsValue(e.target.value)}
                        placeholder="0x0"
                      />
                    </FormControl>
                  </VStack>
                )}

                {methodType === 'wallet_sign' && (
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">wallet_sign Parameters (SpendPermission)</Heading>
                    <HStack spacing={4}>
                      <FormControl>
                        <FormLabel>Chain ID</FormLabel>
                        <Select
                          value={signChainId}
                          onChange={(e) => setSignChainId(e.target.value)}
                        >
                          <option value="84532">Base Sepolia (84532)</option>
                          <option value="8453">Base (8453)</option>
                        </Select>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Version</FormLabel>
                        <Input
                          value={signVersion}
                          onChange={(e) => setSignVersion(e.target.value)}
                        />
                      </FormControl>
                    </HStack>

                    <Accordion allowToggle>
                      <AccordionItem>
                        <h2>
                          <AccordionButton>
                            <Box flex="1" textAlign="left" fontWeight="semibold">
                              SpendPermission Fields
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <VStack spacing={3} align="stretch">
                            <FormControl>
                              <FormLabel fontSize="sm">Account</FormLabel>
                              <Input
                                size="sm"
                                fontFamily="mono"
                                value={spAccount}
                                onChange={(e) => setSpAccount(e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm">Spender</FormLabel>
                              <Input
                                size="sm"
                                fontFamily="mono"
                                value={spSpender}
                                onChange={(e) => setSpSpender(e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm">Token</FormLabel>
                              <Input
                                size="sm"
                                fontFamily="mono"
                                value={spToken}
                                onChange={(e) => setSpToken(e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm">Allowance (hex)</FormLabel>
                              <Input
                                size="sm"
                                fontFamily="mono"
                                value={spAllowance}
                                onChange={(e) => setSpAllowance(e.target.value)}
                              />
                            </FormControl>
                            <HStack>
                              <FormControl>
                                <FormLabel fontSize="sm">Period</FormLabel>
                                <Input
                                  size="sm"
                                  value={spPeriod}
                                  onChange={(e) => setSpPeriod(e.target.value)}
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">Start</FormLabel>
                                <Input
                                  size="sm"
                                  value={spStart}
                                  onChange={(e) => setSpStart(e.target.value)}
                                />
                              </FormControl>
                              <FormControl>
                                <FormLabel fontSize="sm">End</FormLabel>
                                <Input
                                  size="sm"
                                  value={spEnd}
                                  onChange={(e) => setSpEnd(e.target.value)}
                                />
                              </FormControl>
                            </HStack>
                            <FormControl>
                              <FormLabel fontSize="sm">Salt</FormLabel>
                              <Input
                                size="sm"
                                fontFamily="mono"
                                value={spSalt}
                                onChange={(e) => setSpSalt(e.target.value)}
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel fontSize="sm">Verifying Contract</FormLabel>
                              <Input
                                size="sm"
                                fontFamily="mono"
                                value={spVerifyingContract}
                                onChange={(e) => setSpVerifyingContract(e.target.value)}
                              />
                            </FormControl>
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  </VStack>
                )}

                {methodType === 'generic' && (
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm">Generic JSON-RPC Parameters</Heading>
                    <FormControl>
                      <FormLabel>Chain ID</FormLabel>
                      <Input
                        type="number"
                        value={chainId}
                        onChange={(e) => setChainId(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Method</FormLabel>
                      <Input
                        value={genericMethod}
                        onChange={(e) => setGenericMethod(e.target.value)}
                        placeholder="eth_sendTransaction"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Params (JSON)</FormLabel>
                      <Textarea
                        fontFamily="mono"
                        value={genericParams}
                        onChange={(e) => setGenericParams(e.target.value)}
                        rows={10}
                        placeholder='[{ "from": "0x...", "to": "0x...", "value": "0x100" }]'
                      />
                    </FormControl>
                  </VStack>
                )}

                <Button
                  colorScheme="blue"
                  size="lg"
                  onClick={generateProlink}
                  isLoading={loading}
                  loadingText="Generating..."
                >
                  Generate Prolink
                </Button>
              </>
            )}

            {/* Capabilities - shared between both modes */}
            <Accordion allowToggle>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left" fontWeight="semibold">
                      Capabilities (Optional)
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <VStack spacing={4} align="stretch">
                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb="0">Include Capabilities</FormLabel>
                      <input
                        type="checkbox"
                        checked={useCapabilities}
                        onChange={(e) => setUseCapabilities(e.target.checked)}
                      />
                    </FormControl>
                    {useCapabilities && (
                      <FormControl>
                        <FormLabel>Capabilities JSON</FormLabel>
                        <Textarea
                          fontFamily="mono"
                          value={capabilitiesJson}
                          onChange={(e) => setCapabilitiesJson(e.target.value)}
                          rows={8}
                        />
                      </FormControl>
                    )}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </Box>

        {/* Results */}
        {(encodedPayload || error) && (
          <Box borderWidth="1px" borderRadius="lg" p={6} bg={bgColor} borderColor={borderColor}>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Results</Heading>

              {error && (
                <Box p={4} bg="red.50" borderRadius="md" borderColor="red.200" borderWidth="1px">
                  <Text color="red.700" fontWeight="bold">
                    Error:
                  </Text>
                  <Text color="red.600" mt={2}>
                    {error}
                  </Text>
                </Box>
              )}

              {encodedPayload && (
                <Tabs>
                  <TabList>
                    <Tab>Encoded Payload</Tab>
                    <Tab>Decoded Result</Tab>
                  </TabList>

                  <TabPanels>
                    {/* Encoded Payload Tab */}
                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <HStack>
                          <Text fontWeight="bold">Payload Length:</Text>
                          <Text>{encodedPayload.length} characters</Text>
                          <Button size="sm" onClick={copyToClipboard}>
                            Copy
                          </Button>
                        </HStack>
                        <Box p={4} bg={codeBgColor} borderRadius="md" overflowX="auto">
                          <Code display="block" whiteSpace="pre-wrap" wordBreak="break-all">
                            {encodedPayload}
                          </Code>
                        </Box>
                      </VStack>
                    </TabPanel>

                    {/* Decoded Result Tab */}
                    <TabPanel>
                      <Box p={4} bg={codeBgColor} borderRadius="md" overflowX="auto">
                        <Code display="block" whiteSpace="pre" fontSize="sm">
                          {JSON.stringify(decodedResult, null, 2)}
                        </Code>
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
