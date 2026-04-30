import { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon } from '@chakra-ui/icons';
import {
    Box, Button, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Checkbox, HStack, Heading, SimpleGrid, Stack, Table,
    Tbody, Td, Text, Th, Thead, Tr, Badge,
    FormControl, FormLabel, IconButton,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import FieldDisplay from '@/components/FieldDisplay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import LoadingOverlay from '@/components/LoadingOverlay';
import { usePurchaseOrderList, usePurchaseOrderDetails } from '@/services/purchase/order/service';
import {
    useInvoiceList, useProformaInvoiceList,
    useInvoiceDetails, useProformaInvoiceDetails,
} from '@/services/finance/invoice/service';
import { usePaymentReceiptDropdowns } from '@/services/finance/payment-receipt/service';
import { useSaveReturnOrder } from '@/services/purchase/return-order/service';
import { formatDate } from '@/helpers/commonHelper';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { LuInfo } from 'react-icons/lu';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceTab = 'invoice' | 'proforma';

interface ReturnItem {
    po_item_id: string;
    invoice_item_id: string;
    invoice_type: InvoiceTab;
    return_qty: number;
    return_amount: number;
    remarks: string;
    selected: boolean;
    max_qty: number;
    max_amount: number;   // ← returnable_amount from backend
    part_name: string;
    unit_price: number;
    pay_on_qty: number;
    pay_on_amount: number;
    returnable_amount: number;  // ← from backend
    is_fully_returned: boolean; // ← from backend
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d?: string | null) => d ? dayjs(d).format('DD-MMM-YYYY') : '—';

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

export const ReturnOrderForm = () => {
    const navigate = useNavigate();

    const [poId, setPoId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<InvoiceTab>('invoice');
    const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
    const [returnItems, setReturnItems] = useState<Record<string, ReturnItem>>({});
    const [resetKey, setResetKey] = useState(0);

    const debouncedSetPoId = useRef(debounce((v: string) => setPoId(v), 500)).current;

    // ── Data ──
    const { data: poList } = usePurchaseOrderList({ enabled: true });
    const { data: poDetails } = usePurchaseOrderDetails(poId ?? undefined, { enabled: !!poId });
    const { data: dropdownData } = usePaymentReceiptDropdowns();
    const { openPreview } = usePDFPreview();

    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const currencyCode = poDetails?.data?.currency?.code ?? '';

    // ── Invoice lists for this PO (only receipt-created ones) ──
    const { data: invoiceList, isLoading: invoiceListLoading } = useInvoiceList({
        enabled: !!poId,
        queryParams: {
            reference_type: 'purchase_order',
            is_receipt_created: true,
            reference_id: poId ?? '',
        },
    });
    const { data: proformaList, isLoading: proformaListLoading } = useProformaInvoiceList({
        enabled: !!poId,
        queryParams: {
            reference_type: 'purchase_order',
            is_receipt_created: true,
            reference_id: poId ?? '',
        },
    });

    // ── Selected invoice/proforma details ──
    const { data: invoiceDetails, isFetching: invDetailsFetching } = useInvoiceDetails(
        activeTab === 'invoice' && selectedInvId ? selectedInvId : undefined,
        { enabled: activeTab === 'invoice' && !!selectedInvId }
    );
    const { data: proformaDetails, isFetching: proDetailsFetching } = useProformaInvoiceDetails(
        activeTab === 'proforma' && selectedInvId ? selectedInvId : undefined,
        { enabled: activeTab === 'proforma' && !!selectedInvId }
    );

    const detailsFetching = invDetailsFetching || proDetailsFetching;
    const selectedInvData = activeTab === 'invoice' ? invoiceDetails?.data : proformaDetails?.data;
    const invoiceItems: any[] = (selectedInvData?.items as any[]) ?? [];

    const invoiceOptions = invoiceList?.data ?? [];
    const proformaOptions = proformaList?.data ?? [];

    // ── Init return items when invoice details load ──
    // Uses returnable_amount from backend as max_amount ──
    // ── Replace the existing useEffect with this ──
    useEffect(() => {
        if (!invoiceItems.length) { setReturnItems({}); return; }
        const init: Record<string, ReturnItem> = {};
        invoiceItems.forEach((item: any) => {
            const payOnAmt = parseFloat(item.pay_on_amount ?? 0);
            const payOnQty = parseInt(item.pay_on_qty ?? 0);
            const returnableAmt = parseFloat(item.returnable_amount ?? payOnAmt);
            const isFullyReturned = Boolean(item.is_fully_returned);
            const refItem = item.reference_item ?? {};
            const unitPrice = parseFloat(refItem.price ?? refItem.unit_price ?? 0);

            init[item.id] = {
                po_item_id: String(item.reference_item_id ?? ''),
                invoice_item_id: item.id,
                invoice_type: activeTab,
                return_qty: 0,
                return_amount: 0,
                remarks: '',
                selected: false,
                max_qty: payOnQty,
                max_amount: returnableAmt,
                part_name: refItem.part_number?.name ?? refItem.description ?? '—',
                unit_price: unitPrice,
                pay_on_qty: payOnQty,
                pay_on_amount: payOnAmt,
                returnable_amount: returnableAmt,
                is_fully_returned: isFullyReturned,
            };
        });
        setReturnItems(init);
    }, [
        selectedInvId,
        activeTab,
        // ← use JSON of returnable amounts as dep so it re-runs when values change
        JSON.stringify(
            invoiceItems.map((i: any) => ({
                id: i.id,
                returnable_amount: i.returnable_amount,
                is_fully_returned: i.is_fully_returned,
            }))
        ),
    ]);

    // ── Handlers ──
    const handleTabChange = (tab: InvoiceTab) => {
        setActiveTab(tab);
        setSelectedInvId(null);
        setReturnItems({});
    };

    const handlePoChange = (value: any) => {
        if (!value) return;
        setPoId(null);
        setSelectedInvId(null);
        setReturnItems({});
        debouncedSetPoId(value);
    };

    const handleInvoiceSelect = (value: any) => {
        setSelectedInvId(value ?? null);
        setReturnItems({});
    };

    const toggleSelect = (itemId: string) =>
        setReturnItems(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], selected: !prev[itemId].selected },
        }));

    const toggleSelectAll = () => {
        // Only select items that can be returned
        const selectableIds = Object.entries(returnItems)
            .filter(([, ri]) => !ri.is_fully_returned && ri.max_amount > 0)
            .map(([id]) => id);
        const allSelected = selectableIds.every(id => returnItems[id].selected);
        setReturnItems(prev => {
            const next = { ...prev };
            selectableIds.forEach(id => { next[id] = { ...next[id], selected: !allSelected }; });
            return next;
        });
    };

    const updateItem = (itemId: string, field: keyof ReturnItem, value: any) => {
        setReturnItems(prev => {
            const item = prev[itemId];
            const updated = { ...item, [field]: value };

            if (field === 'return_qty') {
                const qty = Math.min(Math.max(parseFloat(value) || 0, 0), item.max_qty);
                const amount = parseFloat(Math.min(qty * item.unit_price, item.max_amount).toFixed(2));
                updated.return_qty = qty;
                updated.return_amount = amount;
            }
            if (field === 'return_amount') {
                updated.return_amount = parseFloat(
                    Math.min(Math.max(parseFloat(value) || 0, 0), item.max_amount).toFixed(2)
                );
            }
            return { ...prev, [itemId]: updated };
        });
    };

    // ── Form ──
    const form = useForm({
        onValidSubmit: (values) => {
            if (!poId || !selectedInvId) return;
            const selectedItems = Object.values(returnItems).filter(
                i => i.selected && i.return_amount > 0
            );
            if (!selectedItems.length) return;

            saveReturnOrder.mutate({
                purchase_order_id: poId,
                invoice_reference_type: activeTab,
                invoice_reference_id: selectedInvId,
                return_date: formatDate(values.return_date) as string,
                remarks: values.remarks ?? '',
                payment_mode_id: values.payment_mode_id,
                items: selectedItems.map(i => ({
                    po_item_id: i.po_item_id,
                    invoice_item_id: i.invoice_item_id,
                    invoice_type: i.invoice_type,
                    return_qty: i.return_qty,
                    return_amount: i.return_amount,
                    remarks: i.remarks,
                })),
            });
        },
    });

    const saveReturnOrder = useSaveReturnOrder({
        onSuccess: () => {
            form.reset();
            setPoId(null);
            setSelectedInvId(null);
            setReturnItems({});
            setResetKey(k => k + 1);
        },
    });

    const selectedItems = Object.values(returnItems).filter(i => i.selected);
    const totalReturnAmt = selectedItems.reduce((s, i) => s + i.return_amount, 0);
    const allSelectable = Object.values(returnItems).filter(
        ri => !ri.is_fully_returned && ri.max_amount > 0
    );
    const allSelected = allSelectable.length > 0 && allSelectable.every(ri => ri.selected);

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
                                <BreadcrumbLink as={Link} to="/finance/return-order">Return Orders</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>Create Return Order</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">Create Return Order</Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />}
                        size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <Formiz autoForm connect={form}>
                    <Stack spacing={4} p={4} bg="white" borderRadius="md" boxShadow="md">

                        {/* ── Step 1: PO Selection ── */}
                        <SectionCard title="Purchase Order">
                            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                                <Box>
                                    <FormControl>
                                        <FormLabel fontSize="sm" minH="20px">Purchase Order</FormLabel>
                                        <HStack spacing={2} align="center">
                                            <IconButton
                                                aria-label="Preview PO" color="black" variant="unstyled"
                                                boxShadow="none" minW="auto" size="sm"
                                                background="transparent !important" border="none"
                                                icon={<LuInfo size={18} />}
                                                isDisabled={!poId}
                                                onClick={() => {
                                                    if (poId) {
                                                        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.purchase_order.replace(':id', poId)}`;
                                                        openPreview(url, 'Purchase Order Preview', true);
                                                    }
                                                }}
                                                _disabled={{ background: 'transparent', border: 'none', opacity: 0.4, cursor: 'not-allowed' }}
                                            />
                                            <FieldSelect
                                                key={`po_${resetKey}`}
                                                name="purchase_order_id"
                                                placeholder="Select PO..."
                                                options={poList?.data ?? []}
                                                onValueChange={handlePoChange}
                                                isClearable size="sm"
                                            />
                                        </HStack>
                                    </FormControl>
                                </Box>
                                <FieldDisplay label="PO Date" value={fmt(poDetails?.data?.created_at)} size="sm" />
                                <FieldDisplay label="PO Value" value={`${currencyCode} ${poDetails?.data?.total_value ?? '—'}`} size="sm" />
                                <FieldDisplay label="Paid" value={`${currencyCode} ${poDetails?.data?.total_paid ?? '—'}`} size="sm" />
                            </SimpleGrid>
                        </SectionCard>

                        {/* ── Step 2: Invoice / Proforma Selection ── */}
                        {poId && (
                            <LoadingOverlay isLoading={invoiceListLoading || proformaListLoading}>
                                <SectionCard title="Select Invoice">
                                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                                        <FieldSelect
                                            key={`inv_type_${resetKey}`}
                                            label="Invoice Type" name="invoice_type"
                                            placeholder="Select type..."
                                            options={[
                                                { value: 'invoice', label: 'Invoice' },
                                                { value: 'proforma', label: 'Proforma Invoice' },
                                            ]}
                                            onValueChange={(val) => handleTabChange((val as InvoiceTab) ?? 'invoice')}
                                            isClearable size="sm"
                                        />
                                        <Box>
                                            <FormControl>
                                                <FormLabel fontSize="sm" minH="20px">
                                                    {activeTab === 'invoice' ? 'Invoice No' : 'Proforma Invoice No'}
                                                </FormLabel>
                                                <HStack spacing={2} align="center">
                                                    <IconButton
                                                        aria-label="Preview invoice" color="black" variant="unstyled"
                                                        boxShadow="none" minW="auto" size="sm"
                                                        background="transparent !important" border="none"
                                                        icon={<LuInfo size={18} />}
                                                        isDisabled={!selectedInvId}
                                                        onClick={() => {
                                                            if (selectedInvId) {
                                                                const ep = activeTab === 'proforma' ? endPoints.preview.proforma_invoice : endPoints.preview.invoice;
                                                                const label = activeTab === 'proforma' ? 'Proforma Invoice Preview' : 'Invoice Preview';
                                                                openPreview(`${import.meta.env.VITE_PUBLIC_API_URL}${ep.replace(':id', selectedInvId)}`, label, true);
                                                            }
                                                        }}
                                                        _disabled={{ background: 'transparent', border: 'none', opacity: 0.4, cursor: 'not-allowed' }}
                                                    />
                                                    <FieldSelect
                                                        key={`inv_${activeTab}_${resetKey}`}
                                                        name="invoice_id"
                                                        placeholder="Select..."
                                                        options={activeTab === 'invoice' ? invoiceOptions : proformaOptions}
                                                        onValueChange={handleInvoiceSelect}
                                                        isDisabled={!activeTab}
                                                        isClearable size="sm"
                                                    />
                                                </HStack>
                                            </FormControl>
                                        </Box>
                                        {selectedInvData && (
                                            <>
                                                <FieldDisplay
                                                    label="Invoice Amount"
                                                    value={`${currencyCode} ${parseFloat(String(selectedInvData.invoice_amount ?? 0)).toFixed(2)}`}
                                                    size="sm"
                                                />
                                                <FieldDisplay
                                                    label="Returnable Amount"
                                                    value={`${currencyCode} ${parseFloat(String((selectedInvData as any).returnable_amount ?? selectedInvData.invoice_amount ?? 0)).toFixed(2)}`}
                                                    size="sm"
                                                />
                                            </>
                                        )}
                                    </SimpleGrid>
                                </SectionCard>
                            </LoadingOverlay>
                        )}

                        {/* ── Step 3: Items ── */}
                        {selectedInvId && (
                            <LoadingOverlay isLoading={detailsFetching}>
                                <SectionCard title="Select Items to Return">
                                    {invoiceItems.length === 0 ? (
                                        <Text fontSize="sm" color="gray.400" textAlign="center" py={4}>
                                            No items found in this {activeTab === 'invoice' ? 'invoice' : 'proforma invoice'}.
                                        </Text>
                                    ) : (
                                        <>
                                            <Box overflowX="auto">
                                                <Table variant="striped" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <DarkTh>
                                                                <Checkbox
                                                                    isChecked={allSelected}
                                                                    onChange={toggleSelectAll}
                                                                    colorScheme="whiteAlpha"
                                                                    borderColor="white"
                                                                />
                                                            </DarkTh>
                                                            {['#', 'Item', 'Invoiced Qty', 'Invoiced Amt', 'Returnable', 'Return Qty', 'Return Amount', 'Remarks'].map(h => (
                                                                <DarkTh key={h}>{h}</DarkTh>
                                                            ))}
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {invoiceItems.map((item: any, i: number) => {
                                                            const ri = returnItems[item.id];
                                                            if (!ri) return null;
                                                            // ── canReturn uses returnable_amount from backend ──
                                                            const canReturn = !ri.is_fully_returned && ri.returnable_amount > 0;

                                                            return (
                                                                <Tr key={item.id}
                                                                    bg={ri.is_fully_returned ? 'red.50' : ri.selected ? 'blue.50' : undefined}
                                                                    opacity={!canReturn ? 0.6 : 1}>
                                                                    <Td>
                                                                        <Checkbox
                                                                            isChecked={ri.selected}
                                                                            isDisabled={!canReturn}
                                                                            onChange={() => toggleSelect(item.id)}
                                                                            colorScheme="blue"
                                                                        />
                                                                    </Td>
                                                                    <Td fontSize="xs">{i + 1}</Td>
                                                                    <Td fontSize="xs" fontWeight="semibold">
                                                                        {ri.part_name}
                                                                        {ri.is_fully_returned && (
                                                                            <Badge ml={1} colorScheme="red" variant="subtle" fontSize="9px">
                                                                                Fully Returned
                                                                            </Badge>
                                                                        )}
                                                                        {!ri.is_fully_returned && !canReturn && (
                                                                            <Text fontSize="9px" color="gray.400">No amount invoiced</Text>
                                                                        )}
                                                                    </Td>
                                                                    <Td fontSize="xs">{ri.pay_on_qty || '—'}</Td>
                                                                    <Td fontSize="xs" color="blue.600" fontWeight="semibold">
                                                                        {currencyCode} {ri.pay_on_amount.toFixed(2)}
                                                                    </Td>
                                                                    {/* ── Returnable amount ── */}
                                                                    <Td fontSize="xs" color={ri.is_fully_returned ? 'red.400' : 'green.600'} fontWeight="semibold">
                                                                        {ri.is_fully_returned
                                                                            ? '—'
                                                                            : `${currencyCode} ${ri.returnable_amount.toFixed(2)}`
                                                                        }
                                                                    </Td>
                                                                    <Td>
                                                                        <FieldInput
                                                                            name={`return_qty_${item.id}`}
                                                                            placeholder="0" type="number" size="sm"
                                                                            inputProps={{ width: '80px', min: 0, max: ri.max_qty }}
                                                                            isDisabled={!ri.selected || ri.max_qty === 0}
                                                                            defaultValue={String(ri.return_qty || '')}
                                                                            onValueChange={(val) => updateItem(item.id, 'return_qty', val)}
                                                                        />
                                                                    </Td>
                                                                    <Td>
                                                                        <FieldInput
                                                                            name={`return_amount_${item.id}`}
                                                                            placeholder="0.00" type="decimal" size="sm"
                                                                            inputProps={{ width: '100px' }}
                                                                            isDisabled={!ri.selected}
                                                                            defaultValue={String(ri.return_amount || '')}
                                                                            onValueChange={(val) => updateItem(item.id, 'return_amount', val)}
                                                                            maxValue={ri.returnable_amount}  // ← capped at returnable
                                                                        />
                                                                    </Td>
                                                                    <Td>
                                                                        <FieldInput
                                                                            name={`remarks_${item.id}`}
                                                                            placeholder="Reason" type="text" size="sm"
                                                                            inputProps={{ width: '160px' }}
                                                                            isDisabled={!ri.selected}
                                                                            defaultValue={ri.remarks}
                                                                            onValueChange={(val) => updateItem(item.id, 'remarks', String(val ?? ''))}
                                                                        />
                                                                    </Td>
                                                                </Tr>
                                                            );
                                                        })}
                                                    </Tbody>
                                                </Table>
                                            </Box>

                                            {/* Summary */}
                                            {selectedItems.length > 0 && (
                                                <Box bg="blue.50" border="1px solid" borderColor="blue.200"
                                                    borderRadius="md" p={3} mt={3}>
                                                    <HStack justify="flex-end" spacing={8}>
                                                        <HStack spacing={2}>
                                                            <Text fontSize="xs" color="gray.500">Selected Items:</Text>
                                                            <Badge colorScheme="blue">{selectedItems.length}</Badge>
                                                        </HStack>
                                                        <HStack spacing={2}>
                                                            <Text fontSize="xs" color="gray.500">Total Return:</Text>
                                                            <Text fontSize="xs" fontWeight="bold" color="red.500">
                                                                {currencyCode} {totalReturnAmt.toFixed(2)}
                                                            </Text>
                                                        </HStack>
                                                    </HStack>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </SectionCard>
                            </LoadingOverlay>
                        )}

                        {/* ── Step 4: Return Details ── */}
                        {selectedInvId && (
                            <SectionCard title="Return Details">
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <FieldDayPicker
                                        label="Return Date" name="return_date"
                                        placeholder="Select return date"
                                        required="Return date is required"
                                        size="sm"
                                        disabledDays={{ after: new Date() }}
                                    />
                                    <FieldSelect
                                        key={`payment_mode_${resetKey}`}
                                        label="Payment Mode" name="payment_mode_id"
                                        placeholder="Select mode..."
                                        options={paymentModeOptions}
                                        required="Payment mode is required"
                                        size="sm"
                                    />
                                    <FieldInput
                                        label="Remarks" name="remarks"
                                        placeholder="Overall return remarks"
                                        type="text" size="sm"
                                    />
                                </SimpleGrid>
                            </SectionCard>
                        )}

                        {/* ── Actions ── */}
                        {selectedInvId && (
                            <HStack justify="center" spacing={3} mt={2}>
                                <Button colorScheme="red" size="sm"
                                    onClick={() => {
                                        form.reset();
                                        setPoId(null);
                                        setSelectedInvId(null);
                                        setReturnItems({});
                                        setResetKey(k => k + 1);
                                    }}>
                                    Reset
                                </Button>
                                <Button type="submit" colorScheme="brand" size="sm"
                                    isDisabled={selectedItems.length === 0 || saveReturnOrder.isLoading}
                                    isLoading={saveReturnOrder.isLoading}
                                    loadingText="Creating…">
                                    Create Return Order
                                </Button>
                            </HStack>
                        )}

                    </Stack>
                </Formiz>
            </Stack>
        </SlideIn>
    );
};

export default ReturnOrderForm;