import { BiChevronDown } from 'react-icons/bi';
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';

export interface ActionMenuOption<T extends string = string> {
  label: string;
  value: T;
}

interface ActionMenuProps<T extends string = string> {
  label: string;
  icon: React.ReactElement;
  colorScheme: string;
  options: readonly ActionMenuOption<T>[];
  onClick: (value: T) => void;
  isDisabled?: boolean;
}

export const ActionMenu = <T extends string = string>({
  label,
  icon,
  colorScheme,
  options,
  onClick,
  isDisabled = false,
}: ActionMenuProps<T>) => (
  <Menu>
    <MenuButton
      as={Button}
      leftIcon={<Box mr={3}>{icon}</Box>}
      rightIcon={<Box ml={3} as={BiChevronDown} />}
      size="sm"
      colorScheme={colorScheme}
      ml={2}
      isDisabled={isDisabled}
    >
      {label}
    </MenuButton>

    <MenuList bg="white" borderColor="gray.200">
      {options.map(({ label: optLabel, value }) => (
        <MenuItem
          key={value}
          bg="white"
          color="gray.800"
          _hover={{ bg: 'gray.100' }}
          onClick={() => onClick(value)}
          icon={icon}
          isDisabled={isDisabled}
        >
          {optLabel}
        </MenuItem>
      ))}
    </MenuList>
  </Menu>
);