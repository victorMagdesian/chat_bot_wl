import React from 'react';
import { Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from '../components/Layout/MainLayout';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <MainLayout>
      <Box>
        <Heading mb={6}>Dashboard</Heading>
        <Text mb={6} fontSize="lg">Welcome back, {user?.email}!</Text>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <StatLabel>Total Tenants</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Active tenants</StatHelpText>
            </Stat>
          </Box>
          
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <StatLabel>Total Bots</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Configured bots</StatHelpText>
            </Stat>
          </Box>
          
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <StatLabel>Total Messages</StatLabel>
              <StatNumber>0</StatNumber>
              <StatHelpText>Messages processed</StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>
      </Box>
    </MainLayout>
  );
};
