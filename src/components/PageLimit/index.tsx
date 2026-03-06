import React from 'react';
import { HiChevronDown } from 'react-icons/hi';
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';

interface PageLimitProps {
  loading?: boolean;
  changeLimit: (limit: number) => void;
  currentLimit: number;
  total?: number;
}

export const PageLimit: React.FC<PageLimitProps> = ({
  loading,
  changeLimit,
  currentLimit,
  total,
}) => {
  const limits: number[] = [10, 25, 50, 100];

  // Apply disable logic ONLY if total exists
  const shouldApplyTotalLogic = typeof total === "number";

  const isCompletelyDisabled =
    loading ||
    (shouldApplyTotalLogic && total < Math.min(...limits));

  return (
    <Menu>
      <MenuButton
        as={Button}
        bg="#0C2556"
        color="white"
        _hover={{ color: '#0C2556', bg: '#fff' }}
        _active={{ color: '#0C2556', bg: '#fff' }}
        _focus={{ color: '#0C2556', bg: '#fff' }}
        rightIcon={<HiChevronDown />}
        size="sm"
        maxW="130px"
        minW="130px"
        ml={2}
        isDisabled={isCompletelyDisabled}
      >
        {currentLimit}
      </MenuButton>

      <MenuList
        width="130px"
        maxW="130px"
        minW="130px"
        boxShadow="md"
        sx={{ overflow: "hidden", padding: "4px" }}
      >
        {limits.map((limit: number) => {
          let isDisabled = false;

          if (shouldApplyTotalLogic) {
            const sortedLimits = [...limits].sort((a, b) => a - b);
            const nextLimit =
              sortedLimits.find((l) => l >= total!) || sortedLimits[sortedLimits.length - 1];

            isDisabled = limit > nextLimit;
          }

          return (
            <MenuItem
              key={limit}
              onClick={() => !isDisabled && changeLimit(limit)}
              fontSize="sm"
              fontWeight="semibold"
              isDisabled={isDisabled}
            >
              {limit}
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
};

export default PageLimit;