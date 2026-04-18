import { useState, useEffect, useMemo, useRef } from "react";
import { ChevronRightIcon, DeleteIcon, SearchIcon } from "@chakra-ui/icons";
import {
    Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading,
    IconButton, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tooltip, Tr, Grid, GridItem,
    useDisclosure,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft } from "react-icons/hi";
// import { LuDownload } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

import { FieldUpload } from '@/components/FieldUpload';
import FieldDisplay from "@/components/FieldDisplay";
import { FieldHTMLEditor } from "@/components/FieldHTMLEditor";
import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { useToastError } from "@/components/Toast";
import { formatContactAddress, formatShippingAddress } from "@/helpers/commonHelper";
//import { getOptionValue, handleDownload, formatContactAddress, formatShippingAddress, formatDate } from "@/helpers/commonHelper";
// import { CSVUploadButton } from "@/components/ReUsable/CSVUploadButton";

import { CustomerModal } from "@/components/Modals/CustomerMaster";
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";
import { CustomerShippingAddressModal } from "@/components/Modals/CustomerMaster/ShippingAddress";
import { MaterialRequestSearchPopup } from "@/components/Popups/Search/Purchase/MaterialRequest";

import { useSavePurchaseOrder, usePurchaseOrderDetails, usePurchaseOrderDropdowns } from "@/services/purchase/order/service";
import { useCustomerRelationIndex, useCustomerDetails, useCustomerList } from "@/services/master/customer/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useUserContext } from "@/services/auth/UserContext";
import { usePDFPreviewController } from "@/api/hooks/usePDFPreviewController";
import { endPoints } from "@/api/endpoints";
import { useMaterialRequestList, getMaterialRequestById } from "@/services/purchase/material-request/service";


// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_KEYS = [
    "priority_id", "currency_id", "payment_mode_id", "payment_term_id", "fob_id",
    "customer_id", "customer_contact_manager_id", "customer_shipping_address_id", "remarks",
    "bank_charge", "freight", "miscellaneous_charges", "vat", "discount",
    "ship_type_id", "ship_mode_id", "ship_account_id", "reference_file"
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
    material_request_id?: any;
    material_request_item_id?: any;
    material_request_code?: any;
    is_existing?: boolean;
    id?: any;
    part_number: any;
};

const calcTotalValue = (qty: any, unitPrice: any): string => {
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(p)) return (q * p).toFixed(2);
    return "";
};

const str = (v: any) => String(v ?? '');

// ─── Component ────────────────────────────────────────────────────────────────

export const DirectPOForm = () => {
    const navigate = useNavigate();
    const toastError = useToastError();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const { userInfo } = useUserContext();

    // ── MR State ───────────────────────────────────────────────────────────────
    const [selectedMRIds, setSelectedMRIds] = useState<string[]>([]);
    const [selectedMaterialRequests, setSelectedMaterialRequests] = useState<any[]>([]);
    const [isMRLoading, setIsMRLoading] = useState(false);
    const prefillDoneRef = useRef(false);
    const { isOpen: isMRModalOpen, onOpen: openMRModal, onClose: closeMRModal } = useDisclosure();
    const [activeInput, setActiveInput] = useState('');
    // ── Row / Customer State ───────────────────────────────────────────────────
    const [isCustomerChanged, setIsCustomerChanged] = useState(false);
    const [isInitialAutoFillDone, setIsInitialAutoFillDone] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<any>(null);
    const [selectedContactManagerId, setSelectedContactManagerId] = useState<any>(null);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<any>(null);
    const [rows, setRows] = useState<SLRow[]>([]);
    const [initialValues, setInitialValues] = useState<any>(null);
    const [initialMRIds, setInitialMRIds] = useState<string[]>([]);

    // ── Data Fetching ──────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: l1, refetch: reloadDropDowns } = usePurchaseOrderDropdowns();
    const { data: itemInfo, isLoading: l2 } = usePurchaseOrderDetails(id, { enabled: isEdit });
    const { data: customerInfo, isLoading: l3 } = useCustomerDetails(selectedCustomerId, { enabled: !!selectedCustomerId });
    const { data: contactManagerList, isLoading: l4, refetch: reloadContactManagers } = useCustomerRelationIndex(selectedCustomerId, "contact-managers");
    const { data: shippingAddressList, isLoading: l5, refetch: reloadShippingAddresses } = useCustomerRelationIndex(selectedCustomerId, "shipping-addresses");
    const { data: conditionData } = useSubmasterItemIndex("conditions", {});
    const { data: uomData } = useSubmasterItemIndex("unit-of-measures", {});
    const { data: contactTypeData } = useSubmasterItemIndex("contact-types", {});
    const { data: currencyData } = useSubmasterItemIndex("currencies", {});
    const { data: materialRequestList } = useMaterialRequestList();

    const handleDoubleClick = (field: string) => setActiveInput(field);

    const filteredContactTypeIds = contactTypeData?.data
        ?.filter((item: any) => ['SUP', 'PUR'].includes(item.code))
        ?.map((item: any) => item.id);
    const { data: customerList, isLoading: l6, refetch: reloadCustomers } = useCustomerList({ contact_type_id: filteredContactTypeIds });

    const isLoading = l1 || l2 || l3 || l6 || isMRLoading;

    // ── Derived Options ────────────────────────────────────────────────────────
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

    const contactManagerOptions = contactManagerList?.data?.map((i: any) => ({ value: i.id, label: i.attention })) ?? [];
    const shippingAddressOptions = shippingAddressList?.data?.map((i: any) => ({ value: i.id, label: `${i.consignee_name} — ${i.country}` })) ?? [];

    const fixedMRIds: string[] = isEdit
        ? (itemInfo?.data?.material_requests ?? [])
            .map((mr: any) => typeof mr === "object" ? mr?.id : mr) // 👈 extract id if object
            .filter(Boolean)
            .map(String)
        : [];
    const materialRequestOptions = (materialRequestList?.data ?? []).map((opt: any) => ({
        ...opt, isFixed: fixedMRIds.includes(String(opt.value)),
    }));

    // ── Address Display ────────────────────────────────────────────────────────
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

    const form = useForm({
        onValidSubmit: (values) => {
            if (rows.some(r => r.is_duplicate)) {
                toastError({ title: "Duplicate entries found", description: "Same Part Number added with same condition multiple times" });
                return;
            }
            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));

            // ── Use form field value as fallback in case state is stale ──
            const mrIds = selectedMRIds.length > 0
                ? selectedMRIds
                : (Array.isArray(values['material_request_id']) ? values['material_request_id'] : []);
            payload.material_request_ids = mrIds;

            payload.items = rows.map(row => ({
                part_number_id: row.part_number_id,
                condition_id: values[`condition_${row.rowKey}`],
                qty: Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: row.unit_of_measure_id,
                price: Number(values[`price_${row.rowKey}`]),
                total_value: Number(values[`total_value_${row.rowKey}`]),
                note: values[`note_${row.rowKey}`],
                ...(row.material_request_item_id && { quotation_item_id: row.material_request_item_id }),
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
        const match = currencyData?.data?.find((c: any) => String(c.id) === String(selectedCurrencyId));
        return match?.symbol ?? match?.label ?? "";
    }, [fields['currency_id']?.value, currencyData]);

    // ── Edit Prefill ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!itemInfo?.data) return;
        const s = itemInfo.data;
        prefillDoneRef.current = false;

        const values = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));
        setSelectedCustomerId(s.customer_id);
        setSelectedContactManagerId(s.customer_contact_manager_id);
        setSelectedShippingAddressId(s.customer_shipping_address_id);
        setInitialValues(values);
        form.setValues(values);

        // MR IDs
        if (s.material_requests) {
            const mrIds = s.material_requests.map((mr: any) => mr?.id).filter(Boolean);

            const mrIdStrings = mrIds.map(String);

            setInitialMRIds(mrIdStrings);
            setSelectedMRIds(mrIdStrings);

            form.setValues({ material_request_id: mrIds });

            setSelectedMaterialRequests(s.material_requests);
        }

        if (!s.items?.length) {
            prefillDoneRef.current = true;
            return;
        }

        const prefilled: SLRow[] = s.items.map((item: any) => ({
            rowKey: uuidv4(),
            part_number_id: item.part_number_id,
            condition_id: item.condition_id,
            qty: item.qty,
            unit_of_measure_id: item.unit_of_measure_id,
            price: item.price ?? "",
            total_value: item.total_value ?? calcTotalValue(item.qty, item.price),
            note: item.note ?? "",
            material_request_id: item.material_request_id ?? "",
            material_request_item_id: item.quotation_item_id ?? "",
            material_request_code: item.material_request_code ?? "",
            id: item.id,
            is_duplicate: false,
            is_existing: true,
            part_number: item.part_number
        }));
        setRows(prefilled);
        applyRowsToForm(prefilled);
        prefillDoneRef.current = true;
    }, [itemInfo]);

    // ── Fetch MR Details when selectedMRIds changes ────────────────────────────
    useEffect(() => {
        if (selectedMRIds.length === 0) {
            // ← clear both MRs and rows when all MRs deselected
            setSelectedMaterialRequests([]);
            if (!isEdit || !prefillDoneRef.current) {
                setRows([]);
            } else {
                // In edit mode keep only existing rows, drop new MR rows
                setRows(prev => prev.filter(r => r.is_existing));
            }
            return;
        }

        const alreadyFetchedIds = new Set(selectedMaterialRequests.map(mr => str(mr.id)));
        const toFetch = selectedMRIds.filter(sid => !alreadyFetchedIds.has(sid));
        const retained = selectedMaterialRequests.filter(mr => selectedMRIds.includes(str(mr.id)));

        if (toFetch.length === 0) {
            if (retained.length !== selectedMaterialRequests.length) {
                setSelectedMaterialRequests(retained);
                // Remove rows belonging to deselected MRs
                setRows(prev => prev.filter(row =>
                    !row.material_request_id ||
                    row.is_existing ||
                    selectedMRIds.includes(str(row.material_request_id))
                ));
            }
            return;
        }

        setIsMRLoading(true);
        (async () => {
            try {
                const fetched = await Promise.all(toFetch.map(getMaterialRequestById));
                setSelectedMaterialRequests([...retained, ...fetched]);
            } finally {
                setIsMRLoading(false);
            }
        })();
    }, [selectedMRIds]);
    // ── Sync new MR rows ───────────────────────────────────────────────────────
    // ── Sync new MR rows ───────────────────────────────────────────────────────
    useEffect(() => {
        if (selectedMaterialRequests.length === 0) return;
        if (!prefillDoneRef.current && isEdit) return;

        // In edit mode — only add NEW MR items not already in rows
        if (isEdit && prefillDoneRef.current) {
            const existingItemIds = new Set(rows.filter(r => r.is_existing).map(r => str(r.material_request_item_id)));
            const newRows: SLRow[] = selectedMaterialRequests
                .filter(mr => !initialMRIds.includes(str(mr.id)))
                .flatMap(mr =>
                    (mr.items ?? [])
                        .filter((item: any) => !existingItemIds.has(str(item.id)))
                        .map((item: any) => ({
                            rowKey: uuidv4(),
                            material_request_id: mr.id,
                            material_request_code: mr.code,
                            material_request_item_id: item.id ?? '',
                            part_number_id: item.part_number_id ?? '',
                            part_number: item.part_number ?? null,   // ← add
                            condition_id: item.condition_id ?? '',
                            qty: item.qty ?? '',
                            unit_of_measure_id: item.unit_of_measure_id ?? '',
                            price: '',
                            total_value: '',
                            note: '',
                            is_duplicate: false,
                        }))
                );
            if (newRows.length > 0) {
                setRows(prev => [...prev, ...newRows]);
                setTimeout(() => applyRowsToForm(newRows), 0);
            }
            return;
        }

        // Add mode — rebuild all rows from selected MRs
        const newRows: SLRow[] = selectedMaterialRequests.flatMap(mr =>
            (mr.items ?? []).map((item: any) => ({
                rowKey: uuidv4(),
                material_request_id: mr.id,
                material_request_code: mr.code,
                material_request_item_id: item.id ?? '',
                part_number_id: item.part_number_id ?? '',
                part_number: item.part_number ?? null,   // ← add
                condition_id: item.condition_id ?? '',
                qty: item.qty ?? '',
                unit_of_measure_id: item.unit_of_measure_id ?? '',
                price: '',
                total_value: '',
                note: '',
                is_duplicate: false,
            }))
        );

        setRows(prev => {
            const manualRows = prev.filter(r => !r.material_request_id);
            return [...newRows, ...manualRows];
        });

        setTimeout(() => applyRowsToForm(newRows), 0);
    }, [selectedMaterialRequests]);

    // ── Customer Auto-fill ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!customerInfo?.data) return;
        const c = customerInfo.data;
        if (!isCustomerChanged && !(isEdit && !isInitialAutoFillDone)) return;
        form.setValues({ currency_id: c.currency_id ?? "", payment_mode_id: c.payment_mode_id ?? "", payment_term_id: c.payment_term_id ?? "" });
        if (!isInitialAutoFillDone) setIsInitialAutoFillDone(true);
        if (isCustomerChanged) setIsCustomerChanged(false);
    }, [customerInfo]);

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

    // ── PDF Preview ────────────────────────────────────────────────────────────
    const previewPDF = usePDFPreviewController({ url: endPoints.preview_post.purchase_order, title: "PURCHASE ORDER PREVIEW" });

    const handleOpenPreview = () => {
        const popupVariables: any = { user_id: userInfo.id };
        Object.keys(fields).forEach(key => { popupVariables[key] = fields[key].value; });
        popupVariables.items = rows.map(row => ({
            part_number_id: fields[`part_number_${row.rowKey}`]?.value,
            condition_id: fields[`condition_${row.rowKey}`]?.value,
            qty: Number(fields[`qty_${row.rowKey}`]?.value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`]?.value,
            price: Number(fields[`price_${row.rowKey}`]?.value),
            total_value: Number(fields[`total_value_${row.rowKey}`]?.value),
            note: fields[`note_${row.rowKey}`]?.value,
        }));
        previewPDF.open(popupVariables);
    };

    // ── Row Helpers ────────────────────────────────────────────────────────────
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

    const deleteRow = (rowKey: string) => setRows(prev => prev.filter(r => r.rowKey !== rowKey));

    const handleInputChange = (field: string, value: any, index: number) => {
        setRows(prev => {
            const next = [...prev];
            const updated = { ...next[index], [field]: value };
            if (field === "qty" || field === "price") {
                const qty = field === "qty" ? value : updated.qty;
                const unitPrice = field === "price" ? value : updated.price;
                const tv = calcTotalValue(qty, unitPrice);
                updated.total_value = tv;
                form.setValues({ [`total_value_${next[index].rowKey}`]: tv });
            }
            next[index] = updated;
            //const seen = new Set<string>();
            return next;
            // .map(row => {
            //     const key = `${row.part_number_id}-${row.condition_id}`;
            //     const isDuplicate = !!(row.part_number_id && row.condition_id && seen.has(key));
            //     if (row.part_number_id && row.condition_id) seen.add(key);
            //     return { ...row, is_duplicate: isDuplicate };
            // });
        });
    };

    // ── MR Modal ───────────────────────────────────────────────────────────────
    const handleMRApply = (ids: string[]) => {
        setSelectedMRIds(ids);
        form.setValues({ material_request_id: ids });
        closeMRModal();
    };

    // ── Add New Helpers ────────────────────────────────────────────────────────
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

    const submasterAddNew = (fieldName: string, model: string) => ({
        label: '+ Add New',
        CreateModal: (p: any) => <SubMasterModalForm {...p} model={model} isEdit={false} />,
        onSuccess: handleAddNewSuccess(fieldName, reloadDropDowns),
    });

    const handleCustomerChange = (v: any) => {
        setSelectedCustomerId(v);
        setSelectedContactManagerId(null);
        setSelectedShippingAddressId(null);
        setIsCustomerChanged(true);
        form.setValues({ customer_contact_manager_id: "", customer_shipping_address_id: "" });
    };

    // ── Derived Totals ─────────────────────────────────────────────────────────
    const isFormValuesChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });
    const totalQty = rows.reduce((acc, row) => acc + (Number(fields[`qty_${row.rowKey}`]?.value) || 0), 0);
    const totalItems = rows.filter(row => fields[`part_number_${row.rowKey}`]?.value).length;
    const grandTotal = rows.reduce((acc, row) => acc + (Number(fields[`total_value_${row.rowKey}`]?.value) || 0), 0);
    const subTotal = grandTotal;
    const vatAmount = parseFloat(((subTotal * (Number(fields['vat']?.value) || 0)) / 100).toFixed(2));
    const totalPayableAmount = parseFloat((
        subTotal +
        (Number(fields['bank_charge']?.value) || 0) +
        (Number(fields['freight']?.value) || 0) +
        (Number(fields['miscellaneous_charges']?.value) || 0) +
        vatAmount -
        (Number(fields['discount']?.value) || 0)
    ).toFixed(2));

    const isSaving = saveEndpoint.isLoading;
    const title = isEdit ? "Edit Direct PO" : "Add New Direct PO";
    const sectionStyle = { bg: "blue.100", p: 4, rounded: "md", border: "1px solid", borderColor: "blue.300" };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Page Header ── */}
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

                                {/* ── MR Selection ── */}
                                <Grid templateColumns={{ base: "1fr", md: "3fr 7fr" }} gap={6} alignItems="stretch">
                                    <GridItem>
                                        <Box rounded="md" border="1px solid" borderColor="gray.300" p={4} h="100%" background={'blue.100'}>
                                            <Stack spacing={4}>
                                                <FormControl>
                                                    <FormLabel fontSize={'sm'}>
                                                        Material Request <Text as="span" color={'red.500'}>*</Text>
                                                        <IconButton aria-label="Open MR Search" colorScheme="brand" size="xs" icon={<SearchIcon />} onClick={openMRModal} ml={2} />
                                                    </FormLabel>
                                                    <FieldSelect
                                                        required="Material Requests required"
                                                        size={'sm'}
                                                        name="material_request_id"
                                                        options={materialRequestOptions} isClearable isMulti
                                                        onValueChange={(v) => setSelectedMRIds(v ?? [])}
                                                        selectProps={{ noOptionsMessage: () => 'No Material Requests' }}
                                                    />
                                                </FormControl>
                                            </Stack>
                                        </Box>
                                    </GridItem>

                                    <GridItem>
                                        <Box rounded="md" h="100%">
                                            <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                    <Table variant="striped" size="sm">
                                        <Thead bg="gray.500">
                                                        <Tr>
                                                            <Th color="white">MR Reference</Th>
                                                            <Th color="white">MR Type</Th>
                                                            <Th color="white">Need by Date</Th>
                                                            <Th color="white">Priority</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {selectedMaterialRequests.length > 0
                                                            ? selectedMaterialRequests.map((item: any, i: number) => (
                                                                <Tr key={i}>
                                                                    <Td>{item?.code ?? item?.ref}</Td>
                                                                    <Td>{item?.type_label}</Td>
                                                                    <Td>{item?.due_date ? dayjs(item.due_date).format('DD-MMM-YYYY') : '-'}</Td>
                                                                    <Td>{item?.priority?.name ?? '—'}</Td>
                                                                </Tr>
                                                            ))
                                                            : <Tr><Td colSpan={4} textAlign="center" color="gray.400">No Material Request Selected</Td></Tr>
                                                        }
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    </GridItem>
                                </Grid>

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
                                    <FieldUpload
                                        label="Ref File" name="reference_file"
                                        placeholder="Upload Ref File" size="sm"
                                        inputProps={{ id: 'RefFileUpload' }}
                                    />
                                </Stack>

                                {/* ── Section 2: Shipping ── */}
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

                                {/* ── Items Toolbar ── */}
                                {/* <HStack justify="space-between" mt={3}>
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
                                                    const newOptions = Object.values(resolvedMap).map((r: any) => ({ value: String(r.id), label: r.name }));
                                                    setExtraSpareOptions(prev => {
                                                        const existingIds = new Set(prev.map(o => o.value));
                                                        return [...prev, ...newOptions.filter(o => !existingIds.has(o.value))];
                                                    });
                                                },
                                            }}
                                            duplicateCheck={{ keys: ["part_number_id"], label: "Part Number", existingRows: rows }}
                                            onUpload={(mapped) => {
                                                const kept = rows.filter(r => r.part_number_id);
                                                const rowsWithTotals = mapped.map(row => ({ ...row, total_value: calcTotalValue(row.qty, row.price) }));
                                                const next = [...kept, ...rowsWithTotals];
                                                setRows(next);
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
                                </HStack> */}

                                {/* ── Items Table ── */}
                                {/* ── Items Table ── */}
                                <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.500">
                                            <Tr>
                                                <Th color="white">S.No.</Th>
                                                <Th color="white">MR Ref</Th>
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
                                            {rows.map((row, index) => (
                                                <Tr
                                                    key={row.rowKey}
                                                    background={row.is_duplicate ? "yellow.100" : ""}
                                                >
                                                    <Td><Text fontSize="medium">{index + 1}.</Text></Td>

                                                    {/* MR Ref */}
                                                    <Td>
                                                        <Text fontSize="sm" color="gray.600">
                                                            {row.material_request_code || '—'}
                                                        </Text>
                                                    </Td>

                                                    {/* Part Number — display only, same as PurchaseOrderForm */}
                                                    <Td>
                                                        <Text fontWeight="bold">{row.part_number?.name ?? '—'}</Text>
                                                        <Text fontSize="xs" color="gray.500">{row.part_number?.description ?? '—'}</Text>
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
                                                            selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: l1 }}
                                                        />
                                                    </Td>

                                                    {/* Qty — double-click to edit */}
                                                    <Tooltip hasArrow label="Double-click to change" placement="top" bg="green.600">
                                                        <Td>
                                                            <FieldInput
                                                                name={`qty_${row.rowKey}`}
                                                                size="sm" required="Quantity is required"
                                                                type="integer" placeholder="Qty"
                                                                defaultValue={row.qty || ""}
                                                                width="100px" maxLength={9}
                                                                onValueChange={(v) => handleInputChange("qty", v, index)}
                                                                onDoubleClick={() => setActiveInput(`qty_${row.rowKey}`)}
                                                                onBlur={() => setActiveInput('')}
                                                                isReadOnly={activeInput !== `qty_${row.rowKey}`}
                                                            />
                                                        </Td>
                                                    </Tooltip>

                                                    {/* UOM — disabled, same as PurchaseOrderForm */}
                                                    <Td>
                                                        <FieldSelect
                                                            name={`uom_${row.rowKey}`}
                                                            size="sm" menuPortalTarget={document.body}
                                                            required="UOM is required" placeholder="Select..."
                                                            options={uomOptions}
                                                            defaultValue={row.unit_of_measure_id || ""}
                                                            onValueChange={(v) => handleInputChange("unit_of_measure_id", v, index)}
                                                            style={{ minWidth: 120 }}
                                                            isCaseSensitive
                                                            isDisabled
                                                            className="disabled-input"
                                                            selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: l1 }}
                                                        />
                                                    </Td>

                                                    {/* Unit Price — double-click to edit */}
                                                    <Tooltip hasArrow label="Double-click to change" placement="top" bg="green.600">
                                                        <Td>
                                                            <FieldInput
                                                                name={`price_${row.rowKey}`}
                                                                size="sm" required="Unit Price is required"
                                                                type="number" placeholder="Unit Price"
                                                                defaultValue={row.price || ""}
                                                                width="120px" maxLength={15}
                                                                onValueChange={(v) => handleInputChange("price", v, index)}
                                                                // onDoubleClick={() => setActiveInput(`price_${row.rowKey}`)}
                                                                // onBlur={() => setActiveInput('')}
                                                                // isReadOnly={activeInput !== `price_${row.rowKey}`}
                                                                leftElement={currencySymbol || undefined}
                                                            />
                                                        </Td>
                                                    </Tooltip>

                                                    {/* Total Value — read-only */}
                                                    <Td>
                                                        <FieldInput
                                                            name={`total_value_${row.rowKey}`}
                                                            size="sm" placeholder="—"
                                                            defaultValue={row.total_value || ""}
                                                            width="120px"
                                                            isReadOnly
                                                            style={{ background: "var(--chakra-colors-gray-50)", cursor: "default" }}
                                                            leftElement={currencySymbol || undefined}
                                                        />
                                                    </Td>

                                                    {/* Note — double-click to edit */}
                                                    <Tooltip hasArrow label="Double-click to change" placement="top" bg="green.600">
                                                        <Td>
                                                            <FieldInput
                                                                name={`note_${row.rowKey}`}
                                                                size="sm" placeholder="Remark"
                                                                defaultValue={row.note || ""}
                                                                maxLength={60}
                                                                style={{ minWidth: 200 }}
                                                                onDoubleClick={() => setActiveInput(`note_${row.rowKey}`)}
                                                                onBlur={() => setActiveInput('')}
                                                                isReadOnly={activeInput !== `note_${row.rowKey}`}
                                                            />
                                                        </Td>
                                                    </Tooltip>

                                                    {/* Actions */}
                                                    <Td isNumeric>
                                                        <Tooltip
                                                            label="Cannot delete MR-linked item"
                                                            placement="left" hasArrow color="white"
                                                            isDisabled={!row.is_existing} background="red"
                                                        >
                                                            <span>
                                                                <IconButton
                                                                    aria-label="Delete Row"
                                                                    colorScheme="red" size="sm"
                                                                    icon={<DeleteIcon />}
                                                                    onClick={() => deleteRow(row.rowKey)}
                                                                    isDisabled={rows.length <= 1 || row.is_existing === true}
                                                                />
                                                            </span>
                                                        </Tooltip>
                                                    </Td>
                                                </Tr>
                                            ))}
                                            {rows.length === 0 && (
                                            <Tr><Td colSpan={10} textAlign="center" color="gray.400">No Items found</Td></Tr>
                                            )}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* ── Totals ── */}
                                <HStack mt={3}>
                                    <Text>Total Qty: <Text as="span" ml={3} fontWeight="bold">{totalQty}</Text></Text>
                                    <Text ml={3}>Total Line Items: <Text as="span" ml={3} fontWeight="bold">{rows.length}</Text></Text>
                                    <Text ml={3}>Total Amount: <Text as="span" ml={3} fontWeight="bold">{grandTotal.toFixed(2)}</Text></Text>
                                </HStack>

                                {/* ── Charges ── */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} {...sectionStyle} display={'none'}>
                                    <FieldDisplay label="Sub Total" value={subTotal.toFixed(2)} size="sm" style={{ backgroundColor: '#fff' }} leftElement={currencySymbol || undefined} />
                                    <FieldInput label="Bank Charges" name="bank_charge" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled />
                                    <FieldInput label="Freight Charges" name="freight" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled />
                                    <FieldInput label="Misc Charges" name="miscellaneous_charges" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled/>
                                    <FieldInput label="VAT" name="vat" size="sm" type="decimal" rightElement="%" maxLength={6} maxValue={999} isDisabled/>
                                    <FieldDisplay label="VAT Amount" value={vatAmount.toFixed(2)} size="sm" style={{ backgroundColor: '#fff' }} leftElement={currencySymbol || undefined} />
                                    <FieldInput label="Discount" name="discount" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled/>
                                    <FieldDisplay label="Total Amount" value={totalPayableAmount.toFixed(2)} size="sm" style={{ backgroundColor: '#fff' }} leftElement={currencySymbol || undefined} />
                                </Stack>

                                {/* ── Remarks ── */}
                                <FormControl>
                                    <FormLabel>Remarks</FormLabel>
                                    <FieldHTMLEditor
                                        onValueChange={(v) => form.setValues({ remarks: v })}
                                        maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                        placeHolder="Enter Remarks Here"
                                        defaultValue={isEdit && itemInfo?.data?.remarks ? itemInfo.data.remarks : ""}
                                    />
                                </FormControl>

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

            <MaterialRequestSearchPopup isOpen={isMRModalOpen} onClose={handleMRApply} data={{ request_ids: selectedMRIds }} />
        </SlideIn>
    );
};

export default DirectPOForm;