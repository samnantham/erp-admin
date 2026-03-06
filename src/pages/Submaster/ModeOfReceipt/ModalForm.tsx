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
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useQueryClient } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useCreateModeOfReceipt, useUpdateModeOfReceipt } from '@/services/submaster/mode-of-receipt/services';

type ModalFormProps = {
  isOpen: boolean;
  isEdit?: boolean;
  existInfo?: any;
  name?: string;
  onClose: (status? : any) => void;
};

const ModalForm = ({
  isOpen,
  isEdit = false,
  existInfo,
  name = '',
  onClose,
}: ModalFormProps) => {
  const initialRef = React.useRef(null);
  const queryClient = useQueryClient();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const createItem = useCreateModeOfReceipt({
    onSuccess: () => {
      onClose(true);
      toastSuccess({
        title: 'Mode of receipt created',
      });
      queryClient.invalidateQueries(['mode_of_receipt_Index']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating mode of receipt',
        description: error.response?.data.message,
      });
    },
  });
  
  const updateItem = useUpdateModeOfReceipt({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Mode Of Receipt updated',
      });
      queryClient.invalidateQueries(['mode_of_receipt_Index']);
    },
    onError: (error) => {
      toastError({
        title: 'Error updating mode of receipt',
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
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Mode Of Receipt</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FieldInput
              name="name"
              placeholder="Enter mode of receipt name" 
              required={'Mode of receipt name required'}
              defaultValue={isEdit ? existInfo?.name : (name ?? '')}
              type="all-capital"
              maxLength={15}
            />
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
