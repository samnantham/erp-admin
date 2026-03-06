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
  Stack,
  Checkbox
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useQueryClient } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useCreateRack, useUpdateRack } from '@/services/submaster/rack/services';

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

  const createItem = useCreateRack({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Rack created',
      });
      queryClient.invalidateQueries(['rackIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error creating Rack',
        description: error.response?.data.message,
      });
    },
  });
  
  const updateItem = useUpdateRack({
    onSuccess: () => {
      onClose();
      toastSuccess({
        title: 'Rack updated',
      });
      queryClient.invalidateQueries(['rackIndex']);
    },
    onError: (error) => {
      toastError({
        title: 'Error updating Rack',
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

  const handleCheckboxChange = (checked: boolean) => {
    form.setValues({ [`is_quarantine`]: checked ? 1 : 0 });
  };

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
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Rack</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FieldInput
              name={`is_quarantine`}
              size={'sm'}
              sx={{ display: 'none' }}
              defaultValue={existInfo?.name || 0}
            />
            <FieldInput
              name="name"
              placeholder="Enter Rack Name"
              required={'Rack Name required'}
              defaultValue={existInfo?.name || ''}
              type="all-capital"
              maxLength={10}
            />
            <Stack spacing={4} direction={{ base: 'column', md: 'row' }} mt={4}>
              <Checkbox
                onChange={(e) => handleCheckboxChange(e.target.checked)}
              >
                Quarantine
              </Checkbox>
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
