import { useEffect, useState } from 'react';

import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';

import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import { FieldInput } from '@/components/FieldInput';
import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldPhone } from '@/components/FieldPhone';
import { FieldTextarea } from '@/components/FieldTextarea';
import { FieldUpload } from '@/components/FieldUpload';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useSavePrincipleOwner } from "@/services/master/customer/service";

type PrincipleOfOwnerModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  customerId: string;
  isEdit?: boolean;
  isView?: boolean;
  existValues?: any;
  customerInfo?: any
};

export function PrincipleOfOwnerModal({
  isOpen,
  onClose,
  customerId,
  isEdit,
  isView,
  existValues,
  customerInfo
}: PrincipleOfOwnerModalProps) {
  const keys = ['owner', 'phone', 'email', 'id_passport_copy', 'remarks'];
  const saveItem = useSavePrincipleOwner({
    onSuccess: ({ id }) => {
      onClose(true, id);
    },
    onError: () => {
      // onClose(false, 0);
    },
  });
  const form = useForm({
    onValidSubmit: async (values) => {
      const {
        attention,
        address,
        city,
        state,
        zip_code,
        country,
        phone,
        fax,
        email,
        remarks,
        ...optionalValues
      } = values;

      const payload: any = {
        customer_id: customerId,
        attention,
        address,
        city,
        state,
        zip_code,
        country,
        phone,
        fax,
        email,
        remarks,
        ...Object.fromEntries(
          Object.entries(optionalValues).filter(
            ([_, value]) => value !== null && value !== ''
          )
        ),
      };
      if (isEdit) {
        payload.id = existValues.id;
      }
      saveItem.mutate(payload);
    },
  });

  const fields = useFormFields({
    connect: form,
  });
  const [initialValues, setInitialValues] = useState<any>(null);

  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: keys
  });

  useEffect(() => {
    if (!existValues || !isOpen) return;

    const init = Object.fromEntries(
      keys.map((key) => [key, existValues?.[key] ?? ""])
    );

    setInitialValues(init);
    form.setValues(init);
  }, [existValues, form, isOpen]);

  const handleClose = () => {
    onClose(false, 0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent maxWidth="60vw">
        <Formiz autoForm connect={form}>
          <ModalHeader>
            Principle of Owner Modal
            {customerInfo ? `(${customerInfo?.business_name} - ${customerInfo?.code})` : ''}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Stack spacing={2}>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'Owner'}
                    name={'owner'}
                    type={'alpha-with-space'}
                    placeholder={!isView ? 'Enter Owner Name' : ''}
                    maxLength={40}
                    isDisabled={isView}
                    required="Owner Name is required"
                  />

                  <FieldPhone
                    label={"Phone Number"}
                    name={"phone"}
                    placeholder={!isView ? "Enter Phone Number" : ""}
                    defaultCountry="AE"
                    isDisabled={isView}
                  />

                  <FieldEmailInput
                    label={'Email'}
                    name={`email`}
                    placeholder={!isView ? "Enter Email" : ""}
                    validations={[
                      {
                        handler: isEmail(),
                        message: 'Invalid email',
                      },
                    ]}
                    maxLength={100}
                    isDisabled={isView}
                    required={existValues?.email ? 'Email is required' : ''}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  {isView !== true && (
                    <FieldUpload
                      label="ID/Passport Copy"
                      name="id_passport_copy"
                      placeholder={!isView ? 'Passport Copy' : ''}
                      existingFileUrl={existValues?.id_passport_copy || ''}
                    />
                  )}
                  {isView === true && (
                    <Box w={'100%'} mt={0}>
                      <Text fontSize={'md'} mb={2}>
                        Passport Copy
                      </Text>
                      <DocumentDownloadButton
                        size={'sm'}
                        url={existValues?.id_passport_copy || ''}
                      />
                    </Box>
                  )}

                  <FieldTextarea
                    label="Remarks"
                    name="remarks"
                    placeholder={!isView ? 'Enter Remarks' : ''}
                    maxLength={100}
                    isDisabled={isView}
                  />
                </Stack>
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Stack
              direction="row"
              spacing={4}
              justify="center"
              width="100%"
              mt={4}
            >
              <Button type="button" colorScheme="red" onClick={handleClose}>
                Close
              </Button>
              {isView === false && (
                <Button
                  type="submit"
                  colorScheme="brand"
                  isLoading={saveItem.isLoading}
                  isDisabled={
                    !form.isValid ||
                    saveItem.isLoading ||
                    (isEdit ? !isFormValuesChanged : false)
                  }
                >
                  {isEdit === true ? 'Update' : 'Create '} Principle of Owner
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
