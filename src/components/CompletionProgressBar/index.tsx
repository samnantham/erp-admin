import { Box } from '@chakra-ui/react';

type CompletionProgressBarProps = {
  value?: number;
  maxW?: string;
  trackColor?: string;
};

export const CompletionProgressBar = ({ value = 0, maxW = "100px", trackColor = "#7b8085" }: CompletionProgressBarProps) => {
  const color = value > 75 ? '#48BB78' : value > 50 ? '#ED8936' : 'red';

  return (
    <Box maxW={maxW}>
      <Box fontSize="xs" fontWeight="semibold" color={color} mb={1}>
        {value}%
      </Box>
      <Box w="100%" h="6px" bg={trackColor} borderRadius="full" overflow="hidden">
        <Box
          h="100%"
          w={`${value}%`}
          bg={color}
          borderRadius="full"
          transition="width 0.3s ease"
        />
      </Box>
    </Box>
  );
};

export default CompletionProgressBar;