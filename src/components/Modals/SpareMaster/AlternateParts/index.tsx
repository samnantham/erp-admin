import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';

type ModalPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  altPartNos: any;
};

export const AltPartInfoPopup = ({
  isOpen,
  onClose,
  altPartNos,
}: ModalPopupProps) => {
  const closeModal = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} size="md" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxWidth="50vw">
        <ModalHeader textAlign={'center'}>
          <Text fontSize="lg" fontWeight="bold">
            Alternate Part Numbers
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            borderColor={'black'}
            padding={'1'}
            backgroundColor="gray.200"
            whiteSpace="white-space"
            mb={4}
          >
            <Flex justify="space-between" p={2}>
              <Box p={0} m={0} border="none" bg="transparent">
                <Flex direction="column" gap={1}>
                  <Flex justify="space-between" align="center">
                    <Text marginEnd={10}>Alt. Partnumbers:</Text>
                    <Text fontWeight={'bold'}>
                      {altPartNos
                        .map((item: any) => item?.alternate_part_number?.part_number)
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AltPartInfoPopup;
