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
  Switch,
  Select,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { botService, Bot } from '../../services/bot.service';
import { tenantService, Tenant } from '../../services/tenant.service';

export const BotList: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    loadBots();
  }, [selectedTenantId]);

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

  const loadBots = async () => {
    try {
      setIsLoading(true);
      const data = await botService.getAll(selectedTenantId || undefined);
      setBots(data);
    } catch (error: any) {
      toast({
        title: 'Error loading bots',
        description: error.response?.data?.message || 'Failed to load bots',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await botService.toggleActive(id, !currentStatus);
      toast({
        title: `Bot ${!currentStatus ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadBots();
    } catch (error: any) {
      toast({
        title: 'Error updating bot',
        description: error.response?.data?.message || 'Failed to update bot',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bot?')) {
      return;
    }

    try {
      await botService.delete(id);
      toast({
        title: 'Bot deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadBots();
    } catch (error: any) {
      toast({
        title: 'Error deleting bot',
        description: error.response?.data?.message || 'Failed to delete bot',
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
          <Heading>Bots</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => navigate('/bots/new')}
          >
            Add Bot
          </Button>
        </HStack>

        <Box mb={4}>
          <Select
            placeholder="All Tenants"
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            maxW="300px"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </Select>
        </Box>

        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Name</Th>
                <Th>Tenant</Th>
                <Th>Instagram User ID</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bots.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py={8}>
                    No bots found. Create your first bot to get started.
                  </Td>
                </Tr>
              ) : (
                bots.map((bot) => {
                  const tenant = tenants.find((t) => t.id === bot.tenantId);
                  return (
                    <Tr key={bot.id}>
                      <Td fontWeight="medium">{bot.name}</Td>
                      <Td>{tenant?.name || bot.tenantId}</Td>
                      <Td>{bot.instagramUserId || '-'}</Td>
                      <Td>
                        <HStack>
                          <Switch
                            isChecked={bot.isActive}
                            onChange={() => handleToggleActive(bot.id, bot.isActive)}
                            colorScheme="green"
                          />
                          <Badge colorScheme={bot.isActive ? 'green' : 'gray'}>
                            {bot.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td>{new Date(bot.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit bot"
                            icon={<FiEdit />}
                            size="sm"
                            onClick={() => navigate(`/bots/${bot.id}`)}
                          />
                          <IconButton
                            aria-label="Delete bot"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDelete(bot.id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </MainLayout>
  );
};
