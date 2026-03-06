import { Flex, FlexProps, useMediaQuery } from '@chakra-ui/react';

export const Viewport = (props: FlexProps) => {
  const [isStandalone] = useMediaQuery('(display-mode: standalone)');

  return (
    <Flex
      direction="column"
      overflowX="auto"
      minH="100vh"
      w="full"
      maxW="100vw"
      bg={'gray.50'}
      style={
        !isStandalone
          ? {
              minHeight: 'calc(var(--vh, 1vh) * 100)',
            }
          : {}
      }
      {...props}
    />
  );
};
