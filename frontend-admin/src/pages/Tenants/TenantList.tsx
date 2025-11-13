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
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { tenantService, Tenant } from '../../services/tenant.service';

export const TenantList: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) {
      return;
    }

    try {
      await tenantService.delete(id);
      toast({
        title: 'Tenant deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadTenants();
    } catch (error: any) {
      toast({
        title: 'Error deleting tenant',
        description: error.response?.data?.message || 'Failed to delete tenant',
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
          <Heading>Tenants</Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => navigate('/tenants/new')}
          >
            Add Tenant
          </Button>
        </HStack>

        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Name</Th>
                <Th>Domain</Th>
                <Th>Primary Color</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tenants.length === 0 ? (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8}>
                    No tenants found. Create your first tenant to get started.
                  </Td>
                </Tr>
              ) : (
                tenants.map((tenant) => (
                  <Tr key={tenant.id}>
                    <Td fontWeight="medium">{tenant.name}</Td>
                    <Td>
                      <Badge colorScheme="blue">{tenant.domain}</Badge>
                    </Td>
                    <Td>
                      <HStack>
                        <Box
                          w={4}
                          h={4}
                          borderRadius="sm"
                          bg={tenant.primaryColor || '#3182CE'}
                        />
                        <span>{tenant.primaryColor || '#3182CE'}</span>
                      </HStack>
                    </Td>
                    <Td>{new Date(tenant.createdAt).toLocaleDateString()}</Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit tenant"
                          icon={<FiEdit />}
                          size="sm"
                          onClick={() => navigate(`/tenants/${tenant.id}`)}
                        />
                        <IconButton
                          aria-label="Delete tenant"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(tenant.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </MainLayout>
  );
};
