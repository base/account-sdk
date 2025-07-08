import { createBaseAccountSDK } from '@base/account-sdk';
import { Box, Button } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { Client, createPublicClient, http } from 'viem';
import { SmartAccount, createBundlerClient, createPaymasterClient } from 'viem/account-abstraction';
import { baseSepolia } from 'viem/chains';

export function DeploySubAccount({
  sdk,
  subAccount,
}: {
  sdk: ReturnType<typeof createBaseAccountSDK>;
  subAccount: SmartAccount;
}) {
  const [state, setState] = useState<string>();

  const handleDeploySubAccount = useCallback(async () => {
    if (!sdk) {
      return;
    }

    try {
      const client = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });
      const paymasterClient = createPaymasterClient({
        transport: http(
          'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O'
        ),
      });
      const bundlerClient = createBundlerClient({
        account: subAccount,
        client: client as Client,
        transport: http(
          'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O'
        ),
        paymaster: paymasterClient,
      });

      // @ts-ignore
      const hash = await bundlerClient.sendUserOperation({
        calls: [],
      });

      console.info('response', hash);
      setState(hash as string);
    } catch (e) {
      console.error('error', e);
    }
  }, [sdk, subAccount]);

  return (
    <>
      <Button
        w="full"
        onClick={handleDeploySubAccount}
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
        Deploy SubAccount
      </Button>
      {state && (
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
          {JSON.stringify(state, null, 2)}
        </Box>
      )}
    </>
  );
}
