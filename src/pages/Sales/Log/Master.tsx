import { useMemo, useState } from 'react';
import { BiEdit, BiSolidFilePdf } from 'react-icons/bi';
import {
    Box, Button, HStack, Heading, Stack, Icon,
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
import { useSalesLogIndex, useSalesLogDropdowns } from '@/services/sales/sales-log/service';
import { usePDFPreview } from "@/context/PDFPreviewContext";
import { endPoints } from '@/api/endpoints';

import dayjs from 'dayjs';

export const SalesLogMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;
    const canDelete = otherPermissions.update === 1;
    const canView = otherPermissions.view === 1;

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } = useSalesLogDropdowns();
    const customerOptions = dropdownData?.customers ?? [];
    const modeOfReceiptOptions = dropdownData?.mode_of_receipts ?? [];
    const priorityOptions = dropdownData?.priorities ?? [];
    const currencyOptions = dropdownData?.currencies ?? [];

    const { openPreview } = usePDFPreview();

    const handleOpenPreview = (itemInfo: any) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.sales_log.replace(":id", itemInfo.id)}`;
        openPreview(url, `SEL Preview - #${itemInfo.code}`, true);
    };

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [formKey, setFormKey] = useState(0);

    const initialQueryParams = {
        page: 1,
        limit: itemsPerPage,
        search: '',
        customer_id: '',
        mode_of_receipt_id: '',
        priority_id: '',
        currency_id: '',
        is_closed: '',
        due_date_from: '',
        due_date_to: '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
        useSalesLogIndex(queryParams);

    const allApiDataLoaded = dropdownsFetched && listFetched;
    const data = listData?.data ?? [];
    const paginationData = listData?.pagination;


    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];

        const baseColumnConfig: DynamicColumn<any>[] = [
            { key: 'code', header: 'ID', meta: { sortable: true, sortParam: 'code', fontWeight: 'bold'} },
            { key: 'cust_rfq_no', header: 'RFQ No', meta: { sortable: true, sortParam: 'cust_rfq_no' } },
            {
                key: 'cust_rfq_date',
                header: 'RFQ Date',
                meta: { sortable: true, sortParam: 'cust_rfq_date' },
                render: (row: any) =>
                    row.cust_rfq_date
                        ? dayjs(row.cust_rfq_date).format('DD-MMM-YYYY')
                        : '-',
            },
            {
                key: 'due_date',
                header: 'Due Date',
                meta: { sortable: true, sortParam: 'due_date' },
                render: (row: any) =>
                    row.due_date
                        ? dayjs(row.due_date).format('DD-MMM-YYYY')
                        : '-',
            },
            { key: 'customer.business_name', header: 'Customer', meta: { sortable: true, sortParam: 'customer_id' } },
            { key: 'mode_of_receipt.name', header: 'Mode of Rec.', meta: { sortable: true, sortParam: 'mode_of_receipt_id' } },
            { key: 'priority.name', header: 'Priority', meta: { sortable: true, sortParam: 'priority_id' } },
            { key: 'currency.name', header: 'Currency', meta: { sortable: true, sortParam: 'currency_id' } },
            { key: 'total_items', header: 'Tot Items' },
            { key: 'total_qty', header: 'Total Qty' },
            { key: 'total_open', header: 'Open Items' },
            { key: 'total_closed', header: 'Closed Items' },
            // {
            //     key: 'is_closed',
            //     header: 'Status',
            //     render: (row: any) => (
            //         <Badge colorScheme={row.is_closed ? 'red' : 'green'} variant="solid" borderRadius="sm" fontSize="10px">
            //             {row.is_closed ? 'Closed' : 'Open'}
            //         </Badge>
            //     ),
            // },
            // {
            //     key: 'is_purchase_request_fulfilled',
            //     header: 'PR Status',
            //     render: (row: any) => (
            //         <Badge colorScheme={row.is_purchase_request_fulfilled ? 'green' : 'yellow'} variant="solid" borderRadius="sm" fontSize="10px">
            //             {row.is_purchase_request_fulfilled ? 'Fulfilled' : 'Pending'}
            //         </Badge>
            //     ),
            // },
            {
                key: 'actions',
                header: 'Actions',
                type: 'actions',
                actions: [
                    ...(canUpdate ? [{
                        label: 'Edit',
                        icon: <BiEdit />,
                        isDisabled: (row: any) => !!row.has_pending_request || !!row.is_closed,
                        onClick: (row: any) => navigate(`/sales-management/sales-log/form/${row.id}`),
                        disabledTooltip: (row: any) =>
                            row.is_closed ? 'Sales log is closed' : row.pending_request_message,
                    }] : []),
                    {
                        label: 'Preview',
                        icon: <BiSolidFilePdf />,
                        onClick: (row: any) => handleOpenPreview(row),
                    },
                ],
            },
        ];

        return buildColumns(baseColumnConfig, { showSerial: true });
    }, [dropdownsFetched, queryParams, canView, canUpdate, canDelete]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                <HStack justify="space-between">
                    <Heading as="h4" size="md">Sales Log</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/sales-management/sales-log/form')}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            {/* Row 1 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                <FieldInput
                                    name="keyword"
                                    placeholder="Search RFQ No."
                                    onValueChange={(value) => updateFilter('search', value ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`customer_${formKey}`}
                                    name="customer_id"
                                    placeholder="Customer"
                                    options={customerOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('customer_id', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`mode_${formKey}`}
                                    name="mode_of_receipt_id"
                                    placeholder="Mode of Receipt"
                                    options={modeOfReceiptOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('mode_of_receipt_id', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`priority_${formKey}`}
                                    name="priority_id"
                                    placeholder="Priority"
                                    options={priorityOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('priority_id', v)}
                                    isClearable
                                    size="sm"
                                />
                            </Stack>

                            {/* Row 2 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                <FieldSelect
                                    key={`currency_${formKey}`}
                                    name="currency_id"
                                    placeholder="Currency"
                                    options={currencyOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('currency_id', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`is_closed_${formKey}`}
                                    name="is_closed"
                                    placeholder="Status"
                                    options={[
                                        { value: 'true', label: 'Closed' },
                                        { value: 'false', label: 'Open' },
                                    ]}
                                    onValueChange={(v) => updateFilter('is_closed', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldDayPicker
                                    name="due_date_from"
                                    placeholder="Due Date From"
                                    size="sm"
                                    onValueChange={(v) => updateFilter('due_date_from', v ?? '')}
                                />
                                <FieldDayPicker
                                    name="due_date_to"
                                    placeholder="Due Date To"
                                    size="sm"
                                    onValueChange={(v) => updateFilter('due_date_to', v ?? '')}
                                />
                            </Stack>

                            {/* Reset */}
                            <Stack align="center" mt={6}>
                                <Button
                                    variant="@primary"
                                    size="sm"
                                    leftIcon={<HiRefresh />}
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

                <Box borderRadius={4}>
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                        title="Sales Logs"
                        enablePagination
                        enableClientSideSearch={false}
                        onSortChange={handleSortChange}
                        sortDirection={sortDirection}
                        sortBy={sortBy}
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={itemsPerPage}
                        stickyColumns={3}
                        stickyLastColumn={true}
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

export default SalesLogMaster;