import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Spinner,
  Center,
  HStack,
  Badge,
  Select,
  Text,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { automationService, Automation } from '../../services/automation.service';
import { botService, Bot } from '../../services/bot.service';

export const AutomationList: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadBots();
  }, []);

  useEffect(() => {
    if (selectedBotId) {
      loadAutomations();
    } else {
      setAutomations([]);
    }
  }, [selectedBotId]);

  const loadBots = async () => {
    try {
      const data = await botService.getAll();
      setBots(data);
      if (data.length > 0) {
        setSelectedBotId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading bots',
        description: error.response?.data?.message || 'Failed to load bots',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadAutomations = async () => {
    try {
      setIsLoading(true);
      const data = await automationService.getAll(selectedBotId);
      // Sort by priority
      const sorted = data.sort((a, b) => b.priority - a.priority);
      setAutomations(sorted);
    } catch (error: any) {
      toast({
        title: 'Error loading automations',
        description: error.response?.data?.message || 'Failed to load automations',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this automation?')) {
      return;
    }

    try {
      await automationService.delete(id);
      toast({
        title: 'Automation deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadAutomations();
    } catch (error: any) {
      toast({
        title: 'Error deleting automation',
        description: error.response?.data?.message || 'Failed to delete automation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePriorityChange = async (id: string, direction: 'up' | 'down') => {
    const automation = automations.find((a) => a.id === id);
    if (!automation) return;

    const newPriority = direction === 'up' ? automation.priority + 1 : automation.priority - 1;

    try {
      await automationService.update(id, { priority: newPriority });
      loadAutomations();
    } catch (error: any) {
      toast({
        title: 'Error updating priority',
        description: error.response?.data?.message || 'Failed to update priority',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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
        <HStack justify="space-between" mb={6}>
          <Heading>Automations</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => navigate(`/automations/new?botId=${selectedBotId}`)}
            isDisabled={!selectedBotId}
          >
            Add Automation
          </Button>
        </HStack>

        <Box mb={4}>
          <Select
            placeholder="Select a bot"
            value={selectedBotId}
            onChange={(e) => setSelectedBotId(e.target.value)}
            maxW="300px"
          >
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name}
              </option>
            ))}
          </Select>
        </Box>

        {!selectedBotId ? (
          <Box bg="white" p={8} borderRadius="lg" boxShadow="sm" textAlign="center">
            <Text color="gray.600">Please select a bot to view its automations</Text>
          </Box>
        ) : (
          <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Priority</Th>
                  <Th>Trigger</Th>
                  <Th>Response</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {automations.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center" py={8}>
                      No automations found. Create your first automation to get started.
                    </Td>
                  </Tr>
                ) : (
                  automations.map((automation) => (
                    <Tr key={automation.id}>
                      <Td>
                        <HStack>
                          <Text fontWeight="medium">{automation.priority}</Text>
                          <IconButton
                            aria-label="Increase priority"
                            icon={<FiArrowUp />}
                            size="xs"
                            variant="ghost"
                            onClick={() => handlePriorityChange(automation.id, 'up')}
                          />
                          <IconButton
                            aria-label="Decrease priority"
                            icon={<FiArrowDown />}
                            size="xs"
                            variant="ghost"
                            onClick={() => handlePriorityChange(automation.id, 'down')}
                          />
                        </HStack>
                      </Td>
                      <Td fontWeight="medium">{automation.trigger}</Td>
                      <Td maxW="300px" isTruncated>
                        {automation.response}
                      </Td>
                      <Td>
                        <Badge colorScheme={automation.isActive ? 'green' : 'gray'}>
                          {automation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit automation"
                            icon={<FiEdit />}
                            size="sm"
                            onClick={() => navigate(`/automations/${automation.id}`)}
                          />
                          <IconButton
                            aria-label="Delete automation"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDelete(automation.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
    </MainLayout>
  );
};
