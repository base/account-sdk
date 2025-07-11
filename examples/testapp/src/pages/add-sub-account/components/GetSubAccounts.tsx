import { createBaseAccountSDK } from '@base-org/account-sdk';
import { Box, Button } from '@chakra-ui/react';
import { useCallback, useState } from 'react';

type GetSubAccountsProps = {
  sdk: ReturnType<typeof createBaseAccountSDK>;
};

export function GetSubAccounts({ sdk }: GetSubAccountsProps) {
  const [subAccounts, setSubAccounts] = useState<{
    subAccounts: {
      address: string;
      factory: string;
      factoryData: string;
    }[];
  }>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetSubAccounts = useCallback(async () => {
    if (!sdk) {
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      const provider = sdk.getProvider();
      const accounts = (await provider.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (accounts.length < 2) {
        throw new Error('Create a sub account first by clicking the Add Address button');
      }
      const response = await provider.request({
        method: 'wallet_getSubAccounts',
        params: [
          {
            account: accounts[1],
            domain: window.location.origin,
          },
        ],
      });

      console.info('getSubAccounts response', response);
      setSubAccounts(
        response as { subAccounts: { address: string; factory: string; factoryData: string }[] }
      );
    } catch (error) {
      console.error('Error getting sub accounts:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [sdk]);

  return (
    <>
      <Button
        w="full"
        onClick={handleGetSubAccounts}
        isLoading={isLoading}
        loadingText="Getting Sub Accounts..."
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
        Get Sub Accounts
      </Button>
      {subAccounts && (
        <Box
          as="pre"
          w="full"
          p={2}
          bg="gray.50"
          borderRadius="md"
          border="1px solid"
          borderColor="gray.300"
          color="gray.800"
          overflow="auto"
          whiteSpace="pre-wrap"
          _dark={{ bg: 'gray.900', borderColor: 'gray.700', color: 'gray.200' }}
        >
          {JSON.stringify(subAccounts, null, 2)}
        </Box>
      )}
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
          overflow="auto"
          whiteSpace="pre-wrap"
          _dark={{ bg: 'red.900', borderColor: 'red.700', color: 'red.200' }}
        >
          {error}
        </Box>
      )}
    </>
  );
}
