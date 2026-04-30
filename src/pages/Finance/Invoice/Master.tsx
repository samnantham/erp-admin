import { useEffect, useMemo, useState } from 'react';
import { Box, Button, HStack, Heading, Icon, Stack, Tab, TabList, Tabs, Tooltip, Text, useDisclosure } from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch, HiEye } from 'react-icons/hi';
import { LuPlus, LuCheck } from 'react-icons/lu';
import { BiEdit } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import { InvoiceInfoModal } from '@/components/Modals/Finance/InvoicePreview';
import {
    useInvoiceIndex, useInvoiceDropdowns, useMarkInvoiceReady,
    useProformaInvoiceIndex, useProformaInvoiceDropdowns, useMarkProformaInvoiceReady,
    useInvoiceDetails, useProformaInvoiceDetails,
} from '@/services/finance/invoice/service';
import { usePurchaseOrderDetails } from '@/services/purchase/order/service';
import { getDisplayLabel } from '@/helpers/commonHelper';
import dayjs from 'dayjs';
import { PageLimit } from '@/components/PageLimit';
import DocumentDownloadButton from '@/components/DocumentDownloadButton';

// ─── Constants ────────────────────────────────────────────────────────────────

const REFERENCE_OPTIONS = [
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'logistic_order', label: 'Logistic Order', isDisabled: true },
];

const TABS = [
    { label: 'Invoice', value: 'invoice' as const },
    { label: 'Proforma Invoice', value: 'proforma' as const },
];

type MasterType = 'invoice' | 'proforma';

const MASTER_CONFIG = {
    invoice: { tableTitle: 'Invoices', createPath: '/finance/invoice/form' },
    proforma: { tableTitle: 'Proforma Invoices', createPath: '/finance/invoice/form' },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

const useInvoiceMasterData = (type: MasterType, queryParams: any) => {
    const invoice = useInvoiceIndex(type === 'invoice' ? queryParams : undefined);
    const proforma = useProformaInvoiceIndex(type === 'proforma' ? queryParams : undefined);
    return type === 'invoice' ? invoice : proforma;
};

const useInvoiceMasterDropdowns = (type: MasterType) => {
    const invoice = useInvoiceDropdowns();
    const proforma = useProformaInvoiceDropdowns();
    return type === 'invoice' ? invoice : proforma;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const InvoiceMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();
    const [type, setType] = useState<MasterType>('invoice');
    const config = MASTER_CONFIG[type];
    const canCreate = otherPermissions.create === 1;

    // const canUpdate = otherPermissions.update === 1;
    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } =
        useInvoiceMasterDropdowns(type);

    const currencyOptions = dropdownData?.currencies ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [formKey, setFormKey] = useState(0);

    // ── Modal state ──
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [confirmItem, setConfirmItem] = useState<any>(null);
    const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

    // ── Fetch full details for the info modal ──
    const { data: invoiceDetails, isFetching: invoiceDetailsFetching } = useInvoiceDetails(
        type === 'invoice' && selectedRow ? selectedRow.id : undefined
    );
    const { data: proformaDetails, isFetching: proformaDetailsFetching } = useProformaInvoiceDetails(
        type === 'proforma' && selectedRow ? selectedRow.id : undefined
    );
    const invoiceData = type === 'invoice' ? invoiceDetails?.data : proformaDetails?.data;
    const isDetailLoading = invoiceDetailsFetching || proformaDetailsFetching;

    // ── Fetch PO details for info modal ──
    const poReferenceId = invoiceData?.reference_id ?? null;
    const { data: poDetails, isFetching: poDetailsFetching } = usePurchaseOrderDetails(
        poReferenceId ?? undefined,
        { enabled: !!poReferenceId }
    );
    const currencyCode = poDetails?.data?.currency?.code ?? '';

    // ── Mutations ──
    const markInvoiceReady = useMarkInvoiceReady({
        onSuccess: () => { onConfirmClose(); setConfirmItem(null); refetchList(); },
    });
    const markProformaReady = useMarkProformaInvoiceReady({
        onSuccess: () => { onConfirmClose(); setConfirmItem(null); refetchList(); },
    });

    const handleView = (row: any) => { setSelectedRow(row); onInfoOpen(); };
    const handleMarkReady = (row: any) => { setConfirmItem(row); onConfirmOpen(); };
    const confirmMarkReady = () => {
        if (!confirmItem) return;
        type === 'proforma' ? markProformaReady.mutate(confirmItem.id) : markInvoiceReady.mutate(confirmItem.id);
    };

    const getInitialQueryParams = (t: MasterType) => ({
        page: 1, limit: itemsPerPage, search: '',
        ...(t === 'invoice' && { invoice_type: '', currency_id: '', payment_term_id: '', payment_date_from: '', payment_date_to: '' }),
        ...(t === 'proforma' && { payment_term_id: '', invoice_date_from: '', invoice_date_to: '', due_date_from: '', due_date_to: '' }),
    });

    const [queryParams, setQueryParams] = useState<any>(getInitialQueryParams('invoice'));
    const form = useForm();

    useEffect(() => {
        form.reset();
        setFormKey((k) => k + 1);
        setQueryParams(getInitialQueryParams(type));
    }, [type]);

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading, refetch: refetchList } =
        useInvoiceMasterData(type, queryParams);

    const data = listData?.data ?? [];
    const paginationData = listData?.pagination;
    const allApiDataLoaded = dropdownsFetched && listFetched;
    const isLoading = dropdownLoading || listDataLoading;

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];
        const fmt = (date?: string | null) => date ? dayjs(date).format('DD-MMM-YYYY') : '-';

        const invoiceSpecific: DynamicColumn<any>[] = [
            { key: 'tax_invoice_no', header: 'Tax Inv. No', meta: { sortable: true, sortParam: 'tax_invoice_no' } },
            { key: 'tax_invoice_date', header: 'Tax Inv. Date', meta: { sortable: true, sortParam: 'tax_invoice_date' }, render: (row) => fmt(row.tax_invoice_date) },
            { key: 'payment_date', header: 'Payment Date', meta: { sortable: true, sortParam: 'payment_date' }, render: (row) => fmt(row.payment_date) },
            { key: 'payment_by', header: 'Payment By', meta: { sortable: true, sortParam: 'payment_by' } },
            { key: 'currency.name', header: 'Currency', meta: { sortable: true, sortParam: 'currency_id' } },
        ];
        const proformaSpecific: DynamicColumn<any>[] = [
            { key: 'invoice_number', header: 'Invoice No.', meta: { sortable: true, sortParam: 'invoice_number' } },
            { key: 'invoice_date', header: 'Invoice Date', meta: { sortable: true, sortParam: 'invoice_date' }, render: (row) => fmt(row.invoice_date) },
            { key: 'date', header: 'Date', meta: { sortable: true, sortParam: 'date' }, render: (row) => fmt(row.date) },
        ];

        return buildColumns([
            {
                key: 'code',
                header: 'Code',
                meta: { sortable: true, sortParam: 'code' },
                render: (row: any) => (
                    <Tooltip
                        label={row.is_ready_for_receipt ? 'Ready for receipt' : 'Not ready for receipt yet'}
                        hasArrow
                        bg={row.is_ready_for_receipt ? 'green.500' : 'orange.500'}
                        color="white"
                        placement={'top'}
                    >
                        <Text fontWeight="bold" color={row.is_ready_for_receipt ? 'green.600' : 'orange.600'}>
                            {row.code}
                        </Text>
                    </Tooltip>
                ),
            },
            { key: 'reference_type', header: 'Ref. Type', render: (row: any) => getDisplayLabel(REFERENCE_OPTIONS, row?.reference_type, 'ref') },
            ...(type === 'invoice' ? invoiceSpecific : proformaSpecific),
            { key: 'invoice_amount', header: 'Amount', meta: { sortable: true, sortParam: 'invoice_amount' } },
            { key: 'payment_term.name', header: 'Payment Term', meta: { sortable: true, sortParam: 'payment_term_id' } },
            { key: 'customer_bank.beneficiary_name', header: 'Bank', meta: { sortable: true, sortParam: 'customer_bank_id' } },
            {
                key: 'file',
                header: 'Inv. File',
                render: (row: any) => <DocumentDownloadButton size="xs" url={row.file ?? ''} />,
            },
            {
                key: 'actions', header: 'Actions', type: 'actions',
                actions: [
                    {
                        label: 'View',
                        icon: <HiEye />,
                        onClick: (row: any) => handleView(row),
                    },
                    {
                        label: 'Mark as Ready',
                        icon: <LuCheck />,
                        isVisible: (row: any) => !row.is_ready_for_receipt,
                        onClick: (row: any) => handleMarkReady(row),
                    },
                    // ...(canUpdate ? [
                    {
                        label: 'Edit',
                        icon: <BiEdit />,
                        isDisabled: (_row: any) => true,
                        disabledTooltip: (row: any) => row.pending_request_message ?? 'Editing is disabled',
                        onClick: (_row: any) => { },
                    }
                    // ] : []),
                ],
            },
        ] as DynamicColumn<any>[], { showSerial: true });
    }, [dropdownsFetched, type]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                <HStack justify="space-between">
                    <Heading as="h4" size="md">Invoice Entry</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary" icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate(config.createPath, { state: { type } })}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                <Formiz key={`form_${type}`} autoForm connect={form}>
                    <Box bg="green.200" width="100%" padding="4" borderRadius="4">
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            {type === 'invoice' && (
                                <>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                        <FieldInput name="keyword" placeholder="Search code, tax invoice no..."
                                            onValueChange={(v) => updateFilter('search', v ?? '')}
                                            rightElement={<Icon as={HiOutlineSearch} color="gray.300" />} size="sm" />
                                        <FieldSelect key={`invoice_type_${formKey}`} name="invoice_type" placeholder="Invoice Type"
                                            options={REFERENCE_OPTIONS} onValueChange={(v) => updateFilter('invoice_type', v)}
                                            isClearable size="sm" />
                                        <FieldSelect key={`currency_${formKey}`} name="currency_id" placeholder="Currency"
                                            options={currencyOptions} selectProps={{ isLoading: dropdownLoading }}
                                            onValueChange={(v) => updateFilter('currency_id', v)} isClearable size="sm" />
                                        <FieldSelect key={`payment_term_${formKey}`} name="payment_term_id" placeholder="Payment Term"
                                            options={paymentTermOptions} selectProps={{ isLoading: dropdownLoading }}
                                            onValueChange={(v) => updateFilter('payment_term_id', v)} isClearable size="sm" />
                                    </Stack>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                        <FieldDayPicker name="payment_date_from" placeholder="Payment Date From" size="sm" onValueChange={(v) => updateFilter('payment_date_from', v ?? '')} />
                                        <FieldDayPicker name="payment_date_to" placeholder="Payment Date To" size="sm" onValueChange={(v) => updateFilter('payment_date_to', v ?? '')} />
                                    </Stack>
                                </>
                            )}

                            {type === 'proforma' && (
                                <>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                        <FieldInput name="keyword" placeholder="Search code, invoice no..."
                                            onValueChange={(v) => updateFilter('search', v ?? '')}
                                            rightElement={<Icon as={HiOutlineSearch} color="gray.300" />} size="sm" />
                                        <FieldSelect key={`payment_term_${formKey}`} name="payment_term_id" placeholder="Payment Term"
                                            options={paymentTermOptions} selectProps={{ isLoading: dropdownLoading }}
                                            onValueChange={(v) => updateFilter('payment_term_id', v)} isClearable size="sm" />
                                        <FieldDayPicker name="invoice_date_from" placeholder="Invoice Date From" size="sm" onValueChange={(v) => updateFilter('invoice_date_from', v ?? '')} />
                                        <FieldDayPicker name="invoice_date_to" placeholder="Invoice Date To" size="sm" onValueChange={(v) => updateFilter('invoice_date_to', v ?? '')} />
                                    </Stack>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                        <FieldDayPicker name="due_date_from" placeholder="Due Date From" size="sm" onValueChange={(v) => updateFilter('due_date_from', v ?? '')} />
                                        <FieldDayPicker name="due_date_to" placeholder="Due Date To" size="sm" onValueChange={(v) => updateFilter('due_date_to', v ?? '')} />
                                    </Stack>
                                </>
                            )}

                            <Stack align="center" mt={6}>
                                <Button variant="@primary" size="sm" leftIcon={<HiRefresh />}
                                    onClick={() => { form.reset(); setFormKey((k) => k + 1); setQueryParams(getInitialQueryParams(type)); }}>
                                    Reset Form
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                </Formiz>

                <Box borderRadius={4}>
                    <HStack bg="white" justify="space-between" p={4} borderTopRadius={4} mb={4}>
                        <Heading as="h4" size="md">{config.tableTitle}</Heading>
                        <PageLimit
                            currentLimit={itemsPerPage}
                            loading={isLoading}
                            changeLimit={(limit) => setItemsPerPage(limit)}
                            total={paginationData?.total}
                        />
                    </HStack>

                    <Tabs
                        index={TABS.findIndex((t) => t.value === type)}
                        onChange={(i) => setType(TABS[i].value)}
                        variant="unstyled"
                    >
                        <TabList>
                            {TABS.map((tab) => (
                                <Tab
                                    key={tab.value}
                                    bg={type === tab.value ? '#0C2556' : 'gray.200'}
                                    color={type === tab.value ? 'white' : 'gray.600'}
                                    fontSize="sm" fontWeight="semibold"
                                    px={4} py={1.5}
                                    _hover={{ bg: type === tab.value ? '#0C2556' : 'gray.300' }}
                                    _selected={{}}
                                >
                                    {tab.label}
                                </Tab>
                            ))}
                        </TabList>
                    </Tabs>

                    <DataTable
                        columns={columns} data={data}
                        loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                        title={config.tableTitle}
                        enablePagination enableClientSideSearch={false}
                        onSortChange={handleSortChange}
                        sortDirection={sortDirection} sortBy={sortBy}
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={itemsPerPage}
                        stickyColumns={4} stickyLastColumn
                        showtitleBar={false}
                        onPageChange={(page) => setQueryParams((prev: any) => ({ ...prev, page }))}
                        onPageSizeChange={(limit) => { setItemsPerPage(limit); setQueryParams((prev: any) => ({ ...prev, limit, page: 1 })); }}
                    />
                </Box>

                {/* ── Invoice Info Modal ── */}
                <InvoiceInfoModal
                    isOpen={isInfoOpen}
                    onClose={() => { onInfoClose(); setSelectedRow(null); }}
                    invoice={invoiceData}
                    currencyCode={currencyCode}
                    isProforma={type === 'proforma'}
                    poData={poDetails}
                    poLoading={poDetailsFetching || isDetailLoading}
                />

                {/* ── Confirm Mark Ready ── */}
                <ConfirmationPopup
                    isOpen={isConfirmOpen}
                    onClose={() => { onConfirmClose(); setConfirmItem(null); }}
                    onConfirm={confirmMarkReady}
                    headerText="Mark Ready for Receipt"
                    bodyText={`Are you sure you want to mark ${confirmItem?.code ?? 'this invoice'} as ready for receipt? This action cannot be undone.`}
                />

            </Stack>
        </SlideIn>
    );
};

export default InvoiceMaster;