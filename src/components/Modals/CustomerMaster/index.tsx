import { useRef, useEffect, useState } from 'react';
import {
    Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Stack,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';
import dayjs from 'dayjs';

import { FieldSelect } from '@/components/FieldSelect';
import { FieldInput } from '@/components/FieldInput';
import { FieldYearPicker } from '@/components/FieldYearPicker';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { FieldUpload } from '@/components/FieldUpload';
import { FieldTextarea } from '@/components/FieldTextarea';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { useSubmasterItemIndex } from "@/services/submaster/service";
import {
    useSaveCustomer,
    useCustomerDropdowns
} from '@/services/master/customer/service';

type CustomerModalProps = {
    isOpen: boolean;
    onClose: (status: boolean, id: any) => void;
    isEdit?: boolean;
    isView?: boolean;
    existValues?: any;
    createdInputValue?: string;
    onSuccess?: (createdValue?: unknown) => void;
};

const KEYS = [
    'contact_type_id', 'business_name', 'business_since', 'year_of_business',
    'business_type_id', 'is_foreign_entity',
    'currency_id', 'nature_of_business', 'email',
    'license_trade_no', 'license_trade_exp_date', 'license_trade_url',
    'vat_tax_id', 'vat_tax_url',
    'payment_mode_id', 'payment_term_id', 'total_credit_amount', 'total_credit_period',
    'remarks',
];

const REQUIRED_KEYS = new Set([
    'contact_type_id', 'business_name', 'business_type_id',
    'is_foreign_entity', 'currency_id', 'email',
    'payment_mode_id', 'payment_term_id',
]);

export function CustomerModal({
    isOpen, onClose,
    isEdit, isView, existValues,
    createdInputValue,
    onSuccess
}: CustomerModalProps) {


    const { data: paymentTermList } = useSubmasterItemIndex("payment-terms", {});
    const paymentTerms: TODO[] = paymentTermList?.data ?? [];
    const { data: dropdownData, isLoading: dropdownLoading } = useCustomerDropdowns();

    const [tocDisabled, setTOCDisabled] = useState<any>(true);
    const businessTypeOptions = dropdownData?.business_types ?? [];
    const contactTypeOptions = dropdownData?.contact_types ?? [];
    const currencyOptions = dropdownData?.currencies ?? [];
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentTermsOptions = dropdownData?.payment_terms ?? [];

    const saveItem = useSaveCustomer(
        {
            onSuccess: ({ data }) => {
                if (onSuccess) {
                    onSuccess(data);
                }
                onClose?.(true, data?.id);
            },
        }
    );

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
            const payload: any = {...required, ...optional };
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

    const handlePaymentTermsChange = (paymentTerm: any) => {
        const selected = paymentTerms?.find((emp) => String(emp.id) === String(paymentTerm));
        if (selected && selected.is_fixed === true) {
            setTOCDisabled(true);
            form.setValues({ total_credit_amount: ' ', total_credit_period: ' ' });
        } else if (selected && selected.is_fixed === false) {
            setTOCDisabled(false);
            form.setValues({ total_credit_amount: '', total_credit_period: selected.credit_days?.toString() });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => onClose(false, 0)} size="md" closeOnOverlayClick={false} closeOnEsc={false}>
            <ModalOverlay />
            <ModalContent maxWidth="75vw">
                <div onSubmit={(e) => e.stopPropagation()}>
                    <Formiz autoForm connect={form}>
                        <ModalHeader>
                            Customer Modal
                        </ModalHeader>
                        <ModalCloseButton />

                        <ModalBody>
                            <Box p={4}>

                                {/* Contact & Business Info */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <FieldSelect
                                        label="Type of Contact"
                                        name="contact_type_id"
                                        required="Type of Contact is required"
                                        placeholder="Select type of contact"
                                        options={contactTypeOptions}
                                        isDisabled={isView}
                                        selectProps={{
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: dropdownLoading,
                                        }}
                                    />
                                    <FieldInput
                                        label="Business Name"
                                        name="business_name"
                                        required="Business Name is required"
                                        placeholder="Enter business name"
                                        maxLength={40}
                                        type="alpha-numeric-with-space"
                                        isDisabled={isView}
                                        defaultValue={createdInputValue ? createdInputValue : ""}
                                    />
                                    <FieldYearPicker
                                        name="business_since"
                                        label="Business Since"
                                        placeholder="Select year"
                                        yearRange={{ start: 1950, end: dayjs().year() }}
                                        isDisabled={isView}
                                        onValueChange={(value) => {
                                            if (value) {
                                                form.setValues({
                                                    year_of_business: (
                                                        Number(dayjs().year()) - Number(dayjs(value).year())
                                                    ).toString(),
                                                });
                                            }
                                        }}
                                    />
                                    <FieldInput
                                        label="Years in Business"
                                        name="year_of_business"
                                        placeholder="Years in Business"
                                        defaultValue="0"
                                        isDisabled={true}
                                    />
                                </Stack>

                                {/* Business Type & Foreign Entity */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <FieldSelect
                                        label="Types of Business"
                                        name="business_type_id"
                                        required="Business Type is required"
                                        placeholder="Select business type"
                                        options={businessTypeOptions}
                                        isDisabled={isView}
                                        selectProps={{
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: dropdownLoading,
                                        }}
                                    />
                                    <FieldSelect
                                        label="Foreign Entity"
                                        name="is_foreign_entity"
                                        required="Foreign Entity is required"
                                        placeholder="Select foreign entity"
                                        options={[
                                            { value: 'true', label: 'Yes' },
                                            { value: 'false', label: 'No' },
                                        ]}
                                        isDisabled={isView}
                                        selectProps={{
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: dropdownLoading,
                                        }}
                                    />
                                </Stack>

                                {/* Currency, Nature of Business, Email */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <FieldSelect
                                        label="Currency"
                                        name="currency_id"
                                        required="Currency is required"
                                        placeholder="Select currency"
                                        options={currencyOptions}
                                        isDisabled={isView}
                                        selectProps={{
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: dropdownLoading,
                                        }}
                                    />
                                    <FieldInput
                                        label="Nature of Business"
                                        name="nature_of_business"
                                        placeholder="Enter nature of business"
                                        maxLength={35}
                                        type="alpha-numeric-with-space"
                                        isDisabled={isView}
                                    />
                                    <FieldInput
                                        label="Email"
                                        name="email"
                                        type="email"
                                        onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                                        placeholder="Enter email"
                                        validations={[{ handler: isEmail(), message: 'Invalid email' }]}
                                        required="Email is required"
                                        maxLength={100}
                                        isDisabled={isView}
                                    />
                                </Stack>

                                {/* License / Trade Fields */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <Stack w="full" spacing={8} direction={{ base: 'column', md: 'row' }}>
                                        <FieldInput
                                            label="License / Trade Number"
                                            name="license_trade_no"
                                            placeholder="Enter license / trade number"
                                            maxLength={25}
                                            type="alpha-numeric-with-special"
                                            isDisabled={isView}
                                            required={
                                                fields?.license_trade_exp_date?.value || fields?.license_trade_url?.value
                                                    ? 'License / Trade Number required' : ''
                                            }
                                        />
                                        <FieldDayPicker
                                            label="License / Trade Expiry Date"
                                            name="license_trade_exp_date"
                                            placeholder="Enter license / trade expiry date"
                                            disabledDays={{ before: new Date() }}
                                            isDisabled={isView}
                                            required={
                                                fields?.license_trade_no?.value || fields?.license_trade_url?.value
                                                    ? 'License / Trade Expiry Date required' : ''
                                            }
                                        />
                                    </Stack>
                                    <FieldUpload
                                        label="License / Trade Doc Upload"
                                        name="license_trade_url"
                                        placeholder="Upload license / trade doc"
                                        isDisabled={isView}
                                        required={
                                            fields?.license_trade_no?.value || fields?.license_trade_exp_date?.value
                                                ? 'License / Trade Doc required' : ''
                                        }
                                    />
                                </Stack>

                                {/* VAT / Tax Fields */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <FieldInput
                                        label="Vat / Tax ID"
                                        name="vat_tax_id"
                                        type="alpha-numeric-with-special"
                                        placeholder="Enter vat / tax id"
                                        maxLength={30}
                                        isDisabled={isView}
                                        required={fields?.vat_tax_url?.value ? 'Vat / Tax ID required' : ''}
                                    />
                                    <FieldUpload
                                        label="Vat / Tax Doc Upload"
                                        name="vat_tax_url"
                                        placeholder="Upload vat / tax doc"
                                        isDisabled={isView}
                                        required={fields?.vat_tax_id?.value ? 'Vat / Tax Doc required' : ''}
                                    />
                                </Stack>

                                {/* Payment Fields */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <FieldSelect
                                        label="Mode of Payment"
                                        name="payment_mode_id"
                                        required="Mode of Payment is required"
                                        placeholder="Select mode of payment"
                                        options={paymentModeOptions}
                                        isDisabled={isView}
                                        selectProps={{
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: dropdownLoading,
                                        }}
                                    />
                                    <FieldSelect
                                        label="Payment Terms"
                                        name="payment_term_id"
                                        required="Payment Terms is required"
                                        placeholder="Select payment terms"
                                        options={paymentTermsOptions}
                                        isDisabled={isView}
                                        onValueChange={(value) => handlePaymentTermsChange(value)}
                                        selectProps={{
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: dropdownLoading,
                                        }}
                                    />
                                    <FieldInput
                                        key="total_credit_amount"
                                        label="Total Credit Amount"
                                        name="total_credit_amount"
                                        required={!tocDisabled ? 'Total Credit Amount is required' : ''}
                                        placeholder="Enter Total Credit Amount"
                                        type="decimal"
                                        maxLength={10}
                                        isDisabled={isView || tocDisabled}
                                    />
                                    <FieldInput
                                        key="total_credit_period"
                                        label="Total Credit Period (Days)"
                                        name="total_credit_period"
                                        required={!tocDisabled ? 'Total Credit Period is required' : ''}
                                        placeholder="Enter Total Credit Period"
                                        type="integer"
                                        maxLength={6}
                                        isDisabled={true}
                                    />
                                </Stack>

                                {/* Remarks */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                                    <FieldTextarea
                                        label="Remarks"
                                        name="remarks"
                                        placeholder="Enter remarks"
                                        maxLength={100}
                                        isDisabled={isView}
                                    />
                                </Stack>

                            </Box>
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
                                        {isEdit ? 'Update' : 'Create'} Customer
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

export default CustomerModal;