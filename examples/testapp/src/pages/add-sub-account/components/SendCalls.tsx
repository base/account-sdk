import type { TokenPaymentSuccess } from '@base-org/account';
import { createBaseAccountSDK, payWithToken } from '@base-org/account';
import { CheckCircleIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, HStack, Icon, Link, Text, VStack } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { formatUnits } from 'viem';

// Common token symbols and decimals
const TOKEN_CONFIG: Record<string, { symbol: string; decimals: number }> = {
  '0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4': { symbol: 'USDC', decimals: 6 }, // Base USDC
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 }, // Base mainnet USDC
};

function getTokenInfo(tokenAddress: string) {
  const lowerAddress = tokenAddress.toLowerCase();
  return TOKEN_CONFIG[lowerAddress] || { symbol: 'Token', decimals: 18 };
}

function stripChainPrefix(txHash: string): string {
  // Remove chain prefix if present (e.g., "base:0x..." -> "0x...")
  return txHash.includes(':') ? txHash.split(':')[1] : txHash;
}

function getBlockExplorerUrl(chainId: number, txHash: string): string {
  const hash = stripChainPrefix(txHash);
  
  const explorers: Record<number, string> = {
    8453: 'https://basescan.org/tx', // Base mainnet
    84532: 'https://sepolia.basescan.org/tx', // Base Sepolia
  };
  
  return `${explorers[chainId] || 'https://basescan.org/tx'}/${hash}`;
}

export function SendCalls({
  sdk,
  subAccountAddress,
}: {
  sdk: ReturnType<typeof createBaseAccountSDK>;
  subAccountAddress: string;
}) {
  const [paymentResult, setPaymentResult] = useState<TokenPaymentSuccess | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayWithToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPaymentResult(null);

    try {
      // Example payment with token
      const result = await payWithToken({
        amount: '100000000000000000000', // 100 tokens (18 decimals)
        to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        token: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', // USDC on Base Sepolia
        chainId: 8453,
        paymaster: {
          url: 'https://api.developer.coinbase.com/rpc/v1/base/S-fOd2n2Oi4fl4e1Crm83XeDXZ7tkg8O',
        },
      });

      if (result.success) {
        setPaymentResult(result);
      }
    } catch (e) {
      console.error('Payment error:', e);
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <VStack spacing={4} align="stretch" w="full">
      <Button
        w="full"
        onClick={handlePayWithToken}
        isLoading={isLoading}
        loadingText="Processing..."
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
        Pay with Token
      </Button>

      {error && (
        <Box
          w="full"
          p={4}
          bg="red.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="red.200"
          _dark={{ bg: 'red.900', borderColor: 'red.700' }}
        >
          <HStack spacing={2}>
            <Text color="red.800" _dark={{ color: 'red.200' }} fontWeight="medium">
              ❌ Payment Failed
            </Text>
          </HStack>
          <Text color="red.700" _dark={{ color: 'red.300' }} fontSize="sm" mt={2}>
            {error}
          </Text>
        </Box>
      )}

      {paymentResult && (
        <Box
          w="full"
          p={6}
          bg="green.50"
          borderRadius="lg"
          border="1px solid"
          borderColor="green.200"
          _dark={{ bg: 'green.900', borderColor: 'green.700' }}
        >
          <HStack spacing={3} mb={6}>
            <Icon as={CheckCircleIcon} boxSize={6} color="green.600" _dark={{ color: 'green.400' }} />
            <Text fontSize="xl" fontWeight="bold" color="green.800" _dark={{ color: 'green.200' }}>
              Payment Successful!
            </Text>
          </HStack>

          <VStack spacing={4} align="stretch">
            {/* Amount */}
            <Box>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={1}>
                Amount
              </Text>
              <Text fontSize="lg" fontWeight="semibold" color="gray.900" _dark={{ color: 'white' }}>
                {formatUnits(
                  BigInt(paymentResult.tokenAmount),
                  getTokenInfo(paymentResult.tokenAddress).decimals
                )}{' '}
                {paymentResult.token || getTokenInfo(paymentResult.tokenAddress).symbol}
              </Text>
            </Box>

            {/* Recipient */}
            <Box>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={1}>
                Recipient
              </Text>
              <Flex align="center" gap={2}>
                <Text
                  fontSize="md"
                  fontFamily="mono"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                  title={paymentResult.to}
                >
                  {paymentResult.to}
                </Text>
              </Flex>
            </Box>

            {/* Transaction ID */}
            <Box>
              <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} mb={1}>
                Transaction ID
              </Text>
              <HStack spacing={2}>
                <Text
                  fontSize="sm"
                  fontFamily="mono"
                  color="gray.700"
                  _dark={{ color: 'gray.300' }}
                  wordBreak="break-all"
                >
                  {stripChainPrefix(paymentResult.id)}
                </Text>
              </HStack>
              <Link
                href={getBlockExplorerUrl(paymentResult.chainId, paymentResult.id)}
                isExternal
                color="blue.600"
                _dark={{ color: 'blue.400' }}
                fontSize="sm"
                mt={2}
                display="inline-flex"
                alignItems="center"
                gap={1}
                _hover={{ textDecoration: 'underline' }}
              >
                View on Block Explorer
                <ExternalLinkIcon />
              </Link>
            </Box>
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
