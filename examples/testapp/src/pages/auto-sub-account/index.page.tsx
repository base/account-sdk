import { getCryptoKeyAccount } from '@base-org/account';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { createPublicClient, http, numberToHex, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { useConfig } from '../../context/ConfigContextProvider';
import { useEIP1193Provider } from '../../context/EIP1193ProviderContextProvider';
import { unsafe_generateOrLoadPrivateKey } from '../../utils/unsafe_generateOrLoadPrivateKey';

type SignerType = 'cryptokey' | 'secp256k1';

interface WalletConnectResponse {
  accounts: Array<{
    address: string;
    capabilities?: Record<string, unknown>;
  }>;
}

export default function AutoSubAccount() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<string>();
  const [sendingAmounts, setSendingAmounts] = useState<Record<number, boolean>>({});
  const [signerType, setSignerType] = useState<SignerType>('cryptokey');
  const [walletConnectCapabilities, setWalletConnectCapabilities] = useState({
    siwe: false,
    addSubAccount: false,
  });
  const [walletConnectChainIds, setWalletConnectChainIds] = useState<string>('');
  const { subAccountsConfig, setSubAccountsConfig, config, setConfig } = useConfig();
  const { provider } = useEIP1193Provider();

  useEffect(() => {
    const stored = localStorage.getItem('signer-type');
    if (stored !== null) {
      setSignerType(stored as SignerType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('signer-type', signerType);
  }, [signerType]);

  useEffect(() => {
    const getSigner =
      signerType === 'cryptokey'
        ? getCryptoKeyAccount
        : async () => {
            // THIS IS NOT SAFE, THIS IS ONLY FOR TESTING
            // IN A REAL APP YOU SHOULD NOT STORE/EXPOSE A PRIVATE KEY
            const privateKey = unsafe_generateOrLoadPrivateKey();
            return {
              account: privateKeyToAccount(privateKey),
            };
          };

    setSubAccountsConfig((prev) => ({ ...prev, toOwnerAccount: getSigner }));
  }, [signerType, setSubAccountsConfig]);

  const handleRequestAccounts = async () => {
    if (!provider) return;

    try {
      const response = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });
      setAccounts(response as string[]);
      setLastResult(JSON.stringify(response, null, 2));
    } catch (e) {
      console.error('error', e);
      setLastResult(JSON.stringify(e, null, 2));
    }
  };

  const handleEthAccounts = async () => {
    if (!provider) return;

    try {
      const response = await provider.request({
        method: 'eth_accounts',
        params: [],
      });
      setAccounts(response as string[]);
      setLastResult(JSON.stringify(response, null, 2));
    } catch (e) {
      console.error('error', e);
      setLastResult(JSON.stringify(e, null, 2));
    }
  };

  const handleSendTransaction = async () => {
    if (!provider || !accounts.length) return;

    try {
      const response = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            value: '0x0',
            data: '0x',
          },
        ],
      });
      setLastResult(JSON.stringify(response, null, 2));
    } catch (e) {
      console.error('error', e);
      setLastResult(JSON.stringify(e, null, 2));
    }
  };

  const handleSignTypedData = async () => {
    if (!provider || !accounts.length) return;

    try {
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
        },
        primaryType: 'Person',
        domain: {
          name: 'Test Domain',
          version: '1',
          chainId: baseSepolia.id,
          verifyingContract: '0x0000000000000000000000000000000000000000' as `0x${string}`,
        },
        message: {
          name: 'Test User',
          wallet: accounts[0],
        },
      };

      const response = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [accounts[0], JSON.stringify(typedData)],
      });

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const isValid = await publicClient.verifyTypedData({
        address: accounts[0] as `0x${string}`,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
        signature: response as `0x${string}`,
      });

      setLastResult(`isValid: ${isValid}\n${response}`);
    } catch (e) {
      console.error('error', e);
      setLastResult(JSON.stringify(e, null, 2));
    }
  };

  const handleWalletConnect = async () => {
    if (!provider) return;

    let params: unknown[] = [];

    // Build params based on selected capabilities and chainIds input
    const chainIds = walletConnectChainIds
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .flatMap((v) => {
        try {
          return [numberToHex(BigInt(v))];
        } catch (_) {
          return [] as string[];
        }
      });

    if (
      walletConnectCapabilities.siwe ||
      walletConnectCapabilities.addSubAccount ||
      chainIds.length > 0
    ) {
      const capabilities: Record<string, unknown> = {};

      // Add SIWE capability if selected
      if (walletConnectCapabilities.siwe) {
        capabilities.signInWithEthereum = {
          chainId: 84532,
          nonce: Math.random().toString(36).substring(2, 15),
        };
      }

      // Add addSubAccount capability if selected
      if (walletConnectCapabilities.addSubAccount) {
        const { account: ownerAccount } = await subAccountsConfig.toOwnerAccount();
        capabilities.addSubAccount = {
          account: {
            type: 'create',
            keys: [
              {
                type: ownerAccount.address ? 'address' : 'webauthn-p256',
                publicKey: ownerAccount.address ?? ownerAccount.publicKey,
              },
            ],
          },
        };
      }

      params = [
        {
          version: '1',
          ...(chainIds.length > 0 && { chainIds }),
          ...(Object.keys(capabilities).length > 0 && { capabilities }),
        },
      ];
    }

    try {
      const response = (await provider.request({
        method: 'wallet_connect',
        params,
      })) as WalletConnectResponse;
      setLastResult(JSON.stringify(response, null, 2));
    } catch (e) {
      console.error('error', e);
      setLastResult(JSON.stringify(e, null, 2));
    }
  };

  const handleEthSend = async (amount: string) => {
    if (!provider || !accounts.length) return;

    try {
      setSendingAmounts((prev) => ({ ...prev, [amount]: true }));
      const to = '0x8d25687829d6b85d9e0020b8c89e3ca24de20a89';
      const value = parseEther(amount);

      const response = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: to,
            value: numberToHex(value),
            data: '0x',
          },
        ],
      });
      setLastResult(JSON.stringify(response, null, 2));
    } catch (e) {
      console.error('error', e);
      setLastResult(JSON.stringify(e, null, 2));
    } finally {
      setSendingAmounts((prev) => ({ ...prev, [amount]: false }));
    }
  };

  const handleAttributionDataSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setConfig({
        ...config,
        attribution: { dataSuffix: value as `0x${string}` },
      });
    } else {
      const { attribution, ...rest } = config;
      setConfig(rest);
    }
  };

  const handleAttributionModeChange = (value: string) => {
    if (value === 'auto') {
      setConfig({
        ...config,
        attribution: { auto: true },
      });
    } else if (value === 'manual') {
      setConfig({
        ...config,
        attribution: { dataSuffix: '0x' as `0x${string}` },
      });
    } else {
      const { attribution, ...restConfig } = config;
      setConfig(restConfig);
    }
  };

  const getAttributionMode = () => {
    if (!config.attribution) return 'none';
    if (config.attribution.auto) return 'auto';
    return 'manual';
  };

  return (
    <Container mb={16}>
      <Text fontSize="3xl" fontWeight="bold" mb={4}>
        Auto Sub Account
      </Text>
      <VStack w="full" spacing={4}>
        <Box w="full" textAlign="left" fontSize="lg" fontWeight="bold">
          Configuration
        </Box>
        <FormControl>
          <FormLabel>Select Signer Type</FormLabel>
          <RadioGroup value={signerType} onChange={(value: SignerType) => setSignerType(value)}>
            <Stack direction="row">
              <Radio value="cryptokey">CryptoKey</Radio>
              <Radio value="secp256k1">secp256k1</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
        <FormControl>
          <FormLabel>Auto Sub-Accounts</FormLabel>
          <RadioGroup
            value={(subAccountsConfig?.enableAutoSubAccounts || false).toString()}
            onChange={(value) =>
              setSubAccountsConfig((prev) => ({
                ...prev,
                enableAutoSubAccounts: value === 'true',
              }))
            }
          >
            <Stack direction="row">
              <Radio value="true">Enabled</Radio>
              <Radio value="false">Disabled</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
        <FormControl>
          <FormLabel>Attribution</FormLabel>
          <RadioGroup value={getAttributionMode()} onChange={handleAttributionModeChange}>
            <Stack direction="row">
              <Radio value="none">None</Radio>
              <Radio value="auto">Auto</Radio>
              <Radio value="manual">Manual</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>
        {getAttributionMode() === 'manual' && (
          <FormControl>
            <FormLabel>Attribution Data Suffix (hex)</FormLabel>
            <Input
              placeholder="0x..."
              value={config.attribution?.dataSuffix || ''}
              onChange={handleAttributionDataSuffixChange}
            />
          </FormControl>
        )}
        <FormControl>
          <FormLabel>wallet_connect Capabilities</FormLabel>
          <Stack spacing={2}>
            <Checkbox
              isChecked={walletConnectCapabilities.siwe}
              onChange={(e) =>
                setWalletConnectCapabilities((prev) => ({ ...prev, siwe: e.target.checked }))
              }
            >
              SIWE (Sign In With Ethereum)
            </Checkbox>
            <Checkbox
              isChecked={walletConnectCapabilities.addSubAccount}
              onChange={(e) =>
                setWalletConnectCapabilities((prev) => ({
                  ...prev,
                  addSubAccount: e.target.checked,
                }))
              }
            >
              Add Sub Account
            </Checkbox>
            <Box>
              <FormLabel>Chain IDs (comma separated integers)</FormLabel>
              <Input
                placeholder="e.g. 1, 8453"
                value={walletConnectChainIds}
                onChange={(e) => setWalletConnectChainIds(e.target.value)}
              />
            </Box>
          </Stack>
        </FormControl>
        {accounts.length > 0 && (
          <Box w="full">
            <Box fontSize="lg" fontWeight="bold" mb={2}>
              Connected Accounts
            </Box>
            <VStack w="full" spacing={2} align="stretch">
              {accounts.map((account) => (
                <Box
                  key={account}
                  p={3}
                  bg="gray.100"
                  borderRadius="md"
                  fontFamily="monospace"
                  fontSize="sm"
                  color="gray.800"
                  _dark={{ bg: 'gray.700', color: 'gray.200' }}
                >
                  {account}
                </Box>
              ))}
            </VStack>
          </Box>
        )}
        <Box w="full" textAlign="left" fontSize="lg" fontWeight="bold">
          RPCs
        </Box>
        <Button
          w="full"
          onClick={handleRequestAccounts}
          bg="blue.500"
          color="white"
          border="1px solid"
          borderColor="blue.500"
          _hover={{ bg: 'blue.600', borderColor: 'blue.600' }}
          _dark={{
            bg: 'blue.600',
            borderColor: 'blue.600',
            _hover: { bg: 'blue.700', borderColor: 'blue.700' },
          }}
        >
          eth_requestAccounts
        </Button>
        <Button
          w="full"
          onClick={handleEthAccounts}
          bg="blue.500"
          color="white"
          border="1px solid"
          borderColor="blue.500"
          _hover={{ bg: 'blue.600', borderColor: 'blue.600' }}
          _dark={{
            bg: 'blue.600',
            borderColor: 'blue.600',
            _hover: { bg: 'blue.700', borderColor: 'blue.700' },
          }}
        >
          eth_accounts
        </Button>
        <Button
          w="full"
          onClick={handleSendTransaction}
          isDisabled={!accounts.length}
          bg="blue.500"
          color="white"
          border="1px solid"
          borderColor="blue.500"
          _hover={{ bg: 'blue.600', borderColor: 'blue.600' }}
          _dark={{
            bg: 'blue.600',
            borderColor: 'blue.600',
            _hover: { bg: 'blue.700', borderColor: 'blue.700' },
          }}
        >
          eth_sendTransaction
        </Button>
        <Button
          w="full"
          onClick={handleSignTypedData}
          isDisabled={!accounts.length}
          bg="blue.500"
          color="white"
          border="1px solid"
          borderColor="blue.500"
          _hover={{ bg: 'blue.600', borderColor: 'blue.600' }}
          _dark={{
            bg: 'blue.600',
            borderColor: 'blue.600',
            _hover: { bg: 'blue.700', borderColor: 'blue.700' },
          }}
        >
          eth_signTypedData_v4
        </Button>
        <Button
          w="full"
          onClick={handleWalletConnect}
          bg="blue.500"
          color="white"
          border="1px solid"
          borderColor="blue.500"
          _hover={{ bg: 'blue.600', borderColor: 'blue.600' }}
          _dark={{
            bg: 'blue.600',
            borderColor: 'blue.600',
            _hover: { bg: 'blue.700', borderColor: 'blue.700' },
          }}
        >
          wallet_connect
        </Button>
        <Box w="full" textAlign="left" fontSize="lg" fontWeight="bold">
          Send
        </Box>
        <HStack w="full" spacing={4}>
          {['0.0001', '0.001', '0.01'].map((amount) => (
            <Button
              key={amount}
              flex={1}
              onClick={() => handleEthSend(amount)}
              isDisabled={!accounts.length || sendingAmounts[amount]}
              isLoading={sendingAmounts[amount]}
              loadingText="Sending..."
              size="lg"
              bg="green.500"
              color="white"
              border="1px solid"
              borderColor="green.500"
              _hover={{ bg: 'green.600', borderColor: 'green.600' }}
              _dark={{
                bg: 'green.600',
                borderColor: 'green.600',
                _hover: { bg: 'green.700', borderColor: 'green.700' },
              }}
            >
              {amount} ETH
            </Button>
          ))}
        </HStack>
        {lastResult && (
          <Box
            as="pre"
            w="full"
            p={2}
            bg="gray.50"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.300"
            overflow="auto"
            whiteSpace="pre-wrap"
            color="gray.800"
            _dark={{ bg: 'gray.900', borderColor: 'gray.700', color: 'gray.200' }}
          >
            {lastResult}
          </Box>
        )}
      </VStack>
    </Container>
  );
}
