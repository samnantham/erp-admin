import { useRef, useEffect, useState } from 'react';
import {
  Button, Modal, ModalBody, ModalCloseButton, ModalContent,
  ModalFooter, ModalHeader, ModalOverlay, Stack,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';

import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldPhone } from '@/components/FieldPhone';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { countryOptions } from '@/constants';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useSaveShippingAddress } from "@/services/master/customer/service";

type CustomerShippingAddressModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  customerId: string;
  isEdit?: boolean;
  isView?: boolean;
  existValues?: any;
  customerInfo?: any;
  createdInputValue?: string;
  onSuccess?: (createdValue?: unknown) => void;
};

const KEYS = [
  'attention', 'consignee_name', 'address_line1', 'address_line2',
  'city', 'state', 'zip_code', 'country', 'phone', 'fax', 'email', 'remarks',
];

export function CustomerShippingAddressModal({
  isOpen, onClose, customerId,
  isEdit, isView, existValues, customerInfo, createdInputValue, onSuccess
}: CustomerShippingAddressModalProps) {

  const saveItem = useSaveShippingAddress({
    onSuccess: ({ data }) => {
      if (onSuccess) {
        onSuccess(data);
      }
      onClose?.(true, data?.id);
    },
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

  const fields = useFormFields({ connect: form });
  const formRef = useRef(form);
  formRef.current = form;

  const [initialValues, setInitialValues] = useState<any>(null);
  const isChanged = isFormFieldsChanged({ fields, initialValues, keys: KEYS });

  useEffect(() => {
    if (!existValues || !isOpen) return;
    const init = Object.fromEntries(KEYS.map((k) => [k, existValues?.[k] ?? '']));
    setInitialValues(init);
    setTimeout(() => formRef.current.setValues(init), 0);
  }, [existValues, isOpen]);

  const p = (text: string) => (!isView ? text : '');
  const ev = (key: string) => existValues?.[key] ?? '';

  return (
    <Modal isOpen={isOpen} onClose={() => onClose(false, 0)} size="md" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxWidth="60vw">
        <div onSubmit={(e) => e.stopPropagation()}>
        <Formiz autoForm connect={form}>
          <ModalHeader>
            Customer Shipping Address Modal{customerInfo ? ` (${customerInfo.business_name} - ${customerInfo.code})` : ''}
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <Stack spacing={4}>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="Attention" name="attention" required="Attention is required" placeholder={p('Enter Attention')} type="alpha-with-space" maxLength={40} isDisabled={isView} defaultValue={
                  existValues?.attention ??
                  (!isEdit && createdInputValue ? createdInputValue : "")
                } />
                <FieldInput label="Consignee Name" name="consignee_name" required="Consignee Name is required" placeholder={p('Enter Consignee Name')} type="alpha-with-space" maxLength={40} isDisabled={isView} defaultValue={ev('consignee_name')} />
                <FieldEmailInput label="Email" name="email" placeholder={p('Enter Email')} validations={[{ handler: isEmail(), message: 'Invalid email' }]} required="Country is required"  maxLength={100} isDisabled={isView} defaultValue={existValues?.email?.toLowerCase() ?? ''} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="Address Line 1" name="address_line1" required="Address Line 1 is required" placeholder={p('Enter Address Line 1')} maxLength={50} isDisabled={isView} defaultValue={ev('address_line1')} />
                <FieldInput label="Address Line 2" name="address_line2" placeholder={p('Enter Address Line 2')} maxLength={50} isDisabled={isView} defaultValue={ev('address_line2')} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldPhone label="Phone Number" name="phone" placeholder={p('Enter Phone Number')} defaultValue={ev('phone')} defaultCountry="AE" isDisabled={isView} required={"Phone Number Required"}/>
                <FieldInput label="Fax No" name="fax" placeholder={p('Enter Fax No')} type="phone-number" maxLength={15} isDisabled={isView} defaultValue={ev('fax')} />
                <FieldInput label="City" name="city" placeholder={p('Enter city')} type="alpha-numeric-with-space" maxLength={40} isDisabled={isView} defaultValue={ev('city')} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput label="State" name="state" placeholder={p('Enter State')} type="alpha-with-space" maxLength={40} isDisabled={isView} defaultValue={ev('state')} />
                <FieldInput label="Zipcode" name="zip_code" placeholder={p('Enter Zipcode')} type="integer" maxLength={8} isDisabled={isView} defaultValue={ev('zip_code')} />
                <FieldSelect label="Country" name="country" placeholder={p('Enter Country')} required="Country is required" options={countryOptions} isDisabled={isView} defaultValue={ev('country')} className={isView ? 'disabled-input' : ''} />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldTextarea label="Remarks" name="remarks" placeholder={p('Enter Remarks')} maxLength={100} isDisabled={isView} defaultValue={ev('remarks')} />
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
                  {isEdit ? 'Update' : 'Create'} Address
                </Button>
              )}
            </Stack>
          </ModalFooter>
        </Formiz>
        </div>
      </ModalContent>
    </Modal>
  );
}

export default CustomerShippingAddressModal;