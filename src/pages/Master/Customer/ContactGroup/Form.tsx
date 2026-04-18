import { useState, useEffect } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Button,
    HStack,
    Heading,
    Stack,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";

import { useSaveContactGroup, useContactGroupDetails } from "@/services/master/customer/service";
import { useCustomerDropdowns, useCustomerList } from "@/services/master/customer/service";

import ConfirmationPopup from '@/components/ConfirmationPopup';
import LoadingOverlay from "@/components/LoadingOverlay";

export const ContactGroupForm = () => {
    const navigate = useNavigate();
    const { id, mode } = useParams<{ id?: string; mode?: string }>();
    const [queryParams, setQueryParams] = useState<any>({});
    const isEdit = mode === "edit";
    const isView = mode === "view";

    const { data: groupData, isLoading: infoLoading } = useContactGroupDetails(id, { enabled: !!id });
    const { data: dropdownData, isLoading: dropdownLoading } = useCustomerDropdowns();

    const [openConfirmation, setOpenConfirmation] = useState(false);
    const [pendingContactType, setPendingContactType] = useState<any>(null);
    const [prevContactType, setPrevContactType] = useState<any>(null);

    const saveContactGroup = useSaveContactGroup();
    const contactTypeOptions = dropdownData?.contact_types ?? [];
    const [initialValues, setInitialValues] = useState<any>(null);

    const handleConfirm = () => {
        form.setValues({ "contact_type_id": pendingContactType, "members": [] });

        setPrevContactType(pendingContactType);
        setPendingContactType(null);
        setOpenConfirmation(false);
    };

    const handleClose = () => {
        // revert to previous value
        form.setValues({ "contact_type_id": prevContactType });

        setPendingContactType(null);
        setOpenConfirmation(false);
    };

    const form = useForm({
        onValidSubmit: (values) => {
            const payload: any = {
                name: values.name,
                contact_type_id: values.contact_type_id,
                members: (values.members ?? []).map((m: any) => ({
                    contact_id: m,
                })),
            };

            console.log(payload)

            saveContactGroup.mutate(
                isEdit ? { id, ...payload } : payload,
                { onSuccess: () => navigate("/contact-management/contact-group") }
            );
        },
    });

    /* ---------- Prefill for edit / view ---------- */
    useEffect(() => {
        if (groupData?.data) {
            const group = groupData.data;

            const initial = {
                name: group.name,
                contact_type_id: group.contact_type_id,

                // ✅ set members directly in form (UI format)
                members: (group.members ?? []).map((m: any) => m.contact_id)
            };

            console.log(initial)

            setInitialValues(initial);
            form.setValues(initial);
        }
    }, [groupData]);

    const fields = useFormFields({ connect: form });
    const isFormValuesChanged = isFormFieldsChanged({
        fields,
        initialValues,
        keys: ["name", "contact_type_id"],
    });

    const contactTypeId = fields?.contact_type_id?.value;

    const { data: customerListData, isLoading: customerListLoading } =
        useCustomerList({
            queryParams,
        });

    const customerOptions = customerListData?.data ?? [];

    useEffect(() => {
        if (contactTypeId) {
            setQueryParams({
                contact_type_id: contactTypeId,
            });
        } else {
            setQueryParams({}); // ✅ important
        }
    }, [contactTypeId]);

    useEffect(() => {
        if (fields?.contact_type_id?.value && prevContactType === null) {
            setPrevContactType(fields.contact_type_id.value);
        }
    }, [fields?.contact_type_id?.value]);


    return (
        <SlideIn>
            <Stack pl={2} spacing={2}>
                <HStack justify={"space-between"}>
                    <Stack spacing={0}>
                        <Breadcrumb
                            fontWeight="medium"
                            fontSize="sm"
                            separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
                        >
                            <BreadcrumbItem color={"brand.500"}>
                                <BreadcrumbLink as={Link} to="/contact-management/contact-group">
                                    Contact Group
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color={"gray.500"}>
                                <BreadcrumbLink>
                                    {isView ? "View Group" : isEdit ? "Edit Group" : "Add New Group"}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>

                        <Heading as="h4" size={"md"}>
                            {isView ? "View Group" : isEdit ? "Edit Group" : "Add New Group"}
                        </Heading>
                    </Stack>

                    <ResponsiveIconButton
                        variant={"@primary"}
                        icon={<HiArrowNarrowLeft />}
                        size={"sm"}
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <LoadingOverlay isLoading={dropdownLoading || infoLoading}>
                    <Stack spacing={2} p={4} bg={"white"} borderRadius={"md"} boxShadow={"md"}>
                        <Formiz autoForm connect={form}>

                            {/* Row 1 — Name + Contact Type */}
                            <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                                <FieldInput
                                    type="text"
                                    label="Group Name"
                                    name="name"
                                    placeholder="Enter group name"
                                    required={"Group name is required"}
                                    isDisabled={isView}
                                />

                                <FieldSelect
                                    label="Contact Type"
                                    name="contact_type_id"
                                    placeholder={(isView && !initialValues.contact_type_id) ? ' - ' : "Select contact type"}
                                    options={contactTypeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    isDisabled={isView}
                                    className={isView ? "disabled-input" : ""}
                                    onValueChange={(val) => {
                                        const currentMembers = fields?.members?.value ?? [];

                                        // 👉 if members already selected → ask confirmation
                                        if (currentMembers.length > 0) {
                                            setPendingContactType(val);
                                            setOpenConfirmation(true);
                                        } else {
                                            form.setValues({ "contact_type_id": val });
                                            setPrevContactType(val);
                                        }
                                    }}
                                />
                            </Stack>

                            {/* Row 2 — Members */}
                            <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                                <FieldSelect
                                    label="Members"
                                    name="members"
                                    placeholder="Select members..."
                                    options={customerOptions}
                                    isClearable 
                                    isMulti
                                    selectProps={{
                                        isLoading: customerListLoading,

                                    }}
                                    required={"Group Members required"}
                                    isDisabled={isView}
                                    className={isView ? "disabled-input" : ""}
                                />
                            </Stack>

                            <Stack
                                direction={{ base: "column", md: "row" }}
                                justify={"center"}
                                alignItems={"center"}
                                mt={6}
                            >
                                {!isView && (
                                    <Button
                                        type="submit"
                                        colorScheme="brand"
                                        isLoading={saveContactGroup.isLoading}
                                        isDisabled={
                                            saveContactGroup.isLoading ||
                                            !form.isValid ||
                                            (isEdit ? !isFormValuesChanged : false)
                                        }
                                    >
                                        {isEdit ? "Update" : "Submit"}
                                    </Button>
                                )}
                                <Button
                                    colorScheme="red"
                                    isDisabled={saveContactGroup.isLoading}
                                    onClick={() => navigate(-1)}
                                >
                                    Go Back
                                </Button>
                            </Stack>
                        </Formiz>
                    </Stack>
                </LoadingOverlay>

                <ConfirmationPopup
                    isOpen={openConfirmation}
                    onClose={handleClose}
                    onConfirm={handleConfirm}
                    headerText="Change Contact Type"
                    bodyText="Changing contact type will remove all selected members. Do you want to continue?"
                />
            </Stack>
        </SlideIn>
    );
};

export default ContactGroupForm;