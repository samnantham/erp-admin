import { useMemo, useState } from 'react';
import { BiEdit, BiSolidFilePdf } from 'react-icons/bi';
import {
    Box, Button, HStack, Heading, Stack, Icon, Badge, Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
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
import { useSalesOrderIndex } from '@/services/sales/sales-order/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import dayjs from 'dayjs';

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesOrderMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();
    const { openPreview } = usePDFPreview();

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;

    const handleOpenPreview = (row: any) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.sales_order.replace(':id', row.id)}`;
        openPreview(url, `SO Preview - #${row.code}`, true);
    };

    const [itemsPerPage,  setItemsPerPage]  = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy,        setSortBy]        = useState<string>('created_at');
    const [formKey,       setFormKey]       = useState(0);

    const initialQueryParams = {
        page:              1,
        limit:             itemsPerPage,
        search:            '',
        is_closed:         '',
        order_date_from:   '',
        order_date_to:     '',
        delivery_date_from: '',
        delivery_date_to:  '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isLoading: listDataLoading } =
        useSalesOrderIndex(queryParams);

    const data           = listData?.data      ?? [];
    const paginationData = listData?.pagination;

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    const columns = useMemo(() => {
        const baseColumnConfig: DynamicColumn<any>[] = [
            {
                key:    'code',
                header: 'ID',
                meta:   { sortable: true, sortParam: 'code', fontWeight: 'bold' },
            },
            {
                key:    'sales_quotation.code',
                header: 'SQ No',
                meta:   { fontWeight: 'semibold' },
            },
            {
                key:    'sales_quotation.sales_log.cust_rfq_no',
                header: 'RFQ No',
                meta:   { sortable: true, sortParam: 'cust_rfq_no' },
            },
            {
                key:    'sales_quotation.sales_log.customer.business_name',
                header: 'Customer',
                meta:   { sortable: true, sortParam: 'customer_id' },
            },
            {
                key:    'total_items',
                header: 'Tot. Items',
                render: (row: any) => (
                    <Badge colorScheme="blue" variant="subtle">{row.total_items ?? 0}</Badge>
                ),
            },
            {
                key:    'total_value',
                header: 'Total Value',
                meta:   { sortable: true, sortParam: 'total_value' },
                render: (row: any) => (
                    <Text fontSize="xs" fontWeight="semibold" color="blue.600">
                        {row.sales_quotation?.sales_log?.currency?.code ?? ''}{' '}
                        {Number(row.total_value ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>
                ),
            },
            {
                key:    'order_date',
                header: 'Order Date',
                meta:   { sortable: true, sortParam: 'order_date' },
                render: (row: any) =>
                    row.order_date ? dayjs(row.order_date).format('DD-MMM-YYYY') : '—',
            },
            {
                key:    'delivery_date',
                header: 'Delivery Date',
                meta:   { sortable: true, sortParam: 'delivery_date' },
                render: (row: any) =>
                    row.delivery_date ? dayjs(row.delivery_date).format('DD-MMM-YYYY') : '—',
            },
            {
                key:    'is_closed',
                header: 'Status',
                render: (row: any) => (
                    <Badge
                        colorScheme={row.is_closed ? 'red' : 'green'}
                        variant="solid" borderRadius="sm" fontSize="10px"
                    >
                        {row.is_closed ? 'Closed' : 'Open'}
                    </Badge>
                ),
            },
            {
                key:     'actions',
                header:  'Actions',
                type:    'actions',
                actions: [
                    ...(canUpdate ? [{
                        label:           'Edit',
                        icon:            <BiEdit />,
                        isDisabled:      (row: any) => !!row.has_pending_request || !!row.is_closed,
                        onClick:         (row: any) => navigate(`/sales-management/order/form/${row.id}`),
                        disabledTooltip: (row: any) =>
                            row.is_closed
                                ? 'Sales Order is closed'
                                : row.pending_request_message ?? 'Editing disabled',
                    }] : []),
                    {
                        label:   'Preview',
                        icon:    <BiSolidFilePdf />,
                        onClick: (row: any) => handleOpenPreview(row),
                    },
                ],
            },
        ];

        return buildColumns(baseColumnConfig, { showSerial: true });
    }, [canUpdate]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Header ── */}
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Sales Orders</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/sales-management/order/form')}
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
                                    placeholder="Search code, RFQ no..."
                                    onValueChange={(value) => updateFilter('search', value ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`is_closed_${formKey}`}
                                    name="is_closed"
                                    placeholder="Status"
                                    options={[
                                        { value: 'false', label: 'Open'   },
                                        { value: 'true',  label: 'Closed' },
                                    ]}
                                    onValueChange={(v) => updateFilter('is_closed', v)}
                                    isClearable size="sm"
                                />
                            </Stack>

                            {/* Row 2 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                <FieldDayPicker
                                    name="order_date_from"
                                    placeholder="Order Date From"
                                    size="sm"
                                    onValueChange={(v) => updateFilter('order_date_from', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="order_date_to"
                                    placeholder="Order Date To"
                                    size="sm"
                                    onValueChange={(v) => updateFilter('order_date_to', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="delivery_date_from"
                                    placeholder="Delivery Date From"
                                    size="sm"
                                    onValueChange={(v) => updateFilter('delivery_date_from', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="delivery_date_to"
                                    placeholder="Delivery Date To"
                                    size="sm"
                                    onValueChange={(v) => updateFilter('delivery_date_to', v ?? '')}
                                />
                            </Stack>

                            {/* Reset */}
                            <Stack align="center" mt={6}>
                                <Button
                                    variant="@primary" size="sm" leftIcon={<HiRefresh />}
                                    onClick={() => {
                                        form.reset();
                                        setFormKey((k) => k + 1);
                                        setQueryParams(initialQueryParams);
                                    }}
                                >
                                    Reset Form
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                </Formiz>

                {/* ── Table ── */}
                <Box borderRadius={4}>
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={listDataLoading}
                        title="Sales Orders"
                        enablePagination
                        enableClientSideSearch={false}
                        onSortChange={handleSortChange}
                        sortDirection={sortDirection}
                        sortBy={sortBy}
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={itemsPerPage}
                        stickyColumns={3}
                        stickyLastColumn
                        onPageChange={(page) =>
                            setQueryParams((prev: any) => ({ ...prev, page }))
                        }
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

export default SalesOrderMaster;