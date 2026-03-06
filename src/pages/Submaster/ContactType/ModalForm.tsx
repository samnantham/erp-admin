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
import { useQueryClient } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useCreateContactType, useUpdateContactType } from '@/services/submaster/contacttype/services';


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

  const createItem = useCreateContactType({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Contact Type created',
      });
      queryClient.invalidateQueries(['contactTypeIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Contact Type',
        description: error.response?.data.message,
      });
    },
  });
  
  const updateItem = useUpdateContactType({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Contact Type updated',
      });
      queryClient.invalidateQueries(['contactTypeIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Contact Type',
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
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Contact Type</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FieldInput
              name="name"
              placeholder="Enter Contact Type"
              required={'Contact Type required'}
              defaultValue={existInfo?.name || ''}
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
