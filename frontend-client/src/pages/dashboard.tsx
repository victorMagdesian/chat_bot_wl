import { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  VStack,
  Button,
  HStack,
  Icon,
  useColorModeValue,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { FiMessageSquare, FiUsers, FiClock, FiSend } from 'react-icons/fi';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/router';
import { useTenant } from '@/lib/tenantContext';

interface DashboardStats {
  totalMessages: number;
  activeChats: number;
  scheduledMessages: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { primaryColor } = useTenant();
  const bgColor = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [chatsResponse, scheduledResponse] = await Promise.all([
        api.get('/chats'),
        api.get('/chats/scheduled'),
      ]);

      const chats = chatsResponse.data;
      const scheduled = scheduledResponse.data;

      // Calculate stats
      const totalMessages = chats.reduce((sum: number, chat: any) => {
        return sum + (chat._count?.messages || 0);
      }, 0);

      const recentActivity = chats
        .slice(0, 5)
        .map((chat: any) => ({
          id: chat.id,
          type: 'message',
          description: `New message from ${chat.instagramUsername || 'User'}`,
          timestamp: chat.lastMessageAt,
        }));

      setStats({
        totalMessages,
        activeChats: chats.length,
        scheduledMessages: scheduled.filter((s: any) => s.status === 'pending').length,
        recentActivity,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" color={primaryColor || 'blue.500'} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <VStack spacing={8} align="stretch">
        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <HStack spacing={4}>
                <Icon
                  as={FiMessageSquare}
                  boxSize={10}
                  color={primaryColor || 'blue.500'}
                />
                <Box>
                  <StatLabel>Total Messages</StatLabel>
                  <StatNumber>{stats?.totalMessages || 0}</StatNumber>
                  <StatHelpText>All time</StatHelpText>
                </Box>
              </HStack>
            </Stat>
          </Box>

          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <HStack spacing={4}>
                <Icon
                  as={FiUsers}
                  boxSize={10}
                  color={primaryColor || 'blue.500'}
                />
                <Box>
                  <StatLabel>Active Chats</StatLabel>
                  <StatNumber>{stats?.activeChats || 0}</StatNumber>
                  <StatHelpText>Currently active</StatHelpText>
                </Box>
              </HStack>
            </Stat>
          </Box>

          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <HStack spacing={4}>
                <Icon
                  as={FiClock}
                  boxSize={10}
                  color={primaryColor || 'blue.500'}
                />
                <Box>
                  <StatLabel>Scheduled</StatLabel>
                  <StatNumber>{stats?.scheduledMessages || 0}</StatNumber>
                  <StatHelpText>Pending messages</StatHelpText>
                </Box>
              </HStack>
            </Stat>
          </Box>

          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Stat>
              <HStack spacing={4}>
                <Icon
                  as={FiSend}
                  boxSize={10}
                  color={primaryColor || 'blue.500'}
                />
                <Box>
                  <StatLabel>Response Rate</StatLabel>
                  <StatNumber>98%</StatNumber>
                  <StatHelpText>Last 30 days</StatHelpText>
                </Box>
              </HStack>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* Quick Actions */}
        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>
            Quick Actions
          </Heading>
          <HStack spacing={4} flexWrap="wrap">
            <Button
              leftIcon={<FiMessageSquare />}
              colorScheme="blue"
              bg={primaryColor || 'blue.500'}
              onClick={() => router.push('/chats')}
            >
              View Chats
            </Button>
            <Button
              leftIcon={<FiClock />}
              variant="outline"
              onClick={() => router.push('/schedules')}
            >
              Schedule Message
            </Button>
            <Button
              leftIcon={<FiUsers />}
              variant="outline"
              onClick={() => router.push('/chats')}
            >
              Manage Contacts
            </Button>
          </HStack>
        </Box>

        {/* Recent Activity */}
        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
          <Heading size="md" mb={4}>
            Recent Activity
          </Heading>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <VStack spacing={3} align="stretch">
              {stats.recentActivity.map((activity) => (
                <Box
                  key={activity.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  _hover={{ bg: 'gray.50' }}
                  cursor="pointer"
                  onClick={() => router.push(`/chats/${activity.id}`)}
                >
                  <HStack justify="space-between">
                    <Text>{activity.description}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500">No recent activity</Text>
          )}
        </Box>
      </VStack>
    </DashboardLayout>
  );
}
