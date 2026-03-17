import { useRef, useEffect, useState } from 'react';
import {
    Button, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Stack,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';

import { FieldPhone } from '@/components/FieldPhone';
import { FieldEmailInput } from '@/components/FieldEmailInput';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { countryOptions } from '@/constants';

type ShippingAddressModalProps = {
    isOpen: boolean;
    onClose: (status: boolean, isEdit: boolean, data: any) => void;
    isEdit?: boolean;
    isView?: boolean;
    existValues?: any;
    customerInfo?: any;
};

const KEYS = [
    'attention', 'consignee_name', 'address_line1', 'address_line2',
    'city', 'state', 'zip_code', 'country',
    'phone', 'fax', 'email', 'remarks',
];

export function ShippingAddressModal({
    isOpen, onClose,
    isEdit, isView, existValues, customerInfo,
}: ShippingAddressModalProps) {

    const form = useForm({
        onValidSubmit: (values) => {
            const payload: any = Object.fromEntries(
                KEYS.map((k) => [k, values[k] ?? ''])
            );

            if (isEdit) {
                // Preserve record id so parent can match the row
                if (existValues?.id !== undefined) payload.id = existValues.id;
                // Include customer_id only on edit — it is known for saved records
                if (existValues?.customer_id !== undefined) payload.customer_id = existValues.customer_id;
            }
            // On create: customer_id is unknown, intentionally omitted

            onClose(true, !!isEdit, payload);
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
        setTimeout(() => { formRef.current.setValues(init); }, 0);
    }, [existValues, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setInitialValues(null);
            form.reset();
        }
    }, [isOpen]);

    const p = (text: string) => (!isView ? text : '');

    return (
        <Modal isOpen={isOpen} onClose={() => onClose(false, !!isEdit, null)} size="md" closeOnOverlayClick={false} closeOnEsc={false}>
            <ModalOverlay />
            <ModalContent maxWidth="60vw">
                <Formiz autoForm connect={form}>
                    <ModalHeader>
                        Shipping Address{customerInfo ? ` (${customerInfo.business_name} - ${customerInfo.code})` : ''}
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <Stack spacing={4}>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldInput
                                    label="Attention"
                                    name="attention"
                                    required="Attention is required"
                                    placeholder={p('Enter attention')}
                                    type="alpha-with-space"
                                    maxLength={40}
                                    isDisabled={isView}
                                />
                                <FieldInput
                                    label="Consignee Name"
                                    name="consignee_name"
                                    required="Consignee Name is required"
                                    placeholder={p('Enter consignee name')}
                                    type="alpha-with-space"
                                    maxLength={40}
                                    isDisabled={isView}
                                />
                            </Stack>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldInput
                                    label="Address Line 1"
                                    name="address_line1"
                                    required="Address is required"
                                    placeholder={p('Enter address line 1')}
                                    type="text"
                                    maxLength={50}
                                    isDisabled={isView}
                                />
                                <FieldInput
                                    label="Address Line 2"
                                    name="address_line2"
                                    placeholder={p('Enter address line 2')}
                                    type="text"
                                    maxLength={50}
                                    isDisabled={isView}
                                />
                            </Stack>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldInput
                                    label="City"
                                    name="city"
                                    placeholder={p('Enter city')}
                                    type="alpha-numeric-with-space"
                                    maxLength={40}
                                    isDisabled={isView}
                                />
                                <FieldInput
                                    label="State"
                                    name="state"
                                    placeholder={p('Enter state')}
                                    type="alpha-with-space"
                                    maxLength={40}
                                    isDisabled={isView}
                                />
                                <FieldInput
                                    label="Zip Code"
                                    name="zip_code"
                                    placeholder={p('Enter zip code')}
                                    type="integer"
                                    maxLength={8}
                                    isDisabled={isView}
                                />
                            </Stack>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldSelect
                                    label="Country"
                                    name="country"
                                    required="Country is required"
                                    placeholder={p('Select country')}
                                    options={countryOptions}
                                    isDisabled={isView}
                                />
                            </Stack>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldPhone
                                    label="Phone Number"
                                    name="phone"
                                    placeholder={p('Enter phone number')}
                                    defaultCountry="AE"
                                    isDisabled={isView}
                                />
                                <FieldInput
                                    label="Fax No"
                                    name="fax"
                                    placeholder={p('Enter fax no')}
                                    type="phone-number"
                                    maxLength={15}
                                    isDisabled={isView}
                                />
                                <FieldEmailInput
                                    label="Email"
                                    name="email"
                                    placeholder={p('Enter email')}
                                    validations={[{ handler: isEmail(), message: 'Invalid email' }]}
                                    maxLength={100}
                                    isDisabled={isView}
                                />
                            </Stack>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldTextarea
                                    label="Remarks"
                                    name="remarks"
                                    placeholder={p('Enter remarks')}
                                    maxLength={100}
                                    isDisabled={isView}
                                />
                            </Stack>

                        </Stack>
                    </ModalBody>

                    <ModalFooter>
                        <Stack direction="row" spacing={4} justify="center" width="100%" mt={4}>
                            <Button colorScheme="red" onClick={() => onClose(false, !!isEdit, null)}>Close</Button>
                            {!isView && (
                                <Button
                                    type="submit"
                                    colorScheme="brand"
                                    isDisabled={!form.isValid || (isEdit ? !isChanged : false)}
                                >
                                    {isEdit ? 'Update' : 'Add'} Shipping Address
                                </Button>
                            )}
                        </Stack>
                    </ModalFooter>
                </Formiz>
            </ModalContent>
        </Modal>
    );
}

export default ShippingAddressModal;