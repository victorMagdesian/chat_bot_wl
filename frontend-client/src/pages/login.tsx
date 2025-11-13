import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Image,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/lib/tenantContext';
import { useTenantData } from '@/hooks/useTenant';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { setTenant } = useTenant();
  const { tenant, loading: tenantLoading, error: tenantError } = useTenantData();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (tenant) {
      setTenant(tenant);
    }
  }, [tenant, setTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || 'Invalid credentials',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <Container maxW="md" centerContent py={20}>
        <Text>Loading...</Text>
      </Container>
    );
  }

  if (tenantError) {
    return (
      <Container maxW="md" centerContent py={20}>
        <Heading size="lg" mb={4}>Tenant Not Found</Heading>
        <Text color="red.500">{tenantError}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="md" centerContent py={20}>
      <Box w="full" p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <VStack spacing={6}>
          {tenant?.logoUrl && (
            <Image src={tenant.logoUrl} alt="Logo" maxH="60px" />
          )}
          <Heading size="lg">Welcome Back</Heading>
          <Text color="gray.600">Sign in to your account</Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                w="full"
                isLoading={isLoading}
                bg={tenant?.primaryColor || 'blue.500'}
                _hover={{ opacity: 0.8 }}
              >
                Sign In
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Container>
  );
}
