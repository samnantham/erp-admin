import React from 'react';
import { Tooltip, Box } from '@chakra-ui/react';

interface DiffTooltipProps {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  ml?: number | string;
}

export const DiffTooltip: React.FC<DiffTooltipProps> = ({
  label,
  icon,
  color = 'red.500',
  ml = 1,
}) => {
  return (
    <Tooltip label={label} hasArrow placement="top">
      <Box
        as="span"
        color={color}
        ml={ml}
        display="inline-flex"
        alignItems="center"
        lineHeight="1"
      >
        {icon ?? '✱'}
      </Box>
    </Tooltip>
  );
};

export default DiffTooltip;
