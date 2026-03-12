import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
} from '@chakra-ui/react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  headerText?: string;
  bodyText?: string;
  isLoading?: boolean;
  showBody?: boolean;
  /** Make reason mandatory (default: true) */
  isInputRequired?: boolean;
  initialReason?: string;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
};

export const ConfirmationWithReasonPopup: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  headerText = 'Confirmation',
  bodyText = 'Are you sure you want to proceed with this action?',
  isLoading = false,
  showBody = true,
  isInputRequired = true,
  initialReason = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  placeholder= 'Enter Reason'
}) => {
  const [reason, setReason] = useState(initialReason ?? '');
  const [touched, setTouched] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setReason(initialReason ?? '');
      setTouched(false);
    }
  }, [isOpen, initialReason]);

  const trimmed = reason.trim();
  const isInvalid = isInputRequired && touched && trimmed.length === 0;

  const handleConfirm = () => {
    // mark as touched to show error if empty
    setTouched(true);
    if (isInputRequired && trimmed.length === 0) return;
    onConfirm(trimmed);
    // Do NOT close here; parent will close on mutation success
  };

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

        <ModalBody>
          {showBody && <Text as="span">{bodyText}</Text>}

          <FormControl mt={showBody ? 4 : 0} isRequired={isInputRequired} isInvalid={isInvalid}>
            <FormLabel>Reason</FormLabel>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Type reason"
              size="sm"
              isDisabled={isLoading}
            />
            <FormErrorMessage>{placeholder}</FormErrorMessage>
          </FormControl>
        </ModalBody>

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
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationWithReasonPopup;
