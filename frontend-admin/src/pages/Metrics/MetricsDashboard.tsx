import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Center,
  HStack,
  Select,
  Button,
} from '@chakra-ui/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '../../components/Layout/MainLayout';
import { metricsService, Metrics } from '../../services/metrics.service';
import { tenantService, Tenant } from '../../services/tenant.service';

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('30');
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [selectedTenantId, dateRange]);

  const loadTenants = async () => {
    try {
      const data = await tenantService.getAll();
      setTenants(data);
    } catch (error: any) {
      toast({
        title: 'Error loading tenants',
        description: error.response?.data?.message || 'Failed to load tenants',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = {
        tenantId: selectedTenantId || undefined,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const data = await metricsService.getMetrics(params);
      setMetrics(data);
    } catch (error: any) {
      toast({
        title: 'Error loading metrics',
        description: error.response?.data?.message || 'Failed to load metrics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for charts (in production, this would come from the API)
  const messageData = [
    { date: 'Mon', messages: 45 },
    { date: 'Tue', messages: 52 },
    { date: 'Wed', messages: 38 },
    { date: 'Thu', messages: 65 },
    { date: 'Fri', messages: 58 },
    { date: 'Sat', messages: 42 },
    { date: 'Sun', messages: 35 },
  ];

  const responseTimeData = [
    { date: 'Mon', time: 2.3 },
    { date: 'Tue', time: 1.8 },
    { date: 'Wed', time: 2.1 },
    { date: 'Thu', time: 1.5 },
    { date: 'Fri', time: 2.0 },
    { date: 'Sat', time: 1.9 },
    { date: 'Sun', time: 2.2 },
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <Center h="400px">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        <Heading mb={6}>Metrics Dashboard</Heading>

        <HStack mb={6} spacing={4}>
          <Select
            placeholder="All Tenants"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            maxW="250px"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </Select>

          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            maxW="200px"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>

          <Button onClick={loadMetrics} colorScheme="blue">
            Refresh
          </Button>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <StatLabel>Total Messages</StatLabel>
              <StatNumber>{metrics?.totalMessages || 0}</StatNumber>
              <StatHelpText>
                Last {dateRange} days
              </StatHelpText>
            </Stat>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <StatLabel>Active Chats</StatLabel>
              <StatNumber>{metrics?.activeChats || 0}</StatNumber>
              <StatHelpText>
                Currently active
              </StatHelpText>
            </Stat>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <StatLabel>Avg Response Time</StatLabel>
              <StatNumber>{metrics?.averageResponseTime?.toFixed(2) || 0}s</StatNumber>
              <StatHelpText>
                Average response time
              </StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>
              Messages Over Time
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={messageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="messages" fill="#3182CE" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4}>
              Response Time Trend
            </Heading>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" stroke="#38A169" name="Response Time (s)" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </SimpleGrid>
      </Box>
    </MainLayout>
  );
};
