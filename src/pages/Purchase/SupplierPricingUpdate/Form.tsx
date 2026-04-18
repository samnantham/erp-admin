import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRightIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons';
import {
    Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Flex,
    FormControl, FormLabel, Grid, HStack, Heading, IconButton,
    Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
    ModalHeader, ModalOverlay, Stack, Table, TableContainer,
    Tbody, Td, Text, Th, Thead, Tr, Input, useDisclosure, Tooltip
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiArrowNarrowLeft, HiOutlinePencilAlt, HiOutlinePlus, HiX } from 'react-icons/hi';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
import { PairDocUpload } from '@/components/PairDocUpload';
import { formatDate, getDisplayLabel } from '@/helpers/commonHelper';
import dayjs from 'dayjs';
import { useCustomerDetails } from '@/services/master/customer/service';
import { usePRFQDetails, usePRFQList } from '@/services/purchase/rfq/service';
import { useAltPartNumberList, useAssignAltParts } from '@/services/master/spare/service';
import {
    useCreateQuotationItems, useUpdateQuotationItem,
    usePurchaseQuotationDetails, usePurchaseQuotationDropdowns,
    useSavePurchaseQuotation, useQuotationList, useQuotationItems,
    type PurchaseQuotationVariables, type QuotationItemVariables,
} from '@/services/purchase/quotation/service';
import { useToastError } from '@/components/Toast';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { PartNumberModal } from '@/components/Modals/SpareMaster';
import { AddVendorToRFQModal } from '@/components/Popups/PRFQCustomers/AddVendorToRFQModal';
import { format } from 'date-fns';
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
    action: 'no_quote' | 'delete_line' | 'pending_items';
    lineItemId?: number | string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TABLE_COLUMNS: [string, string | null][] = [
    ['Quo. P/N', null], ['Condition', null],
    ['Qty', 'qty'], ['UOM', null], ['Price', 'price'],
    ['MOQ', 'moq'], ['MOV', 'mov'], ['Delivery', 'delivery_options'],
    ['Remark', 'remark'],
];

const CONFIRM_DEFAULTS: ConfirmState = { title: 'Confirm', content: 'Are you sure?', action: 'pending_items' };

// ─── Component ────────────────────────────────────────────────────────────────

export const SupplierPricingUpdateForm = () => {

    const { id: routeQuotationId } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const routeRfqId = searchParams.get('rfq_id');
    const routeVendorId = searchParams.get('vendor_id');

    const navigate = useNavigate();
    const toastError = useToastError();

    // ── IDs ───────────────────────────────────────────────────────────────────
    const [prfqId, setPrfqId] = useState<any>(null);
    const [customerId, setCustomerId] = useState<any>(null);
    const [quotationId, setQuotationId] = useState<any>(null);

    // ── UI ────────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState(0);
    const [isEditMode, setIsEditMode] = useState(!!routeQuotationId);
    const [formTabValues, setFormTabValues] = useState<Record<number, TabData>>({});
    const [sortField, setSortField] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    // ── Confirm dialog ────────────────────────────────────────────────────────
    const [confirmState, setConfirmState] = useState<ConfirmState>(CONFIRM_DEFAULTS);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingItems, setPendingItems] = useState<QuotationItemVariables[] | null>(null);

    // ── Alt part flow ─────────────────────────────────────────────────────────
    const [pendingAltPartId, setPendingAltPartId] = useState<string | null>(null);
    const [pendingAltPartName, setPendingAltPartName] = useState('');
    const [isAltConfirmOpen, setIsAltConfirmOpen] = useState(false);
    const [isAltModalOpen, setIsAltModalOpen] = useState(false);
    const [altRemark, setAltRemark] = useState('');
    const [altRefDoc, setAltRefDoc] = useState<string | undefined>();
    const [isSavingAlt, setIsSavingAlt] = useState(false);

    // ── Inline edit ───────────────────────────────────────────────────────────
    const [editingLineItem, setEditingLineItem] = useState<any | null>(null);

    const { isOpen: isSearchOpen, onOpen: openSearch, onClose: closeSearch } = useDisclosure();
    const { isOpen: isAddVendorOpen, onOpen: openAddVendor, onClose: closeAddVendor } = useDisclosure();

    // ── Queries ───────────────────────────────────────────────────────────────
    const { data: prfqList } = usePRFQList();
    const { data: dropdownData, isLoading: dropdownLoading, refetch: reloadDropDowns } = usePurchaseQuotationDropdowns();
    const { data: rfqDetails, isLoading: rfqLoading, refetch: refetchRFQDetails } = usePRFQDetails(prfqId ?? undefined);
    const { data: vendorDetails, isLoading: vendorLoading } = useCustomerDetails(customerId, { enabled: !!customerId });
    const { data: quotationList, refetch: reloadQuotations } = useQuotationList({
        enabled: !!prfqId && !!customerId,
        queryParams: { prfq_id: prfqId, vendor_id: customerId },
    });
    const { data: quotationDetails, isLoading: quotationDetailsLoading } = usePurchaseQuotationDetails(
        quotationId, { enabled: !!quotationId && quotationId !== '__new__' },
    );
    const { data: quotationItemsData, refetch: refetchQuotationItems } = useQuotationItems(
        quotationId ?? undefined, { enabled: !!quotationId && quotationId !== '__new__' },
    );
    const { data: altPartNumbers, isLoading: altPartsLoading, refetch: reloadAltDropdowns } = useAltPartNumberList(
        rfqDetails?.data?.items?.[activeTab]?.part_number_id ?? undefined,
        { enabled: !!rfqDetails?.data?.items?.[activeTab]?.part_number_id },
    );

    const [hasInitializedFromRoute, setHasInitializedFromRoute] = useState(false);


    useEffect(() => {
        if (routeQuotationId) return; // don't override route-seeded quotation

        const existing = quotationList?.data ?? [];
        if (existing.length > 0 && customerId) {
            const firstId = existing[0].value;
            setQuotationId(firstId);
            headerForm.setValues({ quotation_id: firstId });
        } else {
            setQuotationId(null);
            headerForm.setValues({ quotation_id: quotationOptions[0]?.value });
        }
    }, [quotationList, customerId]);


    const isNeedByDateExpired = !!rfqDetails?.data?.need_by_date && new Date(rfqDetails.data.need_by_date) < new Date();

    useEffect(() => {
        if (isNeedByDateExpired && !quotationId) {
            headerForm.setValues({ remarks: 'Expired RFQ' });
        }
    }, [isNeedByDateExpired, quotationId]);

    const isLoading = rfqLoading || dropdownLoading || vendorLoading || quotationDetailsLoading;

    // ── Derived ───────────────────────────────────────────────────────────────
    const rfqItems = rfqDetails?.data?.items ?? [];
    const rfqVendors = rfqDetails?.data?.vendors ?? [];
    const activeRFQItem = rfqItems[activeTab];
    const activeTabData = formTabValues[activeTab];
    const currencyOptions = dropdownData?.currencies ?? [];
    const conditionOptions = dropdownData?.conditions ?? [];
    const uomOptions = dropdownData?.unit_of_measures ?? [];
    const altPartOptions = altPartNumbers?.data ?? [];
    const isItemDisabled = !quotationId;
    const isMetaDisabled = !prfqId || !customerId;
    // Meta fields are read-only when a quotation already exists and we're not editing
    const isMetaReadOnly = !!quotationId && !isEditMode;

    const activeQuotationItem = useMemo(() =>
        quotationItemsData?.data?.find(
            (qi) => String(qi.prfq_item_id) === String(activeRFQItem?.id)
        ) ?? null,
        [quotationItemsData, activeRFQItem]);

    const activeLineItems = activeQuotationItem?.lines ?? [];

    const vendorOptions = useMemo(
        () =>
            rfqVendors.map((v: any) => {
                const vendor = v.vendor;
                return {
                    value: vendor.id,
                    label: `${vendor.business_name}${v.is_approved === false ? ' (Late Entry)' : ''
                        }`,
                };
            }),
        [rfqVendors]
    );

    const quotationOptions = useMemo(() => [
        ...(quotationList?.data ?? []),
        { value: '__new__', label: '+ Add New Quotation' },
    ], [quotationList]);

    const sortedLineItems = useMemo(() => [...activeLineItems].sort((a: any, b: any) => {
        const aVal = a[sortField] ?? '', bVal = b[sortField] ?? '';
        return aVal < bVal ? (sortDir === 'asc' ? -1 : 1) : aVal > bVal ? (sortDir === 'asc' ? 1 : -1) : 0;
    }), [activeLineItems, sortField, sortDir]);

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
            savePurchaseQuotation.mutate(
                { ...payload, ...(isEditMode && quotationId ? { id: quotationId } : {}) },
                { onSuccess: () => { reloadQuotations(); setIsEditMode(false); } },
            );
        },
    });

    const itemForm = useForm({
        onValidSubmit: (values) => editingLineItem ? handleItemUpdate(values) : handleItemSubmit(values),
    });

    // ── Mutations ─────────────────────────────────────────────────────────────
    const deleteLineItem = useDelete({ url: endPoints.delete.quotation_line_item.replace(':quotation', quotationId ?? ''), invalidate: [] });
    const savePurchaseQuotation = useSavePurchaseQuotation();
    const createItems = useCreateQuotationItems();
    const updateLineItem = useUpdateQuotationItem();
    const assignAltParts = useAssignAltParts();

    // ── Effects ───────────────────────────────────────────────────────────────

    /** Init tab form data from RFQ items */
    useEffect(() => {
        if (!rfqItems.length) return;
        const initial: Record<number, TabData> = {};
        rfqItems.forEach((item: any, idx: number) => {
            initial[idx] = {
                requested_part_number_id: item.part_number_id ?? '',
                part_number_id: item.part_number_id ?? '',
                condition_id: item.condition_id ?? '',
                unit_of_measure_id: item.unit_of_measure_id ?? '',
                qty: String(item.qty ?? ''),
                price: '', moq: '', mov: '', delivery_options: '',
                remark: item.remark ?? '',
                prfq_item_id: item.id ?? '',
                part_number: item.part_number ?? '',
            };
        });
        setFormTabValues(initial);
    }, [rfqDetails]);

    /** Pre-fill currency from vendor */
    useEffect(() => {
        if (vendorDetails?.data?.currency_id)
            headerForm.setValues({ currency_id: vendorDetails.data.currency_id });
    }, [vendorDetails]);

    /** Auto-select first existing quotation */
    useEffect(() => {
        const existing = quotationList?.data ?? [];
        if (existing.length > 0 && customerId) {
            const firstId = existing[0].value;
            setQuotationId(firstId);
            headerForm.setValues({ quotation_id: firstId });
        } else {
            setQuotationId(null);
            headerForm.setValues({ quotation_id: quotationOptions[0]?.value });
        }
    }, [quotationList, customerId]);

    /** Populate header form from saved quotation */
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

    /** Sync item form on tab change */

    useEffect(() => {
        const data = formTabValues[activeTab];
        if (!data || !quotationId) return;
        const timeout = setTimeout(() => {
            itemForm.setValues({
                part_number_id: data.part_number_id ?? '',
                condition_id: data.condition_id ?? '',
                qty: data.qty ? Number(data.qty) : '',
                unit_of_measure_id: data.unit_of_measure_id ?? '',
                price: data.price ?? '', moq: data.moq ?? '', mov: data.mov ?? '',
                delivery_options: data.delivery_options ?? '', remark: data.remark ?? '',
            });
        }, 50);
        return () => clearTimeout(timeout);
    }, [activeTab, formTabValues, quotationId]);


    // ── Handlers ──────────────────────────────────────────────────────────────

    const resetItemForm = useCallback((rfqItem?: TabData) => {
        const item = rfqItem ?? formTabValues[activeTab];
        itemForm.reset();
        setTimeout(() => itemForm.setValues({
            part_number_id: item?.part_number_id ?? '',
            condition_id: item?.condition_id ?? '',
            qty: item?.qty ? Number(item.qty) : '',
            unit_of_measure_id: item?.unit_of_measure_id ?? '',
            price: '', moq: '', mov: '', delivery_options: '', remark: item?.remark ?? '',
        }), 50);
    }, [activeTab, formTabValues, itemForm]);

    const handleCancelEdit = useCallback(() => {
        setEditingLineItem(null);
        resetItemForm();
    }, [resetItemForm]);

    const handleEditLineItem = useCallback((line: any) => {
        setEditingLineItem(line);
        itemForm.reset();
        setTimeout(() => itemForm.setValues({
            part_number_id: line.part_number_id ?? '',
            condition_id: line.condition_id ?? '',
            qty: line.qty ? Number(line.qty) : '',
            unit_of_measure_id: line.unit_of_measure_id ?? '',
            price: line.price ?? '', moq: line.moq ?? '', mov: line.mov ?? '',
            delivery_options: line.delivery_options ?? '', remark: line.remark ?? '',
        }), 50);
    }, [itemForm]);

    const handleItemUpdate = useCallback((values: any) => {
        if (!quotationId || !editingLineItem) return;
        updateLineItem.mutate(
            {
                quotation_id: quotationId, line_item_id: editingLineItem.id,
                part_number_id: values.part_number_id || undefined,
                condition_id: values.condition_id || undefined,
                unit_of_measure_id: values.unit_of_measure_id || undefined,
                qty: Number(values.qty) || 0, price: Number(values.price) || 0,
                moq: Number(values.moq) || 0, mov: Number(values.mov) || 0,
                delivery_options: values.delivery_options || undefined,
                remark: values.remark || undefined,
            },
            { onSuccess: () => { refetchQuotationItems(); reloadQuotations(); handleCancelEdit(); } },
        );
    }, [quotationId, editingLineItem, updateLineItem, refetchQuotationItems, reloadQuotations, handleCancelEdit]);

    const handleItemSubmit = useCallback((values: any) => {
        if (!quotationId || !activeTabData) return;

        const isDuplicate = activeLineItems.some((line: any) =>
            String(line.part_number_id) === String(values.part_number_id ?? '') &&
            String(line.condition_id) === String(values.condition_id ?? '') &&
            String(line.qty) === String(values.qty ?? '') &&
            String(line.price) === String(values.price ?? '')
        );
        if (isDuplicate) {
            toastError({ title: 'Duplicate Entry!!!', description: 'A line item with the same Part Number, Condition, QTY and Price already exists.' });
            return;
        }

        createItems.mutate(
            {
                quotation_id: quotationId,
                items: [{
                    prfq_item_id: activeTabData.prfq_item_id || undefined,

                    // swapped here
                    requested_part_number_id: formTabValues[activeTab].part_number_id || undefined,
                    part_number_id: values.part_number_id || undefined,

                    is_no_quote: false,
                    condition_id: values.condition_id || undefined,
                    unit_of_measure_id: values.unit_of_measure_id || undefined,
                    qty: Number(values.qty) || 0,
                    price: Number(values.price) || 0,
                    moq: Number(values.moq) || 0,
                    mov: Number(values.mov) || 0,
                    delivery_options: values.delivery_options || undefined,
                    remark: values.remark || undefined,
                }],
            },
            {
                onSuccess: () => {
                    reloadQuotations();
                    refetchQuotationItems();
                    resetItemForm();
                },
            }
        );
    }, [quotationId, activeTabData, activeLineItems, createItems, refetchQuotationItems, reloadQuotations, resetItemForm]);

    const handleMarkNoQuote = useCallback(() => {
        if (!quotationId || !activeRFQItem) return;
        createItems.mutate(
            { quotation_id: quotationId, items: [{ prfq_item_id: String(activeRFQItem.id ?? ''), is_no_quote: true }] },
            { onSuccess: () => { refetchQuotationItems(); reloadQuotations(); } },
        );
        setIsConfirmOpen(false);
    }, [quotationId, activeRFQItem, createItems, refetchQuotationItems, reloadQuotations]);

    const handleDeleteLineItem = useCallback((lineItemId: number | string) => {
        setConfirmState({ title: 'Delete Line Item', content: 'Are you sure you want to delete this line item? This action cannot be undone.', action: 'delete_line', lineItemId });
        setPendingItems(null);
        setIsConfirmOpen(true);
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmState.action === 'delete_line' && confirmState.lineItemId) {
            deleteLineItem.mutate({ id: confirmState.lineItemId }, {
                onSuccess: () => { refetchQuotationItems(); reloadQuotations(); },
            });
        } else if (confirmState.action === 'no_quote') {
            handleMarkNoQuote(); return;
        } else if (confirmState.action === 'pending_items' && pendingItems && quotationId) {
            createItems.mutate({ quotation_id: quotationId, items: pendingItems }, { onSuccess: () => refetchQuotationItems() });
        }
        setPendingItems(null);
        setIsConfirmOpen(false);
    }, [confirmState, pendingItems, quotationId, deleteLineItem, createItems, refetchQuotationItems, reloadQuotations, handleMarkNoQuote]);

    const handleRfqSelect = useCallback((id: any) => {
        setPrfqId(id); setCustomerId(null); setQuotationId(null); setActiveTab(0);
        headerForm.reset();
        setTimeout(() => headerForm.setValues({
            prfq_id: id,
            vendor_id: '',
            vendor_quotation_no: '',
            vendor_quotation_date: undefined,
            expiry_date: undefined,
            quotation_file: undefined,
        }), 0);
    }, [headerForm]);

    const handleVendorSelect = useCallback((id: any) => {
        setCustomerId(id);
        setQuotationId(null);
        headerForm.setValues({
            quotation_id: '',
            vendor_quotation_no: '',
            vendor_quotation_date: undefined,
            expiry_date: undefined,
            quotation_file: undefined,
        });
    }, [headerForm]);

    const handleAddNewSuccess = (fieldName: any, refetch: () => void, opts?: { onValueChange?: (val: any, full?: any) => void }) =>
        (data: any) => {
            const id = (data?.data ?? data)?.id;
            setTimeout(() => { refetch(); setTimeout(() => { itemForm.setValues({ [fieldName]: id }); opts?.onValueChange?.(id, data?.data ?? data); }, 50); }, 100);
        };

    const toggleSort = (field: string) => {
        if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    const handleNewPartNumberCreated = useCallback((data: any) => {
        const record = data?.data ?? data;
        const newId = record?.id, newName = record?.name ?? '';
        setTimeout(() => { reloadAltDropdowns(); setTimeout(() => itemForm.setValues({ part_number_id: newId }), 50); }, 100);
        if (activeRFQItem?.part_number_id && String(newId) !== String(activeRFQItem.part_number_id)) {
            setPendingAltPartId(newId); setPendingAltPartName(newName);
            setAltRemark(''); setAltRefDoc(undefined); setIsAltConfirmOpen(true);
        }
    }, [activeRFQItem, reloadAltDropdowns, itemForm]);

    const handleSaveAltMapping = useCallback(async () => {
        if (!pendingAltPartId || !activeRFQItem?.part_number_id) return;
        setIsSavingAlt(true);
        try {
            await assignAltParts.mutateAsync([{
                part_number_id: activeRFQItem.part_number_id,
                alternate_part_number_id: pendingAltPartId,
                remark: altRemark, alt_ref_doc: altRefDoc, is_deleted: false,
            }]);
            await reloadAltDropdowns();
            setTimeout(() => itemForm.setValues({ part_number_id: pendingAltPartId }), 100);
            setIsAltModalOpen(false); setPendingAltPartId(null);
        } finally { setIsSavingAlt(false); }
    }, [pendingAltPartId, activeRFQItem, altRemark, altRefDoc, assignAltParts, reloadAltDropdowns, itemForm]);

    const restoreHeaderForm = useCallback(() => {
        if (!quotationDetails?.data) return;
        const q = quotationDetails.data;
        headerForm.setValues({
            remarks: q.remarks ?? '',
            vendor_quotation_no: q.vendor_quotation_no ?? '',
            vendor_quotation_date: q.vendor_quotation_date ? dayjs(q.vendor_quotation_date) : undefined,
            expiry_date: q.expiry_date ? dayjs(q.expiry_date) : undefined,
        });
    }, [quotationDetails, headerForm]);

    // Replace the existing hasInitializedFromRoute effect with this:
    useEffect(() => {
        if (hasInitializedFromRoute) return;
        if (routeRfqId) {
            setPrfqId(routeRfqId);
            headerForm.setValues({ prfq_id: routeRfqId });
        }
        if (routeQuotationId) {
            setQuotationId(routeQuotationId);
            headerForm.setValues({ quotation_id: routeQuotationId });
            setIsEditMode(true);
        }
        // DON'T set vendor here — vendorOptions isn't ready yet
        setHasInitializedFromRoute(true);
    }, [routeRfqId, routeQuotationId]);

    // New separate effect — fires once vendorOptions are loaded from rfqDetails
    useEffect(() => {
        if (!routeVendorId || !vendorOptions.length) return;
        const exists = vendorOptions.some((o: any) => String(o.value) === String(routeVendorId));
        if (exists) {
            setCustomerId(routeVendorId);
            headerForm.setValues({ vendor_id: routeVendorId });
        }
    }, [vendorOptions, routeVendorId]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Page Header */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/purchase/supplier-pricing-update">Supplier Pricing Update</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>New Entry</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">Supplier Pricing Update</Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />} size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                {/* Main Card */}
                <Stack spacing={4} p={4} bg="white" borderRadius="md" boxShadow="md">

                    {/* Title + Edit toggle */}
                    <Flex align="center" justify="space-between">
                        <Text fontSize="md" fontWeight="700">Supplier Pricing Update</Text>
                        {(quotationId && !routeQuotationId) && (
                            <ResponsiveIconButton
                                variant="@primary"
                                icon={isEditMode ? <HiX /> : <HiOutlinePencilAlt />}
                                size="sm"
                                onClick={() => { if (isEditMode) restoreHeaderForm(); setIsEditMode((v) => !v); }}
                            >
                                {isEditMode ? 'Cancel' : 'Edit'}
                            </ResponsiveIconButton>
                        )}
                    </Flex>

                    <Formiz autoForm connect={headerForm}>
                        {/* Top grid */}
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(6, 1fr)' }} gap={3} mb={4} bg="blue.100" p={3} borderRadius="md" borderWidth={1} alignItems="end">
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">
                                        RFQ
                                        <IconButton aria-label="Open RFQ Search" colorScheme="brand" size="xs" icon={<SearchIcon />} onClick={openSearch} ml={2} />
                                    </FormLabel>
                                    <FieldSelect name="prfq_id" required="RFQ is required" options={prfqList?.data ?? []} placeholder="Select RFQ" size="sm" onValueChange={(v) => handleRfqSelect(v ?? null)} isDisabled={isEditMode} className={isEditMode ? 'disabled-input' : ''} />
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">RFQ Need by Date</FormLabel>
                                    <Tooltip
                                        label="RFQ Need By Date Expired"
                                        placement="top"
                                        isDisabled={!rfqDetails?.data?.need_by_date || new Date(rfqDetails.data.need_by_date) >= new Date()}
                                        hasArrow
                                    >
                                        <Box
                                            sx={isNeedByDateExpired ? {
                                                '@keyframes blink': {
                                                    '0%, 100%': { backgroundColor: '#FED7D7' },
                                                    '50%': { backgroundColor: '#FC8181' },
                                                },
                                                animation: 'blink 1.2s ease-in-out infinite',
                                                borderRadius: 'md',
                                            } : {
                                                background: '#fff'
                                            }}
                                        >
                                            <FieldDisplay
                                                value={rfqDetails?.data?.need_by_date ? format(new Date(rfqDetails.data.need_by_date), 'dd-MMM-yyyy') : 'N/A'}
                                                size="sm"
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    color: "#000"
                                                }}
                                            />
                                        </Box>
                                    </Tooltip>
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">
                                        <HStack spacing={2} align="center">
                                            <span>Vendor</span>
                                            {(!!prfqId && !isEditMode) && (
                                                <IconButton
                                                    aria-label="Add Vendor to RFQ"
                                                    icon={<HiOutlinePlus />}
                                                    colorScheme="brand"
                                                    size="xs"
                                                    variant="@primary"
                                                    onClick={openAddVendor}
                                                />
                                            )}
                                        </HStack>
                                    </FormLabel>
                                    <FieldSelect key={`vendor-${prfqId}`} name="vendor_id" required="Vendor is required" options={vendorOptions} placeholder="Select Vendor" size="sm" onValueChange={(v) => handleVendorSelect(v ?? '')} isDisabled={!prfqId || isEditMode} className={isEditMode ? 'disabled-input' : ''} />
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Vendor Code</FormLabel>
                                    <FieldDisplay value={vendorDetails?.data?.code ?? 'N/A'} size="sm" style={{ backgroundColor: '#fff' }} />
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Currency <Text as="span" color="red.500">*</Text></FormLabel>
                                    <FieldSelect name="currency_id" required="Currency is required" options={currencyOptions} placeholder="Select Currency" size="sm" isDisabled={isMetaDisabled || isEditMode || (!isEditMode && quotationId)} selectProps={{ isLoading: dropdownLoading }} className={(isEditMode || (!isEditMode && quotationId)) ? 'disabled-input' : ''} />
                                </FormControl>
                            </Box>
                            <Box>
                                <FormControl>
                                    <FormLabel fontSize="sm" minH="20px">Remarks</FormLabel>
                                    <FieldInput name="remarks" placeholder="Remarks" size="sm" maxLength={50} isDisabled={isMetaDisabled || (!isEditMode && !!quotationId) || isNeedByDateExpired} />
                                </FormControl>
                            </Box>

                        </Grid>

                        {/* ── Meta row — always visible; fields disabled when read-only ── */}
                        <Stack
                            direction={{ base: 'column', md: 'row' }} spacing={2} p={3}
                            borderRadius="md" borderWidth={1}
                            borderColor={isEditMode ? 'orange.200' : 'blue.100'}
                            bg={isEditMode ? 'orange.50' : 'blue.100'}
                        >
                            <Box w="full">
                                <FieldSelect
                                    name="quotation_id" options={quotationOptions} placeholder="Select Quotation" size="sm"
                                    isDisabled={(quotationList?.data ?? []).length === 0 || isMetaDisabled || isEditMode}
                                    onValueChange={(v) => {
                                        if (v === '__new__') {
                                            setQuotationId(null);
                                            headerForm.setValues({
                                                vendor_quotation_no: '',
                                                vendor_quotation_date: '',
                                                expiry_date: '',
                                                quotation_file: '',
                                            });
                                        } else {
                                            setQuotationId(v);
                                        }
                                    }}
                                    label={'Quotation'}
                                    className={isEditMode ? 'disabled-input' : ''}
                                />
                            </Box>
                            <Box w="full">
                                <FieldInput label="Vendor Quotation No" name="vendor_quotation_no" placeholder="Quotation No" size="sm" required="Quotation No is required" maxLength={20} isDisabled={isMetaDisabled || isMetaReadOnly} />
                            </Box>
                            <Box w="full">
                                <FieldDayPicker label="Vendor Quotation Date" name="vendor_quotation_date" placeholder="Select Date" size="sm" required="Quotation date is required" disabledDays={{ after: new Date() }} dayPickerProps={{ inputProps: { isDisabled: isMetaDisabled || isMetaReadOnly } }} />
                            </Box>
                            <Box w="full">
                                <FieldDayPicker label="Quotation Expiry Date" name="expiry_date" placeholder="Select Expiry" size="sm" required="Expiry date is required" disabledDays={{ before: new Date() }} dayPickerProps={{ inputProps: { isDisabled: isMetaDisabled || isMetaReadOnly } }} />
                            </Box>
                            <Box w="full">
                                {(!quotationId || isEditMode) ? (
                                    <FieldUpload label="Upload" name="quotation_file" size="sm" isDisabled={isMetaDisabled} />
                                ) : (
                                    <Box>
                                        <Text fontWeight="500" fontSize="sm">Quotation File</Text>
                                        <DocumentDownloadButton size="sm" mt={2} url={quotationDetails?.data?.quotation_file ?? ''} />
                                    </Box>
                                )}
                            </Box>
                        </Stack>

                        {/* Save / Update button — hidden when quotation exists and not in edit mode */}
                        {(!quotationId || isEditMode) && (
                            <Flex justify="center" mt={2} gap={2}>
                                {isEditMode && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        colorScheme="gray"
                                        onClick={() => {
                                            if (routeQuotationId) {
                                                navigate(-1);
                                            } else {
                                                restoreHeaderForm();
                                                setIsEditMode(false);
                                            }
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    colorScheme={isEditMode ? 'green' : 'orange'}
                                    size="sm"
                                    isLoading={savePurchaseQuotation.isLoading}
                                // isDisabled={!headerForm.isValid}
                                >
                                    {isEditMode ? 'Update & Continue' : 'Save & Continue'}
                                </Button>
                            </Flex>
                        )}
                    </Formiz>

                    {/* Items Panel */}
                    <LoadingOverlay isLoading={isLoading}>
                        {!isEditMode && quotationId && rfqItems.length > 0 && (
                            <Flex gap={4} direction={{ base: 'column', lg: 'row' }} align="stretch">

                                {/* Sidebar */}
                                <Box w={{ base: '100%', lg: '250px' }} flexShrink={0} borderWidth={1} borderColor="gray.300" borderRadius="md" overflow="hidden" display="flex" flexDirection="column">
                                    <Box bg="#0C2556" px={3} py={2.5}>
                                        <Text fontSize="xs" fontWeight="700" color="white" textTransform="uppercase" letterSpacing="wider">Items ({rfqItems.length})</Text>
                                    </Box>
                                    <Stack spacing={0} maxH="500px" overflowY="auto">
                                        {rfqItems.map((item: any, idx: number) => {
                                            const slot = quotationItemsData?.data?.find((qi) => String(qi.prfq_item_id) === String(item.id));
                                            const isNoQuote = slot?.is_no_quote ?? false;
                                            return (
                                                <Box
                                                    key={item.id} px={3} py={3} minH="64px" borderBottomWidth={2} borderColor="gray.300"
                                                    cursor="pointer" transition="all 0.15s"
                                                    _hover={{ bg: isNoQuote ? 'red.50' : 'orange.200' }}
                                                    backgroundColor={activeTab === idx ? 'orange.300' : (isNoQuote ? 'red.200' : 'white')}
                                                    onClick={() => { setActiveTab(idx); setEditingLineItem(null); }}
                                                >
                                                    <Text fontSize="10px" fontWeight="600" mb={1} color={isNoQuote ? 'red.800' : activeTab === idx ? 'blue.700' : 'gray.400'}>
                                                        {idx + 1} / {rfqItems.length}
                                                    </Text>
                                                    <Box noOfLines={1} mb={1} fontWeight="500">{item?.part_number?.name}</Box>
                                                    <Text fontSize="11px" fontWeight="500" color={isNoQuote ? 'red.800' : activeTab === idx ? 'blue.700' : 'gray.500'}>
                                                        {isNoQuote ? 'No Quote' : `Qty: ${item.qty}`}
                                                    </Text>
                                                </Box>
                                            );
                                        })}
                                    </Stack>
                                </Box>

                                {/* Right panel */}
                                {activeRFQItem && (
                                    <Box flex={1} minW={0}>
                                        {/* Summary */}
                                        <Stack direction={{ base: 'column', md: 'row' }} spacing={2} mb={4} p={3} bg="green.100" borderRadius="md" borderWidth={1} borderColor="gray.200">
                                            <Box flex={1}><FieldDisplay label="Part Number" size="sm" value={activeRFQItem.part_number?.name} style={{ background: '#fff' }} /></Box>
                                            <Box flex={2}><FieldDisplay label="Description" size="sm" value={activeRFQItem.part_number?.description} style={{ background: '#fff' }} /></Box>
                                            <Box flex={1}><FieldDisplay label="Req. CD" size="sm" style={{ background: '#fff' }} value={getDisplayLabel(conditionOptions, activeRFQItem.condition_id ?? '', 'CN')} /></Box>
                                            <Box flex={1}><FieldDisplay label="Req. QTY" size="sm" style={{ background: '#fff' }} value={`${activeRFQItem.qty} No${activeRFQItem.qty > 1 ? "'s" : ''}`} /></Box>
                                            <Box flex={1}><FieldDisplay label="UOM" size="sm" style={{ background: '#fff' }} value={getDisplayLabel(uomOptions, activeRFQItem.unit_of_measure_id ?? '', 'UOM')} /></Box>
                                        </Stack>

                                        {activeQuotationItem?.is_no_quote ? (
                                            <Flex align="center" justify="center" minH="300px" borderWidth={1} borderColor="gray.200" borderRadius="md">
                                                <Stack align="center" spacing={2}>
                                                    <Text fontSize="lg" fontWeight="700">This item is marked as No Quote</Text>
                                                    <Text fontSize="sm">No pricing can be entered for this line item</Text>
                                                </Stack>
                                            </Flex>
                                        ) : (
                                            <>
                                                {!activeQuotationItem && (
                                                    <Flex justify="center" mb={4}>
                                                        <Button colorScheme="orange" size="sm" onClick={() => { setConfirmState({ title: 'Set as No-Quote', content: 'Mark this item as No Quote?', action: 'no_quote' }); setPendingItems(null); setIsConfirmOpen(true); }}>
                                                            Set as No Quote
                                                        </Button>
                                                    </Flex>
                                                )}

                                                {/* Item form */}
                                                <Formiz connect={itemForm}>
                                                    <form noValidate onSubmit={itemForm.submit}>
                                                        <Box bg={editingLineItem ? 'yellow.50' : 'blue.100'} borderRadius="md" borderWidth={editingLineItem ? 2 : 1} borderColor={editingLineItem ? 'yellow.400' : 'gray.200'} opacity={isItemDisabled ? 0.5 : 1} mb={4} transition="all 0.2s">
                                                            <Stack direction={{ base: 'column', md: 'row' }} spacing={2} p={3}>
                                                                <Box flex={1}>
                                                                    <FieldSelect name="part_number_id" label="Quoted. PN" options={altPartOptions} placeholder="Select P/N" size="sm" isDisabled={isItemDisabled}
                                                                        addNew={{ label: '+ Add New', CreateModal: (p) => <PartNumberModal {...p} onClose={() => p.onClose?.()} onSuccess={(data: any) => handleNewPartNumberCreated(data)} /> }}
                                                                        selectProps={{ type: 'creatable', noOptionsMessage: () => "No parts found", isLoading: altPartsLoading }}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}>
                                                                    <FieldSelect name="condition_id" label="Quoted CD" options={conditionOptions} placeholder="Select CN" required="Condition required" size="sm" isDisabled={isItemDisabled}
                                                                        addNew={{ label: '+ Add New', CreateModal: (p) => <SubMasterModalForm {...p} model="conditions" isEdit={false} />, onSuccess: handleAddNewSuccess('condition_id', reloadDropDowns) }}
                                                                        selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options found', isLoading: dropdownLoading }}
                                                                    />
                                                                </Box>
                                                                <Box flex={1}><FieldInput name="qty" label="Quoted QTY" type="integer" placeholder="Req Qty" required="Qty required" size="sm" isDisabled={isItemDisabled} maxLength={5} defaultValue={activeRFQItem?.qty} /></Box>
                                                                <Box flex={1}><FieldSelect name="unit_of_measure_id" label="UOM" options={uomOptions} placeholder="Select" size="sm" isDisabled={isItemDisabled} /></Box>
                                                            </Stack>
                                                            <Stack direction={{ base: 'column', md: 'row' }} spacing={2} p={3}>
                                                                <Box flex={1}><FieldInput name="price" label="Unit Price" type="decimal" placeholder="Price" size="sm" required="Price Required" isDisabled={isItemDisabled} maxLength={9} /></Box>
                                                                <Box flex={1}><FieldInput name="moq" label="MOQ" type="integer" placeholder="MOQ" size="sm" isDisabled={isItemDisabled} maxLength={9} /></Box>
                                                                <Box flex={1}><FieldInput name="mov" label="MOV" type="decimal" placeholder="MOV" size="sm" isDisabled={isItemDisabled} maxLength={9} /></Box>
                                                                <Box flex={1}><FieldInput name="delivery_options" label="Delivery Detail" placeholder="Delivery details" size="sm" isDisabled={isItemDisabled} maxLength={25} /></Box>
                                                                <Box flex={1}><FieldInput name="remark" label="Remarks" placeholder="Remarks" size="sm" isDisabled={isItemDisabled} maxLength={25} /></Box>
                                                            </Stack>
                                                            <Flex justify="center" p={3} gap={2}>
                                                                {editingLineItem && (
                                                                    <Button size="sm" px={6} variant="outline" colorScheme="gray" onClick={handleCancelEdit}>Cancel</Button>
                                                                )}
                                                                <Button type="submit" colorScheme={editingLineItem ? 'green' : 'brand'} size="sm" px={6}
                                                                    isDisabled={isItemDisabled || createItems.isLoading || updateLineItem.isLoading}
                                                                    isLoading={editingLineItem ? updateLineItem.isLoading : createItems.isLoading}
                                                                >
                                                                    {editingLineItem ? 'Update Item' : 'Add Item'}
                                                                </Button>
                                                            </Flex>
                                                        </Box>
                                                    </form>
                                                </Formiz>

                                                {/* Line items table */}
                                                <TableContainer bg="white" borderRadius="md" borderWidth={1} borderColor="gray.200">
                                                    <Table variant="simple" size="sm">
                                                        <Thead backgroundColor="#0C2556">
                                                            <Tr>
                                                                <Th color="#fff">#</Th>
                                                                {TABLE_COLUMNS.map(([label, field]) => (
                                                                    <Th key={label} color="#fff" cursor={field ? 'pointer' : 'default'} onClick={field ? () => toggleSort(field) : undefined}>
                                                                        {label}{field ? (sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕') : ''}
                                                                    </Th>
                                                                ))}
                                                                <Th color="#fff">Actions</Th>
                                                            </Tr>
                                                        </Thead>
                                                        <Tbody>
                                                            {sortedLineItems.length > 0 ? sortedLineItems.map((line: any, i: number) => {
                                                                const isEditing = editingLineItem?.id === line.id;
                                                                return (
                                                                    <Tr key={line.id} bg={isEditing ? 'yellow.100' : i % 2 === 0 ? 'white' : 'green.50'} outline={isEditing ? '2px solid' : undefined} outlineColor={isEditing ? 'yellow.400' : undefined}>
                                                                        <Td>{i + 1}</Td>
                                                                        <Td>{line.part_number?.name ?? activeRFQItem?.part_number?.name ?? '—'}</Td>
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
                                                                                <IconButton aria-label="Edit" size="xs" colorScheme={isEditing ? 'yellow' : 'green'} icon={isEditing ? <HiX /> : <HiOutlinePencilAlt />} onClick={() => isEditing ? handleCancelEdit() : handleEditLineItem(line)} />
                                                                                <IconButton aria-label="Delete" size="xs" colorScheme="red" icon={<DeleteIcon />} isDisabled={!!editingLineItem} isLoading={deleteLineItem.isLoading && confirmState.lineItemId === line.id} onClick={() => handleDeleteLineItem(line.id)} />
                                                                            </HStack>
                                                                        </Td>
                                                                    </Tr>
                                                                );
                                                            }) : (
                                                                <Tr><Td colSpan={13} textAlign="center" color="gray.400">No items yet</Td></Tr>
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

            {/* Modals */}
            <PRFQSearchPopup isOpen={isSearchOpen} onClose={(selectedId) => { if (selectedId) { handleRfqSelect(String(selectedId)); headerForm.setValues({ prfq_id: String(selectedId) }); } closeSearch(); }} data={prfqId ? { prfq_id: prfqId } : {}} />

            {!!prfqId && (
                <AddVendorToRFQModal
                    isOpen={isAddVendorOpen}
                    onClose={closeAddVendor}
                    prfqId={String(prfqId)}
                    existVendorIds={rfqVendors.map((v: any) => String(v.vendor?.id ?? v.vendor_id))}
                    onSuccess={() => {
                        closeAddVendor();
                        refetchRFQDetails();
                    }}
                />
            )}

            <ConfirmationPopup isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleConfirm} headerText={confirmState.title} bodyText={confirmState.content} />

            <ConfirmationPopup
                isOpen={isAltConfirmOpen}
                onClose={() => { setIsAltConfirmOpen(false); setPendingAltPartId(null); }}
                onConfirm={() => { setIsAltConfirmOpen(false); setIsAltModalOpen(true); }}
                headerText="Add as Alternate Part?"
                bodyText={`Do you want to map "${pendingAltPartName}" as an alternate for "${activeRFQItem?.part_number?.name ?? ''}"?`}
            />

            <Modal isOpen={isAltModalOpen} onClose={() => { setIsAltModalOpen(false); setPendingAltPartId(null); }} isCentered size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" pb={1}>
                        Map as Alternate Part
                        <Text fontSize="sm" fontWeight="400" color="gray.500" mt={1}>
                            <Text as="span" fontWeight="600" color="blue.600">{activeRFQItem?.part_number?.name}</Text>
                            {' → '}
                            <Text as="span" fontWeight="600" color="green.600">{pendingAltPartName}</Text>
                        </Text>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Stack spacing={4}>
                            <FormControl>
                                <FormLabel fontSize="sm">Remark <Text as="span" color="gray.400">(optional)</Text></FormLabel>
                                <Input size="sm" placeholder="Enter remark" value={altRemark} onChange={(e) => setAltRemark(e.target.value)} maxLength={100} borderRadius="md" />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm">Reference Document <Text as="span" color="gray.400">(optional)</Text></FormLabel>
                                <PairDocUpload existingUrl={altRefDoc} isDisabled={false} onValueChange={(url) => setAltRefDoc(url ?? undefined)} />
                            </FormControl>
                        </Stack>
                    </ModalBody>
                    <ModalFooter gap={2}>
                        <Button size="sm" variant="ghost" onClick={() => { setIsAltModalOpen(false); setPendingAltPartId(null); }}>Skip</Button>
                        <Button size="sm" colorScheme="brand" isLoading={isSavingAlt} onClick={handleSaveAltMapping}>Save & Map</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </SlideIn>
    );
};

export default SupplierPricingUpdateForm;