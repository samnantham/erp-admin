import { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import {
    Box, Badge, Button, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    HStack, Heading, SimpleGrid, Stack, Table, Tbody, Td, Text,
    Th, Thead, Tr,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import FieldDisplay from '@/components/FieldDisplay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldUpload } from '@/components/FieldUpload';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useSalesLogList, useSalesLogDetails } from '@/services/sales/sales-log/service';
import { useSalesQuotationDetails, useSaveSalesQuotation } from '@/services/sales/quotation/service';
import { useSubmasterItemList } from '@/services/submaster/service';
import { useCustomerDetails } from '@/services/master/customer/service';
import { formatDate } from '@/helpers/commonHelper';
import { SalesQuotationItemVariable } from '@/services/sales/quotation/schema';
import { usePDFPreviewController } from '@/api/hooks/usePDFPreviewController';
import { endPoints } from '@/api/endpoints';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_FORM_KEYS = ['quotation_date', 'expiry_date', 'remarks'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteItem {
    sales_log_item_id: string;
    condition_id:      string;
    qty:               number;
    unit_price:        number;
    total_value:       number;
    remarks:           string;
    part_name:         string;
    description:       string;
    uom:               string;
    original_qty:      number;
}

type NormalisedQuoteItem = {
    sales_log_item_id: string;
    condition_id:      string;
    qty:               string;
    unit_price:        string;
    remarks:           string;
};

const fmt = (d?: string | null) => d ? dayjs(d).format('DD-MMM-YYYY') : '—';

const normaliseQuoteItem = (item: Partial<QuoteItem>): NormalisedQuoteItem => ({
    sales_log_item_id: String(item.sales_log_item_id ?? ''),
    condition_id:      String(item.condition_id      ?? ''),
    qty:               String(item.qty               ?? ''),
    unit_price:        String(item.unit_price        ?? ''),
    remarks:           String(item.remarks           ?? ''),
});

const itemsChanged = (
    current: NormalisedQuoteItem[],
    initial: NormalisedQuoteItem[]
): boolean => {
    if (current.length !== initial.length) return true;
    return current.some((item, i) => JSON.stringify(item) !== JSON.stringify(initial[i]));
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const DarkTh = ({ children }: { children: React.ReactNode }) => (
    <Th bg="#0C2556" color="white" fontSize="xs" letterSpacing="wide" fontWeight="medium" py={2}>
        {children}
    </Th>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box bg="white" borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
        <HStack px={5} py={3} bg="#0C2556" borderTopLeftRadius="md" borderTopRightRadius="md">
            <Text fontWeight="semibold" fontSize="sm" color="white">{title}</Text>
        </HStack>
        <Box p={5}>{children}</Box>
    </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const SalesQuotationForm = () => {
    const navigate = useNavigate();
    const { id }   = useParams<{ id?: string }>();
    const isEdit   = !!id;

    const [selId,         setSelId]         = useState<string | null>(null);
    const [quoteItems,    setQuoteItems]    = useState<Record<string, QuoteItem>>({});
    const [resetKey,      setResetKey]      = useState(0);
    const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null);
    const [initialItems,  setInitialItems]  = useState<NormalisedQuoteItem[]>([]);

    const debouncedSetSelId = useRef(debounce((v: string) => setSelId(v), 400)).current;

    // ── Data ──
    const { data: selList }                              = useSalesLogList({ enabled: true });
    const { data: selDetails, isFetching: selFetching } = useSalesLogDetails(selId ?? undefined, { enabled: !!selId });
    const { data: sqDetails }                            = useSalesQuotationDetails(id, { enabled: isEdit });
    const { data: conditionData }                        = useSubmasterItemList('conditions');

    const selOptions       = selList?.data       ?? [];
    const conditionOptions = conditionData?.data ?? [];
    const selData          = selDetails?.data;
    const selItems: any[]  = selData?.items      ?? [];
    const customerId       = selData?.customer_id ?? null;

    const { data: customerDetails } = useCustomerDetails(
        customerId ?? '',
        { enabled: !!customerId }
    );

    const currency       = (selData?.currency ?? (customerDetails?.data as any)?.default_currency) as any;
    const currencyCode   = currency?.code   ?? '';
    const currencySymbol = currency?.symbol ?? '';

    // ── PDF Preview ──
    const previewPDF = usePDFPreviewController({
        url:   endPoints.preview_post.sales_quotation,
        title: 'SALES QUOTATION PREVIEW',
    });

    // ── Load SEL items into quoteItems ──
    useEffect(() => {
        if (!selItems.length) { setQuoteItems({}); return; }
        const init: Record<string, QuoteItem> = {};
        selItems.forEach((item: any) => {
            const part = item.part_number ?? {};
            init[item.id] = {
                sales_log_item_id: item.id,
                condition_id:      item.condition?.id ?? '',
                qty:               item.qty,
                unit_price:        0,
                total_value:       0,
                remarks:           item.remark ?? '',
                part_name:         part.name        ?? '—',
                description:       part.description ?? '—',
                uom:               item.unit_of_measure?.name ?? '—',
                original_qty:      item.qty,
            };
        });
        setQuoteItems(init);
    }, [selItems.length, selId]);

    // ── Edit mode — prefill header ──
    useEffect(() => {
        if (!isEdit || !sqDetails?.data) return;
        const sq = sqDetails.data;
        if (sq.sales_log_id) setSelId(sq.sales_log_id);

        const headerValues = {
            sales_log_id:   sq.sales_log_id,
            quotation_date: sq.quotation_date,
            expiry_date:    sq.expiry_date ?? '',
            remarks:        sq.remarks    ?? '',
        };

        setInitialValues(Object.fromEntries(HEADER_FORM_KEYS.map(k => [k, (headerValues as any)[k]])));
        form.setValues(headerValues);
    }, [sqDetails?.data?.id]);

    // ── Edit mode — prefill items after SEL loads ──
    useEffect(() => {
        if (!isEdit || !sqDetails?.data?.items?.length || !Object.keys(quoteItems).length) return;
        const sqItems = sqDetails.data.items!;
        const formValues: Record<string, any> = {};
        let updatedItems: Record<string, QuoteItem> = {};

        setQuoteItems(prev => {
            const next = { ...prev };
            sqItems.forEach((sqItem: any) => {
                const key = sqItem.sales_log_item_id;
                if (next[key]) {
                    const qty        = sqItem.qty        ?? 0;
                    const unit_price = sqItem.unit_price ?? 0;
                    next[key] = {
                        ...next[key],
                        condition_id: sqItem.condition_id,
                        qty,
                        unit_price,
                        total_value:  parseFloat((qty * unit_price).toFixed(2)),
                        remarks:      sqItem.remarks ?? '',
                    };
                    formValues[`qty_${key}`]        = String(qty);
                    formValues[`unit_price_${key}`] = String(unit_price);
                    formValues[`condition_${key}`]  = sqItem.condition_id ?? '';
                    formValues[`remarks_${key}`]    = sqItem.remarks ?? '';
                }
            });
            updatedItems = next;
            return next;
        });

        setTimeout(() => {
            setInitialItems(Object.values(updatedItems).map(item => normaliseQuoteItem(item)));
            form.setValues(formValues);
        }, 100);
    }, [sqDetails?.data?.items?.length, Object.keys(quoteItems).length]);

    // ── Handlers ──
    const handleSelChange = (value: any) => {
        if (!value) {
            bumpReset();
        } else {
            setSelId(null);
            setQuoteItems({});
            debouncedSetSelId(value);
        }
    };

    const updateItem = (itemId: string, field: keyof QuoteItem, value: any) => {
        setQuoteItems(prev => {
            const item    = prev[itemId];
            const updated = { ...item, [field]: value };

            if (field === 'qty') {
                const newQty        = parseFloat(value) || 0;
                updated.qty         = Math.min(newQty, item.original_qty);
                updated.total_value = parseFloat((updated.qty * item.unit_price).toFixed(2));
            }
            if (field === 'unit_price') {
                updated.unit_price  = parseFloat(value) || 0;
                updated.total_value = parseFloat((updated.unit_price * item.qty).toFixed(2));
            }
            if (field === 'condition_id') {
                updated.condition_id = value ?? '';
            }
            return { ...prev, [itemId]: updated };
        });
    };

    // ── Compute live total per row from fields (reactive) ──
    const getLiveRowTotal = (item: QuoteItem): number => {
        const qty        = parseFloat(fields[`qty_${item.sales_log_item_id}`]?.value        ?? String(item.qty))        || 0;
        const unit_price = parseFloat(fields[`unit_price_${item.sales_log_item_id}`]?.value ?? String(item.unit_price)) || 0;
        return parseFloat((qty * unit_price).toFixed(2));
    };

    // ── Preview handler ──
    const handleOpenPreview = () => {
        const items = Object.values(quoteItems)
            .filter(i => i.condition_id)
            .map(i => {
                const qty        = parseFloat(fields[`qty_${i.sales_log_item_id}`]?.value        ?? String(i.qty))        || 0;
                const unit_price = parseFloat(fields[`unit_price_${i.sales_log_item_id}`]?.value ?? String(i.unit_price)) || 0;
                return {
                    sales_log_item_id: i.sales_log_item_id,
                    condition_id:      i.condition_id,
                    qty,
                    unit_price,
                    total_value:       parseFloat((qty * unit_price).toFixed(2)),
                    remarks:           i.remarks || undefined,
                };
            });

        const payload = {
            sales_log_id:   selId,
            quotation_date: formatDate(fields['quotation_date']?.value) ?? '',
            expiry_date:    fields['expiry_date']?.value ? formatDate(fields['expiry_date']?.value) : null,
            quotation_file: fields['quotation_file']?.value ?? null,
            remarks:        fields['remarks']?.value ?? '',
            items,
        };

        previewPDF.open(payload);
    };

    // ── Form ──
    const form = useForm({
        onValidSubmit: (values) => {
            if (!selId) return;

            const items: SalesQuotationItemVariable[] = Object.values(quoteItems)
                .filter(i => i.condition_id)
                .map(i => {
                    const qty        = parseFloat(fields[`qty_${i.sales_log_item_id}`]?.value        ?? String(i.qty))        || 0;
                    const unit_price = parseFloat(fields[`unit_price_${i.sales_log_item_id}`]?.value ?? String(i.unit_price)) || 0;
                    return {
                        sales_log_item_id: i.sales_log_item_id,
                        condition_id:      i.condition_id,
                        qty,
                        unit_price,
                        total_value:       parseFloat((qty * unit_price).toFixed(2)),
                        remarks:           i.remarks || undefined,
                    };
                });

            if (!items.length) return;

            saveSQ.mutate({
                id,
                sales_log_id:   selId,
                quotation_date: formatDate(values.quotation_date) as string,
                expiry_date:    values.expiry_date ? formatDate(values.expiry_date) as string : undefined,
                quotation_file: values.quotation_file ?? undefined,
                remarks:        values.remarks ?? '',
                items,
            });
        },
    });

    const fields = useFormFields({ connect: form });

    const saveSQ = useSaveSalesQuotation({
        onSuccess: () => navigate('/sales-management/quotation/master'),
    });

    const bumpReset = () => {
        form.reset();
        setSelId(null);
        setQuoteItems({});
        setInitialValues(null);
        setInitialItems([]);
        setResetKey(k => k + 1);
    };

    // ── Change detection ──
    const isHeaderChanged = isFormFieldsChanged({ fields, initialValues, keys: HEADER_FORM_KEYS });

    const liveItems: NormalisedQuoteItem[] = Object.values(quoteItems).map(item =>
        normaliseQuoteItem({
            sales_log_item_id: item.sales_log_item_id,
            condition_id:      fields[`condition_${item.sales_log_item_id}`]?.value  ?? item.condition_id,
            qty:               parseFloat(fields[`qty_${item.sales_log_item_id}`]?.value ?? String(item.qty)) || item.qty,
            unit_price:        parseFloat(fields[`unit_price_${item.sales_log_item_id}`]?.value ?? String(item.unit_price)) || item.unit_price,
            remarks:           fields[`remarks_${item.sales_log_item_id}`]?.value ?? item.remarks,
        })
    );

    const isItemsChanged_     = isEdit && itemsChanged(liveItems, initialItems);
    const isFormValuesChanged = isHeaderChanged || isItemsChanged_;

    // ── Live grand total computed from fields ──
    const liveTotalValue = Object.values(quoteItems).reduce((sum, item) => {
        const qty        = parseFloat(fields[`qty_${item.sales_log_item_id}`]?.value        ?? String(item.qty))        || 0;
        const unit_price = parseFloat(fields[`unit_price_${item.sales_log_item_id}`]?.value ?? String(item.unit_price)) || 0;
        return sum + qty * unit_price;
    }, 0);

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
                                <BreadcrumbLink as={Link} to="/sales-management/quotation/master">
                                    Sales Quotations
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>{isEdit ? 'Edit Quotation' : 'Create Quotation'}</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">
                            {isEdit ? 'Edit Sales Quotation' : 'Create Sales Quotation'}
                        </Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />}
                        size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <Formiz autoForm connect={form}>
                    <Stack spacing={4} p={4} bg="white" borderRadius="md" boxShadow="md">

                        {/* ── Step 1: SEL Selection ── */}
                        <SectionCard title="Sales Enquiry Log (SEL)">
                            <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                                <FieldSelect
                                    key={`sel_${resetKey}`}
                                    label="SEL / RFQ" name="sales_log_id"
                                    placeholder="Select SEL..."
                                    options={selOptions}
                                    onValueChange={handleSelChange}
                                    isDisabled={isEdit}
                                    isClearable size="sm"
                                />
                                <FieldDisplay label="Customer"  value={selData?.customer?.business_name ?? '—'} size="sm" />
                                <FieldDisplay label="RFQ No"    value={selData?.cust_rfq_no ?? '—'}             size="sm" />
                                <FieldDisplay label="RFQ Date"  value={fmt(selData?.cust_rfq_date)}             size="sm" />
                                <FieldDisplay label="Due Date"  value={fmt(selData?.due_date)}                  size="sm" />
                            </SimpleGrid>

                            {selData && (
                                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mt={4}>
                                    <FieldDisplay
                                        label="Currency"
                                        value={currency ? `${currencyCode} — ${currency.name ?? ''}` : '—'}
                                        size="sm"
                                    />
                                    <FieldDisplay label="Payment Mode" value={selData?.payment_mode?.name ?? '—'} size="sm" />
                                    <FieldDisplay label="Payment Term" value={selData?.payment_term?.name ?? '—'} size="sm" />
                                    <FieldDisplay label="FOB"          value={selData?.fob?.name          ?? '—'} size="sm" />
                                </SimpleGrid>
                            )}
                        </SectionCard>

                        {/* ── Step 2: Quotation Details ── */}
                        {selId && (
                            <SectionCard title="Quotation Details">
                                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                                    <FieldDayPicker
                                        label="Quotation Date" name="quotation_date"
                                        placeholder="Select quotation date"
                                        required="Quotation date is required"
                                        size="sm"
                                        disabledDays={{ after: new Date() }}
                                    />
                                    <FieldDayPicker
                                        label="Expiry Date" name="expiry_date"
                                        placeholder="Select expiry date"
                                        required="Quotation expiry date is required"
                                        size="sm"
                                        disabledDays={{ before: new Date() }}
                                    />
                                    <FieldInput
                                        label="Remarks" name="remarks"
                                        placeholder="Overall quotation remarks"
                                        type="text" size="sm"
                                    />
                                    <FieldUpload
                                        label="Quotation File" name="quotation_file"
                                        placeholder="Upload quotation file"
                                        size="sm"
                                        reset={resetKey > 0}
                                    />
                                </SimpleGrid>
                            </SectionCard>
                        )}

                        {/* ── Step 3: Items ── */}
                        {selId && Object.keys(quoteItems).length > 0 && (
                            <LoadingOverlay isLoading={selFetching}>
                                <SectionCard title="Quotation Items">
                                    <Box overflowX="auto">
                                        <Table variant="striped" size="sm">
                                            <Thead>
                                                <Tr>
                                                    {['#', 'Part No', 'Description', 'UOM', 'Qty', 'Condition', 'Unit Price', 'Total Value', 'Remarks'].map(h => (
                                                        <DarkTh key={h}>{h}</DarkTh>
                                                    ))}
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {Object.values(quoteItems).map((item, i) => (
                                                    <Tr key={item.sales_log_item_id}>
                                                        <Td fontSize="xs">{i + 1}</Td>
                                                        <Td fontSize="xs" fontWeight="semibold">{item.part_name}</Td>
                                                        <Td fontSize="xs" color="gray.500" maxW="150px">
                                                            <Text noOfLines={2}>{item.description}</Text>
                                                        </Td>
                                                        <Td fontSize="xs">{item.uom}</Td>

                                                        {/* ── Qty — editable, max = original_qty ── */}
                                                        <Td minW="90px">
                                                            <FieldInput
                                                                name={`qty_${item.sales_log_item_id}`}
                                                                placeholder="Qty"
                                                                type="decimal"
                                                                size="sm"
                                                                defaultValue={String(item.qty ?? item.original_qty)}
                                                                maxValue={item.original_qty}
                                                                required="Qty required"
                                                                width={100}
                                                                onValueChange={(val) => updateItem(item.sales_log_item_id, 'qty', val)}
                                                            />
                                                        </Td>

                                                        {/* ── Condition ── */}
                                                        <Td minW="140px">
                                                            <FieldSelect
                                                                name={`condition_${item.sales_log_item_id}`}
                                                                placeholder="Condition"
                                                                options={conditionOptions}
                                                                menuPortalTarget={document.body}
                                                                size="sm"
                                                                defaultValue={item.condition_id || undefined}
                                                                onValueChange={(val) => updateItem(item.sales_log_item_id, 'condition_id', val ?? '')}
                                                            />
                                                        </Td>

                                                        {/* ── Unit Price ── */}
                                                        <Td minW="120px">
                                                            <FieldInput
                                                                name={`unit_price_${item.sales_log_item_id}`}
                                                                placeholder="0.00"
                                                                type="decimal"
                                                                size="sm"
                                                                defaultValue={item.unit_price > 0 ? String(item.unit_price) : ''}
                                                                onValueChange={(val) => updateItem(item.sales_log_item_id, 'unit_price', val)}
                                                                required="Unit Price required"
                                                            />
                                                        </Td>

                                                        {/* ── Total Value — computed live from fields ── */}
                                                        <Td fontSize="xs" fontWeight="semibold" color="blue.600" whiteSpace="nowrap">
                                                            {currencySymbol} {getLiveRowTotal(item).toFixed(2)}
                                                        </Td>

                                                        {/* ── Remarks ── */}
                                                        <Td minW="160px">
                                                            <FieldInput
                                                                name={`remarks_${item.sales_log_item_id}`}
                                                                placeholder="Remarks" type="text" size="sm"
                                                                defaultValue={item.remarks}
                                                                onValueChange={(val) => updateItem(item.sales_log_item_id, 'remarks', String(val ?? ''))}
                                                            />
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </Box>

                                    {/* Summary */}
                                    <Box bg="blue.50" border="1px solid" borderColor="blue.200"
                                        borderRadius="md" p={3} mt={3}>
                                        <HStack justify="flex-end" spacing={8}>
                                            <HStack spacing={2}>
                                                <Text fontSize="xs" color="gray.500">Total Items:</Text>
                                                <Badge colorScheme="blue">{Object.keys(quoteItems).length}</Badge>
                                            </HStack>
                                            <HStack spacing={2}>
                                                <Text fontSize="xs" color="gray.500">Total Value:</Text>
                                                <Text fontSize="xs" fontWeight="bold" color="blue.600">
                                                    {currencySymbol} {liveTotalValue.toFixed(2)}
                                                </Text>
                                            </HStack>
                                        </HStack>
                                    </Box>
                                </SectionCard>
                            </LoadingOverlay>
                        )}

                        {/* ── Actions ── */}
                        {selId && (
                            <HStack justify="center" spacing={3} mt={2}>
                                <Button colorScheme="red" size="sm"
                                    onClick={() => {
                                        form.reset();
                                        if (!isEdit) {
                                            setSelId(null);
                                            setQuoteItems({});
                                        }
                                        setResetKey(k => k + 1);
                                    }}>
                                    Reset
                                </Button>
                                <Button
                                    colorScheme="green" size="sm"
                                    onClick={handleOpenPreview}
                                    isDisabled={Object.keys(quoteItems).length === 0 || !selId}
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
                                        Object.keys(quoteItems).length === 0 ||
                                        saveSQ.isLoading ||
                                        (isEdit ? (!isFormValuesChanged || !form.isValid) : false)
                                    }
                                    isLoading={saveSQ.isLoading}
                                    loadingText={isEdit ? 'Updating…' : 'Creating…'}
                                >
                                    {isEdit ? 'Update Quotation' : 'Create Quotation'}
                                </Button>
                            </HStack>
                        )}

                    </Stack>
                </Formiz>
            </Stack>
        </SlideIn>
    );
};

export default SalesQuotationForm;