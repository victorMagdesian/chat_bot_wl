import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Image,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/lib/tenantContext';
import { FiHome, FiMessageSquare, FiClock, FiSettings, FiLogOut } from 'react-icons/fi';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { logoUrl, primaryColor } = useTenant();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const contentBg = useColorModeValue('gray.50', 'gray.900');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <Flex h="100vh" align="center" justify="center">
        <Text>Loading...</Text>
      </Flex>
    );
  }

  const navItems = [
    { label: 'Dashboard', icon: FiHome, href: '/dashboard' },
    { label: 'Chats', icon: FiMessageSquare, href: '/chats' },
    { label: 'Scheduled', icon: FiClock, href: '/schedules' },
    { label: 'Settings', icon: FiSettings, href: '/settings' },
  ];

  return (
    <Flex h="100vh">
      {/* Sidebar */}
      <Box
        w="250px"
        bg={bgColor}
        borderRight="1px"
        borderColor={borderColor}
        p={4}
      >
        <VStack spacing={6} align="stretch">
          {/* Logo */}
          <Box textAlign="center" py={4}>
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" maxH="50px" mx="auto" />
            ) : (
              <Text fontSize="xl" fontWeight="bold" color={primaryColor || 'blue.500'}>
                ChatBot
              </Text>
            )}
          </Box>

          {/* Navigation */}
          <VStack spacing={2} align="stretch">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href} passHref legacyBehavior>
                  <Button
                    as="a"
                    leftIcon={<Icon as={item.icon} />}
                    variant={isActive ? 'solid' : 'ghost'}
                    justifyContent="flex-start"
                    bg={isActive ? primaryColor || 'blue.500' : 'transparent'}
                    color={isActive ? 'white' : 'inherit'}
                    _hover={{
                      bg: isActive ? primaryColor || 'blue.600' : 'gray.100',
                    }}
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </VStack>
        </VStack>
      </Box>

      {/* Main Content */}
      <Flex flex={1} direction="column">
        {/* Header */}
        <Box
          bg={bgColor}
          borderBottom="1px"
          borderColor={borderColor}
          px={8}
          py={4}
        >
          <Flex justify="space-between" align="center">
            <Text fontSize="2xl" fontWeight="bold">
              {navItems.find((item) => item.href === router.pathname)?.label || 'Dashboard'}
            </Text>

            <Menu>
              <MenuButton>
                <HStack spacing={3} cursor="pointer">
                  <Avatar size="sm" name={user?.email} />
                  <Text fontSize="sm">{user?.email}</Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiLogOut />} onClick={logout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Box>

        {/* Page Content */}
        <Box flex={1} overflow="auto" p={8} bg={contentBg}>
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
