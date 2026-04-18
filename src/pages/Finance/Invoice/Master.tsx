import { useMemo, useState } from 'react';
import { BiEdit } from 'react-icons/bi';
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
import {
    useInvoiceIndex,
    useInvoiceDropdowns,
    useProformaInvoiceIndex,
    useProformaInvoiceDropdowns,
} from '@/services/finance/invoice/service';
import { getDisplayLabel } from '@/helpers/commonHelper';
import dayjs from 'dayjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const REFERENCE_OPTIONS = [
    { value: 'purchase_order', label: 'Purchase Order' },
    { value: 'logistic_order', label: 'Logistic Order', isDisabled: true },
];

// ─── Config type ──────────────────────────────────────────────────────────────

type MasterType = 'invoice' | 'proforma';

interface MasterConfig {
    type: MasterType;
    title: string;
    tableTitle: string;
    createPath: string;
    editPath: (id: any) => string;
}

const MASTER_CONFIG: Record<MasterType, MasterConfig> = {
    invoice: {
        type: 'invoice',
        title: 'Invoice',
        tableTitle: 'Invoices',
        createPath: '/finance/invoice/form',
        editPath: (id) => `/finance/invoice/form/${id}`,
    },
    proforma: {
        type: 'proforma',
        title: 'Proforma Invoice',
        tableTitle: 'Proforma Invoices',
        createPath: '/finance/invoice/proforma/form',
        editPath: (id) => `/finance/invoice/proforma/form/${id}`,
    },
};

// ─── Shared hooks wrapper ─────────────────────────────────────────────────────

const useInvoiceMasterData = (type: MasterType, queryParams: any) => {
    const invoice  = useInvoiceIndex(type === 'invoice' ? queryParams : undefined);
    const proforma = useProformaInvoiceIndex(type === 'proforma' ? queryParams : undefined);
    return type === 'invoice' ? invoice : proforma;
};

const useInvoiceMasterDropdowns = (type: MasterType) => {
    const invoice  = useInvoiceDropdowns();
    const proforma = useProformaInvoiceDropdowns();
    return type === 'invoice' ? invoice : proforma;
};

// ─── Component ───────────────────────────────────────────────────────────────

interface InvoiceMasterProps {
    type: MasterType;
}

export const InvoiceMaster = ({ type }: InvoiceMasterProps) => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();
    const config = MASTER_CONFIG[type];

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } =
        useInvoiceMasterDropdowns(type);

    const currencyOptions    = dropdownData?.currencies    ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];

    const [itemsPerPage,   setItemsPerPage]   = useState(10);
    const [sortDirection,  setSortDirection]  = useState<'asc' | 'desc'>('desc');
    const [sortBy,         setSortBy]         = useState<string>('created_at');
    const [formKey,        setFormKey]        = useState(0);

    const initialQueryParams = {
        page: 1,
        limit: itemsPerPage,
        search: '',
        // invoice-only
        ...(type === 'invoice' && {
            invoice_type:       '',
            currency_id:        '',
            payment_term_id:    '',
            payment_date_from:  '',
            payment_date_to:    '',
        }),
        // proforma-only
        ...(type === 'proforma' && {
            payment_term_id:    '',
            invoice_date_from:  '',
            invoice_date_to:    '',
            due_date_from:      '',
            due_date_to:        '',
        }),
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);
    const form = useForm();

    const updateFilter = (key: string, value: any) =>
        setQueryParams((prev: any) => ({ ...prev, [key]: value ?? '', page: 1, limit: itemsPerPage }));

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading } =
        useInvoiceMasterData(type, queryParams);

    const allApiDataLoaded = dropdownsFetched && listFetched;
    const data             = listData?.data       ?? [];
    const paginationData   = listData?.pagination;

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({ ...prev, sort_field: columnId, sort_order: direction, page: 1 }));
    };

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];

        const fmt = (date?: string | null) =>
            date ? dayjs(date).format('DD-MMM-YYYY') : '-';

        // ── Shared columns ──
        const codeCol: DynamicColumn<any> = {
            key: 'code', header: 'Code',
            meta: { sortable: true, sortParam: 'code', fontWeight: 'bold' },
        };

        const refTypeCol: DynamicColumn<any> = {
            key: 'reference_type', header: 'Ref. Type',
            render: (row: any) => getDisplayLabel(REFERENCE_OPTIONS, row?.reference_type, 'ref'),
        };

        const amountCol: DynamicColumn<any> = {
            key: 'invoice_amount', header: 'Amount',
            meta: { sortable: true, sortParam: 'invoice_amount' },
        };

        const paymentTermCol: DynamicColumn<any> = {
            key: 'payment_term.name', header: 'Payment Term',
            meta: { sortable: true, sortParam: 'payment_term_id' },
        };

        const bankCol: DynamicColumn<any> = {
            key: 'customer_bank.beneficiary_name', header: 'Bank',
            meta: { sortable: true, sortParam: 'customer_bank_id' },
        };

        const actionsCol: DynamicColumn<any> = {
            key: 'actions', header: 'Actions', type: 'actions',
            actions: [
                ...(canUpdate ? [{
                    label: 'Edit',
                    icon: <BiEdit />,
                    isDisabled: () => true,
                    onClick: (row: any) => navigate(config.editPath(row.id)),
                    disabledTooltip: (row: any) => row.pending_request_message,
                }] : []),
            ],
        };

        // ── Type-specific columns ──
        const invoiceSpecific: DynamicColumn<any>[] = [
            { key: 'tax_invoice_no',   header: 'Tax Inv. No',   meta: { sortable: true, sortParam: 'tax_invoice_no' } },
            { key: 'tax_invoice_date', header: 'Tax Inv. Date', meta: { sortable: true, sortParam: 'tax_invoice_date' }, render: (row) => fmt(row.tax_invoice_date) },
            { key: 'payment_date',     header: 'Payment Date',  meta: { sortable: true, sortParam: 'payment_date' },     render: (row) => fmt(row.payment_date) },
            { key: 'payment_by',       header: 'Payment By',    meta: { sortable: true, sortParam: 'payment_by' } },
            { key: 'currency.name',    header: 'Currency',      meta: { sortable: true, sortParam: 'currency_id' } },
        ];

        const proformaSpecific: DynamicColumn<any>[] = [
            { key: 'invoice_number', header: 'Invoice No.', meta: { sortable: true, sortParam: 'invoice_number' } },
            { key: 'invoice_date',   header: 'Invoice Date', meta: { sortable: true, sortParam: 'invoice_date' }, render: (row) => fmt(row.invoice_date) },
            { key: 'due_date',       header: 'Due Date',     meta: { sortable: true, sortParam: 'due_date' },     render: (row) => fmt(row.due_date) },
            { key: 'date',           header: 'Date',         meta: { sortable: true, sortParam: 'date' },         render: (row) => fmt(row.date) },
        ];

        const specific = type === 'invoice' ? invoiceSpecific : proformaSpecific;

        const baseColumnConfig: DynamicColumn<any>[] = [
            codeCol,
            refTypeCol,
            ...specific,
            amountCol,
            paymentTermCol,
            bankCol,
            actionsCol,
        ];

        return buildColumns(baseColumnConfig, { showSerial: true });
    }, [dropdownsFetched, queryParams, canUpdate, type]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                <HStack justify="space-between">
                    <Heading as="h4" size="md">{config.title}</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate(config.createPath)}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            {/* ── Invoice filters ── */}
                            {type === 'invoice' && (
                                <>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                        <FieldInput
                                            name="keyword"
                                            placeholder="Search code, tax invoice no..."
                                            onValueChange={(v) => updateFilter('search', v ?? '')}
                                            rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                            size="sm"
                                        />
                                        <FieldSelect
                                            key={`invoice_type_${formKey}`}
                                            name="invoice_type"
                                            placeholder="Invoice Type"
                                            options={REFERENCE_OPTIONS}
                                            onValueChange={(v) => updateFilter('invoice_type', v)}
                                            isClearable size="sm"
                                        />
                                        <FieldSelect
                                            key={`currency_${formKey}`}
                                            name="currency_id"
                                            placeholder="Currency"
                                            options={currencyOptions}
                                            selectProps={{ isLoading: dropdownLoading }}
                                            onValueChange={(v) => updateFilter('currency_id', v)}
                                            isClearable size="sm"
                                        />
                                        <FieldSelect
                                            key={`payment_term_${formKey}`}
                                            name="payment_term_id"
                                            placeholder="Payment Term"
                                            options={paymentTermOptions}
                                            selectProps={{ isLoading: dropdownLoading }}
                                            onValueChange={(v) => updateFilter('payment_term_id', v)}
                                            isClearable size="sm"
                                        />
                                    </Stack>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                        <FieldDayPicker name="payment_date_from" placeholder="Payment Date From" size="sm" onValueChange={(v) => updateFilter('payment_date_from', v ?? '')} />
                                        <FieldDayPicker name="payment_date_to"   placeholder="Payment Date To"   size="sm" onValueChange={(v) => updateFilter('payment_date_to',   v ?? '')} />
                                    </Stack>
                                </>
                            )}

                            {/* ── Proforma filters ── */}
                            {type === 'proforma' && (
                                <>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                        <FieldInput
                                            name="keyword"
                                            placeholder="Search code, invoice no..."
                                            onValueChange={(v) => updateFilter('search', v ?? '')}
                                            rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                            size="sm"
                                        />
                                        <FieldSelect
                                            key={`payment_term_${formKey}`}
                                            name="payment_term_id"
                                            placeholder="Payment Term"
                                            options={paymentTermOptions}
                                            selectProps={{ isLoading: dropdownLoading }}
                                            onValueChange={(v) => updateFilter('payment_term_id', v)}
                                            isClearable size="sm"
                                        />
                                        <FieldDayPicker name="invoice_date_from" placeholder="Invoice Date From" size="sm" onValueChange={(v) => updateFilter('invoice_date_from', v ?? '')} />
                                        <FieldDayPicker name="invoice_date_to"   placeholder="Invoice Date To"   size="sm" onValueChange={(v) => updateFilter('invoice_date_to',   v ?? '')} />
                                    </Stack>
                                    <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                        <FieldDayPicker name="due_date_from" placeholder="Due Date From" size="sm" onValueChange={(v) => updateFilter('due_date_from', v ?? '')} />
                                        <FieldDayPicker name="due_date_to"   placeholder="Due Date To"   size="sm" onValueChange={(v) => updateFilter('due_date_to',   v ?? '')} />
                                    </Stack>
                                </>
                            )}

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

                <Box borderRadius={4}>
                    <DataTable
                        columns={columns}
                        data={data}
                        loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                        title={config.tableTitle}
                        enablePagination
                        enableClientSideSearch={false}
                        onSortChange={handleSortChange}
                        sortDirection={sortDirection}
                        sortBy={sortBy}
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={itemsPerPage}
                        stickyColumns={4}
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

export default InvoiceMaster;