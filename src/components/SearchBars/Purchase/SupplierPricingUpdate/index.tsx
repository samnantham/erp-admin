// components/SearchBars/Purchase/SupplierPricingUpdate.tsx

import { useMemo, useState, useEffect } from 'react';
import { BiEdit } from 'react-icons/bi';
import { LuCheck, LuX } from 'react-icons/lu';
import {
  Box, Button, HStack, Icon, IconButton, Stack, Tag, TagCloseButton, TagLabel, Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { usePurchaseQuotationIndex, usePurchaseQuotationDropdowns } from '@/services/purchase/quotation/service';
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
  initialSelectedId?: string;
  onApply: (selectedId: string | null) => void;
  onClear?: () => void;
};

type Props = PageModeProps | ModalModeProps;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'true',  label: 'Closed' },
  { value: 'false', label: 'Open' },
];

const INITIAL_QUERY = {
  page: 1, limit: 10,
  search: '',
  is_closed: '',
  vendor_quotation_date_from: '',
  vendor_quotation_date_to: '',
  expiry_date_from: '',
  expiry_date_to: '',
};

// ─── Sub-component: Filter Panel ──────────────────────────────────────────────

type FilterPanelProps = {
  form: ReturnType<typeof useForm>;
  formKey: number;
  currencyOptions: any[];
  dropdownLoading: boolean;
  isModal: boolean;
  onFilter: (key: string, value: any) => void;
  onReset: () => void;
};

const FilterPanel = ({
  form, formKey, currencyOptions, dropdownLoading, isModal, onFilter, onReset,
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
          key={`is_closed_${formKey}`}
          name="is_closed"
          label="Status"
          placeholder="Select"
          options={STATUS_OPTIONS}
          onValueChange={(v) => onFilter('is_closed', v)}
          isClearable
          size="sm"
        />
        <FieldSelect
          key={`currency_${formKey}`}
          name="currency_id"
          label="Currency"
          placeholder="Select..."
          options={currencyOptions}
          selectProps={{ isLoading: dropdownLoading }}
          onValueChange={(v) => onFilter('currency_id', v)}
          isClearable
          size="sm"
        />
        <FieldDayPicker
          name="vendor_quotation_date_from"
          label="Quotation Date Range"
          placeholder="From date"
          size="sm"
          onValueChange={(v) => onFilter('vendor_quotation_date_from', v ?? '')}
        />
        <FieldDayPicker
          name="vendor_quotation_date_to"
          placeholder="To date"
          size="sm"
          onValueChange={(v) => onFilter('vendor_quotation_date_to', v ?? '')}
        />
        <FieldDayPicker
          name="expiry_date_from"
          label="Expiry Date Range"
          placeholder="From date"
          size="sm"
          onValueChange={(v) => onFilter('expiry_date_from', v ?? '')}
        />
        <FieldDayPicker
          name="expiry_date_to"
          placeholder="To date"
          size="sm"
          onValueChange={(v) => onFilter('expiry_date_to', v ?? '')}
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
            key={`is_closed_${formKey}`}
            name="is_closed"
            placeholder="Status"
            options={STATUS_OPTIONS}
            onValueChange={(v) => onFilter('is_closed', v)}
            isClearable
            size="sm"
          />
          <FieldSelect
            key={`currency_${formKey}`}
            name="currency_id"
            placeholder="Currency"
            options={currencyOptions}
            selectProps={{ isLoading: dropdownLoading }}
            onValueChange={(v) => onFilter('currency_id', v)}
            isClearable
            size="sm"
          />
        </Box>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={4} mb={4}>
          <FieldDayPicker
            name="vendor_quotation_date_from"
            placeholder="Quotation Date From"
            size="sm"
            onValueChange={(v) => onFilter('vendor_quotation_date_from', v ?? '')}
          />
          <FieldDayPicker
            name="vendor_quotation_date_to"
            placeholder="Quotation Date To"
            size="sm"
            onValueChange={(v) => onFilter('vendor_quotation_date_to', v ?? '')}
          />
          <FieldDayPicker
            name="expiry_date_from"
            placeholder="Expiry Date From"
            size="sm"
            onValueChange={(v) => onFilter('expiry_date_from', v ?? '')}
          />
          <FieldDayPicker
            name="expiry_date_to"
            placeholder="Expiry Date To"
            size="sm"
            onValueChange={(v) => onFilter('expiry_date_to', v ?? '')}
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

export const SupplierPricingUpdateSearch = (props: Props) => {
  const { mode } = props;
  const isModal = mode === 'modal';

  const navigate = useNavigate();

  const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } =
    usePurchaseQuotationDropdowns();
  const currencyOptions = dropdownData?.currencies ?? [];

  const [itemsPerPage, setItemsPerPage]   = useState(10);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortBy, setSortBy]               = useState('created_at');
  const [formKey, setFormKey]             = useState(0);
  const [queryParams, setQueryParams]     = useState<any>(INITIAL_QUERY);
  const form = useForm();

  // ── Single-select state ────────────────────────────────────────────────────
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Seed from parent if provided
  useEffect(() => {
    if (isModal) {
      const init = (props as ModalModeProps).initialSelectedId;
      if (init) {
        setSelectedId(String(init));
        setSelectedCode(String(init));
      }
    }
  }, [isModal, (props as ModalModeProps).initialSelectedId]);

  const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
    usePurchaseQuotationIndex(queryParams);

  const allLoaded      = dropdownsFetched && listFetched;
  const data           = listData?.data ?? [];
  const paginationData = listData?.pagination;

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

  const handleToggleSelect = (row: any) => {
    const id   = String(row.id);
    const code = String(row.vendor_quotation_no ?? row.id);
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
        key: 'vendor_quotation_no',
        header: 'Quotation No',
        meta: { sortable: true, sortParam: 'vendor_quotation_no' },
      },
      {
        key: 'rfq.code',
        header: 'RFQ',
        meta: { sortable: true, sortParam: 'rfq_id' },
      },
      {
        key: 'customer.business_name',
        header: 'Vendor',
        meta: { sortable: true, sortParam: 'customer_id' },
      },
      {
        key: 'vendor_quotation_date',
        header: 'Quotation Date',
        meta: { sortable: true, sortParam: 'vendor_quotation_date' },
        render: (row: any) =>
          row.vendor_quotation_date ? dayjs(row.vendor_quotation_date).format('DD-MMM-YYYY') : '-',
      },
      {
        key: 'expiry_date',
        header: 'Expiry Date',
        meta: { sortable: true, sortParam: 'expiry_date' },
        render: (row: any) =>
          row.expiry_date ? dayjs(row.expiry_date).format('DD-MMM-YYYY') : '-',
      },
      { key: 'currency.name', header: 'Currency' },
      { key: 'total_items',   header: 'Items' },
      { key: 'total_qty',     header: 'Total Qty' },
      { key: 'total_open',    header: 'Open' },
      { key: 'total_closed',  header: 'Closed' },
      {
        key: 'is_closed',
        header: 'Status',
        render: (row: any) => (
          <Tag colorScheme={row.is_closed ? 'red' : 'green'} size="sm">
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
                    aria-label={isSelected ? 'Deselect' : 'Select'}
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
                  onClick: (row: any) => navigate(`/purchase/supplier-pricing-update/form/${row.id}`),
                  disabledTooltip: (row: any) =>
                    row.is_closed ? 'Quotation is closed' : row.pending_request_message,
                }] : [])
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
          title="Supplier Pricing Updates"
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
                  Selected Quotation:
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
      currencyOptions={currencyOptions}
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

export default SupplierPricingUpdateSearch;