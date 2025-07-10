import { getCryptoKeyAccount, removeCryptoKey } from '@base-org/account-sdk';
import { Box, Button } from '@chakra-ui/react';
import { useCallback, useState } from 'react';

export function GenerateNewSigner() {
  const [state, setState] = useState<string>();

  const handleGenerateNewSigner = useCallback(async () => {
    try {
      await removeCryptoKey();
      const { account } = await getCryptoKeyAccount();
      setState(account.publicKey);
    } catch (e) {
      console.error('error', e);
    }
  }, []);

  return (
    <>
      <Button
        w="full"
        onClick={handleGenerateNewSigner}
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
        Generate New Signer
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
