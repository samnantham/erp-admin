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

import { FieldInput} from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useCreate, useUpdate } from '@/services/submaster/condition/services';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';

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

  const createItem = useCreate({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Condition created',
      });
      queryClient.invalidateQueries(['conditionIndex', 'conditionList']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Condition',
        description: error.response?.data.message,
      });
    },
  });

  const updateItem = useUpdate({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Condition updated',
      });
      queryClient.invalidateQueries(['conditionIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error updating Condition',
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
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Condition</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FieldInput
              name="name"
              placeholder="Enter Condition Name"
              required={'Condition Name required'}
              type="all-capital"
              defaultValue={existInfo?.name || ''}
              maxLength={3}
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
