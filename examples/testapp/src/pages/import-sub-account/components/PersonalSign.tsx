import { createBaseAccountSDK } from '@base-org/account';
import { Box, Button } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { toHex } from 'viem';

export function PersonalSign({
  sdk,
  subAccountAddress,
}: {
  sdk: ReturnType<typeof createBaseAccountSDK>;
  subAccountAddress: string;
}) {
  const [state, setState] = useState<string>();
  const handlePersonalSign = useCallback(async () => {
    if (!sdk) {
      return;
    }

    const provider = sdk.getProvider();
    try {
      const response = await provider.request({
        method: 'personal_sign',
        params: [toHex('Hello, world!'), subAccountAddress],
      });
      console.info('response', response);
      setState(response as string);
    } catch (e) {
      console.error('error', e);
    }
  }, [sdk, subAccountAddress]);

  return (
    <>
      <Button
        w="full"
        onClick={handlePersonalSign}
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
        Personal Sign
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
