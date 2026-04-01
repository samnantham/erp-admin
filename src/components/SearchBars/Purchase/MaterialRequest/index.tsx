// components/ReUsable/MaterialRequestSearch.tsx

import { useMemo, useState, useEffect } from 'react';
import { BiEdit, BiSolidFilePdf } from 'react-icons/bi';
import { LuCheck, LuX } from 'react-icons/lu';
import {
  Box, Button, HStack, Icon, IconButton, Stack,
  Tag, TagCloseButton, TagLabel, Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { DataTable } from '@/components/DataTable';
import LoadingOverlay from '@/components/LoadingOverlay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useMaterialRequestIndex, useMaterialRequestDropdowns } from '@/services/purchase/material-request/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageModeProps = {
  mode: 'page';
  canUpdate?: boolean;
  canView?: boolean;
};

type ModalModeProps = {
  mode: 'modal';
  initialSelectedIds?: string[];
  onApply: (selectedIds: string[]) => void;
  onClear?: () => void;
};

type Props = PageModeProps | ModalModeProps;

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'sel', label: 'Sales' },
  { value: 'wo', label: 'Work Order' },
  { value: 'oe', label: 'Open Enquiry' },
];

const STATUS_OPTIONS = [
  { value: 'true', label: 'Closed' },
  { value: 'false', label: 'Open' },
];

const INITIAL_QUERY = {
  page: 1, limit: 10,
  search: '', priority_id: '', type: '',
  is_closed: '', due_date_from: '', due_date_to: '',
};

// ─── Sub-component: Filter panel ──────────────────────────────────────────────

type FilterPanelProps = {
  form: ReturnType<typeof useForm>;
  formKey: number;
  priorityOptions: any[];
  dropdownLoading: boolean;
  isModal: boolean;
  onFilter: (key: string, value: any) => void;
  onReset: () => void;
};

const FilterPanel = ({
  form, formKey, priorityOptions, dropdownLoading, isModal, onFilter, onReset,
}: FilterPanelProps) => (
  <Formiz autoForm connect={form}>
    {isModal ? (
      // ── Modal: vertical sidebar column ──────────────────────────────────
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
          label="MR No"
          placeholder="Search..."
          onValueChange={(v) => onFilter('search', v ?? '')}
          size="sm"
        />
        <FieldSelect
          key={`type_${formKey}`}
          name="type"
          label="MR Type"
          placeholder="Select"
          options={TYPE_OPTIONS}
          onValueChange={(v) => onFilter('type', v)}
          isClearable
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
          key={`is_closed_${formKey}`}
          name="is_closed"
          label="Status"
          placeholder="Select"
          options={STATUS_OPTIONS}
          onValueChange={(v) => onFilter('is_closed', v)}
          isClearable
          size="sm"
        />
        <FieldDayPicker
          name="due_date_from"
          label="Date Range"
          placeholder="From date"
          size="sm"
          onValueChange={(v) => onFilter('due_date_from', v ?? '')}
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
      // ── Page: 2-row 3-column grid + centred reset button ────────────────
      <Box bg="white">
        {/* Row 1: Search Code | MR Type | Priority */}
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={4} mb={4}>
          <FieldInput
            name="keyword"
            placeholder="Search Code"
            onValueChange={(v) => onFilter('search', v ?? '')}
            rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
            size="sm"
          />
          <FieldSelect
            key={`type_${formKey}`}
            name="type"
            placeholder="MR Type"
            options={TYPE_OPTIONS}
            onValueChange={(v) => onFilter('type', v)}
            isClearable
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
        </Box>

        {/* Row 2: Status | Due Date From | Due Date To */}
        <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={4} mb={4}>
          <FieldSelect
            key={`is_closed_${formKey}`}
            name="is_closed"
            placeholder="Status"
            options={STATUS_OPTIONS}
            onValueChange={(v) => onFilter('is_closed', v)}
            isClearable
            size="sm"
          />
          <FieldDayPicker
            name="due_date_from"
            placeholder="Due Date From"
            size="sm"
            onValueChange={(v) => onFilter('due_date_from', v ?? '')}
          />
          <FieldDayPicker
            name="due_date_to"
            placeholder="Due Date To"
            size="sm"
            onValueChange={(v) => onFilter('due_date_to', v ?? '')}
          />
        </Box>

        {/* Reset button — centred below both rows */}
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

export const MaterialRequestSearch = (props: Props) => {
  const { mode } = props;
  const isModal = mode === 'modal';

  const navigate = useNavigate();
  const { openPreview } = usePDFPreview();

  const {
    data: dropdownData,
    isLoading: dropdownLoading,
    isSuccess: dropdownsFetched,
  } = useMaterialRequestDropdowns();
  const priorityOptions = dropdownData?.priorities ?? [];

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState('created_at');
  const [formKey, setFormKey] = useState(0);
  const [queryParams, setQueryParams] = useState<any>(INITIAL_QUERY);
  const form = useForm();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Tracks id → code so tags display the human-readable MR code
  const [selectedItems, setSelectedItems] = useState<{ id: string; code: string }[]>([]);

  useEffect(() => {
    if (isModal && (props as ModalModeProps).initialSelectedIds?.length) {
      const ids = ((props as ModalModeProps).initialSelectedIds ?? []).map(String);
      setSelectedIds(ids);
      // codes will be filled properly on toggle; fall back to id for pre-selected
      setSelectedItems(ids.map((id) => ({ id, code: id })));
    }
  }, [isModal, (props as ModalModeProps).initialSelectedIds]);

  const {
    data: listData,
    isSuccess: listFetched,
    isLoading: listDataLoading,
  } = useMaterialRequestIndex(queryParams);

  const allLoaded = dropdownsFetched && listFetched;
  const data = listData?.data ?? [];
  const paginationData = listData?.pagination;

  // ── Handlers ────────────────────────────────────────────────────────────────

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
    const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.material_request.replace(':id', row.id)}`;
    openPreview(url, `MR Preview - #${row.code}`, true);
  };

  const handleToggleSelect = (row: any) => {
    const id = String(row.id);
    const code = String(row.code ?? row.id);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setSelectedItems((prev) =>
      prev.some((item) => item.id === id)
        ? prev.filter((item) => item.id !== id)
        : [...prev, { id, code }]
    );
  };

  const handleRemoveTag = (id: string) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleApply = () => {
    if (isModal) (props as ModalModeProps).onApply(selectedIds);
  };

  const handleClear = () => {
    setSelectedIds([]);
    setSelectedItems([]);
    (props as ModalModeProps).onClear?.();
  };

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns = useMemo(() => {
    if (!dropdownsFetched) return [];

    const baseColumns: DynamicColumn<any>[] = [
      { key: 'code', header: 'ID', meta: { sortable: true, sortParam: 'code' } },
      { key: 'type_label', header: 'Type', meta: { sortable: true, sortParam: 'type' } },
      {
        key: 'due_date',
        header: 'Due Date',
        meta: { sortable: true, sortParam: 'due_date' },
        render: (row: any) => row.due_date ? dayjs(row.due_date).format('DD-MMM-YYYY') : '-',
      },
      { key: 'priority.name', header: 'Priority', meta: { sortable: true, sortParam: 'priority_id' } },
      { key: 'total_items', header: 'Tot Items' },
      { key: 'total_qty', header: 'Total Qty' },
      { key: 'total_open', header: 'Open Items' },
      { key: 'total_closed', header: 'Closed Items' },
      {
        key: 'actions',
        header: isModal ? 'Select' : 'Actions',
        ...(isModal
          ? {
            render: (row: any) => {
              const isSelected = selectedIds.includes(String(row.id));
              return (
                <IconButton
                  aria-label="Select MR"
                  colorScheme={isSelected ? 'red' : 'green'}
                  icon={isSelected ? <LuX /> : <LuCheck />}
                  size={'xs'}
                  onClick={() => handleToggleSelect(row)}
                />
              );
            },
          }
          : {
            type: 'actions' as const,
            actions: [
              ...(mode === 'page' && (props as PageModeProps).canUpdate
                ? [{
                  label: 'Edit',
                  icon: <BiEdit />,
                  isDisabled: (row: any) => !!row.has_pending_request || !!row.is_closed,
                  onClick: (row: any) => navigate(`/purchase/material-request/form/${row.id}`),
                  disabledTooltip: (row: any) =>
                    row.is_closed ? 'Material request is closed' : row.pending_request_message,
                }]
                : []),
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
  }, [dropdownsFetched, isModal, selectedIds, mode === 'page' && (props as PageModeProps).canUpdate]);

  // ── Table + actions block ─────────────────────────────────────────────────

  const tableBlock = (
    <Box w="100%" rounded="md" border={mode === 'modal' ? "1px solid" : "none"} borderColor="gray.300" p={mode === 'modal' ? 4: 0} overflowX="auto">
      <LoadingOverlay isLoading={!allLoaded}>
        <DataTable
          columns={columns}
          data={data}
          loading={!allLoaded || dropdownLoading || listDataLoading}
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
          onPageChange={(page) => setQueryParams((prev: any) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => {
            setItemsPerPage(limit);
            setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
          }}
        />
      </LoadingOverlay>

      {/* Bottom bar: selected tags (left) + Apply/Clear buttons (right) — modal only */}
      {isModal && (
        <HStack justify="space-between" align="flex-start" mt={3} spacing={4}>
          {/* Selected MR tags */}
          <HStack flexWrap="wrap" spacing={2} align="center" flex={1}>
            {selectedItems.length > 0 && (
              <>
                <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap">
                  Selected MRs:
                </Text>
                {selectedItems.map(({ id, code }) => (
                  <Tag key={id} size="md" borderRadius="full" variant="solid" colorScheme="green">
                    <TagLabel>{code}</TagLabel>
                    <TagCloseButton onClick={() => handleRemoveTag(id)} />
                  </Tag>
                ))}
              </>
            )}
          </HStack>

          {/* Action buttons */}
          <HStack spacing={3} flexShrink={0}>
            <Button
              size="sm"
              colorScheme="red"
              isDisabled={selectedIds.length === 0}
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              colorScheme="green"
              isDisabled={selectedIds.length === 0}
              onClick={handleApply}
            >
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