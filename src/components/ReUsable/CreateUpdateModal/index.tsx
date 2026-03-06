import React, { useEffect, useState } from 'react';
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
import { useQueryClient, UseMutationResult } from 'react-query';

import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';

type CreateUpdateModalProps<TFormValues extends object> = {
  isOpen: boolean;
  onClose: () => void;

  title: string;
  isEdit?: boolean;

  existInfo?: Partial<TFormValues> & { id?: string | number };

  createMutation: UseMutationResult<any, any, TFormValues>;

  updateMutation: UseMutationResult<
    any,
    any,
    TFormValues & { id: string | number }
  >;

  invalidateKeys?: string[];

  /** ✅ fields used for change detection */
  fields: (keyof TFormValues)[];

  children: React.ReactNode;
  transformValues?: (values: TFormValues) => any;
};

export function CreateUpdateModal<TFormValues extends object>({
  isOpen,
  onClose,
  title,
  isEdit = false,
  existInfo,
  createMutation,
  updateMutation,
  invalidateKeys = [],
  fields: formFields,
  children,
  transformValues
}: CreateUpdateModalProps<TFormValues>) {
  const queryClient = useQueryClient();
  const initialRef = React.useRef(null);

  const form = useForm<TFormValues>({
  onValidSubmit(values) {
  const payload = transformValues ? transformValues(values) : values;

  if (isEdit) {
    updateMutation.mutate(
      {
        id: existInfo?.id as string | number,
        ...payload,
      },
      {
        onSuccess: () => {
          invalidateKeys.forEach((key) =>
            queryClient.invalidateQueries([key])
          );
          onClose();
        },
      }
    );
  } else {
    createMutation.mutate(payload, {
      onSuccess: () => {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries([key])
        );
        onClose();
      },
    });
  }
}
  });

  const [initialValues, setInitialValues] = useState<
    Partial<TFormValues> | null
  >(null);

  const fields = useFormFields({ connect: form });

  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: formFields,
  });

  useEffect(() => {
    if (isEdit && existInfo) {
      const filteredValues = {} as Partial<TFormValues>;

      formFields.forEach((key) => {
        if (key in existInfo) {
          filteredValues[key] = existInfo[key] as TFormValues[typeof key];
        }
      });

      setInitialValues(filteredValues);
    }
  }, [isEdit, existInfo, formFields]);

  return (
    <Modal
      initialFocusRef={initialRef}
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay />

      <ModalContent>
        <Formiz key={existInfo?.id ?? 'create'} autoForm connect={form}>
          <ModalHeader>
            {isEdit ? 'Update' : 'Create'} {title}
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody pb={6}>{children}</ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              colorScheme="brand"
              mr={3}
              isLoading={
                createMutation.isLoading || updateMutation.isLoading
              }
              isDisabled={
                createMutation.isLoading ||
                updateMutation.isLoading ||
                (isEdit ? !isFormValuesChanged : false)
              }
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>

            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
}