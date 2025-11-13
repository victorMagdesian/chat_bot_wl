import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

export default function TenantError() {
  return (
    <Container maxW="md" centerContent py={20}>
      <VStack spacing={6}>
        <Icon as={FiAlertCircle} boxSize={20} color="red.500" />
        <Heading size="xl">Tenant Not Found</Heading>
        <Text textAlign="center" color="gray.600">
          The tenant domain you&apos;re trying to access doesn&apos;t exist or has been disabled.
          Please check the URL and try again.
        </Text>
        <Box>
          <Text fontSize="sm" color="gray.500" textAlign="center">
            If you believe this is an error, please contact support.
          </Text>
        </Box>
        <Button
          colorScheme="blue"
          onClick={() => window.location.href = '/'}
        >
          Go to Home
        </Button>
      </VStack>
    </Container>
  );
}
