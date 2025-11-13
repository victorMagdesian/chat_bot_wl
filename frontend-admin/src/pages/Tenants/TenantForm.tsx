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
  Image,
  Text,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '../../components/Layout/MainLayout';
import { tenantService } from '../../services/tenant.service';

export const TenantForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3182CE');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; domain?: string }>({});
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (isEdit && id) {
      loadTenant(id);
    }
  }, [id, isEdit]);

  const loadTenant = async (tenantId: string) => {
    try {
      setIsLoadingData(true);
      const tenant = await tenantService.getById(tenantId);
      setName(tenant.name);
      setDomain(tenant.domain);
      setPrimaryColor(tenant.primaryColor || '#3182CE');
      setLogoUrl(tenant.logoUrl || '');
      setLogoPreview(tenant.logoUrl || '');
    } catch (error: any) {
      toast({
        title: 'Error loading tenant',
        description: error.response?.data?.message || 'Failed to load tenant',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/tenants');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Logo must be less than 2MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: { name?: string; domain?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!domain.trim()) {
      newErrors.domain = 'Domain is required';
    } else if (!/^[a-z0-9-]+$/.test(domain)) {
      newErrors.domain = 'Domain must contain only lowercase letters, numbers, and hyphens';
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
      let finalLogoUrl = logoUrl;
      
      // Upload logo if a new file was selected
      if (logoFile) {
        const uploadResult = await tenantService.uploadLogo(logoFile);
        finalLogoUrl = uploadResult.url;
      }

      const data = {
        name,
        domain,
        primaryColor,
        logoUrl: finalLogoUrl,
      };

      if (isEdit && id) {
        await tenantService.update(id, data);
        toast({
          title: 'Tenant updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await tenantService.create(data);
        toast({
          title: 'Tenant created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      navigate('/tenants');
    } catch (error: any) {
      toast({
        title: isEdit ? 'Error updating tenant' : 'Error creating tenant',
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
        <Heading mb={6}>{isEdit ? 'Edit Tenant' : 'Create Tenant'}</Heading>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <form onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.name}>
                <FormLabel>Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter tenant name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.domain}>
                <FormLabel>Domain</FormLabel>
                <Input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value.toLowerCase())}
                  placeholder="Enter subdomain (e.g., acme)"
                />
                <FormErrorMessage>{errors.domain}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Primary Color</FormLabel>
                <HStack>
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    w="80px"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3182CE"
                  />
                </HStack>
              </FormControl>

              <FormControl>
                <FormLabel>Logo</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  pt={1}
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Maximum file size: 2MB
                </Text>
                {logoPreview && (
                  <Box mt={3}>
                    <Image
                      src={logoPreview}
                      alt="Logo preview"
                      maxH="100px"
                      borderRadius="md"
                    />
                  </Box>
                )}
              </FormControl>

              <HStack spacing={3} pt={4}>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isLoading}
                  loadingText={isEdit ? 'Updating...' : 'Creating...'}
                >
                  {isEdit ? 'Update Tenant' : 'Create Tenant'}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/tenants')}>
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
