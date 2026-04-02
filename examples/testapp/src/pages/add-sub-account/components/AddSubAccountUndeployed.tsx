import { createBaseAccountSDK } from '@base-org/account';
import { Box, Button, Text } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { http, createPublicClient, encodeFunctionData, numberToHex, padHex } from 'viem';
import { baseSepolia } from 'viem/chains';

const factoryAddress = '0xba5ed110efdba3d005bfc882d75358acbbb85842' as const;

const factoryAbi = [
  {
    inputs: [
      { name: 'owners', type: 'bytes[]' },
      { name: 'nonce', type: 'uint256' },
    ],
    name: 'createAccount',
    outputs: [{ name: 'account', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owners', type: 'bytes[]' },
      { name: 'nonce', type: 'uint256' },
    ],
    name: 'getAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

type AddSubAccountUndeployedProps = {
  sdk: ReturnType<typeof createBaseAccountSDK>;
  onAddSubAccount: (address: string) => void;
};

export function AddSubAccountUndeployed({ sdk, onAddSubAccount }: AddSubAccountUndeployedProps) {
  const [subAccount, setSubAccount] = useState<string>();
  const [error, setError] = useState<string>();

  const handleAddSubAccount = useCallback(async () => {
    if (!sdk) {
      return;
    }

    setError(undefined);

    try {
      const provider = sdk.getProvider();

      // Get the currently connected global account address — the backend
      // validates that this address is present as an owner in the factoryData.
      const connectedAccounts = (await provider.request({
        method: 'eth_accounts',
      })) as string[];
      if (!connectedAccounts || connectedAccounts.length === 0) {
        throw new Error('No connected account found. Please connect first.');
      }
      const connectedAddress = connectedAccounts[0] as `0x${string}`;

      const ownerBytes: `0x${string}` = padHex(connectedAddress, { size: 32 });

      const owners = [ownerBytes];
      const nonce = BigInt(Math.floor(Math.random() * 1_000_000));

      // Encode the factoryData as a call to createAccount(bytes[] owners, uint256 nonce)
      const factoryData = encodeFunctionData({
        abi: factoryAbi,
        functionName: 'createAccount',
        args: [owners, nonce],
      });

      // Compute the counterfactual address via the factory's getAddress
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const address = (await publicClient.readContract({
        address: factoryAddress,
        abi: factoryAbi,
        functionName: 'getAddress',
        args: [owners, nonce],
      } as any)) as `0x${string}`;

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: numberToHex(84532) }],
      });

      const response = (await provider.request({
        method: 'wallet_addSubAccount',
        params: [
          {
            version: '1',
            account: {
              type: 'undeployed',
              address,
              factory: factoryAddress,
              factoryData,
              chainId: numberToHex(84532),
            },
          },
        ],
      })) as { address: string };

      console.info('response', response);
      setSubAccount(response.address);
      onAddSubAccount(response.address);
    } catch (e) {
      console.error('Failed to add undeployed sub account', e);
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [sdk, onAddSubAccount]);

  return (
    <>
      <Text fontWeight="medium" w="full">
        wallet_addSubAccount (undeployed)
      </Text>
      <Button
        w="full"
        onClick={handleAddSubAccount}
        bg="purple.500"
        color="white"
        border="1px solid"
        borderColor="purple.500"
        _hover={{ bg: 'purple.600', borderColor: 'purple.600' }}
        _dark={{
          bg: 'purple.600',
          borderColor: 'purple.600',
          _hover: { bg: 'purple.700', borderColor: 'purple.700' },
        }}
      >
        Add Undeployed Account
      </Button>
      {error && (
        <Box
          as="pre"
          w="full"
          p={2}
          bg="red.50"
          borderRadius="md"
          border="1px solid"
          borderColor="red.300"
          color="red.800"
          fontSize="sm"
          whiteSpace="pre-wrap"
          _dark={{ bg: 'red.900', borderColor: 'red.700', color: 'red.200' }}
        >
          {error}
        </Box>
      )}
      {subAccount && (
        <Box
          as="pre"
          w="full"
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.300"
          color="gray.800"
          _dark={{ bg: 'gray.900', borderColor: 'gray.700', color: 'gray.200' }}
        >
          {JSON.stringify(subAccount, null, 2)}
        </Box>
      )}
    </>
  );
}
