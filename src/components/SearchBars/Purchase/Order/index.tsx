import { useMemo, useState, useEffect } from 'react';
import { BiEdit, BiSolidFilePdf } from 'react-icons/bi';
import { LuCheck, LuX } from 'react-icons/lu';
import {
    Box, Button, HStack, Icon, IconButton, Stack, Tag, TagCloseButton, TagLabel, Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { usePurchaseOrderIndex, usePurchaseOrderDropdowns } from '@/services/purchase/order/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import LoadingOverlay from '@/components/LoadingOverlay';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageModeProps = {
    mode: 'page';
    canUpdate?: boolean;
    canDelete?: boolean;
    canView?: boolean;
    onSelect?: never;
};

type ModalModeProps = {
    mode: 'modal';
    initialSelectedId?: any;
    onApply: (selectedId: any) => void;
    onClear?: () => void;
};

type Props = PageModeProps | ModalModeProps;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: 'true', label: 'Closed' },
    { value: 'false', label: 'Open' },
];

const INITIAL_QUERY = {
    page: 1, limit: 10,
    search: '', priority_id: '',
    is_closed: '', customer_id: '',
};

// ─── Sub-component: Filter Panel ──────────────────────────────────────────────

type FilterPanelProps = {
    form: ReturnType<typeof useForm>;
    formKey: number;
    priorityOptions: any[];
    customerOptions: any[];
    dropdownLoading: boolean;
    isModal: boolean;
    onFilter: (key: string, value: any) => void;
    onReset: () => void;
};

const FilterPanel = ({
    form, formKey, priorityOptions, customerOptions, dropdownLoading, isModal, onFilter, onReset,
}: FilterPanelProps) => (
    <Formiz autoForm connect={form}>
        {isModal ? (
            // ── Modal: vertical sidebar ────────────────────────────────────────────
            <Stack
                spacing={4}
                direction="column"
                w="100%"
                p={4}
                bg="white"
                rounded="md"
                border="1px solid"
                borderColor="gray.300"
            >
                <FieldInput
                    name="keyword"
                    label="Search"
                    placeholder="Search..."
                    onValueChange={(v) => onFilter('search', v ?? '')}
                    size="sm"
                />
                <FieldSelect
                    key={`priority_${formKey}`}
                    name="priority_id"
                    label="Priority"
                    placeholder="Select..."
                    options={priorityOptions}
                    selectProps={{ isLoading: dropdownLoading }}
                    onValueChange={(v) => onFilter('priority_id', v)}
                    isClearable
                    size="sm"
                />
                <FieldSelect
                    key={`customer_${formKey}`}
                    name="customer_id"
                    label="Customer"
                    placeholder="Select..."
                    options={customerOptions}
                    selectProps={{ isLoading: dropdownLoading }}
                    onValueChange={(v) => onFilter('customer_id', v)}
                    isClearable
                    size="sm"
                />
                <FieldSelect
                    key={`is_closed_${formKey}`}
                    name="is_closed"
                    label="Status"
                    placeholder="Select"
                    options={STATUS_OPTIONS}
                    onValueChange={(v) => onFilter('is_closed', v)}
                    isClearable
                    size="sm"
                />
                <Button
                    variant="@primary"
                    size="sm"
                    leftIcon={<HiRefresh />}
                    onClick={onReset}
                    w="full"
                    mt={2}
                >
                    Reset Form
                </Button>
            </Stack>
        ) : (
            // ── Page: 2-row grid + centred reset ──────────────────────────────────
            <Box bg="white">
                <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={4} mb={4}>
                    <FieldInput
                        name="keyword"
                        placeholder="Search"
                        onValueChange={(v) => onFilter('search', v ?? '')}
                        rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                        size="sm"
                    />
                    <FieldSelect
                        key={`priority_${formKey}`}
                        name="priority_id"
                        placeholder="Priority"
                        options={priorityOptions}
                        selectProps={{ isLoading: dropdownLoading }}
                        onValueChange={(v) => onFilter('priority_id', v)}
                        isClearable
                        size="sm"
                    />
                    <FieldSelect
                        key={`customer_${formKey}`}
                        name="customer_id"
                        placeholder="Customer"
                        options={customerOptions}
                        selectProps={{ isLoading: dropdownLoading }}
                        onValueChange={(v) => onFilter('customer_id', v)}
                        isClearable
                        size="sm"
                    />
                </Box>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={4} mb={4}>
                    <FieldSelect
                        key={`is_closed_${formKey}`}
                        name="is_closed"
                        placeholder="Status"
                        options={STATUS_OPTIONS}
                        onValueChange={(v) => onFilter('is_closed', v)}
                        isClearable
                        size="sm"
                    />
                </Box>
                <Box display="flex" justifyContent="center">
                    <Button variant="@primary" size="sm" leftIcon={<HiRefresh />} onClick={onReset}>
                        Reset Form
                    </Button>
                </Box>
            </Box>
        )}
    </Formiz>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PurchaseOrderSearch = (props: Props) => {
    const { mode } = props;
    const isModal = mode === 'modal';

    const navigate = useNavigate();
    const { openPreview } = usePDFPreview();

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } =
        usePurchaseOrderDropdowns();
    const priorityOptions = dropdownData?.priorities ?? [];
    const customerOptions = dropdownData?.customers ?? [];

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState('created_at');
    const [formKey, setFormKey] = useState(0);
    const [queryParams, setQueryParams] = useState<any>(INITIAL_QUERY);
    const form = useForm();

    // ── Single-select state ────────────────────────────────────────────────────
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
        usePurchaseOrderIndex(queryParams);

    const allLoaded = dropdownsFetched && listFetched;
    const data = listData?.data ?? [];
    const paginationData = listData?.pagination;

    // ── Seed initial selection ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isModal) return;
        const init = (props as ModalModeProps).initialSelectedId;
        if (!init) return;
        const id = String(init);
        setSelectedId(id);
        if (data.length > 0) {
            const match = data.find((row: any) => String(row.id) === id);
            setSelectedToken(match?.token ? String(match.token) : id);
        } else {
            setSelectedToken(id);
        }
    }, [isModal, (props as ModalModeProps).initialSelectedId]);

    // ── Correct token once data loads ─────────────────────────────────────────
    useEffect(() => {
        if (!isModal || !selectedId || !data.length) return;
        const match = data.find((row: any) => String(row.id) === selectedId);
        if (match?.token) setSelectedToken(String(match.token));
    }, [data]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const handleReset = () => {
        form.reset();
        setFormKey((k) => k + 1);
        setQueryParams(INITIAL_QUERY);
    };

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    const handleOpenPreview = (row: any) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.purchase_order.replace(':id', row.id)}`;
        openPreview(url, `Purchase Order Preview - #${row.code}${row.version && row.version > 0 ? 'R' + row.version : ''}`, true);
    };

    const handleToggleSelect = (row: any) => {
        const id = String(row.id);
        const token = String(row.token ?? row.id);
        if (selectedId === id) {
            setSelectedId(null);
            setSelectedToken(null);
        } else {
            setSelectedId(id);
            setSelectedToken(token);
        }
    };

    const handleClear = () => {
        setSelectedId(null);
        setSelectedToken(null);
        (props as ModalModeProps).onClear?.();
    };

    const handleApply = () => {
        if (isModal) (props as ModalModeProps).onApply(selectedId);
    };

    // ── Columns ───────────────────────────────────────────────────────────────

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];

        const baseColumns: DynamicColumn<any>[] = [
            {
                key: 'code',
                header: 'PO No.',
                meta: { sortable: true, sortParam: 'code', fontWeight: 'bold' },
                render: (info: any) => <Text fontWeight={'bold'}>{info.code}{info.version && info.version > 0 ? 'R' + info.version : ''}</Text>,
            },
            {
                key: 'customer.business_name',
                header: 'Customer',
                meta: { sortable: true, sortParam: 'customer_id' },
            },
            {
                key: 'priority.name',
                header: 'Priority',
                meta: { sortable: true, sortParam: 'priority_id' },
            },
            { key: 'total_items', header: 'Tot Items' },
            { key: 'total_qty', header: 'Total Qty' },
            { key: 'total_open', header: 'Open Items' },
            { key: 'total_closed', header: 'Closed Items' },
            {
                key: 'total_value',
                header: 'Total Value',
                render: (row: any) =>
                    row.total_value != null
                        ? Number(row.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '-',
            },
            {
                key: 'is_closed',
                header: 'Status',
                render: (row: any) => (
                    <Tag
                        size="sm"
                        borderRadius="full"
                        variant="solid"
                        colorScheme={row.is_closed ? 'red' : 'green'}
                    >
                        {row.is_closed ? 'Closed' : 'Open'}
                    </Tag>
                ),
            },
            {
                key: 'actions',
                header: isModal ? 'Select' : 'Actions',
                ...(isModal
                    ? {
                        render: (row: any) => {
                            const isSelected = selectedId === String(row.id);
                            return (
                                <IconButton
                                    aria-label={isSelected ? 'Deselect Purchase Order' : 'Select Purchase Order'}
                                    colorScheme={isSelected ? 'red' : 'green'}
                                    icon={isSelected ? <LuX /> : <LuCheck />}
                                    size="xs"
                                    onClick={() => handleToggleSelect(row)}
                                />
                            );
                        },
                    }
                    : {
                        type: 'actions' as const,
                        actions: [
                            ...(props.canUpdate ? [{
                                label: 'Edit',
                                icon: <BiEdit />,
                                isDisabled: (row: any) => !!row.has_pending_request || !!row.is_closed || !row.is_editable,
                                onClick: (row: any) => {
                                    const hasQuotations = Array.isArray(row.prfq_ids) && row.prfq_ids.length > 0;
                                    navigate(hasQuotations
                                        ? `/purchase/order/quote-form/${row.id}`
                                        : `/purchase/order/form/${row.id}`
                                    );
                                },
                                disabledTooltip: (row: any) =>
                                    row.is_closed ? 'Purchase Order is closed'
                                        : !row.is_editable ? 'Purchase Order is not editable'
                                            : row.pending_request_message,
                            }] : []),
                            {
                                label: 'Preview',
                                icon: <BiSolidFilePdf />,
                                onClick: handleOpenPreview,
                            },
                        ],
                    }),
            },
        ];

        return buildColumns(baseColumns, { showSerial: true });
    }, [dropdownsFetched, isModal, selectedId, mode === 'page' && (props as PageModeProps).canUpdate]);

    // ── Table block ───────────────────────────────────────────────────────────

    const tableBlock = (
        <Box
            w="100%"
            rounded="md"
            border={isModal ? '1px solid' : 'none'}
            borderColor="gray.300"
            p={isModal ? 4 : 0}
            overflowX="auto"
        >
            <LoadingOverlay isLoading={!allLoaded}>
                <DataTable
                    columns={columns}
                    data={data}
                    loading={!allLoaded || dropdownLoading || listDataLoading}
                    title="Purchase Orders"
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
                    onPageChange={(page) => setQueryParams((prev: any) => ({ ...prev, page }))}
                    onPageSizeChange={(limit) => {
                        setItemsPerPage(limit);
                        setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
                    }}
                />
            </LoadingOverlay>

            {/* Bottom bar — modal only */}
            {isModal && (
                <HStack justify="space-between" align="center" mt={3} spacing={4}>
                    <HStack spacing={2} flex={1}>
                        {selectedId && selectedToken && (
                            <>
                                <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap">
                                    Selected PO:
                                </Text>
                                <Tag size="md" borderRadius="full" variant="solid" colorScheme="green">
                                    <TagLabel>{selectedToken}</TagLabel>
                                    <TagCloseButton onClick={handleClear} />
                                </Tag>
                            </>
                        )}
                    </HStack>
                    <HStack spacing={3} flexShrink={0}>
                        <Button size="sm" colorScheme="red" isDisabled={!selectedId} onClick={handleClear}>
                            Clear
                        </Button>
                        <Button size="sm" colorScheme="green" isDisabled={!selectedId} onClick={handleApply}>
                            Apply
                        </Button>
                    </HStack>
                </HStack>
            )}
        </Box>
    );

    const filterPanel = (
        <FilterPanel
            form={form}
            formKey={formKey}
            priorityOptions={priorityOptions}
            customerOptions={customerOptions}
            dropdownLoading={dropdownLoading}
            isModal={isModal}
            onFilter={updateFilter}
            onReset={handleReset}
        />
    );

    // ── Layout ────────────────────────────────────────────────────────────────

    if (isModal) {
        return (
            <Box display="flex" flexDirection="row" alignItems="flex-start" gap={4} w="100%">
                <Box flexShrink={0} w="300px">
                    {filterPanel}
                </Box>
                <Box flex="1" minW={0} overflow="hidden">
                    {tableBlock}
                </Box>
            </Box>
        );
    }

    return (
        <Stack spacing={4}>
            <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                <Box bg="white" p={6} borderRadius={4} mt={2}>
                    {filterPanel}
                </Box>
            </Box>
            {tableBlock}
        </Stack>
    );
};

export default PurchaseOrderSearch;