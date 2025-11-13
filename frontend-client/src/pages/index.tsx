import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
    >
      <Spinner size="xl" />
      <Text ml={4}>Loading...</Text>
    </Box>
  );
}
