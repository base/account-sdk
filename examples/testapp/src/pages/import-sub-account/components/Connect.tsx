import { createBaseAccountSDK } from '@base-org/account';
import { Box, Button } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

export function Connect({ sdk }: { sdk: ReturnType<typeof createBaseAccountSDK> }) {
  const [state, setState] = useState<string[]>();
  const handleConnect = useCallback(async () => {
    if (!sdk) {
      return;
    }

    const provider = sdk.getProvider();
    const response = await provider.request({
      method: 'eth_requestAccounts',
    });

    console.info('response', response);
    setState(response as string[]);
  }, [sdk]);

  useEffect(() => {
    if (!sdk) {
      return;
    }

    const provider = sdk.getProvider();
    provider.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        setState(undefined);
      } else {
        setState(accounts as string[]);
      }
    });
  }, [sdk]);

  return (
    <>
      <Button
        w="full"
        onClick={handleConnect}
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
        Connect
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
          color="gray.800"
          _dark={{ bg: 'gray.900', borderColor: 'gray.700', color: 'gray.200' }}
        >
          {JSON.stringify(state, null, 2)}
        </Box>
      )}
    </>
  );
}
