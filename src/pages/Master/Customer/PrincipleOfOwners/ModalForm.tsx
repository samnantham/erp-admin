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
import { FieldUpload } from '@/components/FieldUpload';
import { FieldTextarea } from '@/components/FieldTextarea';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';

type PrincipleOfOwnerModalProps = {
    isOpen: boolean;
    onClose: (status: boolean, isEdit: boolean, data: any) => void;
    isEdit?: boolean;
    isView?: boolean;
    existValues?: any;
    customerInfo?: any;
};

const KEYS = [
    'owner', 'phone', 'email', 'id_passport_copy', 'remarks',
];

export function PrincipleOfOwnerModal({
    isOpen, onClose,
    isEdit, isView, existValues, customerInfo,
}: PrincipleOfOwnerModalProps) {

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
            <ModalContent maxWidth="50vw">
                <Formiz autoForm connect={form}>
                    <ModalHeader>
                        Principle of Owner{customerInfo ? ` (${customerInfo.business_name} - ${customerInfo.code})` : ''}
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <Stack spacing={4}>

                            <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                                <FieldInput
                                    label="Owner Name"
                                    name="owner"
                                    required="Owner Name is required"
                                    placeholder={p('Enter owner name')}
                                    type="alpha-with-space"
                                    maxLength={40}
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
                                <FieldUpload
                                    label="ID / Passport Copy"
                                    name="id_passport_copy"
                                    placeholder={p('Upload ID or passport copy')}
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
                                    {isEdit ? 'Update' : 'Add'} Owner
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