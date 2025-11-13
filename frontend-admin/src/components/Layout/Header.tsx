import React from 'react';
import {
  Box,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text,
  IconButton,
} from '@chakra-ui/react';
import { FiMenu, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg="white"
      borderBottomWidth="1px"
      borderColor="gray.200"
      px={6}
      py={4}
      position="fixed"
      top={0}
      right={0}
      left={{ base: 0, md: '250px' }}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <IconButton
          aria-label="Open menu"
          icon={<FiMenu />}
          display={{ base: 'flex', md: 'none' }}
          onClick={onMenuClick}
          variant="ghost"
        />

        <Box flex={1} />

        <Menu>
          <MenuButton>
            <Flex align="center" cursor="pointer">
              <Avatar size="sm" name={user?.email} mr={2} />
              <Box display={{ base: 'none', md: 'block' }}>
                <Text fontSize="sm" fontWeight="medium">
                  {user?.email}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {user?.role}
                </Text>
              </Box>
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiUser />}>Profile</MenuItem>
            <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};
