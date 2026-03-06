// components/ConfirmationPopup.tsx
import React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';

interface ConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  headerText?: string;
  isLoading?: boolean;
  bodyText?: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  headerText = 'Confirmation',
  isLoading = false,
  bodyText = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{headerText}</ModalHeader>
        <ModalBody>{bodyText}</ModalBody>
        <ModalFooter>
          <Button
            onClick={onClose}
            mr={3}
            size="sm"
            variant="outline"
            isDisabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            colorScheme="blue"
            size="sm"
            onClick={onConfirm} // parent decides when to close
            isDisabled={isLoading}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationPopup;
