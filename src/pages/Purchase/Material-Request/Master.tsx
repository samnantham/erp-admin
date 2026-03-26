import { useMemo, useState } from 'react';
import { BiEdit, BiSolidFilePdf } from 'react-icons/bi';
import {
    Box, Button, HStack, Heading, Stack, Icon,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { LuPlus } from 'react-icons/lu';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingOverlay from '@/components/LoadingOverlay';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import { useMaterialRequestIndex, useMaterialRequestDropdowns } from '@/services/purchase/material-request/service';
import { usePDFPreview } from "@/context/PDFPreviewContext";
import { endPoints } from '@/api/endpoints';


import dayjs from 'dayjs';

export const MaterialRequestMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;
    const canDelete = otherPermissions.update === 1;
    const canView = otherPermissions.view === 1;
    const location = useLocation();
    const state = location.state as { type?: string } | null;

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } = useMaterialRequestDropdowns();
    const priorityOptions = dropdownData?.priorities ?? [];

    const typeOptions = [
        { value: "sel", label: "Sales" },
        { value: "wo", label: "Work Order" },
        { value: "oe", label: "Open Enquiry" },
    ];

    const { openPreview } = usePDFPreview();

    const handleOpenPreview = (itemInfo: any) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.material_request.replace(":id", itemInfo.id)}`;
        openPreview(url, `MR Preview - #${itemInfo.code}`, true);
    };

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [formKey, setFormKey] = useState(0);

    const initialQueryParams = {
        page: 1,
        limit: itemsPerPage,
        search: '',
        priority_id: '',
        type: '',
        sales_log_id: '',
        is_closed: '',
        due_date_from: '',
        due_date_to: '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
        useMaterialRequestIndex(queryParams);

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
            { key: 'code', header: 'ID', meta: { sortable: true, sortParam: 'code' } },
            { key: 'type_label', header: 'Type', meta: { sortable: true, sortParam: 'type' } },
            {
                key: 'due_date',
                header: 'Due Date',
                meta: { sortable: true, sortParam: 'due_date' },
                render: (row: any) =>
                    row.due_date ? dayjs(row.due_date).format('DD-MMM-YYYY') : '-',
            },
            { key: 'priority.name', header: 'Priority', meta: { sortable: true, sortParam: 'priority_id' } },
            { key: 'total_items', header: 'Tot Items' },
            { key: 'total_qty', header: 'Total Qty' },
            { key: 'total_open', header: 'Open Items' },
            { key: 'total_closed', header: 'Closed Items' },
            {
                key: 'actions',
                header: 'Actions',
                type: 'actions',
                actions: [
                    ...(canUpdate ? [{
                        label: 'Edit',
                        icon: <BiEdit />,
                        isDisabled: (row: any) => !!row.has_pending_request || !!row.is_closed,
                        onClick: (row: any) => navigate(`/purchase/material-request/form/${row.id}`),
                        disabledTooltip: (row: any) =>
                            row.is_closed ? 'Material request is closed' : row.pending_request_message,
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
                    <Heading as="h4" size="md">Material Request</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/purchase/material-request/form', {
                                state: state?.type ? { type: state.type } : undefined,
                            })}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            {/* Filters */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                <FieldInput
                                    name="keyword"
                                    placeholder="Search Code"
                                    onValueChange={(value) => updateFilter('search', value ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />

                                <FieldSelect
                                    key={`type_${formKey}`}
                                    name="type"
                                    placeholder="MR Type"
                                    options={typeOptions}
                                    onValueChange={(v) => updateFilter('type', v)}
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
                                {/* <FieldSelect
                                    key={`sales_${formKey}`}
                                    name="sales_log_id"
                                    placeholder="Sales Log"
                                    options={salesLogOptions}
                                    onValueChange={(v) => updateFilter('sales_log_id', v)}
                                    isClearable
                                    size="sm"
                                /> */}
                            </Stack>

                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
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

                <LoadingOverlay isLoading={!allApiDataLoaded}>
                    <Box borderRadius={4}>
                        <DataTable
                            columns={columns}
                            data={data}
                            loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                            title="Material Requests"
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
                </LoadingOverlay>
            </Stack>
        </SlideIn>
    )
};

export default MaterialRequestMaster;
