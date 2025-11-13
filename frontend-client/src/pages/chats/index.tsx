import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  useColorModeValue,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/api';
import { useRouter } from 'next/router';
import { useTenant } from '@/lib/tenantContext';
import { useWebSocket, useMessageSubscription } from '@/hooks/useWebSocket';

interface Chat {
  id: string;
  instagramUserId: string;
  instagramUsername: string;
  lastMessageAt: string;
  _count?: {
    messages: number;
  };
  messages?: Array<{
    id: string;
    content: string;
    sender: string;
    createdAt: string;
  }>;
}

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { primaryColor } = useTenant();
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const { isConnected } = useWebSocket();

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = chats.filter((chat) =>
        chat.instagramUsername?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  useMessageSubscription((_message) => {
    // Update chat list when new message arrives
    fetchChats();
  });

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
      setFilteredChats(response.data);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLastMessage = (chat: Chat) => {
    if (chat.messages && chat.messages.length > 0) {
      return chat.messages[0].content;
    }
    return 'No messages yet';
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
      <Box bg={bgColor} borderRadius="lg" boxShadow="sm" h="calc(100vh - 200px)">
        <VStack spacing={0} align="stretch" h="full">
          {/* Search Bar */}
          <Box p={4} borderBottomWidth={1}>
            <HStack justify="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="bold">
                Conversations
              </Text>
              {isConnected && (
                <Badge colorScheme="green">Connected</Badge>
              )}
            </HStack>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Box>

          {/* Chat List */}
          <VStack spacing={0} align="stretch" flex={1} overflow="auto">
            {filteredChats.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="gray.500">
                  {searchQuery ? 'No chats found' : 'No conversations yet'}
                </Text>
              </Box>
            ) : (
              filteredChats.map((chat) => (
                <Box
                  key={chat.id}
                  p={4}
                  borderBottomWidth={1}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  onClick={() => router.push(`/chats/${chat.id}`)}
                >
                  <HStack spacing={4}>
                    <Avatar
                      name={chat.instagramUsername || 'User'}
                      size="md"
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <HStack justify="space-between" w="full">
                        <Text fontWeight="bold">
                          {chat.instagramUsername || 'Unknown User'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(chat.lastMessageAt).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.600" noOfLines={1}>
                        {getLastMessage(chat)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))
            )}
          </VStack>
        </VStack>
      </Box>
    </DashboardLayout>
  );
}
