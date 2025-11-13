import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useColorModeValue,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/api';
import { useTenant } from '@/lib/tenantContext';

interface ScheduledMessage {
  id: string;
  recipient: string;
  content: string;
  scheduledAt: string;
  status: string;
  sentAt?: string;
  error?: string;
}

interface Chat {
  id: string;
  instagramUserId: string;
  instagramUsername: string;
}

export default function Schedules() {
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { primaryColor } = useTenant();
  const bgColor = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const [formData, setFormData] = useState({
    recipient: '',
    content: '',
    scheduledAt: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scheduledResponse, chatsResponse] = await Promise.all([
        api.get('/chats/scheduled'),
        api.get('/chats'),
      ]);
      setScheduledMessages(scheduledResponse.data);
      setChats(chatsResponse.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/chats/scheduled', {
        recipient: formData.recipient,
        content: formData.content,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
      });

      toast({
        title: 'Message scheduled',
        status: 'success',
        duration: 3000,
      });

      setFormData({ recipient: '', content: '', scheduledAt: '' });
      onClose();
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Failed to schedule message',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.delete(`/chats/scheduled/${id}`);
      toast({
        title: 'Message cancelled',
        status: 'success',
        duration: 3000,
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Failed to cancel message',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'sent':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
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
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            Scheduled Messages
          </Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            bg={primaryColor || 'blue.500'}
            onClick={onOpen}
          >
            Schedule Message
          </Button>
        </HStack>

        <Box bg={bgColor} borderRadius="lg" boxShadow="sm" overflow="hidden">
          {scheduledMessages.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color="gray.500">No scheduled messages</Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Recipient</Th>
                  <Th>Content</Th>
                  <Th>Scheduled For</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {scheduledMessages.map((message) => (
                  <Tr key={message.id}>
                    <Td>{message.recipient}</Td>
                    <Td maxW="300px" isTruncated>
                      {message.content}
                    </Td>
                    <Td>{new Date(message.scheduledAt).toLocaleString()}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(message.status)}>
                        {message.status}
                      </Badge>
                    </Td>
                    <Td>
                      {message.status === 'pending' && (
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          leftIcon={<FiTrash2 />}
                          onClick={() => handleCancel(message.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </VStack>

      {/* Schedule Message Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Message</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Recipient</FormLabel>
                  <Select
                    placeholder="Select recipient"
                    value={formData.recipient}
                    onChange={(e) =>
                      setFormData({ ...formData, recipient: e.target.value })
                    }
                  >
                    {chats.map((chat) => (
                      <option key={chat.id} value={chat.instagramUserId}>
                        {chat.instagramUsername || chat.instagramUserId}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Message</FormLabel>
                  <Textarea
                    placeholder="Enter your message"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    rows={4}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Schedule For</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    min={getMinDateTime()}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledAt: e.target.value })
                    }
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                bg={primaryColor || 'blue.500'}
                isLoading={submitting}
              >
                Schedule
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </DashboardLayout>
  );
}
