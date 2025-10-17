import { decodeProlink, encodeProlink } from '@base-org/account';
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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Prolink URI Generator</Heading>
        <Text color="gray.600">
          Generate compressed, URL-safe payloads for wallet_sendCalls, wallet_sign, and generic
          JSON-RPC requests
        </Text>

        {/* Method Selection */}
        <Box borderWidth="1px" borderRadius="lg" p={6} bg={bgColor} borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Method Type</FormLabel>
              <Select
                value={methodType}
                onChange={(e) =>
                  setMethodType(e.target.value as 'wallet_sendCalls' | 'wallet_sign' | 'generic')
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
                  <Input value={callsVersion} onChange={(e) => setCallsVersion(e.target.value)} />
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
                    <Select value={signChainId} onChange={(e) => setSignChainId(e.target.value)}>
                      <option value="84532">Base Sepolia (84532)</option>
                      <option value="8453">Base (8453)</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Version</FormLabel>
                    <Input value={signVersion} onChange={(e) => setSignVersion(e.target.value)} />
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

            <Divider />

            {/* Capabilities */}
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

            <Button
              colorScheme="blue"
              size="lg"
              onClick={generateProlink}
              isLoading={loading}
              loadingText="Generating..."
            >
              Generate Prolink
            </Button>
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
