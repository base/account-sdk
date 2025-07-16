import { createBaseAccountSDK } from '@base-org/account';
import { Box, Button } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { SmartAccount } from 'viem/account-abstraction';
import { baseSepolia } from 'viem/chains';

export function SendCalls({
  sdk,
  subAccount,
}: {
  sdk: ReturnType<typeof createBaseAccountSDK>;
  subAccount: SmartAccount;
}) {
  const [state, setState] = useState<string>();
  const handleSendCalls = useCallback(async () => {
    if (!sdk) {
      return;
    }

    const provider = sdk.getProvider();
    try {
      const response = await provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            chainId: baseSepolia.id,
            from: subAccount.address,
            calls: [],
            version: '1',
            capabilities: {
              paymasterService: {
                url: 'https://api.developer.coinbase.com/rpc/v1/base-sepolia/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
              },
            },
          },
        ],
      });
      console.info('response', response);
      setState(response as string);
    } catch (e) {
      console.error('error', e);
    }
  }, [sdk, subAccount.address]);

  return (
    <>
      <Button
        w="full"
        onClick={handleSendCalls}
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
        Send Calls
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
