import React, {useEffect, useState} from 'react';

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useQueryClient } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useCreateShipAccount, useUpdateShipAccount } from '@/services/submaster/ship-account/services';

type ModalFormProps = {
  isOpen: boolean;
  isEdit?: boolean;
  existInfo?: any;
  onClose: () => void;
};

const ModalForm = ({
  isOpen,
  isEdit = false,
  existInfo,
  onClose,
}: ModalFormProps) => {
  const initialRef = React.useRef(null);
  const queryClient = useQueryClient();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const createItem = useCreateShipAccount({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'ShipAccount created',
      });
      queryClient.invalidateQueries(['shipAccountIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Ship Account',
        description: error.response?.data.message,
      });
    },
  });
  
  const updateItem = useUpdateShipAccount({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Ship Account updated',
      });
      queryClient.invalidateQueries(['shipAccountIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error updating Ship Account',
        description: error.response?.data.message,
      });
    },
  });

  const form = useForm({
    onValidSubmit(values) {
      if (isEdit) {
        const formValues: TODO = values;
        formValues.id = existInfo?.id;
        updateItem.mutate(formValues);
      } else {
        createItem.mutate(values);
      }
    },
  });

  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });
  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: ['name']
  });

  useEffect(() => {
    if(isEdit){
      setInitialValues(existInfo);
    }
  }, [isEdit]);

  return (
    <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={onClose} closeOnOverlayClick={false}  closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent>
        <Formiz autoForm connect={form}>
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Ship Account</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
                <FieldInput 
                    name="name" 
                    placeholder="Enter Ship Account" 
                    required={'Ship Account required'}
                    type="all-capital"
                    maxLength={15}
                    defaultValue={existInfo?.name || ''}
                />
                <FieldInput 
                    name="account_number" 
                    placeholder="Enter Ship Account Number" 
                    required={'Ship Account Number required'}
                    type="integer"
                    maxLength={15}
                    mt={'1rem'}
                    defaultValue={existInfo?.account_number || ''}
                />
            </Stack>    
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              colorScheme="brand"
              mr={3}
              isLoading={createItem.isLoading || updateItem.isLoading}
              isDisabled={
                 createItem.isLoading || 
                 updateItem.isLoading || 
                 (isEdit ? !isFormValuesChanged : false)
                }
            >
              {isEdit ? 'Update ' : 'Create'}
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
};

export default ModalForm;
