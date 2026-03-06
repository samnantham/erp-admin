import { Box, Text } from '@chakra-ui/react';
import { DiffTooltip } from '@/components/DiffTooltip';
import { ReactNode } from 'react';

type FieldDisplayProps = {
  label?: string;
  value: string | number | undefined;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  isHtml?: boolean;
  showTooltip?: boolean;
  tooltipContent?: string;
  /** NEW: pass an icon for the built-in tooltip */
  tooltipIcon?: ReactNode;
  /** NEW: render anything after the label (e.g., your own DiffTooltip) */
  labelSuffix?: ReactNode;
  /** existing */
  leftElement?: ReactNode;
};

const FieldDisplay = ({
  label,
  value,
  size = 'md',
  style = {},
  isHtml = false,
  showTooltip = false,
  tooltipContent = '',
  tooltipIcon,
  labelSuffix,
  leftElement,
}: FieldDisplayProps) => {
  const displayValue =
    typeof value === 'number' && isNaN(value)
      ? 'N/A'
      : value === undefined
      ? 'N/A'
      : typeof value === 'number'
      ? value.toString()
      : value;

  return (
    <Box w="100%">
      {(label || showTooltip || labelSuffix) && (
        <Text fontSize={size} fontWeight={size === 'sm' ? 'medium' : 'bold'} mb={2}>
          {label}
          {showTooltip && (
            <DiffTooltip label={tooltipContent} icon={tooltipIcon} />
          )}
          {labelSuffix ?? null}
        </Text>
      )}

      <Box
        px={2}
        py={size === 'sm' ? 1 : 2}
        bg="gray.100"
        borderRadius="md"
        sx={{ border: '1px solid #E2E8F0' }}
        style={style}
      >
        {isHtml ? (
          <Text
            fontSize={size}
            dangerouslySetInnerHTML={{ __html: String(displayValue ?? '') }}
          />
        ) : (
          <Text fontSize={size}>
            {leftElement ? <>{leftElement}&nbsp;</> : null}
            {displayValue}
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default FieldDisplay;
