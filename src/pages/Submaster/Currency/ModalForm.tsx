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
import { useCreateCurrency, useUpdateCurrency } from '@/services/submaster/currency/services';

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

  const createItem = useCreateCurrency({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Currency created',
      });
      queryClient.invalidateQueries(['currencyIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Currency',
        description: error.response?.data.message,
      });
    },
  });
  
  const updateItem = useUpdateCurrency({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Currency updated',
      });
      queryClient.invalidateQueries(['currencyIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Currency',
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
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Currency</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
             <Stack spacing={4}>
              <FieldInput 
                name="code" 
                placeholder="Enter Currency Code" 
                type="alpha"
                required={'Currency Code required'}
                defaultValue={existInfo?.code || ''}
                maxLength={3}
              />
              <FieldInput 
                name="name" 
                placeholder="Enter Currency Name" 
                required={'Currency Name required'}
                type="all-capital"
                defaultValue={existInfo?.name || ''}
                maxLength={15}
              />
               <FieldInput 
                name="symbol" 
                placeholder="Enter Currency Symbol" 
                type="text"
                required={'Currency Symbol required'}
                defaultValue={existInfo?.symbol || ''}
                maxLength={3}
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
