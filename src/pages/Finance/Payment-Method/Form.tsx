import { useState, useEffect } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, HStack, Heading, Stack,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { isEmail } from "@formiz/validations";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FieldInput } from "@/components/FieldInput";
import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldPhone } from "@/components/FieldPhone";
import { FieldSelect } from "@/components/FieldSelect";
import { FieldCheckbox } from "@/components/FieldCheckbox";
import { SlideIn } from "@/components/SlideIn";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";

import {
    usePaymentMethodDetails,
    useSaveFinanceBank,
    useSaveFinanceCard,
    useSaveFinanceCheque,
    PaymentMethod,
    usePaymentMethodDropdowns
} from "@/services/finance/payment-method/service";

import { METHOD_CONFIG, FieldConfig } from "@/pages/Finance/Payment-Method/config";

/* =========================================================
   Field Renderer
========================================================= */

const RenderField = ({ field, isView, dropdowns }: { field: FieldConfig; isView: boolean, dropdowns: any }) => {
    const commonProps = {
        name: field.name,
        label: field.label,
        placeholder: field.placeholder,
        isDisabled: isView,
    };

    switch (field.type) {
        case "email":
            return (
                <FieldEmailInput
                    {...commonProps}
                    validations={[{ handler: isEmail(), message: "Invalid email" }]}
                    maxLength={field.maxLength}
                />
            );
        case "phone":
            return (
                <FieldPhone
                    {...commonProps}
                    defaultCountry="AE"
                    required={field.required}
                />
            );
        case "checkbox":
            return (
                <FieldCheckbox
                    name={field.name}
                    label={field.label}
                    isDisabled={isView}
                />
            );
        case "select":
            return (
                <FieldSelect
                    {...commonProps}
                    required={field.required}
                    options={
                        field.options ??
                        (field.optionsKey ? dropdowns?.[field.optionsKey] : []) ??
                        []
                    }
                />
            );
        default:
            return (
                <FieldInput
                    {...commonProps}
                    required={field.required}
                    type={field.type ?? "text"}
                    maxLength={field.maxLength}
                />
            );
    }
};

/* =========================================================
   Form Page
========================================================= */

export const PaymentMethodForm = () => {
    const navigate = useNavigate();
    const { method, id, mode } = useParams<{ method: string; id?: string; mode?: string }>();

    const { data: dropdownData, isLoading: dropdownLoading } = usePaymentMethodDropdowns();

    const paymentMethod = method as PaymentMethod;
    const config = METHOD_CONFIG[paymentMethod];
    const title = config?.title ?? "Payment Method";
    const redirectLink = `/finance/payment-method/${paymentMethod}/master`;

    const isEdit = mode === "edit" || (!!id && !mode);
    const isView = mode === "view";

    const allFields = config?.rows.flat() ?? [];

    /* ---- API ---- */
    const { data: itemData, isLoading: infoLoading } = usePaymentMethodDetails(
        paymentMethod, id, { enabled: !!id }
    );

    const bankMutation = useSaveFinanceBank();
    const cardMutation = useSaveFinanceCard();
    const chequeMutation = useSaveFinanceCheque();

    const activeMutation =
        paymentMethod === "banks" ? bankMutation :
            paymentMethod === "cards" ? cardMutation :
                paymentMethod === "cheques" ? chequeMutation :
                    bankMutation;

    /* ---- Form ---- */
    const form = useForm({
        onValidSubmit: (values) => {
            const payload: any = {};
            allFields.forEach((f) => { payload[f.name] = values[f.name]; });

            if (isEdit) {
                activeMutation.mutate({ id, ...payload } as any, {
                    onSuccess: () => navigate(redirectLink),
                });
            } else {
                activeMutation.mutate(payload as any, {
                    onSuccess: () => navigate(redirectLink),
                });
            }
        },
    });

    const [formKeys, setFormKeys] = useState<string[]>([]);
    const [initialValues, setInitialValues] = useState<any>(null);
    const fields = useFormFields({ connect: form });

    useEffect(() => {
        if (itemData?.data) {
            const info = itemData.data;
            const keys = allFields.map((f) => f.name);
            const vals: any = {};
            keys.forEach((k) => { vals[k] = info[k]; });
            setFormKeys(keys);
            setInitialValues(vals);
            form.setValues(vals);
        }
    }, [itemData]);

    const isFormValuesChanged = isFormFieldsChanged({
        fields,
        initialValues,
        keys: formKeys,
    });

    return (
        <SlideIn>
            <Stack pl={2} spacing={2}>

                {/* Header */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb
                            fontWeight="medium"
                            fontSize="sm"
                            separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
                        >
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to={redirectLink}>
                                    Payment Methods
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>
                                    {isView ? `View ${title}` : isEdit ? `Edit ${title}` : `Add New ${title}`}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>

                        <Heading as="h4" size="md">
                            {isView ? `View ${title}` : isEdit ? `Edit ${title}` : `Add New ${title}`}
                        </Heading>
                    </Stack>

                    <ResponsiveIconButton
                        variant="@primary"
                        icon={<HiArrowNarrowLeft />}
                        size="sm"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </ResponsiveIconButton>
                </HStack>

                {/* Form */}
                <LoadingOverlay isLoading={infoLoading || dropdownLoading}>
                    <Stack spacing={2} p={4} bg="white" borderRadius="md" boxShadow="md">
                        <Formiz autoForm connect={form}>
                            <Stack spacing={4}>

                                {config?.rows.map((row, rowIndex) => (
                                    <Stack
                                        key={rowIndex}
                                        spacing={8}
                                        direction={{ base: "column", md: "row" }}
                                    >
                                        {row.map((field) => (
                                            <RenderField
                                                key={field.name}
                                                field={field}
                                                isView={isView}
                                                dropdowns={dropdownData}
                                            />
                                        ))}
                                    </Stack>
                                ))}

                                {/* Actions */}
                                <Stack
                                    direction={{ base: "column", md: "row" }}
                                    justify="center"
                                    alignItems="center"
                                    mt={6}
                                >
                                    {!isView && (
                                        <Button
                                            type="submit"
                                            colorScheme="brand"
                                            isLoading={activeMutation.isLoading}
                                            isDisabled={
                                                activeMutation.isLoading ||
                                                (isEdit ? !isFormValuesChanged : false)
                                            }
                                        >
                                            {isEdit ? "Update" : "Submit"}
                                        </Button>
                                    )}
                                    <Button
                                        colorScheme="red"
                                        isDisabled={activeMutation.isLoading}
                                        onClick={() => navigate(-1)}
                                    >
                                        Go Back
                                    </Button>
                                </Stack>

                            </Stack>
                        </Formiz>
                    </Stack>
                </LoadingOverlay>

            </Stack>
        </SlideIn>
    );
};

export default PaymentMethodForm;