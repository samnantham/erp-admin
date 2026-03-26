import { useRef, useEffect, useState } from 'react';
import {
  Button, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Stack,
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

const KEYS = [
  'beneficiary_name', 'name', 'address_line1', 'address_line2',
  'branch', 'ac_iban_no', 'type_of_ac', 'swift', 'aba_routing_no',
  'contact_name', 'phone', 'fax', 'mobile', 'email',
];

const REQUIRED_KEYS = new Set([
  'beneficiary_name', 'name', 'address_line1', 'branch',
  'ac_iban_no', 'type_of_ac', 'swift', 'contact_name',
]);

export function BankModal({
  isOpen, onClose, customerId,
  isEdit, isView, existValues, customerInfo,
}: BankModalProps) {

  const saveItem = useSaveBank({
    onSuccess: ({ data }) => onClose(true, data),
  });

  const form = useForm({
    onValidSubmit: (values) => {
      const required = Object.fromEntries(
        KEYS.filter((k) => REQUIRED_KEYS.has(k)).map((k) => [k, values[k]])
      );
      const optional = Object.fromEntries(
        Object.entries(values).filter(
          ([k, v]) => !REQUIRED_KEYS.has(k) && v !== null && v !== ''
        )
      );
      const payload: any = { customer_id: customerId, ...required, ...optional };
      if (isEdit) payload.id = existValues.id;
      saveItem.mutate(payload);
    },
  });

  const fields = useFormFields({ connect: form });
  const formRef = useRef(form);
  formRef.current = form;

  const [initialValues, setInitialValues] = useState<any>(null);
  const isChanged = isFormFieldsChanged({ fields, initialValues, keys: KEYS });

  useEffect(() => {
    if (!existValues || !isOpen) return;

    const init = Object.fromEntries(KEYS.map((k) => [k, existValues?.[k] ?? '']));
    setInitialValues(init);

    setTimeout(() => {
      formRef.current.setValues(init);
    }, 0);

  }, [existValues, isOpen]);

  const p = (text: string) => (!isView ? text : '');

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false, 0)} size="md" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxWidth="60vw">
        <Formiz autoForm connect={form}>
          <ModalHeader>
            Customer Bank Modal{customerInfo ? ` (${customerInfo.business_name} - ${customerInfo.code})` : ''}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Stack spacing={4}>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="Type of Account" name="type_of_ac" required="Account Type is required" placeholder={p('Enter account type')} type="alpha-with-space" maxLength={30} isDisabled={isView} />
                <FieldInput label="Beneficiary Name" name="beneficiary_name" required="Beneficiary Name is required" placeholder={p('Enter beneficiary name')} type="alpha-with-space" maxLength={70} isDisabled={isView} />
                <FieldInput label="Bank Name" name="name" required="Name is required" placeholder={p('Enter bank name')} type="alpha-with-space" maxLength={70} isDisabled={isView} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="Address Line 1" name="address_line1" required="Address is required" placeholder={p('Enter Address Line 1')} maxLength={50} isDisabled={isView} type="text" />
                <FieldInput label="Address Line 2" name="address_line2" maxLength={50} isDisabled={isView} type="text" />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="Branch" name="branch" required="Branch is required" placeholder={p('Enter bank branch')} type="alpha-with-space" maxLength={35} isDisabled={isView} />
                <FieldInput label="Contact Name" name="contact_name" required="Contact Name is required" placeholder={p('Enter Contact Name')} type="alpha-with-space" maxLength={70} isDisabled={isView} />
                <FieldInput label="IBAN Number" name="ac_iban_no" required="IBAN Number is required" placeholder={p('Enter IBAN Number')} type="alpha-numeric" maxLength={34} isDisabled={isView} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="Swift Code" name="swift" required="Swift code is required" placeholder={p('Enter Bank Swift code')} type="alpha-numeric" maxLength={11} isDisabled={isView} />
                <FieldInput label="ABA Routing Number" name="aba_routing_no" placeholder={p('Enter ABA Routing Number')} type="alpha-numeric" maxLength={11} isDisabled={isView} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldPhone label="Phone Number" name="phone" placeholder={p('Enter Bank Phone Number')} defaultCountry="AE" isDisabled={isView} />
                <FieldInput label="Fax No" name="fax" placeholder={p('Enter Bank Fax No')} type="phone-number" maxLength={15} isDisabled={isView} />
                <FieldInput label="Mobile Number" name="mobile" placeholder={p('Enter Bank Mobile Number')} type="phone-number" maxLength={15} isDisabled={isView} />
                <FieldEmailInput label="Email" name="email" placeholder={p('Enter Email')} validations={[{ handler: isEmail(), message: 'Invalid email' }]} maxLength={100} isDisabled={isView} />
              </Stack>

            </Stack>
          </ModalBody>

          <ModalFooter>
            <Stack direction="row" spacing={4} justify="center" width="100%" mt={4}>
              <Button colorScheme="red" onClick={() => onClose(false, 0)}>Close</Button>
              {!isView && (
                <Button
                  type="submit"
                  colorScheme="brand"
                  isLoading={saveItem.isLoading}
                  isDisabled={!form.isValid || saveItem.isLoading || (isEdit ? !isChanged : false)}
                >
                  {isEdit ? 'Update' : 'Create'} Bank
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