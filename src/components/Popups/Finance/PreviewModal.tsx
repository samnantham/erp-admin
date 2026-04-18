import { Box, IconButton } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const PreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      w="100vw"
      h="100vh"
      bg="blackAlpha.600"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose} // click outside closes
    >
      <Box
        position="relative"
        onClick={(e) => e.stopPropagation()} // prevent close inside
      >
        {/* Close Button (FIXED) */}
        <IconButton
          aria-label="Close preview"
          icon={<CloseIcon />}
          position="absolute"
          top="3"
          right="3"
          size="sm"
          borderRadius="full"
          bg="whiteAlpha.900"
          _hover={{ bg: "white" }}
          boxShadow="sm"
          zIndex={2}
          onClick={onClose}
        />

        {children}
      </Box>
    </Box>
  );
};