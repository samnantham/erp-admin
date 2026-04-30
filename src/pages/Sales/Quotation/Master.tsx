import { useMemo, useState } from 'react';
import { BiEdit } from 'react-icons/bi';
import { BiSolidFilePdf } from 'react-icons/bi';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import {
    Box, Button, HStack, Heading, Icon, Stack, Badge, Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import { useSalesQuotationIndex } from '@/services/sales/quotation/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import { PageLimit } from '@/components/PageLimit';
import dayjs from 'dayjs';

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesQuotationMaster = () => {
    const navigate = useNavigate();
    const { openPreview } = usePDFPreview();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;

    const [itemsPerPage,  setItemsPerPage]  = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy,        setSortBy]        = useState<string>('created_at');

    const initialQueryParams = {
        page:               1,
        limit:              itemsPerPage,
        search:             '',
        status:             '',
        validity_date_from: '',
        validity_date_to:   '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData , isLoading: listDataLoading } =
        useSalesQuotationIndex(queryParams);

    const data           = listData?.data      ?? [];
    const paginationData = listData?.pagination;

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    const handlePreview = (row: any) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.sales_quotation.replace(':id', row.id)}`;
        openPreview(url, `Sales Quotation - #${row.code}`, true);
    };

    const columns = useMemo(() => {
        return buildColumns([
            {
                key:    'code',
                header: 'Code',
                meta:   { sortable: true, sortParam: 'code', fontWeight: 'bold' },
            },
            {
                key:    'sales_log.code',
                header: 'SEL No',
                meta:   { fontWeight: 'semibold' },
            },
            {
                key:    'sales_log.cust_rfq_no',
                header: 'RFQ No',
            },
            {
                key:    'sales_log.customer.business_name',
                header: 'Customer',
            },
            {
                key:    'total_items',
                header: 'Items',
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
                        {row.sales_log?.currency?.code ?? ''}{' '}
                        {Number(row.total_value ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>
                ),
            },
            {
                key:    'expiry_date',
                header: 'Expire Date',
                meta:   { sortable: true, sortParam: 'expiry_date' },
                render: (row: any) =>
                    row.expiry_date ? dayjs(row.expiry_date).format('DD-MMM-YYYY') : '—',
            },
            
            {
                key:     'actions',
                header:  'Actions',
                type:    'actions',
                actions: [
                    {
                        label:   'Preview',
                        icon:    <BiSolidFilePdf />,
                        onClick: (row: any) => handlePreview(row),
                    },
                    ...(canUpdate ? [{
                        label:   'Edit',
                        icon:    <BiEdit />,
                        onClick: (row: any) => navigate(`/sales-management/quotation/form/${row.id}`),
                    }] : []),
                ],
            },
        ] as DynamicColumn<any>[], { showSerial: true });
    }, [canUpdate]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Header ── */}
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Sales Quotations</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary" icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/sales-management/quotation/form')}
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
                                    placeholder="Search code, RFQ no..."
                                    onValueChange={(v) => updateFilter('search', v ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />
                                <FieldDayPicker
                                    name="validity_date_from" placeholder="Validity From"
                                    size="sm" onValueChange={(v) => updateFilter('validity_date_from', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="validity_date_to" placeholder="Validity To"
                                    size="sm" onValueChange={(v) => updateFilter('validity_date_to', v ?? '')}
                                />
                            </Stack>
                            <Stack align="center" mt={4}>
                                <Button variant="@primary" size="sm" leftIcon={<HiRefresh />}
                                    onClick={() => {
                                        form.reset();
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
                    <HStack bg="white" justify="space-between" p={4} borderTopRadius={4}>
                        <Heading as="h4" size="sm">Sales Quotations</Heading>
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
                        title="Sales Quotations"
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

export default SalesQuotationMaster;