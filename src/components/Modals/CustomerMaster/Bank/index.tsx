import { useEffect, useState } from 'react';

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
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';

import { FieldPhone } from "@/components/FieldPhone";
import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldInput } from '@/components/FieldInput';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useSaveBank } from "@/services/master/customer/service";

type BankModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  customerId: string;
  isEdit?: boolean;
  isView?: boolean;
  existValues?: any;
  customerInfo?: any;
};

export function BankModal({
  isOpen,
  onClose,
  customerId,
  isEdit,
  isView,
  existValues,
  customerInfo
}: BankModalProps) {

  const keys = [
    'beneficiary_name',
    'name',
    'address_line1',
    'address_line2',
    'branch',
    'ac_iban_no',
    'type_of_ac',
    'swift',
    'aba_routing_no',
    'contact_name',
    'phone',
    'fax',
    'mobile',
    'email',
  ];
  const saveItem = useSaveBank({
    onSuccess: ({ id }) => {
      onClose(true, id);
    },
    onError: () => {
      //onClose(false, 0);
    },
  });

  const form = useForm({
    onValidSubmit: async (values) => {
      const {
        beneficiary_name,
        name,
        address_line1,
        branch,
        ac_iban_no,
        type_of_ac,
        swift,
        contact_name,
        ...optionalValues
      } = values;

      const payload: any = {
        customer_id: customerId,
        beneficiary_name,
        name,
        address_line1,
        branch,
        ac_iban_no,
        type_of_ac,
        swift,
        contact_name,
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
      keys.map((key) => [key, existValues?.[key].toString() ?? ""])
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
            Customer Bank Modal{' '}
            {customerInfo
              ? `(${customerInfo?.business_name} - ${customerInfo?.code})`
              : ''}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <Stack spacing={2}>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'Type of Account'}
                    name={'type_of_ac'}
                    required={'Account Type is required'}
                    placeholder={!isView ? 'Enter account type' : ''}
                    type="alpha-with-space"
                    maxLength={30}
                    isDisabled={isView}
                  />

                  <FieldInput
                    label={'Beneficiary Name'}
                    name={'beneficiary_name'}
                    required={'Beneficiary Name is required'}
                    placeholder={!isView ? 'Enter beneficiary name' : ''}
                    type="alpha-with-space"
                    maxLength={70}
                    isDisabled={isView}
                  />

                  <FieldInput
                    label={'Bank Name'}
                    name={'name'}
                    required={'Name is required'}
                    placeholder={!isView ? 'Enter bank name' : ''}
                    type="alpha-with-space"
                    maxLength={70}
                    isDisabled={isView}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label="Address Line 1"
                    name="address_line1"
                    placeholder={!isView ? 'Enter Address Line 1' : ''}
                    required={'Address is required'}
                    maxLength={50}
                    isDisabled={isView}
                    type="text"
                  />

                  <FieldInput
                    label="Address Line 2"
                    name="address_line2"
                    maxLength={50}
                    isDisabled={isView}
                    type="text"
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'Branch'}
                    name={'branch'}
                    required={'Branch is required'}
                    placeholder={!isView ? 'Enter bank branch' : ''}
                    type="alpha-with-space"
                    maxLength={35}
                    isDisabled={isView}
                  />
                  <FieldInput
                    label={'Contact Name'}
                    name={'contact_name'}
                    required={'Contact Name is required'}
                    placeholder={!isView ? 'Enter Contact Name' : ''}
                    type="alpha-with-space"
                    maxLength={70}
                    isDisabled={isView}
                  />
                  <FieldInput
                    label={'IBAN Number'}
                    name={'ac_iban_no'}
                    required={'IBAN Number is required'}
                    placeholder={!isView ? 'Enter IBAN Number' : ''}
                    type="alpha-numeric"
                    maxLength={34}
                    isDisabled={isView}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'Swift code'}
                    name={'swift'}
                    required={'Swift code is required'}
                    placeholder={!isView ? 'Enter Bank Swift code' : ''}
                    type="alpha-numeric"
                    maxLength={11}
                    isDisabled={isView}
                  />
                  <FieldInput
                    label={'ABA Routing Number'}
                    name={'aba_routing_no'}
                    placeholder={!isView ? 'Enter ABA Routing Number' : ''}
                    type="alpha-numeric"
                    maxLength={11}
                    isDisabled={isView}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>

                  <FieldPhone
                    label={"Phone Number"}
                    name={"phone"}
                    placeholder={!isView ? "Enter Bank Phone Number" : ""}
                    defaultCountry="AE"
                    isDisabled={isView}
                  />

                  <FieldInput
                    label={'Fax No'}
                    name={'fax'}
                    placeholder={!isView ? 'Enter Bank Fax No' : ''}
                    type="phone-number"
                    maxLength={15}
                    isDisabled={isView}
                  />
                  <FieldInput
                    label={'Mobile Number'}
                    name={'mobile'}
                    placeholder={!isView ? 'Enter Bank Mobile Number' : ''}
                    type="phone-number"
                    maxLength={15}
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
                  {isEdit === true ? 'Update' : 'Create '} Bank
                </Button>
              )}
            </Stack>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
}

export default BankModal;
