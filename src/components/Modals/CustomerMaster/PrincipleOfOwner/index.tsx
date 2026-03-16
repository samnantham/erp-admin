import { useRef, useEffect, useState } from 'react';
import {
  Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Stack, Text,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';

import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import { FieldInput }      from '@/components/FieldInput';
import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldPhone }      from '@/components/FieldPhone';
import { FieldTextarea }   from '@/components/FieldTextarea';
import { FieldUpload }     from '@/components/FieldUpload';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useSavePrincipleOwner } from "@/services/master/customer/service";

type PrincipleOfOwnerModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  customerId: string;
  isEdit?: boolean;
  isView?: boolean;
  existValues?: any;
  customerInfo?: any;
};

const KEYS = ['owner', 'phone', 'email', 'id_passport_copy', 'remarks'];

export function PrincipleOfOwnerModal({
  isOpen, onClose, customerId,
  isEdit, isView, existValues, customerInfo,
}: PrincipleOfOwnerModalProps) {

  const saveItem = useSavePrincipleOwner({
    onSuccess: ({ id }) => onClose(true, id),
  });

  const form = useForm({
    onValidSubmit: (values) => {
      const payload: any = {
        customer_id: customerId,
        ...Object.fromEntries(
          Object.entries(values).filter(([_, v]) => v !== null && v !== '')
        ),
      };
      if (isEdit) payload.id = existValues.id;
      saveItem.mutate(payload);
    },
  });

  const fields        = useFormFields({ connect: form });
  const formRef       = useRef(form);
  formRef.current     = form;

  const [initialValues, setInitialValues] = useState<any>(null);
  const isChanged = isFormFieldsChanged({ fields, initialValues, keys: KEYS });

  useEffect(() => {
    if (!existValues || !isOpen) return;
    const init = Object.fromEntries(KEYS.map((k) => [k, existValues?.[k] ?? '']));
    setInitialValues(init);
    setTimeout(() => formRef.current.setValues(init), 0);
  }, [existValues, isOpen]);

  const p = (text: string) => (!isView ? text : '');

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false, 0)} size="md" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxWidth="60vw">
        <Formiz autoForm connect={form}>
          <ModalHeader>
            Principle of Owner Modal{customerInfo ? ` (${customerInfo.business_name} - ${customerInfo.code})` : ''}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Stack spacing={4}>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput
                  label="Owner" name="owner" type="alpha-with-space"
                  placeholder={p('Enter Owner Name')} maxLength={40}
                  isDisabled={isView} required="Owner Name is required"
                />
                <FieldPhone
                  label="Phone Number" name="phone"
                  placeholder={p('Enter Phone Number')}
                  defaultCountry="AE" isDisabled={isView}
                />
                <FieldEmailInput
                  label="Email" name="email"
                  placeholder={p('Enter Email')}
                  validations={[{ handler: isEmail(), message: 'Invalid email' }]}
                  maxLength={100} isDisabled={isView}
                  required={existValues?.email ? 'Email is required' : ''}
                />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                {isView ? (
                  <Box w="100%">
                    <Text fontSize="md" mb={2}>Passport Copy</Text>
                    <DocumentDownloadButton size="sm" url={existValues?.id_passport_copy || ''} />
                  </Box>
                ) : (
                  <FieldUpload
                    label="ID/Passport Copy" name="id_passport_copy"
                    placeholder="Passport Copy"
                    existingFileUrl={existValues?.id_passport_copy || ''}
                  />
                )}

                <FieldTextarea
                  label="Remarks" name="remarks"
                  placeholder={p('Enter Remarks')}
                  maxLength={100} isDisabled={isView}
                />
              </Stack>

            </Stack>
          </ModalBody>

          <ModalFooter>
            <Stack direction="row" spacing={4} justify="center" width="100%" mt={4}>
              <Button colorScheme="red" onClick={() => onClose(false, 0)}>Close</Button>
              {!isView && (
                <Button
                  type="submit" colorScheme="brand"
                  isLoading={saveItem.isLoading}
                  isDisabled={!form.isValid || saveItem.isLoading || (isEdit ? !isChanged : false)}
                >
                  {isEdit ? 'Update' : 'Create'} Principle of Owner
                </Button>
              )}
            </Stack>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
}

export default PrincipleOfOwnerModal;