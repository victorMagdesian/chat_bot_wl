import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { TenantProvider } from '@/lib/tenantContext';
import { AuthProvider } from '@/contexts/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <TenantProvider>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </TenantProvider>
    </ChakraProvider>
  );
}
