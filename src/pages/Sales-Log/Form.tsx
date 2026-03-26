import { useState, useEffect, useMemo } from "react";
import { ChevronRightIcon, DeleteIcon } from "@chakra-ui/icons";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading,
    IconButton, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tooltip, Tr,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft, HiOutlinePlus } from "react-icons/hi";
import { LuDownload } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FieldDayPicker } from "@/components/FieldDayPicker";
import FieldDisplay from "@/components/FieldDisplay";
import { FieldHTMLEditor } from "@/components/FieldHTMLEditor";
import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { useToastError } from "@/components/Toast";
import { getOptionValue, handleDownload, formatContactAddress, formatShippingAddress } from "@/helpers/commonHelper";
import { CSVUploadButton } from "@/components/ReUsable/CSVUploadButton";

import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";
import { CustomerShippingAddressModal } from "@/components/Modals/CustomerMaster/ShippingAddress";
import { PartNumberModal } from '@/components/Modals/SpareMaster';

import { useSaveSalesLog, useSalesLogDetails, useSalesLogDropdowns } from "@/services/sales-log/service";
import { useCustomerRelationIndex, useCustomerDetails } from "@/services/master/customer/service";
import { useSearchPartNumber } from "@/services/master/spare/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useUserContext } from "@/services/auth/UserContext";
import { usePDFPreviewController } from "@/api/hooks/usePDFPreviewController";
import { endPoints } from "@/api/endpoints";
import dayjs from "dayjs";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_KEYS = [
    "cust_rfq_no", "cust_rfq_date", "due_date",
    "customer_id", "mode_of_receipt_id", "priority_id",
    "customer_contact_manager_id", "customer_shipping_address_id",
    "currency_id", "fob_id", "payment_mode_id", "payment_term_id", "remarks",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type SLRow = {
    rowKey: string;
    part_number_id: any;
    condition_id: any;
    qty: any;
    unit_of_measure_id: any;
    remark: any;
    is_duplicate: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_ROW = (): SLRow => ({
    rowKey: crypto.randomUUID(),
    part_number_id: "",
    condition_id: "",
    qty: "",
    unit_of_measure_id: "",
    remark: "",
    is_duplicate: false,
});

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesLogForm = () => {
    const navigate = useNavigate();
    const toastError = useToastError();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const { userInfo } = useUserContext();
    const [queryParams, setQueryParams] = useState<any>({});
    const [partNumberQuery, setPartNumberQuery] = useState("");

    const [existingPartIDs, setExistingPartIDs] = useState<string[]>([]);

    const [disabledDatePicker, setDisabledDatePicker] = useState(true);
    const [isCustomerChanged, setIsCustomerChanged] = useState(false);
    const [isInitialAutoFillDone, setIsInitialAutoFillDone] = useState(false);

    // ── Customer-scoped state ──────────────────────────────────────────────────
    const [selectedCustomerId, setSelectedCustomerId] = useState<any>(null);
    const [selectedContactManagerId, setSelectedContactManagerId] = useState<any>(null);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<any>(null);

    // ── Rows ───────────────────────────────────────────────────────────────────
    const [rows, setRows] = useState<SLRow[]>([EMPTY_ROW()]);

    // ── Part number search ─────────────────────────────────────────────────────
    const [changedRowIndex, setChangedRowIndex] = useState<number | null>(null);
    const [spareLoading, setSpareLoading] = useState(false);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: l1, refetch: reloadDropDowwns } = useSalesLogDropdowns();
    const { data: salesLogData, isLoading: l2 } = useSalesLogDetails(id, { enabled: isEdit });
    const { data: customerInfo, isLoading: l3 } = useCustomerDetails(selectedCustomerId, { enabled: !!selectedCustomerId });
    const { data: contactManagerList, isLoading: l4, refetch: reloadContactManagers } = useCustomerRelationIndex(selectedCustomerId, "contact-managers");
    const { data: shippingAddressList, isLoading: l5, refetch: reloadShippingAddresses } = useCustomerRelationIndex(selectedCustomerId, "shipping-addresses");
    const { data: priorityList } = useSubmasterItemIndex("priorities", {});
    const { data: conditionData } = useSubmasterItemIndex("conditions", {});
    const { data: uomData } = useSubmasterItemIndex("unit-of-measures", {});
    const { data: spareSearchData, refetch: reloadSpares } = useSearchPartNumber(queryParams);

    // ── Single loading flag ────────────────────────────────────────────────────
    const isLoading = l1 || l2 || l3;

    // ── Derived options ────────────────────────────────────────────────────────
    const customerOptions = dropdownData?.customers ?? [];
    const modeOfReceiptOptions = dropdownData?.mode_of_receipts ?? [];
    const priorityOptions = dropdownData?.priorities ?? [];
    const currencyOptions = dropdownData?.currencies ?? [];
    const fobOptions = dropdownData?.fobs ?? [];
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];
    const priorityItems: TODO[] = priorityList?.data ?? [];

    const conditionOptions = conditionData?.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
    const uomOptions = uomData?.data?.map((u: any) => ({ value: u.id, label: u.name })) ?? [];
    const spareOptions = spareSearchData?.data?.map((s: any) => ({ value: s.id, label: s.name })) ?? [];

    const contactManagerOptions = contactManagerList?.data?.map((i: any) => ({ value: i.id, label: i.attention })) ?? [];
    const shippingAddressOptions = shippingAddressList?.data?.map((i: any) => ({ value: i.id, label: `${i.consignee_name} — ${i.country}` })) ?? [];

    // ── Address display strings (derived from already-fetched lists) ───────────
    const selectedContact = useMemo(
        () => contactManagerList?.data?.find((i: any) => String(i.id) === String(selectedContactManagerId)),
        [contactManagerList, selectedContactManagerId]
    );
    const selectedShipping = useMemo(
        () => shippingAddressList?.data?.find((i: any) => String(i.id) === String(selectedShippingAddressId)),
        [shippingAddressList, selectedShippingAddressId]
    );
    const contactAddressDisplay = selectedContact ? formatContactAddress(selectedContact) : "—";
    const shippingAddressDisplay = selectedShipping ? formatShippingAddress(selectedShipping) : "—";

    // ── Form ───────────────────────────────────────────────────────────────────
    const saveEndpoint = useSaveSalesLog();
    const [initialValues, setInitialValues] = useState<any>(null);

    const form = useForm({
        onValidSubmit: (values) => {
            if (rows.some(r => r.is_duplicate)) {
                toastError({
                    title: "Duplicate entries found",
                    description: "Same Part Number added with same condition multiple times",
                });
                return;
            }
            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));
            payload.items = rows.map(row => ({
                part_number_id: values[`part_number_${row.rowKey}`],
                condition_id: values[`condition_${row.rowKey}`],
                qty: Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: values[`uom_${row.rowKey}`],
                remark: values[`remark_${row.rowKey}`],
            }));
            saveEndpoint.mutate(
                isEdit ? { id, ...payload } : payload,
                { onSuccess: () => navigate("/sales-management/sales-log/master") }
            );
        },
    });

    const fields = useFormFields({ connect: form });

    // ── PDF Preview ────────────────────────────────────────────────────────────
    const previewPDF = usePDFPreviewController({ url: endPoints.preview_post.sales_log, title: "SEL PREVIEW" });

    const handleOpenPreview = () => {
        const popupVariables: any = { user_id: userInfo.id };
        Object.keys(fields).forEach(key => { popupVariables[key] = fields[key].value; });
        popupVariables.items = rows.map(row => ({
            part_number_id: fields[`part_number_${row.rowKey}`].value,
            condition_id: fields[`condition_${row.rowKey}`].value,
            qty: Number(fields[`qty_${row.rowKey}`].value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`].value,
            remark: fields[`remark_${row.rowKey}`].value,
        }));
        previewPDF.open(popupVariables);
    };

    // ── Row helpers ────────────────────────────────────────────────────────────
    const applyRowsToForm = (prefilled: SLRow[]) => {
        prefilled.forEach(item => {
            form.setValues({
                [`part_number_${item.rowKey}`]: item.part_number_id,
                [`condition_${item.rowKey}`]: item.condition_id,
                [`qty_${item.rowKey}`]: item.qty,
                [`uom_${item.rowKey}`]: item.unit_of_measure_id,
                [`remark_${item.rowKey}`]: item.remark,
            });
        });
    };

    const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
    const deleteRow = (rowKey: string) => setRows(prev => prev.filter(r => r.rowKey !== rowKey));

    const handleInputChange = (field: string, value: any, index: number) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            const seen = new Set<string>();
            return next.map(row => {
                const key = `${row.part_number_id}-${row.condition_id}`;
                const isDuplicate = !!(row.part_number_id && row.condition_id && seen.has(key));
                if (row.part_number_id && row.condition_id) seen.add(key);
                return { ...row, is_duplicate: isDuplicate };
            });
        });
    };

    const setDuedate = (priority: any) => {
        const selected = priorityItems.find((u) => String(u.id) === String(priority));
        const daysToAdd = selected?.days || 0;
        if (daysToAdd === 0) {
            setDisabledDatePicker(false);
            form.setValues({ due_date: "" });
        } else {
            setDisabledDatePicker(true);
            form.setValues({ due_date: dayjs().add(daysToAdd, "day") });
        }
    };

    const handleRemarksChange = (value: string) => form.setValues({ remarks: value });

    // ── Edit prefill ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!salesLogData?.data) return;
        const s = salesLogData.data;
        const values = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));
        setSelectedCustomerId(s.customer_id);
        setSelectedContactManagerId(s.customer_contact_manager_id);
        setSelectedShippingAddressId(s.customer_shipping_address_id);
        setInitialValues(values);
        form.setValues(values);
        handleRemarksChange(s.remarks ?? "");

        if (!s.items?.length) return;
        const prefilled: SLRow[] = s.items.map((item: any) => ({
            rowKey: crypto.randomUUID(),
            part_number_id: item.part_number_id,
            condition_id: item.condition_id,
            qty: item.qty,
            unit_of_measure_id: item.unit_of_measure_id,
            remark: item.remark ?? "",
            is_duplicate: false,
        }));
        setRows(prefilled);
        applyRowsToForm(prefilled);
    }, [salesLogData]);

    // ── Customer auto-fill (currency / payment) ────────────────────────────────
    useEffect(() => {
        if (!customerInfo?.data) return;
        const c = customerInfo.data;
        const shouldFill = isCustomerChanged || (isEdit && !isInitialAutoFillDone);
        if (!shouldFill) return;

        form.setValues({
            currency_id: c.currency_id ?? "",
            payment_mode_id: c.payment_mode_id ?? "",
            payment_term_id: c.payment_term_id ?? "",
        });
        if (!isInitialAutoFillDone) setIsInitialAutoFillDone(true);
        if (isCustomerChanged) setIsCustomerChanged(false);
    }, [customerInfo]);

    // ── Derived display values ─────────────────────────────────────────────────
    const isFormValuesChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });
    const totalQty = rows.reduce((acc, row) => acc + (Number(fields[`qty_${row.rowKey}`]?.value) || 0), 0);
    const totalItems = rows.filter(row => fields[`part_number_${row.rowKey}`]?.value).length;
    const isSaving = saveEndpoint.isLoading;
    const title = isEdit ? "Edit Sales Log" : "Add New Sales Log";
    const sectionStyle = { bg: "blue.100", p: 4, rounded: "md", border: "1px solid", borderColor: "blue.300" };

    const handleAddNewSuccess =
        (
            fieldName: any,
            refetch: () => void,
            options?: {
                onValueChange?: (val: any, fullData?: any) => void;
            }
        ) =>
            (data: any) => {
                const record = data?.data ?? data; // 🔥 FIX
                console.log(record, fieldName)
                const id = record?.id;

                setTimeout(() => {
                    refetch();

                    setTimeout(() => {
                        form.setValues({ [fieldName]: id });
                        options?.onValueChange?.(id, record);
                    }, 50);
                }, 100);
            };
    // ─── Render ────────────────────────────────────────────────────────────────


    useEffect(() => {
        const exists = [
            ...new Set([...(id ? [id] : []), ...(existingPartIDs ?? [])]),
        ];

        setQueryParams((prev: any) => {
            // Clone previous state
            const updated = { ...prev };

            if (exists.length > 0) {
                updated.exist_ids = exists.join(',');
            } else {
                delete updated.exist_ids; // ✅ remove key completely
            }

            return updated;
        });
    }, [existingPartIDs]);

    useEffect(() => {
        setQueryParams((prev: any) => ({
            ...prev,
            query: partNumberQuery
        }));
    }, [partNumberQuery]);

    useEffect(() => {
        const ids = rows
            .map((row) => row.part_number_id)
            .filter((id) => !!id); // remove empty/null

        setExistingPartIDs([...new Set(ids)]);
    }, [rows]);


    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Page header ── */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/sales-management/sales-log">Sales Log</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>{title}</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">{title}</Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />} size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                {/* ── Single loading flag covers dropdowns + edit data + customer ── */}
                <LoadingOverlay isLoading={isLoading}>
                    <Stack spacing={2} p={4} bg="white" borderRadius="md" boxShadow="md">
                        <Text fontSize="md" fontWeight="700">Sales Log</Text>

                        <Formiz autoForm connect={form}>
                            <FieldInput name="remarks" size="sm" sx={{ display: "none" }} />

                            <Stack spacing={2}>

                                {/* ── Section 1: RFQ + Priority ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect
                                        label="Mode of Receipt"
                                        name="mode_of_receipt_id"
                                        placeholder="Select..."
                                        options={modeOfReceiptOptions}
                                        required="Mode of Receipt is required"
                                        size="sm"
                                        isCaseSensitive={true}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <SubMasterModalForm
                                                    {...p}
                                                    model="mode-of-receipts"
                                                    isEdit={false}
                                                />
                                            ),
                                            onSuccess: handleAddNewSuccess(
                                                'mode_of_receipt_id',
                                                reloadDropDowwns
                                            ),
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: l1,
                                        }}
                                    />
                                    <FieldInput label="Customer RFQ No" name="cust_rfq_no" placeholder="Enter RFQ No" required="RFQ No is required" type="alpha-numeric-with-special" maxLength={20} size="sm" />
                                    <FieldDayPicker label="RFQ Date" name="cust_rfq_date" placeholder="Select RFQ date" required="RFQ Date is required" disabledDays={{ after: new Date() }} size="sm" />
                                    <FieldSelect
                                        label="Priority" name="priority_id" placeholder="Select..."
                                        options={priorityOptions} required="Priority is required"
                                        size="sm"
                                        onValueChange={setDuedate}
                                        isCaseSensitive={true}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <SubMasterModalForm
                                                    {...p}
                                                    model="priorities"
                                                    isEdit={false}
                                                />
                                            ),
                                            onSuccess: handleAddNewSuccess(
                                                'priority_id',
                                                reloadDropDowwns
                                            ),
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: l1,
                                        }}
                                    />
                                    <FieldDayPicker
                                        label="Due Date" name="due_date" placeholder="Select due date"
                                        required="Due Date is required" size="sm"
                                        dayPickerProps={{ inputProps: { isDisabled: disabledDatePicker } }}
                                    />
                                </Stack>

                                {/* ── Section 2: Customer + Contact + Shipping ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle} align="flex-start">
                                    <FieldSelect
                                        label="Customer" name="customer_id" placeholder="Select..."
                                        options={customerOptions} required="Customer is required"
                                        selectProps={{ isLoading: l1 }} size="sm"
                                        onValueChange={(v) => {
                                            setSelectedCustomerId(v);
                                            setSelectedContactManagerId(null);
                                            setSelectedShippingAddressId(null);
                                            setIsCustomerChanged(true);
                                            form.setValues({ customer_contact_manager_id: "", customer_shipping_address_id: "" });
                                        }}
                                    />
                                    <FieldSelect
                                        label="Contact Manager" name="customer_contact_manager_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select customer first"}
                                        options={contactManagerOptions} required="Contact Manager is required" isDisabled={!selectedCustomerId} size="sm"
                                        onValueChange={(v) => setSelectedContactManagerId(v)}
                                        isCaseSensitive={true}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <ContactManagerModal
                                                    {...p}
                                                    customerId={selectedCustomerId}
                                                    isEdit={false}
                                                    customerInfo={customerInfo?.data}

                                                    onClose={() => {
                                                        p.onClose?.();
                                                    }}

                                                    onSuccess={(id) => {
                                                        handleAddNewSuccess(
                                                            'customer_contact_manager_id',
                                                            reloadContactManagers,
                                                            {
                                                                onValueChange: setSelectedContactManagerId, // 🔥 HERE
                                                            }
                                                        )(id);
                                                    }}
                                                />
                                            )
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No contacts found',
                                            isLoading: l4,
                                        }}
                                    />
                                    <FieldDisplay
                                        key={`cm_display_${selectedContactManagerId}`}
                                        label="Contact Address" value={contactAddressDisplay}
                                        isHtml style={{ backgroundColor: "#fff" }} size="sm"
                                    />
                                    <FieldSelect
                                        label="Shipping Address" name="customer_shipping_address_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select customer first"}
                                        options={shippingAddressOptions} required="Shipping Address is required"
                                        isDisabled={!selectedCustomerId} size="sm"
                                        onValueChange={(v) => setSelectedShippingAddressId(v)}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <CustomerShippingAddressModal
                                                    {...p}
                                                    customerId={selectedCustomerId}
                                                    isEdit={false}
                                                    customerInfo={customerInfo?.data}

                                                    onClose={() => {
                                                        p.onClose?.();
                                                    }}

                                                    onSuccess={(id) => {
                                                        handleAddNewSuccess(
                                                            'customer_shipping_address_id',
                                                            reloadShippingAddresses,
                                                            {
                                                                onValueChange: setSelectedShippingAddressId, // 🔥 HERE
                                                            }
                                                        )(id);
                                                    }}
                                                />
                                            )
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No contacts found',
                                            isLoading: l5,
                                        }}
                                    />
                                    <FieldDisplay
                                        key={`sa_display_${selectedShippingAddressId}`}
                                        label="Shipping Address" value={shippingAddressDisplay}
                                        isHtml style={{ backgroundColor: "#fff" }} size="sm"
                                    />
                                </Stack>

                                {/* ── Section 3: Currency + Payment ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect label="Currency" name="currency_id" placeholder="Select..." options={currencyOptions} required="Currency is required" selectProps={{ isLoading: l1 }} size="sm" />
                                    <FieldSelect label="FOB" name="fob_id" placeholder="Select..." options={fobOptions} required="FOB is required" size="sm"
                                        isCaseSensitive={true}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <SubMasterModalForm
                                                    {...p}
                                                    model="fobs"
                                                    isEdit={false}
                                                />
                                            ),
                                            onSuccess: handleAddNewSuccess(
                                                'fob_id',
                                                reloadDropDowwns
                                            ),
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: l1,
                                        }} />
                                    <FieldSelect
                                        label="Payment Mode" name="payment_mode_id" placeholder="Select..." options={paymentModeOptions} required="Pay.Mode is required" isCaseSensitive={true}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <SubMasterModalForm
                                                    {...p}
                                                    model="payment_modes"
                                                    isEdit={false}
                                                />
                                            ),
                                            onSuccess: handleAddNewSuccess(
                                                'payment_mode_id',
                                                reloadDropDowwns
                                            ),
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: l1,
                                        }} size="sm" />
                                    <FieldSelect
                                        label="Payment Term" name="payment_term_id" placeholder="Select..." options={paymentTermOptions} required="Pay.Term is required" isCaseSensitive={true}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <SubMasterModalForm
                                                    {...p}
                                                    model="payment-terms"
                                                    isEdit={false}
                                                />
                                            ),
                                            onSuccess: handleAddNewSuccess(
                                                'payment_term_id',
                                                reloadDropDowwns
                                            ),
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: l1,
                                        }} size="sm" />
                                </Stack>

                                {/* ── Items toolbar ── */}
                                <HStack justify="space-between" mt={3}>
                                    <Text fontSize="md" fontWeight="700">Items</Text>
                                    <HStack ml="auto">
                                        <Button
                                            leftIcon={<LuDownload />} colorScheme="blue" size="sm"
                                            onClick={() => handleDownload(import.meta.env.VITE_MR_SAMPLE_PARTNUMBERS_CSV)}
                                        >
                                            Download Sample
                                        </Button>

                                        {/* ── Reusable CSV Upload ── */}
                                        <CSVUploadButton<SLRow>
                                            createEmptyRow={EMPTY_ROW}
                                            fieldMappings={[
                                                { csvKey: "part_number_id", rowKey: "part_number_id", transform: v => getOptionValue(v, spareOptions) ?? "" },
                                                { csvKey: "condition_id", rowKey: "condition_id", transform: v => getOptionValue(v, conditionOptions) ?? "" },
                                                { csvKey: "qty", rowKey: "qty" },
                                                { csvKey: "unit_of_measure_id", rowKey: "unit_of_measure_id", transform: v => getOptionValue(v, uomOptions) ?? "" },
                                                { csvKey: "remark", rowKey: "remark" },
                                            ]}
                                            duplicateCheck={{
                                                keys: ["part_number_id"],
                                                label: "Part Number",
                                                existingRows: rows,
                                            }}
                                            onUpload={(mapped) =>
                                                setRows(prev => [...prev.filter(r => r.part_number_id), ...mapped])
                                            }
                                            confirmHeaderText="Upload Items CSV"
                                            confirmBodyText="Are you sure you want to upload this file? Existing rows with part numbers will be kept."
                                            buttonLabel="Upload Items"
                                            colorScheme="green"
                                            size="sm"
                                            maxRows={100}
                                        />
                                    </HStack>
                                </HStack>

                                {/* ── Items table ── */}
                                <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.500">
                                            <Tr>
                                                <Th color="white">S.No.</Th>
                                                <Th color="white">Part Number</Th>
                                                <Th color="white">Condition</Th>
                                                <Th color="white">Quantity</Th>
                                                <Th color="white">UOM</Th>
                                                <Th color="white">Remarks</Th>
                                                <Th color="white" isNumeric>Action</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {rows.map((row, index) => {
                                                const isPartSelected = !!fields[`part_number_${row.rowKey}`]?.value;
                                                const isLastRow = index === rows.length - 1;

                                                return (
                                                    <Tr key={row.rowKey} background={row.is_duplicate ? "yellow.100" : ""}>
                                                        <Td><Text fontSize="medium">{index + 1}.</Text></Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`part_number_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="Part Number is required"
                                                                placeholder="Search part number"
                                                                options={spareOptions} isClearable
                                                                defaultValue={row.part_number_id || ""}
                                                                onValueChange={(v) => handleInputChange("part_number_id", v, index)}
                                                                isCaseSensitive={true}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <PartNumberModal
                                                                            {...p}
                                                                            onClose={() => {
                                                                                p.onClose?.();
                                                                            }}

                                                                            onSuccess={(data: TODO) => {
                                                                                setExistingPartIDs(prev => [...prev, data?.id]);
                                                                                setTimeout(() => {
                                                                                    handleAddNewSuccess(
                                                                                        `part_number_${row.rowKey}`,
                                                                                        reloadSpares
                                                                                    )(data);

                                                                                }, 50);

                                                                            }}
                                                                        />
                                                                    )
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => "No parts found",
                                                                    onInputChange: (val: string) => {
                                                                        setSpareLoading(true);
                                                                        setChangedRowIndex(index);
                                                                        setTimeout(() => { setPartNumberQuery(val); setSpareLoading(false); }, 600);
                                                                    },
                                                                    isLoading: changedRowIndex === index && spareLoading || l4
                                                                }}
                                                                style={{ minWidth: 180 }}
                                                            />
                                                        </Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`condition_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="Condition is required" placeholder="Select..."
                                                                options={conditionOptions}
                                                                defaultValue={row.condition_id || ""}
                                                                onValueChange={(v) => handleInputChange("condition_id", v, index)}
                                                                style={{ minWidth: 130 }}
                                                                isCaseSensitive={true}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <SubMasterModalForm
                                                                            {...p}
                                                                            model="conditions"
                                                                            isEdit={false}
                                                                        />
                                                                    ),
                                                                    onSuccess: handleAddNewSuccess(
                                                                        `condition_${row.rowKey}`,
                                                                        reloadDropDowwns
                                                                    ),
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => 'No options found',
                                                                    isLoading: l1,
                                                                }}
                                                                isDisabled={!isPartSelected}
                                                            />
                                                        </Td>

                                                        <Td>
                                                            <FieldInput
                                                                name={`qty_${row.rowKey}`}
                                                                size="sm" required="Quantity is required"
                                                                type="integer" placeholder="Qty"
                                                                defaultValue={row.qty || ""}
                                                                width="100px" maxLength={9}
                                                                isDisabled={!isPartSelected}
                                                                onValueChange={(v) => handleInputChange("qty", v, index)}
                                                            />
                                                        </Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`uom_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="UOM is required" placeholder="Select..."
                                                                options={uomOptions}
                                                                defaultValue={row.unit_of_measure_id || ""}
                                                                onValueChange={(v) => handleInputChange("unit_of_measure_id", v, index)}
                                                                style={{ minWidth: 120 }}
                                                                isDisabled={!isPartSelected}
                                                                isCaseSensitive={true}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <SubMasterModalForm
                                                                            {...p}
                                                                            model="unit_of_measures"
                                                                            isEdit={false}
                                                                        />
                                                                    ),
                                                                    onSuccess: handleAddNewSuccess(
                                                                        `uom_${row.rowKey}`,
                                                                        reloadDropDowwns
                                                                    ),
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => 'No options found',
                                                                    isLoading: l1,
                                                                }}
                                                            />
                                                        </Td>

                                                        <Tooltip
                                                            label={fields[`remark_${row.rowKey}`]?.value ?? ""}
                                                            placement="top" hasArrow color="white"
                                                            isDisabled={String(fields[`remark_${row.rowKey}`]?.value ?? "").length <= 20}
                                                        >
                                                            <Td>
                                                                <FieldInput
                                                                    name={`remark_${row.rowKey}`}
                                                                    size="sm" placeholder="Remark"
                                                                    defaultValue={row.remark || ""}
                                                                    maxLength={60}
                                                                    isDisabled={!isPartSelected}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td isNumeric>
                                                            {isLastRow && (
                                                                <IconButton aria-label="Add Row" variant="@primary" size="sm"
                                                                    icon={<HiOutlinePlus />} onClick={addRow} mr={2} />
                                                            )}
                                                            <IconButton aria-label="Delete Row" colorScheme="red" size="sm"
                                                                icon={<DeleteIcon />} onClick={() => deleteRow(row.rowKey)}
                                                                isDisabled={rows.length <= 1} />
                                                        </Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* ── Totals ── */}
                                <HStack mt={3}>
                                    <Text>Total Qty: <Text as="span" ml={3} fontWeight="bold">{totalQty}</Text></Text>
                                    <Text ml={3}>Total Line Items: <Text as="span" ml={3} fontWeight="bold">{totalItems}</Text></Text>
                                </HStack>

                                {/* ── Remarks editor ── */}
                                <Stack>
                                    <FormControl>
                                        <FormLabel>Remarks</FormLabel>
                                        <FieldHTMLEditor
                                            onValueChange={handleRemarksChange}
                                            maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                            placeHolder="Enter Remarks Here"
                                            defaultValue={isEdit && salesLogData?.data?.remarks ? salesLogData.data.remarks : ""}
                                        />
                                    </FormControl>
                                </Stack>

                            </Stack>

                            {/* ── Actions ── */}
                            <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={4}>
                                <Button
                                    type="submit" colorScheme="brand" isLoading={isSaving}
                                    isDisabled={isSaving || (isEdit ? (!isFormValuesChanged || !form.isValid) : false)}
                                >
                                    {isEdit ? "Update" : "Submit"}
                                </Button>
                                <Button
                                    onClick={handleOpenPreview} colorScheme="green"
                                    isDisabled={!form.isValid} isLoading={previewPDF.isLoading}
                                >
                                    Preview
                                </Button>
                            </Stack>

                        </Formiz>
                    </Stack>
                </LoadingOverlay>
            </Stack>
        </SlideIn>
    );
};

export default SalesLogForm;