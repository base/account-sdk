import { BasePayButton, SignInWithBaseButton } from '@base-org/account-ui/react';
import { Box, Container, Grid, Heading, HStack, Link, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import NextLink from 'next/link';
import { WIDTH_2XL } from '../../components/Layout';

export default function UIDemo() {
  const systemBg = useColorModeValue("white", "black");
  const systemFg = useColorModeValue("black", "white");

  const handleSignInClick = () => {
    console.log('Sign in with Base clicked!');
    alert('Sign in with Base clicked! Check console for details.');
  };

  const handlePayClick = () => {
    console.log('Base Pay clicked!');
    alert('Base Pay clicked! Check console for details.');
  };

  return (
    <Container maxW={WIDTH_2XL}>
      {/* Navigation */}
      <Box mb={6} p={4} borderWidth={1} borderRadius="lg" bg="blue.50">
        <HStack spacing={4} align="center">
          <Link as={NextLink} href="/" color="blue.600" fontWeight="medium" _hover={{ color: "blue.800", textDecoration: "underline" }}>
            Back to the SDK Playground
          </Link>
        </HStack>
      </Box>

      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            Sign In with Base Button
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(2, 1fr)' }} gap={0}>
            <Box p={24} borderWidth={1} bg="#fafafa">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={4} fontSize="sm" color="gray.600">
                        Light, Centered, Solid
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="solid"
                        colorScheme="light"
                        align="center"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#ffffff">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600">
                        Light, Centered, Transparent
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="transparent"
                        colorScheme="light"
                        align="center"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#fafafa">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600">
                        Light, Left Aligned, Solid
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="solid"
                        colorScheme="light"
                        align="left"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#ffffff">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600">
                        Light, Left Aligned, Transparent
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="transparent"
                        colorScheme="light"
                        align="left"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#393939">
                <Box maxW="375px" align="left" m="auto">              
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="#ffffff">
                        Dark, Centered, Solid
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="solid"
                        colorScheme="dark"
                        align="center"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#000000">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="#ffffff">
                        Dark, Centered, Transparent
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="transparent"
                        colorScheme="dark"
                        align="center"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#393939">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="#ffffff">
                        Dark, Left Aligned, Solid
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="solid"
                        colorScheme="dark"
                        align="left"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg="#000000">
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="#ffffff">
                        Dark, Left Aligned, Transparent
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="transparent"
                        colorScheme="dark"
                        align="left"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg={systemBg}>
                <Box maxW="375px" align="left" m="auto">
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600">
                        System Theme, Left Aligned
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="solid"
                        colorScheme="system"
                        align="left"
                    />
                </Box>
            </Box>
            <Box p={24} borderWidth={1} bg={systemBg}>
                <Box maxW="375px" align="left" m="auto">              
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600">
                        System Theme, Centered
                    </Text>
                    <SignInWithBaseButton 
                        onClick={handleSignInClick}
                        variant="solid"
                        colorScheme="system"
                        align="center"
                    />
                </Box>
            </Box>
          </Grid>
        </Box>

        {/* Base Pay Button Section */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            Base Pay Button
          </Heading>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }}>
          <Box p={24} borderWidth={1} bg="#ffffff">
                <Box maxW="375px" align="left" m="auto"> 
                <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.600">
                    Light Mode
                </Text>
                <BasePayButton 
                    onClick={handlePayClick}
                    colorScheme="light"
                />
                </Box>
            </Box>

            <Box p={24} borderWidth={1} bg="#000000">
                <Box maxW="375px" align="left" m="auto"> 
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color="#ffffff">
                        Dark Mode
                    </Text>
                    <BasePayButton 
                        onClick={handlePayClick}
                        colorScheme="dark"
                    />
                    </Box>
            </Box>

            <Box p={24} borderWidth={1} bg={systemBg}>
                <Box maxW="375px" align="left" m="auto"> 
                    <Text fontWeight="semibold" mb={3} fontSize="sm" color={systemFg}>
                        System Theme
                    </Text>
                    <BasePayButton 
                        onClick={handlePayClick}
                        colorScheme="system"
                    />
                </Box>
            </Box>
          </Grid>
        </Box>

        {/* Developer Info */}
        <Box p={6} borderWidth={1} borderRadius="lg" bg="gray.50" mb={24}>
          <Heading size="md" mb={4} color="gray.700">
            Developer Notes
          </Heading>
          <VStack align="start" spacing={2}>
            <Text fontSize="sm">
              • Click any button to see console output and test interactions
            </Text>
            <Text fontSize="sm">
              • Buttons support light, dark, and system color schemes
            </Text>
            <Text fontSize="sm">
              • Sign In button has solid and transparent variants
            </Text>
            <Text fontSize="sm">
              • Buttons include hover and active states with smooth transitions
            </Text>
            <Text fontSize="sm">
              • All buttons are fully accessible and keyboard navigable
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 