import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  useColorModeValue,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/api';
import { useTenant } from '@/lib/tenantContext';
import { useMessageSubscription } from '@/hooks/useWebSocket';

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
}

interface Chat {
  id: string;
  instagramUserId: string;
  instagramUsername: string;
  messages: Message[];
}

export default function ChatDetail() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const { primaryColor } = useTenant();
  const bgColor = useColorModeValue('white', 'gray.800');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (id) {
      fetchChat();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewMessage = useCallback((message: any) => {
    if (message.chatId === id) {
      setMessages((prev) => [...prev, message]);
    }
  }, [id]);

  useMessageSubscription(handleNewMessage);

  const fetchChat = async () => {
    try {
      const response = await api.get(`/chats/${id}`);
      setChat(response.data);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat) return;

    setSending(true);
    try {
      const response = await api.post(`/chats/${chat.id}/messages`, {
        content: newMessage,
        recipient: chat.instagramUserId,
      });

      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
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

  if (!chat) {
    return (
      <DashboardLayout>
        <Box textAlign="center" py={20}>
          <Text>Chat not found</Text>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box bg={bgColor} borderRadius="lg" boxShadow="sm" h="calc(100vh - 200px)">
        <Flex direction="column" h="full">
          {/* Chat Header */}
          <HStack p={4} borderBottomWidth={1} spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<FiArrowLeft />}
              onClick={() => router.push('/chats')}
            >
              Back
            </Button>
            <Avatar name={chat.instagramUsername || 'User'} size="sm" />
            <Text fontWeight="bold">{chat.instagramUsername || 'Unknown User'}</Text>
          </HStack>

          {/* Messages */}
          <VStack
            flex={1}
            overflow="auto"
            p={4}
            spacing={4}
            align="stretch"
          >
            {messages.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No messages yet</Text>
              </Box>
            ) : (
              messages.map((message) => {
                const isBot = message.sender === 'bot';
                return (
                  <Flex
                    key={message.id}
                    justify={isBot ? 'flex-end' : 'flex-start'}
                  >
                    <Box
                      maxW="70%"
                      bg={isBot ? primaryColor || 'blue.500' : 'gray.200'}
                      color={isBot ? 'white' : 'black'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                    >
                      <Text>{message.content}</Text>
                      <Text
                        fontSize="xs"
                        mt={1}
                        opacity={0.8}
                      >
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </Text>
                    </Box>
                  </Flex>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </VStack>

          {/* Message Input */}
          <Box p={4} borderTopWidth={1}>
            <form onSubmit={handleSendMessage}>
              <HStack spacing={2}>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                />
                <Button
                  type="submit"
                  colorScheme="blue"
                  bg={primaryColor || 'blue.500'}
                  leftIcon={<FiSend />}
                  isLoading={sending}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </HStack>
            </form>
          </Box>
        </Flex>
      </Box>
    </DashboardLayout>
  );
}
