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
import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldPhone } from '@/components/FieldPhone';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { countryOptions } from '@/constants';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useSaveTraderReference } from "@/services/master/customer/service";

type TraderReferenceModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  customerId: string;
  isEdit?: boolean;
  isView?: boolean;
  existValues?: any;
  customerInfo?: any;
};

export function TraderReferenceModal({
  isOpen,
  onClose,
  customerId,
  isEdit,
  isView,
  existValues,
  customerInfo
}: TraderReferenceModalProps) {

  const keys = [
    'vendor_name',
    'attention',
    'address_line1',
    'address_line2',
    'city',
    'state',
    'zip_code',
    'country',
    'phone',
    'fax',
    'email',
    'remarks',
  ];
  const saveItem = useSaveTraderReference({
    onSuccess: ({ id }) => {
      onClose(true, id);
    }
  });

  const form = useForm({
    onValidSubmit: async (values) => {
      console.log(values);
      const {
        attention,
        vendor_name,
        address_line1,
        address_line2,
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
        vendor_name,
        address_line1,
        address_line2,
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
    keys: keys,
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
            Trader Reference Modal{' '}
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
                    label={'Attention'}
                    name={'attention'}
                    required={'Attention is required'}
                    placeholder={!isView ? 'Enter Attention' : ''}
                    type={'alpha-with-space'}
                    maxLength={40}
                    isDisabled={isView}
                    defaultValue={existValues?.attention ?? ''}
                  />
                </Stack>

                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'Vendor Name'}
                    name={'vendor_name'}
                    required={'Vendor Name is required'}
                    placeholder={!isView ? 'Enter Vendor Name' : ''}
                    type={'alpha-numeric-with-space'}
                    maxLength={40}
                    isDisabled={isView}
                    defaultValue={existValues?.vendor_name ?? ''}
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
                    defaultValue={
                      existValues?.email
                        ? existValues?.email.toLowerCase()
                        : ""
                    }
                    required={existValues?.email ? 'Email is required' : ''}
                  />

                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label="Address Line 1"
                    name="address_line1"
                    placeholder={!isView ? 'Enter Address Line 1' : ''}
                    required={'Address Line 1 is required'}
                    maxLength={50}
                    isDisabled={isView}
                    defaultValue={existValues?.address_line1 ?? ''}
                  />

                  <FieldInput
                    label="Address Line 2"
                    name="address_line2"
                    placeholder={!isView ? 'Enter Address Line 2' : ''}
                    maxLength={50}
                    isDisabled={isView}
                    defaultValue={existValues?.address_line2 ?? ''}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'City'}
                    name={'city'}
                    placeholder={!isView ? 'Enter city' : ''}
                    type={'alpha-numeric-with-space'}
                    maxLength={40}
                    isDisabled={isView}
                    defaultValue={existValues?.city ?? ''}
                  />
                  <FieldInput
                    label={'State'}
                    name={'state'}
                    placeholder={!isView ? 'Enter State' : ''}
                    type={'alpha-with-space'}
                    maxLength={40}
                    defaultValue={existValues?.state ?? ''}
                  />
                  <FieldInput
                    label={'Zipcode'}
                    name={'zip_code'}
                    placeholder={!isView ? 'Enter Zipcode' : ''}
                    type="integer"
                    maxLength={8}
                    isDisabled={isView}
                    defaultValue={existValues?.zip_code ?? ''}
                  />

                  <FieldSelect
                    label={'Country'}
                    name={'country'}
                    placeholder={!isView ? 'Enter Country' : ''}
                    required={'Country is required'}
                    options={countryOptions}
                    isDisabled={isView}
                    defaultValue={existValues?.country ?? ''}
                    className={isView ? 'disabled-input' : ''}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldPhone
                    label={"Phone Number"}
                    name={"phone"}
                    placeholder={!isView ? "Enter Phone Number" : ""}
                    defaultValue={existValues?.phone ?? ''}
                    defaultCountry="AE"
                    isDisabled={isView}
                  />

                  <FieldInput
                    label={'Fax'}
                    name={'fax'}
                    placeholder={!isView ? 'Enter Fax' : ''}
                    type="phone-number"
                    maxLength={15}
                    isDisabled={isView}
                    defaultValue={existValues?.fax ?? ''}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldTextarea
                    label="Remarks"
                    name="remarks"
                    placeholder={!isView ? 'Enter Remarks' : ''}
                    maxLength={100}
                    isDisabled={isView}
                    defaultValue={existValues?.remarks ?? ''}
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
                  {isEdit === true ? 'Update' : 'Create '} Trader Reference
                </Button>
              )}
            </Stack>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
}

export default TraderReferenceModal;
