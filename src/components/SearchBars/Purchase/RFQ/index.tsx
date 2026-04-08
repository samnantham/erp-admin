// components/SearchBars/Purchase/PRFQ.tsx

import { useMemo, useState, useEffect } from 'react';
import { BiEdit, BiSolidFilePdf } from 'react-icons/bi';
import { LuCheck, LuX } from 'react-icons/lu';
import {
  Box, Button, HStack, Icon, IconButton, Stack, Tag, TagCloseButton, TagLabel, Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch, HiEye } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { FaCodeCompare } from 'react-icons/fa6';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { usePRFQIndex, usePRFQDropdowns } from '@/services/purchase/rfq/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { PRFQVendorsPopup } from '@/components/Popups/PRFQCustomers';
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
  is_closed: '', need_by_date_from: '', need_by_date_to: '',
};

// ─── Sub-component: Filter Panel ──────────────────────────────────────────────

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
          name="need_by_date_from"
          label="Date Range"
          placeholder="From date"
          size="sm"
          onValueChange={(v) => onFilter('need_by_date_from', v ?? '')}
        />
        <FieldDayPicker
          name="need_by_date_to"
          placeholder="To date"
          size="sm"
          onValueChange={(v) => onFilter('need_by_date_to', v ?? '')}
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
            key={`is_closed_${formKey}`}
            name="is_closed"
            placeholder="Status"
            options={STATUS_OPTIONS}
            onValueChange={(v) => onFilter('is_closed', v)}
            isClearable
            size="sm"
          />
        </Box>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={4} mb={4}>
          <FieldDayPicker
            name="need_by_date_from"
            placeholder="Need By Date From"
            size="sm"
            onValueChange={(v) => onFilter('need_by_date_from', v ?? '')}
          />
          <FieldDayPicker
            name="need_by_date_to"
            placeholder="Need By Date To"
            size="sm"
            onValueChange={(v) => onFilter('need_by_date_to', v ?? '')}
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

export const PRFQSearch = (props: Props) => {
  const { mode } = props;
  const isModal = mode === 'modal';

  const navigate = useNavigate();
  const { openPreview } = usePDFPreview();

  const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } =
    usePRFQDropdowns();
  const priorityOptions = dropdownData?.priorities ?? [];

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy] = useState('created_at');
  const [formKey, setFormKey] = useState(0);
  const [queryParams, setQueryParams] = useState<any>(INITIAL_QUERY);
  const form = useForm();

  // ── Single-select state ────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // ── Vendor popup state ─────────────────────────────────────────────────────
  const [vendorModalRow, setVendorModalRow] = useState<any>(null);

  const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
    usePRFQIndex(queryParams);

  const allLoaded = dropdownsFetched && listFetched;
  const data = listData?.data ?? [];
  const paginationData = listData?.pagination;

  // Replace the existing seed useEffect:
  useEffect(() => {
    if (!isModal) return;
    const init = (props as ModalModeProps).initialSelectedId;
    if (!init) return;
    const id = String(init);
    setSelectedId(id);

    // Try to resolve code from already-loaded table data
    if (data.length > 0) {
      const match = data.find((row: any) => String(row.id) === id);
      setSelectedCode(match?.code ? String(match.code) : id);
    } else {
      // Placeholder until data loads
      setSelectedCode(id);
    }
  }, [isModal, (props as ModalModeProps).initialSelectedId]);

  // Add a second effect to correct the code once data loads:
  useEffect(() => {
    if (!isModal || !selectedId || !data.length) return;
    const match = data.find((row: any) => String(row.id) === selectedId);
    if (match?.code) setSelectedCode(String(match.code));
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
    const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.prfq.replace(':id', row.id)}`;
    openPreview(url, `PRFQ Preview - #${row.code}`, true);
  };

  const handleToggleSelect = (row: any) => {
    const id = String(row.id);
    const code = String(row.code ?? row.id);
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedCode(null);
    } else {
      setSelectedId(id);
      setSelectedCode(code);
    }
  };

  const handleClear = () => {
    setSelectedId(null);
    setSelectedCode(null);
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
        header: 'ID',
        meta: { sortable: true, sortParam: 'code' , fontWeight: 'bold'},
      },
      {
        key: 'total_vendors',
        header: 'Vendors',
        render: (row: any) => (
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<HiEye />}
            onClick={() => setVendorModalRow(row)}
          >
            View{row.total_vendors !== 1 ? 's' : ''} ({row.total_vendors ?? 0})
          </Button>
        ),
      },
      {
        key: 'need_by_date',
        header: 'Need By Date',
        meta: { sortable: true, sortParam: 'need_by_date' },
        render: (row: any) => row.need_by_date ? dayjs(row.need_by_date).format('DD-MMM-YYYY') : '-',
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
              const isSelected = selectedId === String(row.id);
              return (
                <IconButton
                  aria-label={isSelected ? 'Deselect PRFQ' : 'Select PRFQ'}
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
                isDisabled: (row: any) => !!row.has_pending_request || !!row.is_closed,
                onClick: (row: any) => navigate(`/purchase/rfq/form/${row.id}`),
                disabledTooltip: (row: any) =>
                  row.is_closed ? 'PRFQ is closed' : row.pending_request_message,
              }] : []),
              {
                                  label: 'Compare',
                                  icon: <FaCodeCompare />,
                                  isDisabled: (row: any) =>
                                    !!row.has_pending_request || !!row.is_closed,
                                  onClick: (row: any) =>
                                    navigate(
                                      `/purchase/supplier-pricing-update/compare-quotations/${row.id}`
                                    ),
                                  disabledTooltip: (row: any) =>
                                    row.is_closed
                                      ? 'Quotation is closed'
                                      : row.pending_request_message,
                                },
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
          title="PRFQs"
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
            {selectedId && selectedCode && (
              <>
                <Text fontWeight="bold" fontSize="sm" whiteSpace="nowrap">
                  Selected PRFQ:
                </Text>
                <Tag size="md" borderRadius="full" variant="solid" colorScheme="green">
                  <TagLabel>{selectedCode}</TagLabel>
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
      dropdownLoading={dropdownLoading}
      isModal={isModal}
      onFilter={updateFilter}
      onReset={handleReset}
    />
  );

  // ── Layout ────────────────────────────────────────────────────────────────

  if (isModal) {
    return (
      <>
        <Box display="flex" flexDirection="row" alignItems="flex-start" gap={4} w="100%">
          <Box flexShrink={0} w="300px">
            {filterPanel}
          </Box>
          <Box flex="1" minW={0} overflow="hidden">
            {tableBlock}
          </Box>
        </Box>

        {vendorModalRow && (
          <PRFQVendorsPopup
            isOpen={!!vendorModalRow}
            onClose={() => setVendorModalRow(null)}
            prfqId={String(vendorModalRow.id)}
            prfqCode={vendorModalRow.code}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Stack spacing={4}>
        <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
          <Box bg="white" p={6} borderRadius={4} mt={2}>
            {filterPanel}
          </Box>
        </Box>
        {tableBlock}
      </Stack>

      {vendorModalRow && (
        <PRFQVendorsPopup
          isOpen={!!vendorModalRow}
          onClose={() => setVendorModalRow(null)}
          prfqId={String(vendorModalRow.id)}
          prfqCode={vendorModalRow.code}
        />
      )}
    </>
  );
};

export default PRFQSearch;