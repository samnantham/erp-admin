import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRightIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import {
    Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Flex,
    FormControl, FormLabel, Grid, HStack, Heading, IconButton,
    Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr,
    useDisclosure,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiArrowNarrowLeft, HiOutlinePencilAlt, HiX } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import FieldDisplay from '@/components/FieldDisplay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldUpload } from '@/components/FieldUpload';
import LoadingOverlay from '@/components/LoadingOverlay';
import { PRFQSearchPopup } from '@/components/Popups/Search/Purchase/RFQ';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { convertToOptions, formatDate, getDisplayLabel } from '@/helpers/commonHelper';
import dayjs from 'dayjs';
import { useCustomerDetails } from '@/services/master/customer/service';
import { usePRFQDetails, usePRFQList } from '@/services/purchase/rfq/service';
import { useAltPartNumberList } from '@/services/master/spare/service';
import {
    useCreateQuotationItems,
    usePurchaseQuotationDetails,
    usePurchaseQuotationDropdowns,
    useSavePurchaseQuotation,
    useQuotationList,
    useQuotationItems,
    type PurchaseQuotationVariables,
    type QuotationItemVariables,
} from '@/services/purchase/quotation/service';
import { useToastError } from '@/components/Toast';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabData = {
    part_number_id: string;
    condition_id: string;
    unit_of_measure_id: string;
    qty: string;
    price: string;
    moq: string;
    mov: string;
    delivery_options: string;
    remark: string;
    prfq_item_id: string;
    requested_part_number_id: string;
    part_number?: any;
};

type ConfirmState = {
    title: string;
    content: string;
    // ← 'no_quote' | 'delete_line' | 'pending_items'
    action: 'no_quote' | 'delete_line' | 'pending_items';
    lineItemId?: number | string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFIRM_DEFAULTS: ConfirmState = {
    title: 'Confirm',
    content: 'Are you sure?',
    action: 'pending_items',
};

const TABLE_COLUMNS: [string, string | null][] = [
    ['Req. P/N', null], ['Condition', null],
    ['Qty', 'qty'], ['UOM', null], ['Price', 'price'],
    ['MOQ', 'moq'], ['MOV', 'mov'], ['Delivery', 'delivery_options'],
    ['Remark', 'remark'],
];

// ─── Component ────────────────────────────────────────────────────────────────

export const SupplierPricingUpdateForm = () => {
    const navigate = useNavigate();
    const toastError = useToastError();
    const [itemFormKey, setItemFormKey] = useState(0);

    // ── Core IDs ──────────────────────────────────────────────────────────────
    const [prfqId, setPrfqId] = useState<any>(null);
    const [customerId, setCustomerId] = useState<any>(null);
    const [quotationId, setQuotationId] = useState<any>(null);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formTabValues, setFormTabValues] = useState<Record<number, TabData>>({});
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // ── Confirmation dialog ───────────────────────────────────────────────────
    const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_DEFAULTS);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingItems, setPendingItems] = useState<QuotationItemVariables[] | null>(null);

    // ── Search modal ──────────────────────────────────────────────────────────
    const { isOpen: isSearchOpen, onOpen: openSearch, onClose: closeSearch } = useDisclosure();

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: prfqList } = usePRFQList();
    const { data: dropdownData, isLoading: dropdownLoading } = usePurchaseQuotationDropdowns();
    const { data: rfqDetails, isLoading: rfqLoading } = usePRFQDetails(prfqId ?? undefined);
    const { data: vendorDetails, isLoading: vendorLoading } = useCustomerDetails(customerId, { enabled: !!customerId });
    const { data: quotationList, refetch: reloadQuotations } = useQuotationList({
        enabled: !!prfqId && !!customerId,
        queryParams: {
            prfq_id: prfqId,
            vendor_id: customerId,
        },
    });
    const { data: quotationDetails, isLoading: quotationDetailsLoading } = usePurchaseQuotationDetails(
        quotationId,
        { enabled: !!quotationId && quotationId !== '__new__' },
    );
    const { data: quotationItemsData, refetch: refetchQuotationItems } = useQuotationItems(
        quotationId ?? undefined,
        { enabled: !!quotationId && quotationId !== '__new__' },
    );

    // ── Single loading flag ───────────────────────────────────────────────────
    const isLoading = rfqLoading || dropdownLoading || vendorLoading || quotationDetailsLoading;

    // ── Derived data ──────────────────────────────────────────────────────────
    const prfqOptions = prfqList?.data ?? [];
    const rfqItems = rfqDetails?.data?.items ?? [];
    const rfqVendors = rfqDetails?.data?.vendors ?? [];
    const activeRFQItem = rfqItems[activeTab];
    const activeTabData = formTabValues[activeTab];
    const currencyOptions = dropdownData?.currencies ?? [];
    const conditionOptions = dropdownData?.conditions ?? [];
    const uomOptions = dropdownData?.unit_of_measures ?? [];
    const isItemDisabled = !quotationId;

    // Active quotation item (slot) for the current RFQ item tab
    const activeQuotationItem = useMemo(() => {
        return quotationItemsData?.data?.find(
            (qi) => String(qi.prfq_item_id) === String(activeRFQItem?.id)
        ) ?? null;
    }, [quotationItemsData, activeRFQItem]);

    const quotationOptions = useMemo(() => {
        const existing = quotationList?.data ?? [];
        return [
            ...existing,
            { value: '__new__', label: '+ Add New Quotation' },
        ];
    }, [quotationList]);

    useEffect(() => {
        const existing = quotationList?.data ?? [];
        if (existing.length > 0 && customerId) {
            const firstId = existing[0].value;
            setQuotationId(firstId);
            headerForm.setValues({ quotation_id: firstId });
        } else {
            setQuotationId(null);
            const firstId = quotationOptions[0]?.value;
            headerForm.setValues({ quotation_id: firstId });
        }
    }, [quotationList, customerId]);

    // Line items (offers) under the active slot
    const activeLineItems = activeQuotationItem?.lines ?? [];

    const vendorOptions = useMemo(
        () => convertToOptions(rfqVendors.map((v: any) => v.vendor), 'id', 'business_name'),
        [rfqVendors],
    );

    const { data: altPartNumbers, isLoading: altPartsLoading } = useAltPartNumberList(
        activeRFQItem?.part_number_id ?? undefined,
        { enabled: !!activeRFQItem?.part_number_id },
    );

    const altPartOptions = altPartNumbers?.data ?? [];

    // ── Delete line item mutation ──────────────────────────────────────────────
    const deleteLineItem = useDelete({
        url: endPoints.delete.quotation_line_item.replace(':quotation', quotationId ?? ''),
        invalidate: [],
    });

    // ── Forms ─────────────────────────────────────────────────────────────────
    const headerForm = useForm({
        onValidSubmit: (values) => {
            const payload: PurchaseQuotationVariables = {
                prfq_id: String(values.prfq_id),
                vendor_id: String(values.vendor_id),
                currency_id: String(values.currency_id),
                vendor_quotation_no: values.vendor_quotation_no,
                vendor_quotation_date: formatDate(values.vendor_quotation_date) ?? '',
                expiry_date: formatDate(values.expiry_date),
                remarks: values.remarks,
                quotation_file: values.quotation_file,
            };
            savePurchaseQuotation.mutate(payload,
                { onSuccess: () => reloadQuotations() },
            );
        },
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const savePurchaseQuotation = useSavePurchaseQuotation();
    const createItems = useCreateQuotationItems();

    // ── Effects ───────────────────────────────────────────────────────────────

    /** Initialise per-tab form data when RFQ items load */
    useEffect(() => {
        if (!rfqItems.length) return;
        const initial: Record<number, TabData> = {};
        rfqItems.forEach((item: any, idx: number) => {
            initial[idx] = {
                requested_part_number_id: item.part_number_id ?? '',
                part_number_id: '',
                condition_id: item.condition_id ?? '',
                unit_of_measure_id: item.unit_of_measure_id ?? '',
                qty: String(item.qty ?? ''),
                price: '',
                moq: '',
                mov: '',
                delivery_options: '',
                remark: item.remark ?? '',
                prfq_item_id: item.id ?? '',
                part_number: item.part_number ?? '',
            };
        });
        setFormTabValues(initial);
    }, [rfqDetails]);

    /** Pre-fill currency from vendor profile */
    useEffect(() => {
        if (vendorDetails?.data?.currency_id) {
            headerForm.setValues({ currency_id: vendorDetails.data.currency_id });
        }
    }, [vendorDetails]);

    /** Populate header form when an existing quotation is loaded */
    useEffect(() => {
        if (!quotationDetails?.data) return;
        const q = quotationDetails.data;
        headerForm.setValues({
            remarks: q.remarks ?? '',
            vendor_quotation_no: q.vendor_quotation_no ?? '',
            vendor_quotation_date: q.vendor_quotation_date ? dayjs(q.vendor_quotation_date) : undefined,
            expiry_date: q.expiry_date ? dayjs(q.expiry_date) : undefined,
        });
    }, [quotationDetails]);

    /** Sync item form fields when active tab or form data changes */
    useEffect(() => {
        const data = formTabValues[activeTab];
        if (!data) return;
        itemForm.setValues({
            part_number_id: data.part_number_id ?? '',
            condition_id: data.condition_id ?? '',
            qty: data.qty ? Number(data.qty) : '',
            unit_of_measure_id: data.unit_of_measure_id ?? '',
            price: data.price ?? '',
            moq: data.moq ?? '',
            mov: data.mov ?? '',
            delivery_options: data.delivery_options ?? '',
            remark: data.remark ?? '',
        });
    }, [activeTab, formTabValues]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    /** Update a single field in the active tab's form data */
    const handleTabChange = useCallback((key: string, value: any) =>
        setFormTabValues((prev) => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], [key]: value ?? '' },
        })), [activeTab]);

    const itemForm = useForm({
        onValidSubmit: (values) => handleItemSubmit(values),
    });

    const handleItemSubmit = useCallback((values: Record<string, any>) => {
        if (!quotationId || !activeTabData) return;

        const d = activeTabData;

        const merged = {
            prfq_item_id: d.prfq_item_id,
            requested_part_number_id: values.part_number_id || d.part_number_id,
            part_number_id: d.part_number_id,
            condition_id: values.condition_id || d.condition_id,
            unit_of_measure_id: values.unit_of_measure_id || d.unit_of_measure_id,
            qty: values.qty ?? d.qty,
            price: values.price ?? d.price,
            moq: values.moq ?? d.moq,
            mov: values.mov ?? d.mov,
            delivery_options: values.delivery_options || d.delivery_options,
            remark: values.remark || d.remark,
        };

        // ── Duplicate check ───────────────────────────────────────────────────
        const isDuplicate = activeLineItems.some(
            (line: any) =>
                String(line.part_number_id) === String(merged.part_number_id) &&
                String(line.condition_id) === String(merged.condition_id)
        );
        if (isDuplicate) {
            toastError({
                title: 'Duplicate Entry!!!',
                description: 'A line item with the same Part Number and Condition already exists.',
            });
            return;
        }

        const items: QuotationItemVariables[] = [{
            prfq_item_id: merged.prfq_item_id || undefined,
            is_no_quote: false,
            part_number_id: merged.part_number_id || undefined,
            requested_part_number_id: merged.requested_part_number_id || undefined,
            condition_id: merged.condition_id || undefined,
            unit_of_measure_id: merged.unit_of_measure_id || undefined,
            qty: merged.qty ? Number(merged.qty) : 0,
            price: merged.price ? Number(merged.price) : 0,
            moq: merged.moq ? Number(merged.moq) : 0,
            mov: merged.mov ? Number(merged.mov) : 0,
            delivery_options: merged.delivery_options || undefined,
            remark: merged.remark || undefined,
        }];

        createItems.mutate(
            { quotation_id: quotationId, items },
            {
                onSuccess: () => {
                    reloadQuotations();
                    refetchQuotationItems();

                    const rfqItem = rfqItems[activeTab];

                    setFormTabValues((prev) => ({
                        ...prev,
                        [activeTab]: {
                            ...prev[activeTab],
                            part_number_id: '',
                            condition_id: rfqItem?.condition_id ?? '',
                            unit_of_measure_id: rfqItem?.unit_of_measure_id ?? '',
                            qty: String(rfqItem?.qty ?? ''),
                            price: '',
                            moq: '',
                            mov: '',
                            delivery_options: '',
                            remark: rfqItem?.remark ?? '',
                        },
                    }));

                    itemForm.reset();
                    setItemFormKey((k) => k + 1);

                    setTimeout(() => {
                        itemForm.setValues({
                            part_number_id: '',
                            condition_id: rfqItem?.condition_id ?? '',
                            unit_of_measure_id: rfqItem?.unit_of_measure_id ?? '',
                            qty: rfqItem?.qty ? Number(rfqItem.qty) : '',
                            remark: rfqItem?.remark ?? '',
                        });
                    }, 200);
                },
            },
        );
    }, [quotationId, activeTabData, activeLineItems, activeTab, rfqItems, createItems, refetchQuotationItems, reloadQuotations]);

    const handleMarkNoQuote = useCallback(() => {
        if (!quotationId || !activeRFQItem) return;
        createItems.mutate(
            {
                quotation_id: quotationId,
                items: [{ prfq_item_id: String(activeRFQItem.id ?? ''), is_no_quote: true }],
            },
            {
                onSuccess: () => {
                    refetchQuotationItems();
                    reloadQuotations();
                },
            },
        );
        setIsConfirmOpen(false);
    }, [quotationId, activeRFQItem, createItems, refetchQuotationItems, reloadQuotations]);

    // ── Delete line item handler ───────────────────────────────────────────────
    const handleDeleteLineItem = useCallback((lineItemId: number | string) => {
        setConfirmState({
            title: 'Delete Line Item',
            content: 'Are you sure you want to delete this line item? This action cannot be undone.',
            action: 'delete_line',
            lineItemId,
        });
        setPendingItems(null);
        setIsConfirmOpen(true);
    }, []);

    // ── Unified confirm handler ────────────────────────────────────────────────
    const handleConfirm = useCallback(() => {
        if (confirmState.action === 'delete_line' && confirmState.lineItemId) {
            deleteLineItem.mutate(
                { id: confirmState.lineItemId },
                {
                    onSuccess: () => {
                        refetchQuotationItems();
                        reloadQuotations();
                    },
                },
            );
        } else if (confirmState.action === 'no_quote') {
            handleMarkNoQuote();
            return; // handleMarkNoQuote closes dialog itself
        } else if (confirmState.action === 'pending_items' && pendingItems && quotationId) {
            createItems.mutate(
                { quotation_id: quotationId, items: pendingItems },
                { onSuccess: () => refetchQuotationItems() },
            );
        }

        setPendingItems(null);
        setIsConfirmOpen(false);
    }, [
        confirmState,
        pendingItems,
        quotationId,
        deleteLineItem,
        createItems,
        refetchQuotationItems,
        reloadQuotations,
        handleMarkNoQuote,
    ]);

    /** Selecting a new PRFQ resets all downstream IDs */
    const handleRfqSelect = useCallback((id: any) => {
        setPrfqId(id);
        setCustomerId(null);
        setQuotationId(null);
        setActiveTab(0);
    }, []);

    /** Selecting a new vendor resets quotation */
    const handleVendorSelect = useCallback((id: any) => {
        setCustomerId(id);
        setQuotationId(null);
        headerForm.setValues({ quotation_id: '' });
    }, []);

    const toggleSort = (field: string) => {
        if (sortField === field) setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDirection('asc'); }
    };

    const sortIcon = (field: string) =>
        sortField === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ' ↕';

    // ── Sorted line items for active tab ──────────────────────────────────────
    const sortedLineItems = useMemo(() => {
        return [...activeLineItems].sort((a: any, b: any) => {
            const aVal = a[sortField] ?? '';
            const bVal = b[sortField] ?? '';
            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activeLineItems, sortField, sortDirection]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Page Header ──────────────────────────────────────────── */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb
                            fontWeight="medium" fontSize="sm"
                            separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
                        >
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/purchase/supplier-pricing-update">
                                    Supplier Pricing Update
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>New Entry</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">Supplier Pricing Update</Heading>
                    </Stack>
                    <ResponsiveIconButton
                        variant="@primary" icon={<HiArrowNarrowLeft />} size="sm"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </ResponsiveIconButton>
                </HStack>

                {/* ── Main Card ────────────────────────────────────────────── */}
                <Stack spacing={4} p={4} bg="white" borderRadius="md" boxShadow="md">

                    {/* Title + edit toggle */}
                    <Flex align="center" justify="space-between">
                        <Text fontSize="md" fontWeight="700">Supplier Pricing Update</Text>
                        {quotationId && (
                            <ResponsiveIconButton
                                variant="@primary"
                                icon={isEditMode ? <HiX /> : <HiOutlinePencilAlt />}
                                size="sm"
                                onClick={() => setIsEditMode((v) => !v)}
                            >
                                {isEditMode ? 'Cancel' : 'Edit'}
                            </ResponsiveIconButton>
                        )}
                    </Flex>

                    {/* ── Header Form ──────────────────────────────────────── */}
                    <Formiz autoForm connect={headerForm}>
                        <Grid
                            templateColumns={{ base: '1fr', md: 'repeat(6, 1fr)' }}
                            gap={3} mb={4} bg="blue.100" p={3} borderRadius="md" borderWidth={1} alignItems="end"
                        >
                            {/* PRFQ */}
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">
                                        RFQ
                                        <IconButton
                                            aria-label="Open RFQ Search"
                                            colorScheme="brand" size="xs"
                                            icon={<SearchIcon />}
                                            onClick={openSearch} ml={2}
                                        />
                                    </FormLabel>
                                    <FieldSelect
                                        name="prfq_id"
                                        required="RFQ is required"
                                        options={prfqOptions}
                                        placeholder="Select RFQ"
                                        size="sm"
                                        onValueChange={(value) => handleRfqSelect(value ?? null)}
                                    />
                                </FormControl>
                            </Box>

                            {/* Vendor */}
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Vendor</FormLabel>
                                    <FieldSelect
                                        name="vendor_id"
                                        required="Vendor is required"
                                        options={vendorOptions}
                                        placeholder="Select Vendor"
                                        size="sm"
                                        isDisabled={!prfqId}
                                        onValueChange={(value) => handleVendorSelect(value ?? '')}
                                    />
                                </FormControl>
                            </Box>

                            {/* Vendor Code */}
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Vendor Code</FormLabel>
                                    <FieldDisplay
                                        value={vendorDetails?.data?.code ?? 'N/A'}
                                        size="sm"
                                        style={{ backgroundColor: '#fff' }}
                                    />
                                </FormControl>
                            </Box>

                            {/* Currency */}
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">
                                        Currency <Text as="span" color="red.500">*</Text>
                                    </FormLabel>
                                    <FieldSelect
                                        name="currency_id"
                                        required="Currency is required"
                                        options={currencyOptions}
                                        placeholder="Select Currency"
                                        size="sm"
                                        isDisabled={!prfqId || !customerId}
                                        selectProps={{
                                            isLoading: dropdownLoading,
                                            noOptionsMessage: () => "No Alt parts found",
                                        }}
                                    />
                                </FormControl>
                            </Box>

                            {/* Remarks */}
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Remarks</FormLabel>
                                    <FieldInput name="remarks" placeholder="Remarks" size="sm" maxLength={50} />
                                </FormControl>
                            </Box>

                            {/* Quotation */}
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Quotation</FormLabel>
                                    <FieldSelect
                                        name="quotation_id"
                                        options={quotationOptions}
                                        placeholder="Select Quotation"
                                        size="sm"
                                        isDisabled={(quotationList?.data ?? []).length === 0 || !prfqId || !customerId}
                                        onValueChange={(value) => {
                                            if (value === '__new__') {
                                                setQuotationId(null);
                                            } else {
                                                setQuotationId(value ?? null);
                                            }
                                        }}
                                    />
                                </FormControl>
                            </Box>
                        </Grid>

                        {/* Quotation meta row */}
                        <Stack
                            direction={{ base: 'column', md: 'row' }}
                            spacing={2} p={3} borderRadius="md" borderWidth={1} borderColor="blue.100" bg="blue.100"
                        >
                            <Box w="full">
                                <FieldInput
                                    label="Vendor Quotation No" name="vendor_quotation_no"
                                    placeholder="Quotation No" size="sm"
                                    required="Quotation No is required" maxLength={20}
                                    isDisabled={!!quotationId && !isEditMode}
                                />
                            </Box>
                            <Box w="full">
                                <FieldDayPicker
                                    label="Vendor Quotation Date" name="vendor_quotation_date"
                                    placeholder="Select Date" size="sm"
                                    required="Quotation date is required"
                                    disabledDays={{ after: new Date() }}
                                    dayPickerProps={{ inputProps: { isDisabled: !!quotationId && !isEditMode } }}
                                />
                            </Box>
                            <Box w="full">
                                <FieldDayPicker
                                    label="Quotation Expiry Date" name="expiry_date"
                                    placeholder="Select Expiry" size="sm"
                                    required="Expiry date is required"
                                    disabledDays={{ before: new Date() }}
                                    dayPickerProps={{ inputProps: { isDisabled: !!quotationId && !isEditMode } }}
                                />
                            </Box>
                            <Box w="full">
                                {!quotationId ? (
                                    <FieldUpload label="Upload" name="quotation_file" size="sm" />
                                ) : (
                                    <Box>
                                        <Text fontWeight="500" fontSize="sm">Quotation File</Text>
                                        <DocumentDownloadButton
                                            size="sm" mt={2}
                                            url={quotationDetails?.data?.quotation_file ?? ''}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Stack>

                        {!quotationId && (
                            <Flex justify="center" mt={2}>
                                <Button
                                    type="submit" colorScheme="orange" size="sm"
                                    isLoading={savePurchaseQuotation.isLoading}
                                    isDisabled={!headerForm.isValid}
                                >
                                    Save & Continue
                                </Button>
                            </Flex>
                        )}
                    </Formiz>

                    {/* ── Items Panel ──────────────────────────────────────── */}
                    <LoadingOverlay isLoading={isLoading}>
                        {quotationId && rfqItems.length > 0 && (
                            <Flex gap={4} direction={{ base: 'column', lg: 'row' }} align="stretch">

                                {/* LEFT SIDEBAR — item list */}
                                <Box
                                    w={{ base: '100%', lg: '250px' }} flexShrink={0}
                                    borderWidth={1} borderColor="gray.300" borderRadius="md"
                                    overflow="hidden" display="flex" flexDirection="column"
                                >
                                    <Box bg="#0C2556" px={3} py={2.5}>
                                        <Text
                                            fontSize="xs" fontWeight="700" color="white"
                                            textTransform="uppercase" letterSpacing="wider"
                                        >
                                            Items ({rfqItems.length})
                                        </Text>
                                    </Box>
                                    <Stack spacing={0} maxH="500px" overflowY="auto">
                                        {rfqItems.map((item: any, idx: number) => {
                                            const itemQuotationSlot = quotationItemsData?.data?.find(
                                                (qi) => String(qi.prfq_item_id) === String(item.id)
                                            );
                                            const isNoQuote = itemQuotationSlot?.is_no_quote ?? false;

                                            return (
                                                <Box
                                                    key={item.id} px={3} py={3} minH="64px"
                                                    borderBottomWidth={2} borderColor="gray.300"
                                                    cursor="pointer"
                                                    bg={isNoQuote ? 'red.200' : 'white'}
                                                    _hover={{ bg: isNoQuote ? 'red.50' : 'orange.200' }}
                                                    onClick={() => setActiveTab(idx)}
                                                    transition="all 0.15s"
                                                    borderLeftColor={activeTab === idx ? '#0C2556' : 'transparent'}
                                                    borderLeftWidth={activeTab === idx ? '6px' : '0px'}
                                                >
                                                    <Text
                                                        fontSize="10px" fontWeight="600" mb={1}
                                                        color={isNoQuote ? 'red.800' : activeTab === idx ? 'blue.700' : 'gray.400'}
                                                    >
                                                        {idx + 1} / {rfqItems.length}
                                                    </Text>
                                                    <Box noOfLines={1} mb={1} fontWeight="500">{item?.part_number?.name}</Box>
                                                    <Text
                                                        fontSize="11px" fontWeight="500"
                                                        color={isNoQuote ? 'red.800' : activeTab === idx ? 'blue.700' : 'gray.500'}
                                                    >
                                                        {isNoQuote ? 'No Quote' : `Qty: ${item.qty}`}
                                                    </Text>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>

                                {/* RIGHT PANEL — item detail */}
                                {activeRFQItem && (
                                    <Box flex={1} minW={0}>

                                        {/* Summary row — always visible */}
                                        <Stack
                                            direction={{ base: 'column', md: 'row' }}
                                            spacing={2} mb={4} p={3}
                                            bg="green.100" borderRadius="md" borderWidth={1} borderColor="gray.200"
                                        >
                                            <Box flex={1}>
                                                <FieldDisplay
                                                    label="Part Number" size="sm"
                                                    value={activeRFQItem.part_number?.name}
                                                    style={{ background: '#fff' }}
                                                />
                                            </Box>
                                            <Box flex={2}>
                                                <FieldDisplay
                                                    label="Description" size="sm"
                                                    value={activeRFQItem.part_number?.description}
                                                    style={{ background: '#fff' }}
                                                />
                                            </Box>
                                            <Box flex={1}>
                                                <FieldDisplay
                                                    label="Req. Condition" size="sm"
                                                    style={{ background: '#fff' }}
                                                    value={getDisplayLabel(conditionOptions, activeRFQItem.condition_id ?? '', 'CN')}
                                                />
                                            </Box>
                                            <Box flex={1}>
                                                <FieldDisplay
                                                    label="Req. Quantity" size="sm"
                                                    style={{ background: '#fff' }}
                                                    value={`${activeRFQItem.qty} No${activeRFQItem.qty > 1 ? "'s" : ''}`}
                                                />
                                            </Box>
                                            <Box flex={1}>
                                                <FieldDisplay
                                                    label="UOM" size="sm"
                                                    style={{ background: '#fff' }}
                                                    value={getDisplayLabel(uomOptions, activeRFQItem.unit_of_measure_id ?? '', 'UOM')}
                                                />
                                            </Box>
                                        </Stack>

                                        {/* ── No Quote state OR entry form + table ── */}
                                        {activeQuotationItem?.is_no_quote ? (

                                            <Flex
                                                align="center" justify="center"
                                                minH="300px"
                                                borderWidth={1} borderColor="gray.200"
                                                borderRadius="md"
                                            >
                                                <Stack align="center" spacing={2}>
                                                    <Text fontSize="lg" fontWeight="700">
                                                        This item is marked as No Quote
                                                    </Text>
                                                    <Text fontSize="sm">
                                                        No pricing can be entered for this line item
                                                    </Text>
                                                </Stack>
                                            </Flex>

                                        ) : (
                                            <>
                                                {/* No-quote button — hidden once a quotation slot already exists */}
                                                {!activeQuotationItem && (
                                                    <Flex justify="center" mb={4}>
                                                        <Button
                                                            colorScheme="orange" size="sm"
                                                            onClick={() => {
                                                                setConfirmState({
                                                                    title: 'Set as No-Quote',
                                                                    content: 'Mark this item as No Quote?',
                                                                    action: 'no_quote',
                                                                });
                                                                setPendingItems(null);
                                                                setIsConfirmOpen(true);
                                                            }}
                                                        >
                                                            Set as No Quote
                                                        </Button>
                                                    </Flex>
                                                )}

                                                {/* Item Entry Form */}
                                                <Formiz connect={itemForm} key={itemFormKey}>
                                                    <form noValidate onSubmit={itemForm.submit}>
                                                        <Box
                                                            bg="blue.100" borderRadius="md" borderWidth={1} borderColor="gray.200"
                                                            opacity={isItemDisabled ? 0.5 : 1} mb={4}
                                                        >
                                                            <Stack direction={{ base: 'column', md: 'row' }} spacing={2} p={3}>
                                                                <Box flex={1}>
                                                                    <FieldSelect
                                                                        name="part_number_id" label="Quo. Alt. PN"
                                                                        options={altPartOptions}
                                                                        placeholder="Select P/N" size="sm" isClearable
                                                                        isDisabled={isItemDisabled}
                                                                        selectProps={{ isLoading: altPartsLoading }}
                                                                        onValueChange={(v) => handleTabChange('part_number_id', v)}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldSelect
                                                                        name="condition_id" label="Quo. Condition"
                                                                        options={conditionOptions}
                                                                        placeholder="Select CN"
                                                                        required="Condition required"
                                                                        size="sm" isDisabled={isItemDisabled}
                                                                        onValueChange={(v) => handleTabChange('condition_id', v)}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldInput
                                                                        name="qty" label="Quo. Quantity" type="integer"
                                                                        placeholder="Req Qty" required="Qty required"
                                                                        size="sm" isDisabled={isItemDisabled} maxLength={5}
                                                                        onValueChange={(v) => handleTabChange('qty', v)}
                                                                        defaultValue={activeRFQItem?.qty}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldSelect
                                                                        name="unit_of_measure_id" label="UOM"
                                                                        options={uomOptions}
                                                                        placeholder="Select" size="sm"
                                                                        isDisabled={isItemDisabled}
                                                                        onValueChange={(v) => handleTabChange('unit_of_measure_id', v)}
                                                                    />
                                                                </Box>
                                                            </Stack>

                                                            <Stack direction={{ base: 'column', md: 'row' }} spacing={2} p={3}>
                                                                <Box flex={1}>
                                                                    <FieldInput
                                                                        name="price" label="Unit Price" type="decimal"
                                                                        placeholder="Price" size="sm"
                                                                        required="Price Required"
                                                                        isDisabled={isItemDisabled} maxLength={9}
                                                                        onValueChange={(v) => handleTabChange('price', v)}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldInput
                                                                        name="moq" label="MOQ" type="integer"
                                                                        placeholder="MOQ" size="sm"
                                                                        isDisabled={isItemDisabled} maxLength={9}
                                                                        onValueChange={(v) => handleTabChange('moq', v)}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldInput
                                                                        name="mov" label="MOV" type="decimal"
                                                                        placeholder="MOV" size="sm"
                                                                        isDisabled={isItemDisabled} maxLength={9}
                                                                        onValueChange={(v) => handleTabChange('mov', v)}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldInput
                                                                        name="delivery_options" label="Delivery Detail"
                                                                        placeholder="Delivery details" size="sm"
                                                                        isDisabled={isItemDisabled} maxLength={25}
                                                                        onValueChange={(v) => handleTabChange('delivery_options', v)}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldInput
                                                                        name="remark" label="Remarks"
                                                                        placeholder="Remarks" size="sm"
                                                                        isDisabled={isItemDisabled} maxLength={25}
                                                                        onValueChange={(v) => handleTabChange('remark', v)}
                                                                    />
                                                                </Box>
                                                            </Stack>

                                                            <Flex justify="center" p={3}>
                                                                <Button
                                                                    type="submit" colorScheme="brand" size="sm" px={6}
                                                                    isDisabled={isItemDisabled || createItems.isLoading}
                                                                    isLoading={createItems.isLoading}
                                                                >
                                                                    Add Item
                                                                </Button>
                                                            </Flex>
                                                        </Box>
                                                    </form>
                                                </Formiz>

                                                {/* Existing line items table */}
                                                <TableContainer bg="white" borderRadius="md" borderWidth={1} borderColor="gray.200">
                                                    <Table variant="simple" size="sm">
                                                        <Thead backgroundColor="#0C2556" color="#fff">
                                                            <Tr>
                                                                <Th color="#fff">#</Th>
                                                                {TABLE_COLUMNS.map(([label, field]) => (
                                                                    <Th
                                                                        color="#fff"
                                                                        key={label}
                                                                        cursor={field ? 'pointer' : 'default'}
                                                                        onClick={field ? () => toggleSort(field) : undefined}
                                                                    >
                                                                        {label}{field ? sortIcon(field) : ''}
                                                                    </Th>
                                                                ))}
                                                                <Th color="#fff">Actions</Th>
                                                            </Tr>
                                                        </Thead>
                                                        <Tbody>
                                                            {sortedLineItems.length > 0 ? (
                                                                sortedLineItems.map((line: any, i: number) => (
                                                                    <Tr key={line.id} bg={i % 2 === 0 ? 'white' : 'green.50'}>
                                                                        <Td>{i + 1}</Td>
                                                                        <Td>{line.requested_part_number?.name ?? activeRFQItem?.part_number?.name ?? '—'}</Td>
                                                                        <Td>{getDisplayLabel(conditionOptions, line.condition_id ?? '', 'CN')}</Td>
                                                                        <Td>{line.qty}</Td>
                                                                        <Td>{getDisplayLabel(uomOptions, line.unit_of_measure_id ?? '', 'UOM')}</Td>
                                                                        <Td>{line.price}</Td>
                                                                        <Td>{line.moq}</Td>
                                                                        <Td>{line.mov}</Td>
                                                                        <Td>{line.delivery_options}</Td>
                                                                        <Td>{line.remark}</Td>
                                                                        <Td>
                                                                            <HStack spacing={1}>
                                                                                {isEditMode && (
                                                                                    <IconButton
                                                                                        aria-label="Edit" size="sm"
                                                                                        colorScheme="green"
                                                                                        icon={<HiOutlinePencilAlt />}
                                                                                        onClick={() => console.log('edit', line.id)}
                                                                                    />
                                                                                )}
                                                                                <IconButton
                                                                                    aria-label="Delete" size="xs"
                                                                                    colorScheme="red"
                                                                                    icon={<DeleteIcon />}
                                                                                    isLoading={
                                                                                        deleteLineItem.isLoading &&
                                                                                        confirmState.lineItemId === line.id
                                                                                    }
                                                                                    onClick={() => handleDeleteLineItem(line.id)}
                                                                                />
                                                                            </HStack>
                                                                        </Td>
                                                                    </Tr>
                                                                ))
                                                            ) : (
                                                                <Tr>
                                                                    <Td colSpan={13} textAlign="center" color="gray.400">
                                                                        No items yet
                                                                    </Td>
                                                                </Tr>
                                                            )}
                                                        </Tbody>
                                                    </Table>
                                                </TableContainer>
                                            </>
                                        )}
                                    </Box>
                                )}
                            </Flex>
                        )}
                    </LoadingOverlay>
                </Stack>
            </Stack>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            <PRFQSearchPopup
                isOpen={isSearchOpen}
                onClose={(selectedId) => {
                    if (selectedId) {
                        handleRfqSelect(String(selectedId));
                        headerForm.setValues({ prfq_id: String(selectedId) });
                    }
                    closeSearch();
                }}
                data={{}}
            />

            {/* Single unified confirmation popup */}
            <ConfirmationPopup
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirm}
                headerText={confirmState.title}
                bodyText={confirmState.content}
            />
        </SlideIn>
    );
};

export default SupplierPricingUpdateForm;