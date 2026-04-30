import { useEffect, useState } from 'react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import {
    Box, Button, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    HStack, Heading, IconButton, SimpleGrid, Stack, Table, Tbody,
    Td, Text, Th, Thead, Tfoot, Tooltip, Tr,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { HiArrowNarrowLeft, HiTrash } from 'react-icons/hi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import FieldDisplay from '@/components/FieldDisplay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useSalesQuotationList, useSalesQuotationDetails } from '@/services/sales/quotation/service';
import { useSalesOrderDetails, useSaveSalesOrder } from '@/services/sales/sales-order/service';
import { useSubmasterItemList } from '@/services/submaster/service';
import { formatDate, formatContactAddress, formatShippingAddress } from '@/helpers/commonHelper';
import { SalesOrderItemVariable } from '@/services/sales/sales-order/schema';
import { usePDFPreviewController } from '@/api/hooks/usePDFPreviewController';
import { endPoints } from '@/api/endpoints';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector'; // ← NEW import
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

// ─── Constants ────────────────────────────────────────────────────────────────

// Header field keys used for change detection
const HEADER_FORM_KEYS = ['order_date', 'delivery_date', 'remarks'];

// ─── Types ────────────────────────────────────────────────────────────────────

type SORow = {
    rowKey:            string;
    sales_log_item_id: string;
    condition_id:      string;
    qty:               number;
    unit_price:        number;
    total_value:       number;
    remarks:           string;
    part_name:         string;
    description:       string;
    uom:               string;
    id?:               string;
};

// Normalised shape used for row-level change comparison
type NormalisedSORow = {
    sales_log_item_id: string;
    condition_id:      string;
    unit_price:        string;
    remarks:           string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d?: string | null) => d ? dayjs(d).format('DD-MMM-YYYY') : '—';

const calcTotalValue = (qty: any, unitPrice: any): number => {
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    return (!isNaN(q) && !isNaN(p)) ? parseFloat((q * p).toFixed(2)) : 0;
};

// Strips a SORow down to the fields users can actually edit, for diffing
const normaliseSORow = (row: Partial<SORow & { unit_price_str?: string }>): NormalisedSORow => ({
    sales_log_item_id: String(row.sales_log_item_id ?? ''),
    condition_id:      String(row.condition_id      ?? ''),
    unit_price:        String(row.unit_price        ?? ''),
    remarks:           String(row.remarks           ?? ''),
});

// Returns true if the current live rows differ from the rows that were loaded
const rowsChanged = (current: NormalisedSORow[], initial: NormalisedSORow[]): boolean => {
    if (current.length !== initial.length) return true;
    return current.some((row, i) => JSON.stringify(row) !== JSON.stringify(initial[i]));
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box bg="white" borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
        <HStack px={5} py={3} bg="#0C2556" borderTopLeftRadius="md" borderTopRightRadius="md">
            <Text fontWeight="semibold" fontSize="sm" color="white">{title}</Text>
        </HStack>
        <Box p={5}>{children}</Box>
    </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const SalesOrderForm = () => {
    const navigate = useNavigate();
    const { id }   = useParams<{ id?: string }>();
    const isEdit   = !!id;

    const [sqId,        setSqId]        = useState<string | null>(null);
    const [rows,        setRows]        = useState<SORow[]>([]);
    const [resetKey,    setResetKey]    = useState(0);
    const [activeInput, setActiveInput] = useState('');

    // ── Change-detection state (edit mode only) ──
    const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null);
    const [initialRows,   setInitialRows]   = useState<NormalisedSORow[]>([]);

    // ── Data ──
    const { data: sqList }                             = useSalesQuotationList({ enabled: true });
    const { data: sqDetails, isFetching: sqFetching } = useSalesQuotationDetails(sqId ?? undefined, { enabled: !!sqId });
    const { data: soDetails }                          = useSalesOrderDetails(id, { enabled: isEdit });
    const { data: conditionData }                      = useSubmasterItemList('conditions');

    const sqOptions        = sqList?.data       ?? [];
    const conditionOptions = conditionData?.data ?? [];
    const sqData           = sqDetails?.data;
    const sqItems: any[]   = sqData?.items      ?? [];
    const sl               = sqData?.sales_log  as any;

    // ── Currency ──
    const currency       = sl?.currency as any;
    const currencySymbol = currency?.symbol ?? '';
    const currencyCode   = currency?.code   ?? '';

    // ── Address ──
    const contactManager         = sl?.customer_contact_manager  as any;
    const shippingAddress        = sl?.customer_shipping_address as any;
    const contactAddressDisplay  = contactManager  ? formatContactAddress(contactManager)   : '—';
    const shippingAddressDisplay = shippingAddress ? formatShippingAddress(shippingAddress) : '—';

    // ── PDF Preview ──
    const previewPDF = usePDFPreviewController({
        url:   endPoints.preview_post.sales_order,
        title: 'SALES ORDER PREVIEW',
    });

    // ── Form ──
    const form = useForm({
        onValidSubmit: (values) => {
    if (!sqId || !rows.length) return;

    const items: SalesOrderItemVariable[] = rows
        .filter(r => r.condition_id)
        .map(r => {
            const condition_id = values[`condition_${r.rowKey}`] ?? r.condition_id;
            const unit_price   = parseFloat(values[`unit_price_${r.rowKey}`] ?? String(r.unit_price)) || 0;
            const total_value  = calcTotalValue(r.qty, unit_price);  // ← was missing

            return {
                ...(r.id ? { id: r.id } : {}),          // ← include id in edit mode
                sales_log_item_id: r.sales_log_item_id,
                condition_id,
                qty:         r.qty,
                unit_price,
                total_value,                              // ← add this
                remarks:     values[`remarks_${r.rowKey}`] ?? r.remarks ?? '',
            };
        });

    if (!items.length) return;

    saveSO.mutate({
        id,
        sales_quotation_id: sqId,
        order_date:         formatDate(values.order_date) as string,
        delivery_date:      values.delivery_date ? formatDate(values.delivery_date) as string : undefined,
        remarks:            values.remarks ?? '',
        items,
    });
},
    });

    const fields = useFormFields({ connect: form });

    // ── Preview handler ──
    const handleOpenPreview = () => {
        const items = rows
            .filter(r => r.condition_id)
            .map(r => ({
                sales_log_item_id: r.sales_log_item_id,
                condition_id:      fields[`condition_${r.rowKey}`]?.value  ?? r.condition_id,
                qty:               r.qty,
                unit_price:        parseFloat(fields[`unit_price_${r.rowKey}`]?.value ?? String(r.unit_price)) || 0,
                remarks:           fields[`remarks_${r.rowKey}`]?.value    ?? r.remarks,
            }));

        const payload = {
            sales_quotation_id: sqId,
            order_date:         formatDate(fields['order_date']?.value)    ?? '',
            delivery_date:      fields['delivery_date']?.value
                                    ? formatDate(fields['delivery_date']?.value)
                                    : null,
            remarks:            fields['remarks']?.value ?? '',
            items,
        };

        previewPDF.open(payload);
    };

    // ── Load SQ items into rows ──
    useEffect(() => {
        if (!sqItems.length) { setRows([]); return; }
        const newRows: SORow[] = sqItems.map((item: any) => {
            const part = item.sales_log_item?.part_number ?? {};
            return {
                rowKey:            uuidv4(),
                sales_log_item_id: item.sales_log_item_id,
                condition_id:      item.condition_id  ?? '',
                qty:               item.qty,
                unit_price:        item.unit_price    ?? 0,
                total_value:       item.total_value   ?? 0,
                remarks:           item.remarks       ?? '',
                part_name:         part.name          ?? '—',
                description:       part.description   ?? '—',
                uom:               item.sales_log_item?.unit_of_measure?.name ?? '—',
            };
        });
        setRows(newRows);
        setTimeout(() => {
            const vals: Record<string, any> = {};
            newRows.forEach(r => {
                vals[`condition_${r.rowKey}`]  = r.condition_id || undefined;
                vals[`unit_price_${r.rowKey}`] = r.unit_price > 0 ? String(r.unit_price) : '';
                vals[`remarks_${r.rowKey}`]    = r.remarks;
            });
            form.setValues(vals);
        }, 100);
    }, [sqItems.length, sqId]);

    // ── Edit mode — prefill header ──
    useEffect(() => {
        if (!isEdit || !soDetails?.data) return;
        const so = soDetails.data;
        if (so.sales_quotation_id) setSqId(so.sales_quotation_id);

        const headerValues = {
            sales_quotation_id: so.sales_quotation_id,
            order_date:         so.order_date,
            delivery_date:      so.delivery_date ?? '',
            remarks:            so.remarks       ?? '',
        };

        // Capture initial header values for change detection
        setInitialValues(Object.fromEntries(HEADER_FORM_KEYS.map(k => [k, (headerValues as any)[k]])));

        form.setValues(headerValues);
    }, [soDetails?.data?.id]);

    // ── Edit mode — prefill items after SQ loads ──
    useEffect(() => {
        if (!isEdit || !soDetails?.data?.items?.length || !rows.length) return;
        const soItems = soDetails.data.items!;
        const formVals: Record<string, any> = {};
        let updatedRows: SORow[] = [];

        setRows(prev => {
            updatedRows = prev.map(row => {
                const match = soItems.find((si: any) => si.sales_log_item_id === row.sales_log_item_id);
                if (!match) return row;
                formVals[`condition_${row.rowKey}`]  = match.condition_id ?? '';
                formVals[`unit_price_${row.rowKey}`] = String(match.unit_price ?? '');
                formVals[`remarks_${row.rowKey}`]    = match.remarks ?? '';
                return {
                    ...row,
                    condition_id: match.condition_id,
                    unit_price:   match.unit_price,
                    total_value:  match.total_value,
                    remarks:      match.remarks ?? '',
                    id:           match.id,
                };
            });
            return updatedRows;
        });

        // Capture initial rows for change detection — runs after setRows resolves
        setTimeout(() => {
            setInitialRows(
                updatedRows.map(row => normaliseSORow({
                    ...row,
                    condition_id: formVals[`condition_${row.rowKey}`] ?? row.condition_id,
                    unit_price:   parseFloat(formVals[`unit_price_${row.rowKey}`]) || row.unit_price,
                    remarks:      formVals[`remarks_${row.rowKey}`]   ?? row.remarks,
                }))
            );
            form.setValues(formVals);
        }, 100);
    }, [soDetails?.data?.items?.length, rows.length]);

    // ── Handlers ──
    const handleSqChange = (value: any) => {
        if (!value) { bumpReset(); return; }
        setSqId(null);
        setRows([]);
        setTimeout(() => setSqId(value), 50);
    };

    const handleRowChange = (field: string, value: any, rowKey: string) => {
        setRows(prev => prev.map(r => {
            if (r.rowKey !== rowKey) return r;
            const updated = { ...r, [field]: value };
            if (field === 'unit_price') {
                updated.unit_price  = parseFloat(String(value)) || 0;
                updated.total_value = calcTotalValue(r.qty, value);
                form.setValues({ [`total_value_${rowKey}`]: updated.total_value.toFixed(2) });
            }
            return updated;
        }));
    };

    const deleteRow = (rowKey: string) =>
        setRows(prev => prev.filter(r => r.rowKey !== rowKey));

    const saveSO = useSaveSalesOrder({
        onSuccess: () => navigate('/sales-management/order/master'),
    });

    const bumpReset = () => {
        form.reset();
        setSqId(null);
        setRows([]);
        setInitialValues(null);
        setInitialRows([]);
        setResetKey(k => k + 1);
    };

    const totalItems = rows.length;
    const totalQty   = rows.reduce((s, r) => s + r.qty, 0);

    // ── Change detection (edit mode only) ──────────────────────────────────────

    const isHeaderChanged = isFormFieldsChanged({ fields, initialValues, keys: HEADER_FORM_KEYS });

    // Build live normalised rows from the current form field values
    const liveRows: NormalisedSORow[] = rows.map(row => normaliseSORow({
        sales_log_item_id: row.sales_log_item_id,
        condition_id:      fields[`condition_${row.rowKey}`]?.value  ?? row.condition_id,
        unit_price:        parseFloat(fields[`unit_price_${row.rowKey}`]?.value ?? String(row.unit_price)) || row.unit_price,
        remarks:           fields[`remarks_${row.rowKey}`]?.value    ?? row.remarks,
    }));

    const isItemsChanged = isEdit && rowsChanged(liveRows, initialRows);

    // True when anything in the form differs from what was loaded
    const isFormValuesChanged = isHeaderChanged || isItemsChanged;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Header */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm"
                            separator={<ChevronRightIcon boxSize={5} color="gray.400" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/sales-management/order/master">
                                    Sales Orders
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>{isEdit ? 'Edit Order' : 'Create Order'}</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">
                            {isEdit ? 'Edit Sales Order' : 'Create Sales Order'}
                        </Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />}
                        size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <Formiz autoForm connect={form}>
                    <Stack spacing={4} p={4} bg="white" borderRadius="md" boxShadow="md">

                        {/* ── Step 1: SQ Selection ── */}
                        <SectionCard title="Sales Quotation">
                            <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                                <FieldSelect
                                    key={`sq_${resetKey}`}
                                    label="Sales Quotation" name="sales_quotation_id"
                                    placeholder="Select SQ..."
                                    options={sqOptions}
                                    onValueChange={handleSqChange}
                                    isDisabled={isEdit}
                                    isClearable size="sm"
                                />
                                <FieldDisplay label="Customer"      value={sl?.customer?.business_name ?? '—'} size="sm" />
                                <FieldDisplay label="Customer Code" value={sl?.customer?.code          ?? '—'} size="sm" />
                                <FieldDisplay label="RFQ No"        value={sl?.cust_rfq_no             ?? '—'} size="sm" />
                                <FieldDisplay label="RFQ Date"      value={fmt(sl?.cust_rfq_date)}             size="sm" />
                            </SimpleGrid>

                            {sqData && (
                                <>
                                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mt={4}>
                                        <FieldDisplay
                                            label="Currency"
                                            value={currency ? `${currencyCode} — ${currency.name ?? ''}` : '—'}
                                            size="sm"
                                        />
                                        <FieldDisplay label="Payment Mode" value={sl?.payment_mode?.name ?? '—'} size="sm" />
                                        <FieldDisplay label="Payment Term" value={sl?.payment_term?.name ?? '—'} size="sm" />
                                        <FieldDisplay label="FOB"          value={sl?.fob?.name          ?? '—'} size="sm" />
                                    </SimpleGrid>

                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                                        <FieldDisplay
                                            key={`cm_${sqId}`}
                                            label="Contact Address"
                                            value={contactAddressDisplay}
                                            isHtml style={{ backgroundColor: '#fff' }}
                                            size="sm"
                                        />
                                        <FieldDisplay
                                            key={`sa_${sqId}`}
                                            label="Shipping Address"
                                            value={shippingAddressDisplay}
                                            isHtml style={{ backgroundColor: '#fff' }}
                                            size="sm"
                                        />
                                    </SimpleGrid>
                                </>
                            )}
                        </SectionCard>

                        {/* ── Step 2: Order Details ── */}
                        {sqId && (
                            <SectionCard title="Order Details">
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <FieldDayPicker
                                        label="Order Date" name="order_date"
                                        placeholder="Select order date"
                                        required="Order date is required"
                                        size="sm"
                                        disabledDays={{ after: new Date() }}
                                    />
                                    <FieldDayPicker
                                        label="Delivery Date" name="delivery_date"
                                        placeholder="Select delivery date"
                                        size="sm"
                                        required="Delivery date is required"
                                        disabledDays={{ before: new Date() }}
                                    />
                                    <FieldInput
                                        label="Remarks" name="remarks"
                                        placeholder="Overall order remarks"
                                        type="text" size="sm"
                                    />
                                </SimpleGrid>
                            </SectionCard>
                        )}

                        {/* ── Step 3: Items ── */}
                        {sqId && rows.length > 0 && (
                            <LoadingOverlay isLoading={sqFetching}>
                                <SectionCard title="Order Items">
                                    <Box overflowX="auto">
                                        <Table variant="simple" size="sm">
                                            <Thead bg="gray.500">
                                                <Tr>
                                                    <Th color="white">S.No.</Th>
                                                    <Th color="white">Part Number</Th>
                                                    <Th color="white">Description</Th>
                                                    <Th color="white">UOM</Th>
                                                    <Th color="white">Qty</Th>
                                                    <Th color="white">Condition</Th>
                                                    <Th color="white">Unit Price</Th>
                                                    <Th color="white">Total Value</Th>
                                                    <Th color="white">Remarks</Th>
                                                    <Th color="white" isNumeric>Action</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {rows.map((row, i) => (
                                                    <Tr key={row.rowKey}>
                                                        <Td><Text fontSize="sm">{i + 1}.</Text></Td>

                                                        <Td>
                                                            <Text fontWeight="bold" fontSize="sm">{row.part_name}</Text>
                                                        </Td>

                                                        <Td maxW="150px">
                                                            <Text fontSize="xs" color="gray.500" noOfLines={2}>{row.description}</Text>
                                                        </Td>

                                                        <Td fontSize="xs">{row.uom}</Td>

                                                        <Td>
                                                            <Text fontSize="sm" fontWeight="semibold">{row.qty}</Text>
                                                        </Td>

                                                        <Td minW="140px">
                                                            <FieldSelect
                                                                name={`condition_${row.rowKey}`}
                                                                placeholder="Condition"
                                                                options={conditionOptions}
                                                                menuPortalTarget={document.body}
                                                                size="sm"
                                                                defaultValue={row.condition_id || undefined}
                                                                onValueChange={(val) => handleRowChange('condition_id', val ?? '', row.rowKey)}
                                                            />
                                                        </Td>

                                                        <Tooltip hasArrow label="Double-click to edit" placement="top" bg="green.600">
                                                            <Td>
                                                                <FieldInput
                                                                    name={`unit_price_${row.rowKey}`}
                                                                    size="sm" type="decimal" placeholder="0.00"
                                                                    defaultValue={row.unit_price > 0 ? String(row.unit_price) : ''}
                                                                    width="110px" maxLength={15}
                                                                    leftElement={currencySymbol || undefined}
                                                                    onValueChange={(v) => handleRowChange('unit_price', v, row.rowKey)}
                                                                    onDoubleClick={() => setActiveInput(`unit_price_${row.rowKey}`)}
                                                                    onBlur={() => setActiveInput('')}
                                                                    isReadOnly={activeInput !== `unit_price_${row.rowKey}`}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td>
                                                            <FieldInput
                                                                name={`total_value_${row.rowKey}`}
                                                                size="sm" placeholder="—"
                                                                defaultValue={row.total_value > 0 ? row.total_value.toFixed(2) : ''}
                                                                width="120px" isReadOnly
                                                                leftElement={currencySymbol || undefined}
                                                                style={{ background: 'var(--chakra-colors-gray-50)', cursor: 'default' }}
                                                            />
                                                        </Td>

                                                        <Tooltip hasArrow label="Double-click to edit" placement="top" bg="green.600">
                                                            <Td minW="160px">
                                                                <FieldInput
                                                                    name={`remarks_${row.rowKey}`}
                                                                    placeholder="Remarks" type="text" size="sm"
                                                                    defaultValue={row.remarks} maxLength={60}
                                                                    onValueChange={(val) => handleRowChange('remarks', String(val ?? ''), row.rowKey)}
                                                                    onDoubleClick={() => setActiveInput(`remarks_${row.rowKey}`)}
                                                                    onBlur={() => setActiveInput('')}
                                                                    isReadOnly={activeInput !== `remarks_${row.rowKey}`}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td isNumeric>
                                                            <IconButton
                                                                aria-label="Delete row"
                                                                icon={<HiTrash />}
                                                                size="sm" colorScheme="red"
                                                                onClick={() => deleteRow(row.rowKey)}
                                                                isDisabled={rows.length <= 1}
                                                            />
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                            <Tfoot>
                                                <Tr bg="gray.100" fontWeight="bold">
                                                    <Td />
                                                    <Td colSpan={3}>
                                                        <Text fontSize="xs">Total Line Items: {totalItems}</Text>
                                                    </Td>
                                                    <Td fontSize="xs" colSpan={2}>Total Qty: {totalQty}</Td>
                                                    <Td />
                                                    <Td fontSize="xs" colSpan={3}>
                                                        Total Value:{' '}
                                                        {currencySymbol && (
                                                            <Text as="span" color="gray.500" mr={1}>{currencySymbol}</Text>
                                                        )}
                                                        {rows.reduce((s, r) => {
                                                            const tv = parseFloat(fields[`total_value_${r.rowKey}`]?.value ?? String(r.total_value ?? 0));
                                                            return s + (isNaN(tv) ? 0 : tv);
                                                        }, 0).toFixed(2)}
                                                    </Td>
                                                    <Td />
                                                </Tr>
                                            </Tfoot>
                                        </Table>
                                    </Box>
                                </SectionCard>
                            </LoadingOverlay>
                        )}

                        {/* ── Actions ── */}
                        {sqId && (
                            <HStack justify="center" spacing={3} mt={2}>
                                <Button colorScheme="red" size="sm"
                                    onClick={() => {
                                        form.reset();
                                        if (!isEdit) bumpReset();
                                        else setResetKey(k => k + 1);
                                    }}>
                                    Reset
                                </Button>
                                <Button
                                    colorScheme="green" size="sm"
                                    onClick={handleOpenPreview}
                                    isDisabled={rows.length === 0 || !sqId}
                                    isLoading={previewPDF.isLoading}
                                    loadingText="Generating…"
                                >
                                    Preview
                                </Button>
                                <Button
                                    type="submit"
                                    colorScheme="brand"
                                    size="sm"
                                    isDisabled={
                                        rows.length === 0 ||
                                        saveSO.isLoading ||
                                        // In edit mode, block submission until something actually changed
                                        (isEdit ? (!isFormValuesChanged || !form.isValid) : false)
                                    }
                                    isLoading={saveSO.isLoading}
                                    loadingText={isEdit ? 'Updating…' : 'Creating…'}
                                >
                                    {isEdit ? 'Update Order' : 'Create Order'}
                                </Button>
                            </HStack>
                        )}

                    </Stack>
                </Formiz>
            </Stack>
        </SlideIn>
    );
};

export default SalesOrderForm;