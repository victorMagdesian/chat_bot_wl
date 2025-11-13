import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  useToast,
  HStack,
  Select,
  Switch,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { automationService } from '../../services/automation.service';
import { botService, Bot } from '../../services/bot.service';

export const AutomationForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  
  const [botId, setBotId] = useState(searchParams.get('botId') || '');
  const [trigger, setTrigger] = useState('');
  const [response, setResponse] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errors, setErrors] = useState<{ botId?: string; trigger?: string; response?: string }>({});
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadBots();
    if (isEdit && id) {
      loadAutomation(id);
    }
  }, [id, isEdit]);

  const loadBots = async () => {
    try {
      const data = await botService.getAll();
      setBots(data);
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

  const loadAutomation = async (automationId: string) => {
    try {
      setIsLoadingData(true);
      const automation = await automationService.getById(automationId);
      setBotId(automation.botId);
      setTrigger(automation.trigger);
      setResponse(automation.response);
      setIsActive(automation.isActive);
      setPriority(automation.priority);
    } catch (error: any) {
      toast({
        title: 'Error loading automation',
        description: error.response?.data?.message || 'Failed to load automation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/automations');
    } finally {
      setIsLoadingData(false);
    }
  };

  const validate = () => {
    const newErrors: { botId?: string; trigger?: string; response?: string } = {};
    
    if (!botId) {
      newErrors.botId = 'Bot is required';
    }
    
    if (!trigger.trim()) {
      newErrors.trigger = 'Trigger is required';
    }
    
    if (!response.trim()) {
      newErrors.response = 'Response is required';
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
      const data = {
        botId,
        trigger,
        response,
        isActive,
        priority,
      };

      if (isEdit && id) {
        await automationService.update(id, data);
        toast({
          title: 'Automation updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await automationService.create(data);
        toast({
          title: 'Automation created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      navigate('/automations');
    } catch (error: any) {
      toast({
        title: isEdit ? 'Error updating automation' : 'Error creating automation',
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
        <Heading mb={6}>{isEdit ? 'Edit Automation' : 'Create Automation'}</Heading>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.botId}>
                <FormLabel>Bot</FormLabel>
                <Select
                  value={botId}
                  onChange={(e) => setBotId(e.target.value)}
                  placeholder="Select bot"
                  isDisabled={isEdit}
                >
                  {bots.map((bot) => (
                    <option key={bot.id} value={bot.id}>
                      {bot.name}
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{errors.botId}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.trigger}>
                <FormLabel>Trigger Keyword</FormLabel>
                <Input
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="Enter trigger keyword (e.g., hello, help, pricing)"
                />
                <FormErrorMessage>{errors.trigger}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.response}>
                <FormLabel>Response Message</FormLabel>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter the automated response message"
                  rows={5}
                />
                <FormErrorMessage>{errors.response}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Priority</FormLabel>
                <NumberInput
                  value={priority}
                  onChange={(_, value) => setPriority(value)}
                  min={0}
                  max={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
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
                  {isEdit ? 'Update Automation' : 'Create Automation'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/automations')}>
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
