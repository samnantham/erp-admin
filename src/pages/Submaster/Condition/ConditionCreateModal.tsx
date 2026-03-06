import React from 'react';

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { useQueryClient } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useCreate } from '@/services/submaster/condition/services';

type ConditionCreateModalProps = {
  isOpen: boolean;
  onClose: (status?: boolean) => void;
};

const ConditionCreateModal = ({
  isOpen,
  onClose,
}: ConditionCreateModalProps) => {
  const initialRef = React.useRef(null);
  const queryClient = useQueryClient();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const CreateItem = useCreate({
    onSuccess: () => {
      queryClient.invalidateQueries(['conditionIndex', 'conditionList']);
      onClose(true);
      toastSuccess({
        title: 'Condition created',
      });
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Condition',
        description: error.response?.data.message,
      });
    },
  });

  const handleClose = () => {
    onClose(false);
}

  const form = useForm({
    onValidSubmit(values) {
      CreateItem.mutate(values);
    },
  });
  return (
    <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={handleClose} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent>
        <Formiz autoForm connect={form}>
          <ModalHeader>Add Condition</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FieldInput
              name="name"
              placeholder="Enter Condition Name"
              required={'Condition Name required'}
              type="all-capital"
              maxLength={3}
            />
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              colorScheme="brand"
              mr={3}
              isLoading={CreateItem.isLoading}
            >
              Add
            </Button>
            <Button onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
};

export default ConditionCreateModal;