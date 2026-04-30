import { useMemo, useState } from 'react';
import { BiEdit } from 'react-icons/bi';
import { HiEye, HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { BiSolidFilePdf } from 'react-icons/bi';
import {
    Box, Button, HStack, Heading, Stack, Icon, Badge, Text, useDisclosure,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import { usePaymentReceiptIndex, usePaymentReceiptDropdowns } from '@/services/finance/payment-receipt/service';
import { PaymentReceiptInfoModal } from '@/components/Modals/Finance/PaymentReceipt/Preview';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import dayjs from 'dayjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { value: 'credit', label: 'Credit' },
    { value: 'debit', label: 'Debit' },
];

const REFER_TYPE_OPTIONS = [
    { value: 'po', label: 'Purchase Order' },
    { value: 'rpo', label: 'Return PO', isDisabled: true },
    { value: 'lo', label: 'Logistic Order', isDisabled: true },
    { value: 'so', label: 'Sales Order', isDisabled: true },
    { value: 'ro', label: 'Return Order', isDisabled: true },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const PaymentReceiptMaster = () => {
    const navigate = useNavigate();
    const { openPreview } = usePDFPreview();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } =
        usePaymentReceiptDropdowns();

    const customerBankOptions = dropdownData?.customer_banks ?? [];
    const paymentModeOptions = dropdownData?.payment_modes ?? [];

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [formKey, setFormKey] = useState(0);

    // ── Modal state ──
    const [selectedReceiptId, setSelectedReceiptId] = useState<string | undefined>();
    const { isOpen: isReceiptInfoOpen, onOpen: onReceiptInfoOpen, onClose: onReceiptInfoClose } = useDisclosure();

    const initialQueryParams = {
        page: 1,
        limit: itemsPerPage,
        search: '',
        type: '',
        refer_type: '',
        reference_type: '',
        customer_bank_id: '',
        payment_mode_id: '',
        payment_date_from: '',
        payment_date_to: '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
        usePaymentReceiptIndex(queryParams);

    const allApiDataLoaded = dropdownsFetched && listFetched;
    const data = listData?.data ?? [];
    const paginationData = listData?.pagination;

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    // ── Open invoice/proforma preview ──
    const handleOpenInvoicePreview = (row: any) => {
        const isProforma = row.reference_type === 'proforma';
        const endpoint = isProforma ? endPoints.preview.proforma_invoice : endPoints.preview.invoice;
        const label = isProforma ? 'Proforma Invoice' : 'Invoice';
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endpoint.replace(':id', row.reference_id)}`;
        openPreview(url, `${label} Preview - #${row.linked_code}`, true);
    };

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];

        const baseColumnConfig: DynamicColumn<any>[] = [
            {
                key: 'code',
                header: 'Code',
                meta: { sortable: true, sortParam: 'code', fontWeight: 'bold' },
            },
            {
                key: 'type',
                header: 'Type',
                render: (row: any) => (
                    <HStack spacing={1}><Badge
                        colorScheme={row.type === 'credit' ? 'green' : 'red'}
                        variant="subtle" fontSize="10px" px={2} py={1}
                    >
                        {TYPE_OPTIONS.find(o => o.value === row.type)?.label ?? row.type ?? '—'}
                    </Badge>
                    </HStack>)
            },
            {
                key: 'refer_type',
                header: 'Ref. Type',
                render: (row: any) =>
                    REFER_TYPE_OPTIONS.find(o => o.value === row.refer_type)?.label ?? row.refer_type ?? '—',
            },
            {
                key: 'linked_code',
                header: 'Invoice Ref',
                render: (row: any) => (
                    <HStack spacing={1}>
                        <Badge
                            colorScheme={
                                row.reference_type === 'invoice' ? 'blue' :
                                    row.reference_type === 'return_order' ? 'red' : 'purple'
                            }
                            variant="subtle" fontSize="9px"
                        >
                            {row.reference_type === 'invoice' ? 'INV' :
                                row.reference_type === 'return_order' ? 'RPO' : 'PINV'}
                        </Badge>
                        <Text fontSize="xs" fontWeight="semibold">{row.linked_code ?? '—'}</Text>
                    </HStack>
                ),

            },
            {
                key: 'linked_invoice_amount',
                header: 'Inv. Amount',
                render: (row: any) =>
                    row.linked_invoice_amount != null
                        ? Number(row.linked_invoice_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '—',
            },
            {
                key: 'bank_receipt_number',
                header: 'Receipt No',
                meta: { sortable: true, sortParam: 'bank_receipt_number' },
            },
            {
                key: 'payment_value',
                header: 'Amount',
                meta: { sortable: true, sortParam: 'payment_value' },
                render: (row: any) =>
                    row.payment_value ? row.payment_value.toFixed(2) : '—',
            },
            {
                key: 'payment_date',
                header: 'Payment Date',
                meta: { sortable: true, sortParam: 'payment_date' },
                render: (row: any) =>
                    row.payment_date ? dayjs(row.payment_date).format('DD-MMM-YYYY') : '—',
            },
            {
                key: 'customer_bank.beneficiary_name',
                header: 'Customer Bank',
                meta: { sortable: true, sortParam: 'customer_bank_id' },
            },
            {
                key: 'payment_mode.name',
                header: 'Payment Mode',
                meta: { sortable: true, sortParam: 'payment_mode_id' },
            },
            {
                key: 'actions',
                header: 'Actions',
                type: 'actions',
                actions: [
                    // ── View Receipt ──
                    {
                        label: 'View Receipt',
                        icon: <HiEye />,
                        onClick: (row: any) => {
                            setSelectedReceiptId(row.id);
                            onReceiptInfoOpen();
                        },
                    },
                    // ── View Invoice ──
                    {
                        label: 'View Invoice',
                        icon: <BiSolidFilePdf />,
                        isVisible: (row: any) => row.reference_type === 'invoice',
                        onClick: (row: any) => handleOpenInvoicePreview(row),
                    },
                    // ── View Proforma ──
                    {
                        label: 'View Proforma',
                        icon: <BiSolidFilePdf />,
                        isVisible: (row: any) => row.reference_type === 'proforma',
                        onClick: (row: any) => handleOpenInvoicePreview(row),
                    },
                    {
                        label: 'View Return Order',
                        icon: <BiSolidFilePdf />,
                        isVisible: (row: any) => row.reference_type === 'return_order',
                        onClick: (row: any) => {
                            const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.return_order.replace(':id', row.reference_id)}`;
                            openPreview(url, `Return Order Preview - #${row.linked_code}`, true);
                        },
                    },
                    // ── Edit (disabled) ──
                    ...(canUpdate ? [{
                        label: 'Edit',
                        icon: <BiEdit />,
                        isDisabled: (_row: any) => true,
                        onClick: (row: any) => navigate(`/finance/payment-receipt/form/${row.id}`),
                        disabledTooltip: (row: any) => row.pending_request_message ?? 'Editing is disabled',
                    }] : []),
                ],
            },
        ];

        return buildColumns(baseColumnConfig, { showSerial: true });
    }, [dropdownsFetched, canUpdate]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Header ── */}
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Payment Receipt</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary" icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/finance/payment-receipt/form')}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                {/* ── Filters ── */}
                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            {/* Row 1 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                <FieldInput
                                    name="keyword"
                                    placeholder="Search code, receipt no..."
                                    onValueChange={(value) => updateFilter('search', value ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`type_${formKey}`}
                                    name="type" placeholder="Type"
                                    options={TYPE_OPTIONS}
                                    onValueChange={(v) => updateFilter('type', v)}
                                    isClearable size="sm"
                                />
                                <FieldSelect
                                    key={`refer_type_${formKey}`}
                                    name="refer_type" placeholder="Ref. Type"
                                    options={REFER_TYPE_OPTIONS}
                                    onValueChange={(v) => updateFilter('refer_type', v)}
                                    isClearable size="sm"
                                />
                                <FieldSelect
                                    key={`reference_type_${formKey}`}
                                    name="reference_type" placeholder="Invoice Type"
                                    options={[
                                        { value: 'invoice', label: 'Invoice' },
                                        { value: 'proforma', label: 'Proforma Invoice' },
                                    ]}
                                    onValueChange={(v) => updateFilter('reference_type', v)}
                                    isClearable size="sm"
                                />
                                <FieldSelect
                                    key={`customer_bank_${formKey}`}
                                    name="customer_bank_id" placeholder="Customer Bank"
                                    options={customerBankOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('customer_bank_id', v)}
                                    isClearable size="sm"
                                />
                                <FieldSelect
                                    key={`payment_mode_${formKey}`}
                                    name="payment_mode_id" placeholder="Payment Mode"
                                    options={paymentModeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('payment_mode_id', v)}
                                    isClearable size="sm"
                                />
                            </Stack>

                            {/* Row 2 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                <FieldDayPicker
                                    name="payment_date_from" placeholder="Payment Date From"
                                    size="sm" onValueChange={(v) => updateFilter('payment_date_from', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="payment_date_to" placeholder="Payment Date To"
                                    size="sm" onValueChange={(v) => updateFilter('payment_date_to', v ?? '')}
                                />
                            </Stack>

                            {/* Reset */}
                            <Stack align="center" mt={6}>
                                <Button variant="@primary" size="sm" leftIcon={<HiRefresh />}
                                    onClick={() => {
                                        form.reset();
                                        setFormKey((k) => k + 1);
                                        setQueryParams(initialQueryParams);
                                    }}>
                                    Reset Form
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                </Formiz>

                {/* ── Table ── */}
                <Box borderRadius={4}>
                    <DataTable
                        columns={columns} data={data}
                        loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                        title="Payment Receipts"
                        enablePagination enableClientSideSearch={false}
                        onSortChange={handleSortChange}
                        sortDirection={sortDirection} sortBy={sortBy}
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={itemsPerPage}
                        stickyColumns={4} stickyLastColumn
                        onPageChange={(page) => setQueryParams((prev: any) => ({ ...prev, page }))}
                        onPageSizeChange={(limit) => {
                            setItemsPerPage(limit);
                            setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
                        }}
                    />
                </Box>

                {/* ── Payment Receipt Info Modal ── */}
                <PaymentReceiptInfoModal
                    isOpen={isReceiptInfoOpen}
                    onClose={() => { onReceiptInfoClose(); setSelectedReceiptId(undefined); }}
                    receiptId={selectedReceiptId}
                />

            </Stack>
        </SlideIn>
    );
};

export default PaymentReceiptMaster;