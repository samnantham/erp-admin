import React from 'react';

import { Box, BoxProps, Center, Spinner } from '@chakra-ui/react';

interface LoadingOverlayProps extends BoxProps {
  isLoading: boolean; // Indicates whether the overlay should be shown
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  ...rest
}) => {
  return (
    <Box position="relative" {...rest}>
      {children}
      {isLoading && (
        <Center
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          bg="rgba(255, 255, 255, 0.8)" // Semi-transparent overlay
          zIndex="overlay"
        >
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
        </Center>
      )}
    </Box>
  );
};

export default LoadingOverlay;
