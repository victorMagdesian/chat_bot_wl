import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  HStack,
  Select,
  Switch,
  FormErrorMessage,
  Text,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { botService } from '../../services/bot.service';
import { tenantService, Tenant } from '../../services/tenant.service';

export const BotForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const [name, setName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [instagramUserId, setInstagramUserId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; tenantId?: string }>({});
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadTenants();
    if (isEdit && id) {
      loadBot(id);
    }
  }, [id, isEdit]);

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

  const loadBot = async (botId: string) => {
    try {
      setIsLoadingData(true);
      const bot = await botService.getById(botId);
      setName(bot.name);
      setTenantId(bot.tenantId);
      setInstagramUserId(bot.instagramUserId || '');
      setIsActive(bot.isActive);
    } catch (error: any) {
      toast({
        title: 'Error loading bot',
        description: error.response?.data?.message || 'Failed to load bot',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/bots');
    } finally {
      setIsLoadingData(false);
    }
  };

  const validate = () => {
    const newErrors: { name?: string; tenantId?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!tenantId) {
      newErrors.tenantId = 'Tenant is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isEdit && id) {
        const updateData = {
          name,
          instagramUserId: instagramUserId || undefined,
          accessToken: accessToken || undefined,
          isActive,
        };
        await botService.update(id, updateData);
        toast({
          title: 'Bot updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        const createData = {
          name,
          tenantId,
          instagramUserId: instagramUserId || undefined,
          accessToken: accessToken || undefined,
        };
        await botService.create(createData);
        toast({
          title: 'Bot created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      navigate('/bots');
    } catch (error: any) {
      toast({
        title: isEdit ? 'Error updating bot' : 'Error creating bot',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <MainLayout>
        <Box>Loading...</Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box maxW="600px">
        <Heading mb={6}>{isEdit ? 'Edit Bot' : 'Create Bot'}</Heading>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Bot Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter bot name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.tenantId}>
                <FormLabel>Tenant</FormLabel>
                <Select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="Select tenant"
                  isDisabled={isEdit}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.tenantId}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Instagram User ID</FormLabel>
                <Input
                  value={instagramUserId}
                  onChange={(e) => setInstagramUserId(e.target.value)}
                  placeholder="Enter Instagram user ID"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Optional: The Instagram account ID for this bot
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Instagram Access Token</FormLabel>
                <Input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter Instagram access token"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Optional: The access token will be encrypted and stored securely
                </Text>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Active</FormLabel>
                <Switch
                  isChecked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  colorScheme="green"
                />
              </FormControl>

              <HStack spacing={3} pt={4}>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isLoading}
                  loadingText={isEdit ? 'Updating...' : 'Creating...'}
                >
                  {isEdit ? 'Update Bot' : 'Create Bot'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/bots')}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>
      </Box>
    </MainLayout>
  );
};
