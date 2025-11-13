import { NextPageContext } from 'next';
import {
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return 'The page you are looking for does not exist.';
      case 500:
        return 'An internal server error occurred.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <Container maxW="md" centerContent py={20}>
      <VStack spacing={6}>
        <Icon as={FiAlertCircle} boxSize={20} color="orange.500" />
        <Heading size="xl">
          {statusCode ? `Error ${statusCode}` : 'Application Error'}
        </Heading>
        <Text textAlign="center" color="gray.600">
          {getErrorMessage()}
        </Text>
        <Button
          colorScheme="blue"
          onClick={() => window.location.href = '/dashboard'}
        >
          Go to Dashboard
        </Button>
      </VStack>
    </Container>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
