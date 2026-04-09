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

import { CustomerModal } from "@/components/Modals/CustomerMaster";
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";
import { CustomerShippingAddressModal } from "@/components/Modals/CustomerMaster/ShippingAddress";
import { PartNumberModal } from '@/components/Modals/SpareMaster';

import { useSavePurchaseOrder, usePurchaseOrderDetails, usePurchaseOrderDropdowns } from "@/services/purchase/order/service";
import { useCustomerRelationIndex, useCustomerDetails, useCustomerList } from "@/services/master/customer/service";
import { useSearchPartNumber, validatePartNumbersByName } from "@/services/master/spare/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useUserContext } from "@/services/auth/UserContext";
import { usePDFPreviewController } from "@/api/hooks/usePDFPreviewController";
import { endPoints } from "@/api/endpoints";
import dayjs from "dayjs";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_KEYS = [
    "priority_id", "currency_id", "payment_mode_id", "payment_term_id", "fob_id",
    "customer_id", "customer_contact_manager_id", "customer_shipping_address_id", "remarks",
    "bank_charge", "freight", "miscellaneous_charges", "vat", "discount", "ship_type_id", "ship_mode_id", "ship_account_id"
];

// ─── Types ────────────────────────────────────────────────────────────────────

type SLRow = {
    rowKey: string;
    part_number_id: any;
    condition_id: any;
    qty: any;
    unit_of_measure_id: any;
    price: any;
    total_value: any;
    note: any;
    is_duplicate: boolean;
    id?: any;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_ROW = (): SLRow => ({
    rowKey: crypto.randomUUID(),
    part_number_id: "",
    condition_id: "",
    qty: "",
    unit_of_measure_id: "",
    price: "",
    total_value: "",
    note: "",
    is_duplicate: false,
});

const calcTotalValue = (qty: any, unitPrice: any): string => {
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p)) return (q * p).toFixed(2);
    return "";
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PurchaseOrderForm = () => {
    const navigate = useNavigate();
    const toastError = useToastError();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const { userInfo } = useUserContext();
    const [queryParams, setQueryParams] = useState<any>({});
    const [partNumberQuery, setPartNumberQuery] = useState("");
    const [existingPartIDs, setExistingPartIDs] = useState<string[]>([]);
    const [isCustomerChanged, setIsCustomerChanged] = useState(false);
    const [isInitialAutoFillDone, setIsInitialAutoFillDone] = useState(false);

    // ── Customer-scoped state ──────────────────────────────────────────────────
    const [selectedCustomerId, setSelectedCustomerId] = useState<any>(null);
    const [selectedContactManagerId, setSelectedContactManagerId] = useState<any>(null);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<any>(null);

    // ── Rows ───────────────────────────────────────────────────────────────────
    const [rows, setRows] = useState<SLRow[]>([EMPTY_ROW()]);
    const [changedRowIndex, setChangedRowIndex] = useState<number | null>(null);
    const [spareLoading, setSpareLoading] = useState(false);
    // Seeded by onResolved so FieldSelect has a label immediately after CSV upload,
    // before reloadSpares completes. Merged into spareOptions below.
    const [extraSpareOptions, setExtraSpareOptions] = useState<{ value: string; label: string }[]>([]);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: l1, refetch: reloadDropDowns } = usePurchaseOrderDropdowns();
    const { data: itemInfo, isLoading: l2 } = usePurchaseOrderDetails(id, { enabled: isEdit });
    const { data: customerInfo, isLoading: l3 } = useCustomerDetails(selectedCustomerId, { enabled: !!selectedCustomerId });
    const { data: contactManagerList, isLoading: l4, refetch: reloadContactManagers } = useCustomerRelationIndex(selectedCustomerId, "contact-managers");
    const { data: shippingAddressList, isLoading: l5, refetch: reloadShippingAddresses } = useCustomerRelationIndex(selectedCustomerId, "shipping-addresses");
    const { data: conditionData } = useSubmasterItemIndex("conditions", {});
    const { data: uomData } = useSubmasterItemIndex("unit-of-measures", {});
    const { data: spareSearchData, refetch: reloadSpares } = useSearchPartNumber(queryParams);
    const { data: contactTypeData } = useSubmasterItemIndex("contact-types", {});
    const { data: currencyData } = useSubmasterItemIndex("currencies", {});

    const filteredContactTypeIds = contactTypeData?.data
        .filter((item: any) => ['SUP', 'PUR'].includes(item.code))
        .map((item: any) => item.id);
    const { data: customerList, isLoading: l6, refetch: reloadCustomers } = useCustomerList({ contact_type_id: filteredContactTypeIds });

    const isLoading = l1 || l2 || l3 || l6;

    // ── Derived options ────────────────────────────────────────────────────────
    const priorityOptions = dropdownData?.priorities ?? [];
    const currencyOptions = dropdownData?.currencies ?? [];


    const fobOptions = dropdownData?.fobs ?? [];
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];
    const shipTypeOptions = dropdownData?.ship_types ?? [];
    const shipModeOptions = dropdownData?.ship_modes ?? [];
    const shipAccountOptions = dropdownData?.ship_accounts ?? [];
    const customerOptions = customerList?.data ?? [];
    const conditionOptions = conditionData?.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
    const uomOptions = uomData?.data?.map((u: any) => ({ value: u.id, label: u.name })) ?? [];
    const spareOptions = useMemo(() => {
        const fromSearch = spareSearchData?.data?.map((s: any) => ({ value: s.id, label: s.name })) ?? [];
        // Merge extraSpareOptions (seeded from CSV validate response) so FieldSelect
        // can show the correct label immediately, before reloadSpares finishes.
        const ids = new Set(fromSearch.map((o: any) => String(o.value)));
        const extras = extraSpareOptions.filter(o => !ids.has(String(o.value)));
        return [...fromSearch, ...extras];
    }, [spareSearchData, extraSpareOptions]);
    const contactManagerOptions = contactManagerList?.data?.map((i: any) => ({ value: i.id, label: i.attention })) ?? [];
    const shippingAddressOptions = shippingAddressList?.data?.map((i: any) => ({ value: i.id, label: `${i.consignee_name} — ${i.country}` })) ?? [];

    // ── Address display strings ────────────────────────────────────────────────
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
    const saveEndpoint = useSavePurchaseOrder();
    const [initialValues, setInitialValues] = useState<any>(null);

    const form = useForm({
        onValidSubmit: (values) => {
            const dueDate = values.due_date ? dayjs(values.due_date) : null;
            if (dueDate && dueDate.startOf('day').isBefore(dayjs().startOf('day'))) {
                toastError({ title: "Invalid Due Date!!", description: "Due date cannot be in the past." });
                return;
            }
            if (rows.some(r => r.is_duplicate)) {
                toastError({ title: "Duplicate entries found", description: "Same Part Number added with same condition multiple times" });
                return;
            }
            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));
            payload.items = rows.map(row => ({
                part_number_id: values[`part_number_${row.rowKey}`],
                condition_id: values[`condition_${row.rowKey}`],
                qty: Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: values[`uom_${row.rowKey}`],
                price: Number(values[`price_${row.rowKey}`]),
                total_value: Number(values[`total_value_${row.rowKey}`]),
                note: values[`note_${row.rowKey}`],
                ...(row.id && { id: row.id }),
            }));
            saveEndpoint.mutate(
                isEdit ? { id, ...payload } : payload,
                { onSuccess: () => navigate("/purchase/order/master") }
            );
        },
    });

    const fields = useFormFields({ connect: form });

    const currencySymbol = useMemo(() => {
        const selectedCurrencyId = fields['currency_id']?.value;
        if (!selectedCurrencyId) return "";
        const match = currencyData?.data.find((c: any) => String(c.id) === String(selectedCurrencyId));
        return match?.symbol ?? match?.label ?? "";
    }, [fields['currency_id']?.value, currencyData]);

    // ── PDF Preview ────────────────────────────────────────────────────────────
    const previewPDF = usePDFPreviewController({ url: endPoints.preview_post.purchase_order, title: "PURCHASE ORDER PREVIEW" });

    const handleOpenPreview = () => {
        const popupVariables: any = { user_id: userInfo.id };
        Object.keys(fields).forEach(key => { popupVariables[key] = fields[key].value; });
        popupVariables.items = rows.map(row => ({
            part_number_id: fields[`part_number_${row.rowKey}`].value,
            condition_id: fields[`condition_${row.rowKey}`].value,
            qty: Number(fields[`qty_${row.rowKey}`].value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`].value,
            price: Number(fields[`price_${row.rowKey}`].value),
            total_value: Number(fields[`total_value_${row.rowKey}`].value),
            note: fields[`note_${row.rowKey}`].value,
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
                [`price_${item.rowKey}`]: item.price,
                [`total_value_${item.rowKey}`]: item.total_value,
                [`note_${item.rowKey}`]: item.note,
            });
        });
    };

    const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
    const deleteRow = (rowKey: string) => setRows(prev => prev.filter(r => r.rowKey !== rowKey));

    const handleInputChange = (field: string, value: any, index: number) => {
        setRows(prev => {
            const next = [...prev];
            const updated = { ...next[index], [field]: value };

            // Recalculate total_value whenever qty or price changes
            if (field === "qty" || field === "price") {
                const qty = field === "qty" ? value : updated.qty;
                const unitPrice = field === "price" ? value : updated.price;
                const tv = calcTotalValue(qty, unitPrice);
                updated.total_value = tv;
                form.setValues({ [`total_value_${next[index].rowKey}`]: tv });
            }

            next[index] = updated;

            // Duplicate detection
            const seen = new Set<string>();
            return next.map(row => {
                const key = `${row.part_number_id}-${row.condition_id}`;
                const isDuplicate = !!(row.part_number_id && row.condition_id && seen.has(key));
                if (row.part_number_id && row.condition_id) seen.add(key);
                return { ...row, is_duplicate: isDuplicate };
            });
        });
    };

    const handleRemarksChange = (value: string) => form.setValues({ remarks: value });

    // ── addNew success helper ──────────────────────────────────────────────────
    const handleAddNewSuccess =
        (fieldName: any, refetch: () => void, options?: { onValueChange?: (val: any, fullData?: any) => void }) =>
            (data: any) => {
                const record = data?.data ?? data;
                const newId = record?.id;
                setTimeout(() => {
                    refetch();
                    setTimeout(() => {
                        form.setValues({ [fieldName]: newId });
                        options?.onValueChange?.(newId, record);
                    }, 50);
                }, 100);
            };

    // ── Submaster addNew shorthand ─────────────────────────────────────────────
    const submasterAddNew = (fieldName: string, model: string) => ({
        label: '+ Add New',
        CreateModal: (p: any) => <SubMasterModalForm {...p} model={model} isEdit={false} />,
        onSuccess: handleAddNewSuccess(fieldName, reloadDropDowns),
    });

    // ── Edit prefill ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!itemInfo?.data) return;
        const s = itemInfo.data;
        const values = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));
        setSelectedCustomerId(s.customer_id);
        setSelectedContactManagerId(s.customer_contact_manager_id);
        setSelectedShippingAddressId(s.customer_shipping_address_id);
        setInitialValues(values);
        form.setValues(values);
        if (!s.items?.length) return;
        const prefilled: SLRow[] = s.items.map((item: any) => ({
            rowKey: crypto.randomUUID(),
            part_number_id: item.part_number_id,
            condition_id: item.condition_id,
            qty: item.qty,
            unit_of_measure_id: item.unit_of_measure_id,
            price: item.price ?? "",
            total_value: item.total_value ?? calcTotalValue(item.qty, item.price),
            note: item.note ?? "",
            id: item.id,
            is_duplicate: false,
        }));
        setRows(prefilled);
        applyRowsToForm(prefilled);
    }, [itemInfo]);

    // ── Customer auto-fill ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!customerInfo?.data) return;
        const c = customerInfo.data;
        if (!isCustomerChanged && !(isEdit && !isInitialAutoFillDone)) return;
        form.setValues({ currency_id: c.currency_id ?? "", payment_mode_id: c.payment_mode_id ?? "", payment_term_id: c.payment_term_id ?? "" });
        if (!isInitialAutoFillDone) setIsInitialAutoFillDone(true);
        if (isCustomerChanged) setIsCustomerChanged(false);
    }, [customerInfo]);

    // ── Re-apply contact manager + shipping address once lists load ────────────
    useEffect(() => {
        if (!isEdit || !itemInfo?.data) return;
        if (contactManagerList?.data?.length && itemInfo.data.customer_contact_manager_id) {
            form.setValues({ customer_contact_manager_id: itemInfo.data.customer_contact_manager_id });
            setSelectedContactManagerId(itemInfo.data.customer_contact_manager_id);
        }
    }, [contactManagerList]);

    useEffect(() => {
        if (!isEdit || !itemInfo?.data) return;
        if (shippingAddressList?.data?.length && itemInfo.data.customer_shipping_address_id) {
            form.setValues({ customer_shipping_address_id: itemInfo.data.customer_shipping_address_id });
            setSelectedShippingAddressId(itemInfo.data.customer_shipping_address_id);
        }
    }, [shippingAddressList]);

    // ── Keep queryParams in sync ───────────────────────────────────────────────
    useEffect(() => {
        const exists = [...new Set([...(id ? [id] : []), ...(existingPartIDs ?? [])])];
        setQueryParams((prev: any) => {
            const updated = { ...prev };
            exists.length > 0 ? (updated.exist_ids = exists.join(',')) : delete updated.exist_ids;
            return updated;
        });
    }, [existingPartIDs]);

    useEffect(() => {
        setQueryParams((prev: any) => ({ ...prev, query: partNumberQuery }));
    }, [partNumberQuery]);

    useEffect(() => {
        setExistingPartIDs([...new Set(rows.map(r => r.part_number_id).filter(Boolean))]);
    }, [rows]);

    // Reload spares whenever exist_ids changes (manual row selection path)
    useEffect(() => {
        if (Object.keys(queryParams).length > 0) reloadSpares();
    }, [queryParams]);

    // ── Derived display values ─────────────────────────────────────────────────
    const isFormValuesChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });
    const totalQty = rows.reduce((acc, row) => acc + (Number(fields[`qty_${row.rowKey}`]?.value) || 0), 0);
    const totalItems = rows.filter(row => fields[`part_number_${row.rowKey}`]?.value).length;
    const grandTotal = rows.reduce((acc, row) => acc + (Number(fields[`total_value_${row.rowKey}`]?.value) || 0), 0);

    const subTotal = grandTotal;
    const vatAmount = parseFloat(
        ((subTotal * (Number(fields['vat']?.value) || 0)) / 100).toFixed(2)
    );
    const totalPayableAmount = parseFloat(
        (
            subTotal +
            (Number(fields['bank_charge']?.value) || 0) +
            (Number(fields['freight']?.value) || 0) +
            (Number(fields['miscellaneous_charges']?.value) || 0) +
            vatAmount -
            (Number(fields['discount']?.value) || 0)
        ).toFixed(2)
    );

    const isSaving = saveEndpoint.isLoading;
    const title = isEdit ? "Edit Direct PO" : "Add New Direct PO";
    const sectionStyle = { bg: "blue.100", p: 4, rounded: "md", border: "1px solid", borderColor: "blue.300" };

    const handleCustomerChange = (v: any) => {
        setSelectedCustomerId(v);
        setSelectedContactManagerId(null);
        setSelectedShippingAddressId(null);
        setIsCustomerChanged(true);
        form.setValues({ customer_contact_manager_id: "", customer_shipping_address_id: "" });
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Page header ── */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/purchase/order/master">Purchase Order</BreadcrumbLink>
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

                <LoadingOverlay isLoading={isLoading}>
                    <Stack spacing={2} p={4} bg="white" borderRadius="md" boxShadow="md">
                        <Text fontSize="md" fontWeight="700">Purchase Order</Text>

                        <Formiz autoForm connect={form}>
                            <FieldInput name="remarks" size="sm" sx={{ display: "none" }} />

                            <Stack spacing={2}>

                                {/* ── Section 1: Customer + Contact ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle} align="flex-start">
                                    <FieldSelect
                                        label="Vendor" name="customer_id" placeholder="Select..." options={customerOptions} required="Vendor is required" size="sm"
                                        onValueChange={handleCustomerChange}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p: any) => (
                                                <CustomerModal {...p} onSuccess={(data) => handleAddNewSuccess('customer_id', reloadCustomers, { onValueChange: handleCustomerChange })(data)} />
                                            ),
                                        }}
                                        selectProps={{ type: 'creatable', noOptionsMessage: () => 'No contacts found', isLoading: l1 }}
                                    />
                                    <FieldDisplay key={`vendor_code_${selectedCustomerId}`} label="Vendor Code" value={customerInfo?.data?.code ?? 'N/A'} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                    <FieldSelect
                                        key={`cm_${selectedCustomerId ?? 'none'}`}
                                        label="Contact Manager" name="customer_contact_manager_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select customer first"}
                                        options={contactManagerOptions} required="Contact Manager is required" isDisabled={!selectedCustomerId} size="sm"
                                        onValueChange={(v) => setSelectedContactManagerId(v)}
                                        isCaseSensitive
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p: any) => (
                                                <ContactManagerModal {...p} customerId={selectedCustomerId} isEdit={false} customerInfo={customerInfo?.data}
                                                    onSuccess={(data) => handleAddNewSuccess('customer_contact_manager_id', reloadContactManagers, { onValueChange: setSelectedContactManagerId })(data)} />
                                            ),
                                        }}
                                        selectProps={{ type: 'creatable', noOptionsMessage: () => 'No contacts found', isLoading: l4 }}
                                    />
                                    <FieldDisplay key={`cm_display_${selectedContactManagerId}`} label="Contact Address" value={contactAddressDisplay} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                </Stack>


                                {/* ── Section 2: Shipping   ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect
                                        key={`sa_${selectedCustomerId ?? 'none'}`}
                                        label="Ship To" name="customer_shipping_address_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select customer first"}
                                        options={shippingAddressOptions} required="Shipping Address is required" isDisabled={!selectedCustomerId} size="sm"
                                        onValueChange={(v) => setSelectedShippingAddressId(v)}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p: any) => (
                                                <CustomerShippingAddressModal {...p} customerId={selectedCustomerId} isEdit={false} customerInfo={customerInfo?.data}
                                                    onSuccess={(data) => handleAddNewSuccess('customer_shipping_address_id', reloadShippingAddresses, { onValueChange: setSelectedShippingAddressId })(data)} />
                                            ),
                                        }}
                                        selectProps={{ type: 'creatable', noOptionsMessage: () => 'No contacts found', isLoading: l5 }}
                                    />
                                    <FieldDisplay key={`sa_display_${selectedShippingAddressId}`} label="Shipping Address" value={shippingAddressDisplay} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                    <FieldSelect label="Ship Type" name="ship_type_id" placeholder="Select..." options={shipTypeOptions} required="Ship Type is required" size="sm" isCaseSensitive addNew={submasterAddNew('ship_type_id', 'ship-types')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                    <FieldSelect label="Ship Mode" name="ship_mode_id" placeholder="Select..." options={shipModeOptions} required="Ship Mode is required" size="sm" isCaseSensitive addNew={submasterAddNew('ship_mode_id', 'ship-modes')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                    <FieldSelect label="Ship Account" name="ship_account_id" placeholder="Select..." options={shipAccountOptions} required="Ship Account is required" size="sm" isCaseSensitive addNew={submasterAddNew('ship_account_id', 'ship-accounts')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                </Stack>


                                {/* ── Section 3: Priority + Payment + FOB ── */}

                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect label="Priority" name="priority_id" placeholder="Select..." options={priorityOptions} required="Priority is required" size="sm" isCaseSensitive addNew={submasterAddNew('priority_id', 'priorities')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                    <FieldSelect label="Currency" name="currency_id" placeholder="Select..." options={currencyOptions} required="Currency is required" size="sm" selectProps={{ isLoading: l1 }} />
                                    <FieldSelect label="Payment Mode" name="payment_mode_id" placeholder="Select..." options={paymentModeOptions} required="Pay.Mode is required" size="sm" isCaseSensitive addNew={submasterAddNew('payment_mode_id', 'payment_modes')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                    <FieldSelect label="Payment Term" name="payment_term_id" placeholder="Select..." options={paymentTermOptions} required="Pay.Term is required" size="sm" isCaseSensitive addNew={submasterAddNew('payment_term_id', 'payment-terms')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                    <FieldSelect label="FOB" name="fob_id" placeholder="Select..." options={fobOptions} required="FOB is required" size="sm" isCaseSensitive addNew={submasterAddNew('fob_id', 'fobs')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }} />
                                </Stack>
                                {/* ── Items toolbar ── */}
                                <HStack justify="space-between" mt={3}>
                                    <Text fontSize="md" fontWeight="700">Items</Text>
                                    <HStack ml="auto">
                                        <Button leftIcon={<LuDownload />} colorScheme="blue" size="sm" onClick={() => handleDownload(import.meta.env.VITE_MR_SAMPLE_PARTNUMBERS_CSV)}>
                                            Download Sample
                                        </Button>
                                        <CSVUploadButton<SLRow>
                                            createEmptyRow={EMPTY_ROW}
                                            fieldMappings={[
                                                { csvKey: "part_number_id", rowKey: "part_number_id" },
                                                { csvKey: "condition_id", rowKey: "condition_id", transform: v => getOptionValue(v, conditionOptions) ?? "" },
                                                { csvKey: "qty", rowKey: "qty" },
                                                { csvKey: "unit_of_measure_id", rowKey: "unit_of_measure_id", transform: v => getOptionValue(v, uomOptions) ?? "" },
                                                { csvKey: "price", rowKey: "price" },
                                                { csvKey: "note", rowKey: "note" },
                                            ]}
                                            partNumberValidation={{
                                                rowKey: "part_number_id",
                                                resolvedKey: "part_number_id",
                                                validate: validatePartNumbersByName,
                                                onResolved: (resolvedMap: any) => {
                                                    const newOptions = Object.values(resolvedMap).map((r: any) => ({
                                                        value: String(r.id),
                                                        label: r.name,
                                                    }));
                                                    setExtraSpareOptions(prev => {
                                                        const existingIds = new Set(prev.map(o => o.value));
                                                        const fresh = newOptions.filter(o => !existingIds.has(o.value));
                                                        return [...prev, ...fresh];
                                                    });
                                                },
                                            }}
                                            duplicateCheck={{ keys: ["part_number_id"], label: "Part Number", existingRows: rows }}
                                            onUpload={(mapped) => {
                                                const kept = rows.filter(r => r.part_number_id);
                                                const rowsWithTotals = mapped.map(row => ({
                                                    ...row,
                                                    total_value: calcTotalValue(row.qty, row.price),
                                                }));
                                                const next = [...kept, ...rowsWithTotals];
                                                setRows(next);

                                                // Push all row field values into the form immediately
                                                const formValues: Record<string, any> = {};
                                                rowsWithTotals.forEach(row => {
                                                    formValues[`part_number_${row.rowKey}`] = row.part_number_id;
                                                    formValues[`condition_${row.rowKey}`] = row.condition_id;
                                                    formValues[`qty_${row.rowKey}`] = row.qty;
                                                    formValues[`uom_${row.rowKey}`] = row.unit_of_measure_id;
                                                    formValues[`price_${row.rowKey}`] = row.price;
                                                    formValues[`total_value_${row.rowKey}`] = row.total_value;
                                                    formValues[`note_${row.rowKey}`] = row.note;
                                                });
                                                form.setValues(formValues);
                                                const newIds = [...new Set(next.map(r => r.part_number_id).filter(Boolean))];
                                                setExistingPartIDs(newIds);
                                                const updatedParams: any = { ...queryParams };
                                                newIds.length > 0
                                                    ? (updatedParams.exist_ids = newIds.join(','))
                                                    : delete updatedParams.exist_ids;
                                                setQueryParams(updatedParams);
                                                setTimeout(() => reloadSpares(), 50);
                                            }}
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
                                                <Th color="white">Unit Price</Th>
                                                <Th color="white">Total Value</Th>
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

                                                        {/* Part Number */}
                                                        <Td>
                                                            <FieldSelect
                                                                name={`part_number_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="Part Number is required"
                                                                placeholder="Search part number"
                                                                options={spareOptions} isClearable
                                                                defaultValue={row.part_number_id || ""}
                                                                onValueChange={(v) => handleInputChange("part_number_id", v, index)}
                                                                isCaseSensitive
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p: any) => (
                                                                        <PartNumberModal {...p}
                                                                            onSuccess={(data: TODO) => {
                                                                                setExistingPartIDs(prev => [...prev, data?.id]);
                                                                                setTimeout(() => handleAddNewSuccess(`part_number_${row.rowKey}`, reloadSpares)(data), 50);
                                                                            }}
                                                                        />
                                                                    ),
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => "No parts found",
                                                                    onInputChange: (val: string) => {
                                                                        setSpareLoading(true);
                                                                        setChangedRowIndex(index);
                                                                        setTimeout(() => { setPartNumberQuery(val); setSpareLoading(false); }, 600);
                                                                    },
                                                                    isLoading: changedRowIndex === index && spareLoading || l4,
                                                                }}
                                                                style={{ minWidth: 180 }}
                                                            />
                                                        </Td>

                                                        {/* Condition */}
                                                        <Td>
                                                            <FieldSelect
                                                                name={`condition_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="Condition is required" placeholder="Select..."
                                                                options={conditionOptions}
                                                                defaultValue={row.condition_id || ""}
                                                                onValueChange={(v) => handleInputChange("condition_id", v, index)}
                                                                style={{ minWidth: 130 }}
                                                                isCaseSensitive
                                                                addNew={submasterAddNew(`condition_${row.rowKey}`, 'conditions')}
                                                                selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }}
                                                                isDisabled={!isPartSelected}
                                                            />
                                                        </Td>

                                                        {/* Qty */}
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

                                                        {/* UOM */}
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
                                                                isCaseSensitive
                                                                addNew={submasterAddNew(`uom_${row.rowKey}`, 'unit_of_measures')}
                                                                selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: l1 }}
                                                            />
                                                        </Td>

                                                        {/* Unit Price */}
                                                        <Td>
                                                            <FieldInput
                                                                name={`price_${row.rowKey}`}
                                                                size="sm" required="Unit Price is required"
                                                                type="number" placeholder="Unit Price"
                                                                defaultValue={row.price || ""}
                                                                width="120px" maxLength={15}
                                                                isDisabled={!isPartSelected}
                                                                onValueChange={(v) => handleInputChange("price", v, index)}
                                                                leftElement={currencySymbol || undefined}
                                                            />
                                                        </Td>

                                                        {/* Total Value (read-only, auto-calculated) */}
                                                        <Td>
                                                            <FieldInput
                                                                name={`total_value_${row.rowKey}`}
                                                                size="sm"
                                                                placeholder="—"
                                                                defaultValue={row.total_value || ""}
                                                                width="120px"
                                                                isReadOnly
                                                                isDisabled={!isPartSelected}
                                                                style={{ background: "var(--chakra-colors-gray-50)", cursor: "default" }}
                                                                leftElement={currencySymbol || undefined}
                                                            />
                                                        </Td>

                                                        {/* Remark */}
                                                        <Tooltip
                                                            label={fields[`note_${row.rowKey}`]?.value ?? ""}
                                                            placement="top" hasArrow color="white"
                                                            isDisabled={String(fields[`note_${row.rowKey}`]?.value ?? "").length <= 20}
                                                        >
                                                            <Td>
                                                                <FieldInput
                                                                    name={`note_${row.rowKey}`}
                                                                    size="sm" placeholder="Remark"
                                                                    defaultValue={row.note || ""}
                                                                    maxLength={60}
                                                                    isDisabled={!isPartSelected}
                                                                    style={{ minWidth: 200 }}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        {/* Actions */}
                                                        <Td isNumeric>
                                                            {isLastRow && (
                                                                <IconButton aria-label="Add Row" variant="@primary" size="sm" icon={<HiOutlinePlus />} onClick={addRow} mr={2} />
                                                            )}
                                                            <IconButton aria-label="Delete Row" colorScheme="red" size="sm" icon={<DeleteIcon />} onClick={() => deleteRow(row.rowKey)} isDisabled={rows.length <= 1} />
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
                                    <Text ml={3}>Grand Total: <Text as="span" ml={3} fontWeight="bold">{grandTotal.toFixed(2)}</Text></Text>
                                </HStack>

                                {/* ── Charges & Totals ── */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} {...sectionStyle}>
                                    <FieldDisplay
                                        label="Sub Total" value={subTotal.toFixed(2)} size="sm"
                                        style={{ backgroundColor: '#fff' }}
                                        leftElement={currencySymbol || undefined}
                                    />
                                    <FieldInput
                                        label="Bank Charges" name="bank_charge" size="sm" type="decimal" maxLength={9}
                                        leftElement={currencySymbol || undefined}
                                    />
                                    <FieldInput
                                        label="Freight Charges" name="freight" size="sm" type="decimal" maxLength={9}
                                        leftElement={currencySymbol || undefined}
                                    />
                                    <FieldInput
                                        label="Misc Charges" name="miscellaneous_charges" size="sm" type="decimal" maxLength={9}
                                        leftElement={currencySymbol || undefined}
                                    />
                                    <FieldInput
                                        label="VAT" name="vat" size="sm" type="decimal"
                                        rightElement="%" maxLength={6} maxValue={999}
                                    />
                                    <FieldDisplay
                                        label="VAT Amount" value={vatAmount.toFixed(2)} size="sm"
                                        style={{ backgroundColor: '#fff' }}
                                        leftElement={currencySymbol || undefined}
                                    />
                                    <FieldInput
                                        label="Discount" name="discount" size="sm" type="decimal" maxLength={9}
                                        leftElement={currencySymbol || undefined}
                                    />
                                    <FieldDisplay
                                        label="Total Amount" value={totalPayableAmount.toFixed(2)} size="sm"
                                        style={{ backgroundColor: '#fff' }}
                                        leftElement={currencySymbol || undefined}
                                    />
                                </Stack>

                                {/* ── Remarks editor ── */}
                                <Stack>
                                    <FormControl>
                                        <FormLabel>Remarks</FormLabel>
                                        <FieldHTMLEditor
                                            onValueChange={handleRemarksChange}
                                            maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                            placeHolder="Enter Remarks Here"
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
                                <Button onClick={handleOpenPreview} colorScheme="green" isDisabled={!form.isValid} isLoading={previewPDF.isLoading}>
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

export default PurchaseOrderForm;