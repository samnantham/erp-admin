import { useMemo, useState } from 'react';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { BiSolidFilePdf } from 'react-icons/bi';
import {
    Box, Button, HStack, Heading, Icon, Stack, Badge, Text
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
import { useReturnOrderIndex } from '@/services/purchase/return-order/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import { PageLimit } from '@/components/PageLimit';
import dayjs from 'dayjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: 'pending',   label: 'Pending'   },
    { value: 'approved',  label: 'Approved'  },
    { value: 'completed', label: 'Completed' },
];

const INVOICE_TYPE_OPTIONS = [
    { value: 'invoice',  label: 'Invoice'          },
    { value: 'proforma', label: 'Proforma Invoice'  },
];

const STATUS_COLOR: Record<string, string> = {
    pending:   'orange',
    approved:  'blue',
    completed: 'green',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ReturnOrderMaster = () => {
    const navigate    = useNavigate();
    const { openPreview } = usePDFPreview();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;

    const [itemsPerPage,  setItemsPerPage]  = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy,        setSortBy]        = useState<string>('created_at');
    const [formKey,       setFormKey]       = useState(0);

    const initialQueryParams = {
        page:              1,
        limit:             itemsPerPage,
        search:            '',
        status:            '',
        invoice_reference_type: '',
        return_date_from:  '',
        return_date_to:    '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isLoading: listDataLoading } =
        useReturnOrderIndex(queryParams);

    const data           = listData?.data      ?? [];
    const paginationData = listData?.pagination;

        const handleOpenPreview = (row: any) => {
            const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.return_order.replace(':id', row.id)}`;
            openPreview(url, `Return Order Preview - #${row.code}${row.version && row.version > 0 ? 'R' + row.version : ''}`, true);
        };

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    // ── Open invoice/proforma preview ──
    const handleOpenInvoicePreview = (row: any) => {
        if (!row.invoice_reference_id) return;
        const isProforma = row.invoice_reference_type === 'proforma';
        const endpoint   = isProforma ? endPoints.preview.proforma_invoice : endPoints.preview.invoice;
        const label      = isProforma ? 'Proforma Invoice Preview' : 'Invoice Preview';
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endpoint.replace(':id', row.invoice_reference_id)}`;
        openPreview(url, `${label} - #${row.invoice_reference_code}`, true);
    };

    // ── Open PO preview ──
    const handleOpenPoPreview = (row: any) => {
        if (!row.purchase_order_id) return;
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.purchase_order.replace(':id', row.purchase_order_id)}`;
        openPreview(url, `Purchase Order Preview - #${row.purchase_order?.code}`, true);
    };

    const columns = useMemo(() => {
        return buildColumns([
            {
                key:    'code',
                header: 'Code',
                meta:   { sortable: true, sortParam: 'code', fontWeight: 'bold' },
            },
            {
                key:    'purchase_order.code',
                header: 'PO No.',
                meta:   { sortable: true, sortParam: 'purchase_order_id', fontWeight: 'bold' },
            },
            {
                key:    'invoice_reference_code',
                header: 'Invoice Ref',
                render: (row: any) => (
                    <HStack spacing={1}>
                        <Badge
                            colorScheme={row.invoice_reference_type === 'invoice' ? 'blue' : 'purple'}
                            variant="subtle" fontSize="9px"
                        >
                            {row.invoice_reference_type === 'invoice' ? 'INV' : 'PINV'}
                        </Badge>
                        <Text fontSize="xs" fontWeight="semibold">
                            {row.invoice_reference_code ?? '—'}
                        </Text>
                    </HStack>
                ),
            },
            {
                key:    'purchase_order.customer.business_name',
                header: 'Customer',
            },
            {
                key:    'total_return_amount',
                header: 'Return Amount',
                meta:   { sortable: true, sortParam: 'total_return_amount' },
                render: (row: any) => (
                    <Text fontSize="xs" fontWeight="semibold" color="red.500">
                        {row.purchase_order?.currency?.code ?? ''}{' '}
                        {Number(row.total_return_amount ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>
                ),
            },
            {
                key:    'return_date',
                header: 'Return Date',
                meta:   { sortable: true, sortParam: 'return_date' },
                render: (row: any) =>
                    row.return_date ? dayjs(row.return_date).format('DD-MMM-YYYY') : '—',
            },

             {
                key:    'status',
                header: 'Status',
                render: (row: any) => (
                    <Badge
                        colorScheme={STATUS_COLOR[row.status] ?? 'gray'}
                        variant="subtle" fontSize="xs" fontStyle="capitalize"
                    >
                        {row.status ?? '—'}
                    </Badge>
                ),
            },
           
            {
                key:    'remarks',
                header: 'Remarks',
                render: (row: any) => (
                    <Text fontSize="xs" color="gray.500" noOfLines={1} maxW="150px">
                        {row.remarks ?? '—'}
                    </Text>
                ),
            },
            {
                key:     'actions',
                header:  'Actions',
                type:    'actions',
                actions: [
                    {
                                                    label: 'Preview',
                                                    icon: <BiSolidFilePdf />,
                                                    onClick: handleOpenPreview,
                                                },
                    {
                        label:   'View PO',
                        icon:    <BiSolidFilePdf />,
                        onClick: (row: any) => handleOpenPoPreview(row),
                    },
                    {
                        label:    'View Invoice',
                        icon:     <BiSolidFilePdf />,
                        isVisible: (row: any) => row.invoice_reference_type !== 'proforma',
                        onClick:  (row: any) => handleOpenInvoicePreview(row),
                    },
                    {
                        label:    'View Proforma',
                        icon:     <BiSolidFilePdf />,
                        isVisible: (row: any) => row.invoice_reference_type === 'proforma',
                        onClick:  (row: any) => handleOpenInvoicePreview(row),
                    },
                ],
            },
        ] as DynamicColumn<any>[], { showSerial: true });
    }, []);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Header ── */}
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Return Orders</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary" icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/purchase/return-order/form')}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                {/* ── Filters ── */}
                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                <FieldInput
                                    name="keyword"
                                    placeholder="Search code, remarks..."
                                    onValueChange={(v) => updateFilter('search', v ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`status_${formKey}`}
                                    name="status" placeholder="Status"
                                    options={STATUS_OPTIONS}
                                    onValueChange={(v) => updateFilter('status', v)}
                                    isClearable size="sm"
                                />
                                <FieldSelect
                                    key={`inv_type_${formKey}`}
                                    name="invoice_reference_type" placeholder="Invoice Type"
                                    options={INVOICE_TYPE_OPTIONS}
                                    onValueChange={(v) => updateFilter('invoice_reference_type', v)}
                                    isClearable size="sm"
                                />
                                <FieldDayPicker
                                    name="return_date_from" placeholder="Return Date From"
                                    size="sm" onValueChange={(v) => updateFilter('return_date_from', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="return_date_to" placeholder="Return Date To"
                                    size="sm" onValueChange={(v) => updateFilter('return_date_to', v ?? '')}
                                />
                            </Stack>

                            <Stack align="center" mt={4}>
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
                    <HStack bg="white" justify="space-between" p={4} borderTopRadius={4} mb={0}>
                        <Heading as="h4" size="sm">Return Orders</Heading>
                        <PageLimit
                            currentLimit={itemsPerPage}
                            loading={listDataLoading}
                            changeLimit={(limit) => setItemsPerPage(limit)}
                            total={paginationData?.total}
                        />
                    </HStack>
                    <DataTable
                        columns={columns} data={data}
                        loading={listDataLoading}
                        title="Return Orders"
                        enablePagination enableClientSideSearch={false}
                        onSortChange={handleSortChange}
                        sortDirection={sortDirection} sortBy={sortBy}
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={itemsPerPage}
                        stickyColumns={3} stickyLastColumn
                        showtitleBar={false}
                        onPageChange={(page) => setQueryParams((prev: any) => ({ ...prev, page }))}
                        onPageSizeChange={(limit) => {
                            setItemsPerPage(limit);
                            setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
                        }}
                    />
                </Box>

            </Stack>
        </SlideIn>
    );
};

export default ReturnOrderMaster;