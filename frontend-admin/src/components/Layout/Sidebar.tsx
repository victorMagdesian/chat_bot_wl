import React from 'react';
import { Box, VStack, Link as ChakraLink, Icon, Text, Flex } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiMessageSquare, FiSettings, FiBarChart2 } from 'react-icons/fi';

interface NavItem {
  name: string;
  path: string;
  icon: any;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: FiHome },
  { name: 'Tenants', path: '/tenants', icon: FiUsers },
  { name: 'Bots', path: '/bots', icon: FiMessageSquare },
  { name: 'Automations', path: '/automations', icon: FiSettings },
  { name: 'Metrics', path: '/metrics', icon: FiBarChart2 },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      w="250px"
      bg="gray.800"
      color="white"
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      overflowY="auto"
    >
      <Box p={6}>
        <Text fontSize="xl" fontWeight="bold">
          Admin Panel
        </Text>
      </Box>

      <VStack spacing={1} align="stretch" px={3}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ChakraLink
              key={item.path}
              as={RouterLink}
              to={item.path}
              _hover={{ textDecoration: 'none' }}
            >
              <Flex
                align="center"
                p={3}
                borderRadius="md"
                bg={isActive ? 'blue.600' : 'transparent'}
                _hover={{ bg: isActive ? 'blue.600' : 'gray.700' }}
                transition="all 0.2s"
              >
                <Icon as={item.icon} mr={3} />
                <Text>{item.name}</Text>
              </Flex>
            </ChakraLink>
          );
        })}
      </VStack>
    </Box>
  );
};
