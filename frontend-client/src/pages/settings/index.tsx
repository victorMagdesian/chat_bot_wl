import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Image,
  useColorModeValue,
  Spinner,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { FiUpload, FiSave } from 'react-icons/fi';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import api from '@/lib/api';
import { useTenant } from '@/lib/tenantContext';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { primaryColor, setTenant } = useTenant();
  const bgColor = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    logoUrl: '',
    primaryColor: '#3182CE',
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantSettings();
  }, []);

  const fetchTenantSettings = async () => {
    try {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];

        if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
          const response = await api.get(`/tenants/domain/${subdomain}`);
          const tenant = response.data;
          setFormData({
            name: tenant.name || '',
            domain: tenant.domain || '',
            logoUrl: tenant.logoUrl || '',
            primaryColor: tenant.primaryColor || '#3182CE',
          });
          setLogoPreview(tenant.logoUrl || null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenant settings:', error);
      toast({
        title: 'Failed to load settings',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo must be less than 2MB',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/tenants/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const logoUrl = response.data.logoUrl;
      setFormData((prev) => ({ ...prev, logoUrl }));
      setLogoPreview(logoUrl);

      toast({
        title: 'Logo uploaded',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to upload logo',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.patch('/tenants/me', {
        name: formData.name,
        logoUrl: formData.logoUrl,
        primaryColor: formData.primaryColor,
      });

      // Update tenant context
      setTenant(response.data);

      toast({
        title: 'Settings saved',
        status: 'success',
        duration: 3000,
      });

      // Reload page to apply new branding
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Failed to save settings',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
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
      <Box maxW="800px">
        <VStack spacing={6} align="stretch">
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm">
            <Text fontSize="xl" fontWeight="bold" mb={6}>
              Tenant Settings
            </Text>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Tenant Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter tenant name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Domain</FormLabel>
                  <Input value={formData.domain} isReadOnly isDisabled />
                </FormControl>

                <Divider />

                <Text fontSize="lg" fontWeight="bold">
                  Branding
                </Text>

                <FormControl>
                  <FormLabel>Logo</FormLabel>
                  <VStack spacing={4} align="start">
                    {logoPreview && (
                      <Box
                        p={4}
                        borderWidth={1}
                        borderRadius="md"
                        bg="gray.50"
                      >
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          maxH="100px"
                        />
                      </Box>
                    )}
                    <Button
                      as="label"
                      htmlFor="logo-upload"
                      leftIcon={<FiUpload />}
                      variant="outline"
                      isLoading={uploading}
                      cursor="pointer"
                    >
                      Upload Logo
                    </Button>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      display="none"
                    />
                    <Text fontSize="sm" color="gray.500">
                      Maximum file size: 2MB
                    </Text>
                  </VStack>
                </FormControl>

                <FormControl>
                  <FormLabel>Primary Color</FormLabel>
                  <HStack spacing={4}>
                    <Input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      w="100px"
                      h="50px"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      placeholder="#3182CE"
                    />
                  </HStack>
                </FormControl>

                <Button
                  type="submit"
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  bg={primaryColor || 'blue.500'}
                  isLoading={saving}
                  alignSelf="flex-start"
                >
                  Save Changes
                </Button>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Box>
    </DashboardLayout>
  );
}
