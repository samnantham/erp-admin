import { useEffect, useRef, useState } from 'react';

import { ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';
import {
    Badge, Box, Button, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Center, HStack, Heading, SimpleGrid, Stack, Table, Tbody, Td,
    Text, Th, Thead, Tr, Alert, AlertIcon, Menu, MenuButton, Portal,
    MenuList, MenuItem, useDisclosure,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { HiArrowNarrowLeft, HiEye } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';

import { FieldDayPicker } from '@/components/FieldDayPicker';
import FieldDisplay from '@/components/FieldDisplay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldUpload } from '@/components/FieldUpload';
import LoadingOverlay from '@/components/LoadingOverlay';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { BankModal } from '@/components/Modals/CustomerMaster/Bank';
import { useSubmasterItemIndex } from '@/services/submaster/service';
import {
    usePaymentReceiptDropdowns,
    useSavePaymentReceipt,
    usePaymentReceiptIndex,
    PaymentReceiptVariables,
} from '@/services/finance/payment-receipt/service';
import {
    useInvoiceDetails,
    useInvoiceList,
    useProformaInvoiceList,
    useProformaInvoiceDetails,
} from '@/services/finance/invoice/service';
import { useCustomerDetails, useCustomerRelationIndex } from '@/services/master/customer/service';
import { usePurchaseOrderDetails, usePurchaseOrderList } from '@/services/purchase/order/service';
import { useReturnOrderList, useReturnOrderDetails } from '@/services/purchase/return-order/service';
import { formatDate } from '@/helpers/commonHelper';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import { PaymentReceiptInfoModal } from '@/components/Modals/Finance/PaymentReceipt/Preview';

// ─── Types ────────────────────────────────────────────────────────────────────

// ← Strict types matching PaymentReceiptVariables — no empty string
type EntryType = 'credit' | 'debit';
type ReferType = 'po' | 'rpo' | 'lo' | 'so' | 'ro';
type InvoiceType = 'invoice' | 'proforma'; // ← return_order is NOT an invoice type, handled separately

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTRY_TYPE_OPTIONS = [
    { value: 'debit', label: 'Account Payable' },
    { value: 'credit', label: 'Account Receivable' },
];

const PAYABLE_OPTIONS = [
    { value: 'po', label: 'Purchase' },
    { value: 'rpo', label: 'Repair', isDisabled: true },
    { value: 'lo', label: 'Logistics', isDisabled: true },
];

const RECEIVABLE_OPTIONS = [
    { value: 'so', label: 'Sales', isDisabled: true },
    { value: 'ro', label: 'Return Order' },
];

const INVOICE_TYPE_OPTIONS = [
    { value: 'proforma', label: 'Proforma' },
    { value: 'invoice', label: 'Tax Invoice' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (date?: string | null) => date ? dayjs(date).format('DD-MMM-YYYY') : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({
    title, badge, children,
}: { title?: string; badge?: string; children: React.ReactNode }) => (
    <Box bg="white" borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
        {title && (
            <HStack px={5} py={3} bg="#0C2556"
                borderBottom="1px solid" borderColor="gray.200"
                borderTopLeftRadius="md" borderTopRightRadius="md">
                <Text fontWeight="semibold" fontSize="sm" color="white">{title}</Text>
                {badge && <Badge bg="white" color="#0C2556" fontSize="xs">{badge}</Badge>}
            </HStack>
        )}
        <Box p={5}>{children}</Box>
    </Box>
);

const DarkTh = ({ children }: { children: string }) => (
    <Th bg="#0C2556" color="white" fontSize="xs" letterSpacing="wide" fontWeight="medium" py={2}>
        {children}
    </Th>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PaymentReceiptForm = () => {
    const navigate = useNavigate();

    // ── UI state ──
    const [resetKey, setResetKey] = useState(0);

    // ── Entry classification — nullable so form can be empty ──
    const [entryType, setEntryType] = useState<EntryType | null>(null);
    const [referType, setReferType] = useState<ReferType | null>(null);
    const [invoiceType, setInvoiceType] = useState<InvoiceType | null>(null);
    const [invoiceId, setInvoiceId] = useState<string | null>(null);

    // ── Reference ──
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [customerBankId, setCustomerBankId] = useState<any>(null);
    const [paymentViaId, setPaymentViaId] = useState<string | null>(null);

    // ── Display state ──
    const [orderDate, setOrderDate] = useState('—');
    const [orderValue, setOrderValue] = useState('—');
    const [vendorName, setVendorName] = useState('—');
    const [vendorCode, setVendorCode] = useState('—');
    const [paymentTerms, setPaymentTerms] = useState('—');
    const [invoiceAmt, setInvoiceAmt] = useState('—');

    // ── Return Order state ──
    const [returnOrderId, setReturnOrderId] = useState<string | null>(null);

    const [selectedReceiptId, setSelectedReceiptId] = useState<string | undefined>();
    const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();

    // ── Dropdowns ──
    const { data: dropdownData, isLoading: dropdownLoading } = usePaymentReceiptDropdowns();
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentViaOptions = dropdownData?.payment_vias ?? [];
    const financeBankOptions = dropdownData?.finance_banks ?? [];
    const financeCardOptions = dropdownData?.finance_cards ?? [];
    const financeChequeOptions = dropdownData?.finance_cheques ?? [];

    const { data: paymentViaItems } = useSubmasterItemIndex('payment-vias', {});
    const paymentVias: any[] = paymentViaItems?.data ?? [];

    const { data: existingReceipts, isLoading: receiptsLoading } = usePaymentReceiptIndex(
        { order_reference_id: referenceId ?? '', refer_type: referType ?? '' },
    );
    const existingReceiptsList = existingReceipts?.data ?? [];

    const { openPreview } = usePDFPreview();

    const handleOpenPreview = (itemInfo: any) => {
        const isProforma = itemInfo.reference_type === 'proforma';
        const endpoint = isProforma ? endPoints.preview.proforma_invoice : endPoints.preview.invoice;
        const label = isProforma ? 'Proforma Invoice' : 'Invoice';
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endpoint.replace(':id', itemInfo.reference_id)}`;
        openPreview(url, `${label} Preview - #${itemInfo.code}`, true);
    };

    const handleOpenReturnOrderPreview = (id: string, code: string) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.return_order.replace(':id', id)}`;
        openPreview(url, `Return Order Preview - #${code}`, true);
    };

    const selectedPaymentVia = paymentVias.find((o: any) => String(o.id) === String(paymentViaId));
    const paymentModeLabel = selectedPaymentVia?.code?.toLowerCase() ?? '';
    const isCard = paymentModeLabel === 'card';
    const isCheque = paymentModeLabel === 'cheque';
    const isBank = paymentModeLabel === 'bank';

    // ── PO / RO data ──
    const { data: purchaseOrderList } = usePurchaseOrderList({ enabled: referType === 'po' });
    const { data: returnOrderList, isLoading: returnOrderListLoading } = useReturnOrderList({ enabled: referType === 'ro' });

    const purchaseOrderOptions = purchaseOrderList?.data ?? [];
    const returnOrderOptions = returnOrderList?.data ?? [];

    const isValidPO = referType === 'po' && !!referenceId;

    const { data: poDetails, isFetching: poFetching } = usePurchaseOrderDetails(
        isValidPO ? referenceId! : undefined,
        { enabled: isValidPO }
    );
    const { data: returnOrderDetails, isFetching: roFetching } = useReturnOrderDetails(
        returnOrderId ?? undefined,
        { enabled: !!returnOrderId && referType === 'ro' }
    );
    const roData = returnOrderDetails?.data;

    // ── Customer data ──
    const { data: customerDetails, isLoading: customerDetailsLoading } = useCustomerDetails(
        customerId ?? '', { enabled: !!customerId }
    );
    const { data: customerBankList, isLoading: bankLoading, refetch: reloadCustomerBanks } =
        useCustomerRelationIndex(customerId ?? '', 'banks', { enabled: !!customerId });
    const custBankOptions = customerBankList?.data?.map((i: any) => ({
        value: i.id, label: i.beneficiary_name,
    })) ?? [];

    // ── Invoice lists ──
    const { data: invoiceList } = useInvoiceList();
    const { data: proformaList } = useProformaInvoiceList();
    const proformaOptions = proformaList?.data ?? [];
    const taxOptions = invoiceList?.data ?? [];

    // ── Selected invoice details ──
    const { data: proformaDetails, isFetching: proformaDetailsFetching } = useProformaInvoiceDetails(
        invoiceType === 'proforma' && invoiceId ? invoiceId : undefined,
        { enabled: invoiceType === 'proforma' && !!invoiceId }
    );
    const { data: taxInvoiceDetails, isFetching: taxDetailsFetching } = useInvoiceDetails(
        invoiceType === 'invoice' && invoiceId ? invoiceId : undefined,
        { enabled: invoiceType === 'invoice' && !!invoiceId }
    );
    const invoiceDetailsFetching = proformaDetailsFetching || taxDetailsFetching;
    const selectedInvoiceData = invoiceType === 'proforma' ? proformaDetails?.data : taxInvoiceDetails?.data;
    const isInvoiceReady = selectedInvoiceData?.is_ready_for_receipt ?? false;

    // ── Forms ──
    const classificationForm = useForm({});
    const receiptForm = useForm({
        onValidSubmit: (values) => {
            // ── PO flow ──
            if (referType === 'po') {
                if (!referenceId || !invoiceType || !invoiceId || !isInvoiceReady || !entryType) return;
                const payload: PaymentReceiptVariables = {
                    type: entryType,
                    refer_type: referType,
                    reference_type: invoiceType,        // 'invoice' | 'proforma'
                    reference_id: invoiceId,
                    order_reference_id: referenceId,
                    customer_bank_id: values.customer_bank_id,
                    payment_mode_id: values.payment_mode_id,
                    payment_via_id: values.payment_via_id,
                    ...(isCard && { finance_card_id: values.finance_card_id }),
                    ...(isBank && { finance_bank_id: values.finance_bank_id }),
                    ...(isCheque && { finance_cheque_id: values.finance_cheque_id }),
                    bank_receipt_number: values.bank_receipt_number,
                    payment_value: Number(values.payment_value),
                    payment_receipt_file: values.payment_receipt_file ?? '',
                    payment_date: formatDate(values.payment_date) as string,
                    remarks: values.remarks ?? '',
                };
                savePaymentReceipt.mutate(payload);
            }

            // ── Return Order flow ──
            if (referType === 'ro') {
                if (!returnOrderId || !roData) return;
                const payload: PaymentReceiptVariables = {
                    type: 'credit',         // ← always credit for return
                    refer_type: 'ro',
                    reference_type: 'return_order',   // ← polymorphic reference
                    reference_id: returnOrderId,
                    order_reference_id: roData.purchase_order_id,
                    customer_bank_id: values.customer_bank_id,
                    payment_mode_id: values.payment_mode_id,
                    payment_via_id: values.payment_via_id,
                    ...(isCard && { finance_card_id: values.finance_card_id }),
                    ...(isBank && { finance_bank_id: values.finance_bank_id }),
                    ...(isCheque && { finance_cheque_id: values.finance_cheque_id }),
                    bank_receipt_number: values.bank_receipt_number,
                    payment_value: Number(values.payment_value),
                    payment_receipt_file: values.payment_receipt_file ?? '',
                    payment_date: formatDate(values.payment_date) as string,
                    remarks: values.remarks ?? '',
                };
                savePaymentReceipt.mutate(payload);
            }
        },
    });

    const handleAddNewSuccess = (
        fieldName: string,
        targetForm: ReturnType<typeof useForm>,
        refetch: () => void,
    ) => (data: any) => {
        const record = data?.data ?? data;
        refetch();
        setTimeout(() => targetForm.setValues({ [fieldName]: record?.id }), 150);
    };

    const savePaymentReceipt = useSavePaymentReceipt({
        onSuccess: () => { receiptForm.reset(); clearSelections(); bumpReset(); },
    });

    const debouncedSetRefId = useRef(debounce((value: string) => setReferenceId(value), 500)).current;

    const bumpReset = () => { setEntryType(null); setResetKey((k) => k + 1); };

    const clearSelections = () => {
        debouncedSetRefId.cancel();
        setReferenceId(null); setCustomerId(null);
        setInvoiceId(null); setInvoiceType(null);
        setOrderDate('—'); setOrderValue('—');
        setVendorName('—'); setVendorCode('—');
        setPaymentTerms('—'); setInvoiceAmt('—');
        setCustomerBankId(null); setPaymentViaId(null);
        setReturnOrderId(null);
    };

    const handleEntryTypeChange = (value: any) => {
        setEntryType(value ? (value as EntryType) : null);
        setReferType(null);
        clearSelections();
    };
    const handleReferTypeChange = (value: any) => {
        setReferType(value ? (value as ReferType) : null);
        clearSelections();
    };
    const handleRefIdChange = (value: any) => {
        if (!value) {
            debouncedSetRefId.cancel();
            clearSelections();
            return;
        }
        setReferenceId(null);
        debouncedSetRefId(value);
    };
    const handleInvoiceTypeChange = (value: any) => {
        setInvoiceType(value ? (value as InvoiceType) : null);
        setInvoiceId(null);
        setInvoiceAmt('—');
        setCustomerBankId(null);
        receiptForm.setValues({ customer_bank_id: '' });
    };
    const handleInvoiceIdChange = (value: any) => {
        setInvoiceId(value ?? null);
        setCustomerBankId(null);
        receiptForm.setValues({ customer_bank_id: '' });
    };
    const handleReturnOrderChange = (value: any) => {
        setReturnOrderId(value ?? null);
        setCustomerBankId(null);
        receiptForm.setValues({ customer_bank_id: '', payment_value: '' });
    };

    // ── Effects — PO flow ──
    useEffect(() => {

        if (referType === 'po' && (!referenceId || !poDetails?.data)) {
            setOrderDate('—');
            setOrderValue('—');
            setPaymentTerms('—');
            return;
        }

        if (!poDetails?.data) return; // extra safety

        const { customer_id, total_price, created_at, payment_term } = poDetails.data;

        setCustomerId(customer_id ?? null);
        setOrderDate(fmt(created_at));
        setOrderValue(String(total_price ?? '—'));
        setPaymentTerms(payment_term?.name ?? '—');

    }, [referenceId, poDetails, referType]);

    useEffect(() => {
        if (!customerId || !customerDetails?.data) { setVendorName('—'); setVendorCode('—'); return; }
        setVendorName(customerDetails.data.business_name ?? '—');
        setVendorCode(customerDetails.data.code ?? '—');
        receiptForm.setValues({ payment_mode_id: customerDetails.data.payment_mode_id });
    }, [customerId, customerDetails]);

    useEffect(() => {
        if (!selectedInvoiceData?.customer_bank_id) return;
        const bid = String(selectedInvoiceData.customer_bank_id);
        setCustomerBankId(bid);
        receiptForm.setValues({ customer_bank_id: bid });
    }, [selectedInvoiceData?.customer_bank_id]);

    useEffect(() => {
        if (invoiceType !== 'invoice' || !invoiceId || !taxInvoiceDetails?.data) {
            if (invoiceType === 'invoice') setInvoiceAmt('—'); return;
        }
        setInvoiceAmt(String(taxInvoiceDetails.data.invoice_amount ?? '—'));
        receiptForm.setValues({ payment_value: taxInvoiceDetails.data.invoice_amount.toFixed(2) });
    }, [invoiceId, invoiceType, taxInvoiceDetails]);

    useEffect(() => {
        if (invoiceType !== 'proforma' || !invoiceId || !proformaDetails?.data) {
            if (invoiceType === 'proforma') setInvoiceAmt('—'); return;
        }
        setInvoiceAmt(String(proformaDetails.data.invoice_amount ?? '—'));
        receiptForm.setValues({ payment_value: proformaDetails.data.invoice_amount.toFixed(2) });
    }, [invoiceId, invoiceType, proformaDetails]);

    useEffect(() => { setInvoiceAmt('—'); }, [invoiceType]);

    // ── Effects — Return Order flow ──
    useEffect(() => {
        if (!roData) return;
        console.log()
        const po = roData.purchase_order as any;
        const customer = po?.customer as any;
        setOrderDate(fmt(roData.return_date));
        setOrderValue(String(roData.total_return_amount ?? '—'));
        setVendorName(customer?.business_name ?? '—');
        setVendorCode(customer?.code ?? '—');
        setCustomerId(customer?.id ?? null);
        setReferenceId(roData.purchase_order_id);
        receiptForm.setValues({ payment_value: Number(roData.total_return_amount ?? 0).toFixed(2) });

        const invRef = roData.invoice_reference as any;
        if (invRef?.customer_bank_id) {
            const bid = String(invRef.customer_bank_id);
            setCustomerBankId(bid);
            receiptForm.setValues({ customer_bank_id: bid });
        }
    }, [roData]);

    // ── Bank details HTML ──
    const selectedBank = customerBankList?.data?.find((i: any) => String(i.id) === String(customerBankId));
    const bankDetails = selectedBank ? `
        <table style="border-collapse:collapse;">
            <tr><td style="font-weight:700;padding-right:8px;">Name</td><td>:</td><td>${selectedBank.name || '—'} (${selectedBank.type_of_ac || '—'})</td></tr>
            <tr><td style="font-weight:700;padding-right:8px;">Beneficiary</td><td>:</td><td>${selectedBank.beneficiary_name || '—'}</td></tr>
            <tr><td style="font-weight:700;padding-right:8px;">Branch</td><td>:</td><td>${selectedBank.branch || '—'}</td></tr>
            <tr><td style="font-weight:700;padding-right:8px;">IBAN</td><td>:</td><td>${selectedBank.ac_iban_no || '—'}</td></tr>
            <tr><td style="font-weight:700;padding-right:8px;">SWIFT</td><td>:</td><td>${selectedBank.swift || '—'}</td></tr>
        </table>` : '—';

    // ── Derived ──
    const isReferenceSet = referType === 'ro' ? !!returnOrderId : !!referenceId;
    const orderLabel = referType === 'ro' ? 'Return Order' : referType === 'lo' ? 'LO' : 'PO';
    const invoiceLabel = invoiceType === 'proforma' ? 'Proforma' : 'Tax';
    const showForm = !!entryType && !!referType;
    const isReturnOrder = referType === 'ro';
    const isUnsupported = showForm && referType !== 'po' && referType !== 'ro';

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Header */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm"
                            separator={<ChevronRightIcon boxSize={5} color="gray.400" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/finance/payment-receipt">Payment Receipt</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>Create Receipt</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">Create Payment Receipt</Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />}
                        size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <Stack spacing={3} p={4} bg="white" borderRadius="md" boxShadow="md">

                    {/* ── Step 1: Entry Classification ── */}
                    <SectionCard title="Entry Classification">
                        <Formiz autoForm connect={classificationForm}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FieldSelect
                                    key={`entry_type_${resetKey}`}
                                    label="Type of Entry" name="entry_type"
                                    placeholder="Select entry type..."
                                    options={ENTRY_TYPE_OPTIONS}
                                    required="Type is required"
                                    onValueChange={handleEntryTypeChange}
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`refer_type_${entryType}_${resetKey}`}
                                    label={entryType === 'debit' ? 'Payable Category' : 'Receivable Category'}
                                    name="refer_type"
                                    placeholder="Select category..."
                                    options={entryType === 'debit' ? PAYABLE_OPTIONS : RECEIVABLE_OPTIONS}
                                    required="Category is required"
                                    onValueChange={handleReferTypeChange}
                                    isDisabled={!entryType}
                                    size="sm"
                                />
                            </SimpleGrid>
                        </Formiz>
                    </SectionCard>

                    {/* ── Step 2: Main Form ── */}
                    {showForm && (
                        <LoadingOverlay isLoading={poFetching || roFetching}>
                            {isUnsupported ? (
                                <SectionCard>
                                    <Center py={10}>
                                        <Stack align="center" spacing={2}>
                                            <Text fontSize="lg">🚧</Text>
                                            <Text color="gray.500" fontSize="sm">This option is coming soon. Stay tuned!</Text>
                                        </Stack>
                                    </Center>
                                </SectionCard>
                            ) : (
                                <Formiz autoForm connect={receiptForm}>
                                    <Stack spacing={4}>

                                        {/* ── 2a: Reference Section ── */}
                                        {isReturnOrder ? (
                                            <SectionCard title="Return Order Details">
                                                <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                                                    <FieldSelect
                                                        key={`ro_id_${resetKey}`}
                                                        label="Return Order" name="return_order_id"
                                                        placeholder="Select Return Order..."
                                                        options={returnOrderOptions}
                                                        selectProps={{ isLoading: returnOrderListLoading }}
                                                        onValueChange={handleReturnOrderChange}
                                                        isClearable size="sm"
                                                    />
                                                    <FieldDisplay label="Vendor Name" value={vendorName} size="sm" />
                                                    <FieldDisplay label="Vendor Code" value={vendorCode} size="sm" />
                                                    <FieldDisplay label="Return Date" value={orderDate} size="sm" />
                                                    <FieldDisplay label="Return Amount" value={orderValue} size="sm" />
                                                </SimpleGrid>

                                                {roData && (
                                                    <Box mt={4}>
                                                        <HStack mb={2} justify="space-between">
                                                            <Text fontSize="xs" fontWeight="semibold" color="gray.500"
                                                                textTransform="uppercase" letterSpacing="wide">
                                                                Return Items
                                                            </Text>
                                                            <HStack spacing={2}>
                                                                <Badge colorScheme={roData.invoice_reference_type === 'invoice' ? 'blue' : 'purple'}
                                                                    variant="subtle" fontSize="9px">
                                                                    {roData.invoice_reference_type === 'invoice' ? 'INV' : 'PINV'}
                                                                </Badge>
                                                                <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                                                                    {roData.invoice_reference_code}
                                                                </Text>
                                                                <Button size="xs" variant="ghost" colorScheme="blue"
                                                                    leftIcon={<HiEye />}
                                                                    onClick={() => handleOpenReturnOrderPreview(roData.id, roData.code)}>
                                                                    Preview RPO
                                                                </Button>
                                                            </HStack>
                                                        </HStack>
                                                        <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                                                            <Table variant="striped" size="sm">
                                                                <Thead>
                                                                    <Tr>
                                                                        {['#', 'Item', 'Return Qty', 'Return Amount', 'Remarks'].map(h => (
                                                                            <DarkTh key={h}>{h}</DarkTh>
                                                                        ))}
                                                                    </Tr>
                                                                </Thead>
                                                                <Tbody>
                                                                    {(roData.items ?? []).map((item: any, i: number) => (
                                                                        <Tr key={item.id}>
                                                                            <Td fontSize="xs">{i + 1}</Td>
                                                                            <Td fontSize="xs" fontWeight="semibold">
                                                                                {item.po_item?.part_number?.name ?? '—'}
                                                                            </Td>
                                                                            <Td fontSize="xs">{item.return_qty ?? '—'}</Td>
                                                                            <Td fontSize="xs" color="red.500" fontWeight="semibold">
                                                                                {Number(item.return_amount ?? 0).toFixed(2)}
                                                                            </Td>
                                                                            <Td fontSize="xs" color="gray.500">{item.remarks || '—'}</Td>
                                                                        </Tr>
                                                                    ))}
                                                                </Tbody>
                                                            </Table>
                                                        </Box>
                                                        <Box bg="red.50" border="1px solid" borderColor="red.200"
                                                            borderRadius="md" p={3} mt={3}>
                                                            <HStack justify="flex-end" spacing={8}>
                                                                <HStack spacing={2}>
                                                                    <Text fontSize="xs" color="gray.500">Total Return Amount:</Text>
                                                                    <Text fontSize="xs" fontWeight="bold" color="red.500">
                                                                        {Number(roData.total_return_amount ?? 0).toFixed(2)}
                                                                    </Text>
                                                                </HStack>
                                                                <Badge colorScheme={
                                                                    roData.status === 'completed' ? 'green' :
                                                                        roData.status === 'approved' ? 'blue' : 'orange'
                                                                } variant="subtle">
                                                                    {roData.status}
                                                                </Badge>
                                                            </HStack>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </SectionCard>
                                        ) : (
                                            <SectionCard title={`${orderLabel} & Vendor Details`}>
                                                <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
                                                    <FieldSelect
                                                        key={`ref_id_${resetKey}`}
                                                        label={`${orderLabel} Number`} name="reference_id"
                                                        placeholder={`Select ${orderLabel}...`}
                                                        options={purchaseOrderOptions}
                                                        required={`${orderLabel} is required`}
                                                        onValueChange={handleRefIdChange}
                                                        isClearable size="sm"
                                                    />
                                                    <FieldDisplay label="Vendor Name" value={vendorName} size="sm" />
                                                    <FieldDisplay label="Vendor Code" value={vendorCode} size="sm" />
                                                    <FieldDisplay label={`${orderLabel} Date`} value={orderDate} size="sm" />
                                                    <FieldDisplay label={`${orderLabel} Value`} value={orderValue} size="sm" />
                                                </SimpleGrid>
                                            </SectionCard>
                                        )}

                                        {/* ── Existing Receipts ── */}
                                        {isReferenceSet && existingReceiptsList.length > 0 && (
                                            <SectionCard title="Payment Receipts"
                                                badge={String(existingReceiptsList.length)}>
                                                <LoadingOverlay isLoading={receiptsLoading}>
                                                    <Box overflowX="auto">
                                                        <Table variant="striped" size="sm">
                                                            <Thead>
                                                                <Tr>
                                                                    {['#', 'Receipt Code', 'Ref', 'Type', 'Receipt No', 'Payment Value', 'Payment Date', 'Mode', 'Action'].map(h => (
                                                                        <DarkTh key={h}>{h}</DarkTh>
                                                                    ))}
                                                                </Tr>
                                                            </Thead>
                                                            <Tbody>
                                                                {existingReceiptsList.map((receipt: any, i: number) => (
                                                                    <Tr key={receipt.id}>
                                                                        <Td fontSize="xs">{i + 1}</Td>
                                                                        <Td fontSize="xs" fontWeight="bold" color="#0C2556">{receipt.code}</Td>
                                                                        <Td fontSize="xs">
                                                                            <HStack spacing={1}>
                                                                                <Badge
                                                                                    colorScheme={
                                                                                        receipt.reference_type === 'return_order' ? 'red' :
                                                                                            receipt.reference_type === 'invoice' ? 'blue' : 'purple'
                                                                                    }
                                                                                    variant="subtle" fontSize="9px">
                                                                                    {receipt.reference_type === 'return_order' ? 'RPO' :
                                                                                        receipt.reference_type === 'invoice' ? 'INV' : 'PINV'}
                                                                                </Badge>
                                                                                <Text fontSize="xs">{receipt.linked_code ?? '—'}</Text>
                                                                            </HStack>
                                                                        </Td>
                                                                        <Td fontSize="xs">
                                                                            <Badge colorScheme={receipt.type === 'debit' ? 'orange' : 'green'}
                                                                                variant="subtle" fontSize="12px" px={4} py={1}>
                                                                                {receipt.type === 'debit' ? 'Debit' : 'Credit'}
                                                                            </Badge>
                                                                        </Td>
                                                                        <Td fontSize="xs">{receipt.bank_receipt_number ?? '—'}</Td>
                                                                        <Td fontSize="xs" fontWeight="semibold" color="green.600">
                                                                            {parseFloat(receipt.payment_value ?? 0).toFixed(2)}
                                                                        </Td>
                                                                        <Td fontSize="xs">
                                                                            {receipt.payment_date ? dayjs(receipt.payment_date).format('DD-MMM-YYYY') : '—'}
                                                                        </Td>
                                                                        <Td fontSize="xs">{receipt.payment_mode?.name ?? '—'}</Td>
                                                                        <Td>
                                                                            <Menu isLazy>
                                                                                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}
                                                                                    size="sm" variant="outline" bg="#0C2556" color="white"
                                                                                    _hover={{ color: '#0C2556', bg: '#fff' }}
                                                                                    _active={{ color: '#0C2556', bg: '#fff' }}
                                                                                    fontWeight="medium">Action</MenuButton>
                                                                                <Portal>
                                                                                    <MenuList zIndex={1500} minW="150px" fontSize="sm">
                                                                                        {receipt.reference_type !== 'return_order' && (
                                                                                            <MenuItem icon={<HiEye size={15} />}
                                                                                                onClick={() => handleOpenPreview(receipt)}>
                                                                                                View Invoice
                                                                                            </MenuItem>
                                                                                        )}
                                                                                        {receipt.reference_type === 'return_order' && (
                                                                                            <MenuItem icon={<HiEye size={15} />}
                                                                                                onClick={() => handleOpenReturnOrderPreview(receipt.reference_id, receipt.linked_code)}>
                                                                                                View Return Order
                                                                                            </MenuItem>
                                                                                        )}
                                                                                        <MenuItem icon={<HiEye size={15} />}
                                                                                            onClick={() => { setSelectedReceiptId(receipt.id); onInfoOpen(); }}>
                                                                                            View Receipt
                                                                                        </MenuItem>
                                                                                    </MenuList>
                                                                                </Portal>
                                                                            </Menu>
                                                                        </Td>
                                                                    </Tr>
                                                                ))}
                                                            </Tbody>
                                                        </Table>
                                                    </Box>
                                                </LoadingOverlay>
                                            </SectionCard>
                                        )}

                                        {/* ── Invoice Details (PO flow only) ── */}
                                        {!isReturnOrder && (
                                            <SectionCard title="Invoice Details">
                                                <LoadingOverlay isLoading={invoiceDetailsFetching}>
                                                    <Stack spacing={4}>
                                                        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                                                            <FieldSelect
                                                                key={`invoice_type_${resetKey}`}
                                                                label="Invoice Type" name="invoice_type"
                                                                placeholder="Select invoice type..."
                                                                options={INVOICE_TYPE_OPTIONS}
                                                                required="Invoice Type is required"
                                                                onValueChange={handleInvoiceTypeChange}
                                                                isDisabled={!isReferenceSet}
                                                                isClearable size="sm"
                                                            />
                                                            <FieldSelect
                                                                key={`invoice_id_${invoiceType}_${resetKey}`}
                                                                label={`${invoiceLabel} Invoice No`} name="invoice_id"
                                                                placeholder="Select invoice..."
                                                                options={invoiceType === 'proforma' ? proformaOptions : taxOptions}
                                                                required="Invoice No is required"
                                                                onValueChange={handleInvoiceIdChange}
                                                                isDisabled={!invoiceType || !isReferenceSet}
                                                                isClearable size="sm"
                                                            />
                                                            <FieldDisplay
                                                                key={`invoice_amt_${resetKey}`}
                                                                label={`${invoiceLabel} Invoice Amount`}
                                                                value={invoiceAmt} size="sm"
                                                            />
                                                            {invoiceId && (
                                                                <FieldDisplay
                                                                    key={`ready_${invoiceId}_${resetKey}`}
                                                                    label="Ready for Receipt"
                                                                    value={isInvoiceReady ? '✅ Ready' : '⚠️ Not Ready'}
                                                                    size="sm"
                                                                />
                                                            )}
                                                        </SimpleGrid>

                                                        {invoiceId && !isInvoiceReady && (
                                                            <Alert status="warning" borderRadius="md" fontSize="sm">
                                                                <AlertIcon />
                                                                This invoice has not been marked as ready for receipt.
                                                            </Alert>
                                                        )}

                                                        {invoiceId && selectedInvoiceData && (
                                                            <Stack spacing={3}>
                                                                {(selectedInvoiceData.items ?? []).length > 0 && (
                                                                    <Box>
                                                                        <Text fontSize="xs" fontWeight="semibold" color="gray.500"
                                                                            textTransform="uppercase" letterSpacing="wide" mb={2}>
                                                                            Invoice Items
                                                                        </Text>
                                                                        <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                                                                            <Table variant="striped" size="sm">
                                                                                <Thead>
                                                                                    <Tr>
                                                                                        {['#', 'Item', 'Pay Qty', 'Pay Amount', 'Total', 'Paid', 'Balance', 'Status'].map(h => (
                                                                                            <DarkTh key={h}>{h}</DarkTh>
                                                                                        ))}
                                                                                    </Tr>
                                                                                </Thead>
                                                                                <Tbody>
                                                                                    {selectedInvoiceData.items?.map((item: any, i: number) => (
                                                                                        <Tr key={item.id}>
                                                                                            <Td fontSize="xs">{i + 1}</Td>
                                                                                            <Td fontSize="xs" fontWeight="semibold">
                                                                                                {item.reference_item?.part_number?.name ?? item.reference_item?.description ?? '—'}
                                                                                            </Td>
                                                                                            <Td fontSize="xs">{item.pay_on_qty ?? '—'}</Td>
                                                                                            <Td fontSize="xs" color="blue.600" fontWeight="semibold">
                                                                                                {parseFloat(item.pay_on_amount ?? 0).toFixed(2)}
                                                                                            </Td>
                                                                                            <Td fontSize="xs">{parseFloat(item.item_total ?? 0).toFixed(2)}</Td>
                                                                                            <Td fontSize="xs" color="orange.500">
                                                                                                {parseFloat(item.total_paid ?? 0).toFixed(2)}
                                                                                            </Td>
                                                                                            <Td fontSize="xs" color={item.balance <= 0 ? 'green.500' : 'red.500'} fontWeight="semibold">
                                                                                                {parseFloat(item.balance ?? 0).toFixed(2)}
                                                                                            </Td>
                                                                                            <Td fontSize="xs">
                                                                                                {item.is_fully_paid
                                                                                                    ? <Badge colorScheme="green" variant="subtle" fontSize="9px">Fully Paid</Badge>
                                                                                                    : <Badge colorScheme="orange" variant="subtle" fontSize="9px">Partial</Badge>
                                                                                                }
                                                                                            </Td>
                                                                                        </Tr>
                                                                                    ))}
                                                                                </Tbody>
                                                                            </Table>
                                                                        </Box>
                                                                    </Box>
                                                                )}

                                                                {(selectedInvoiceData.financial_charges ?? []).length > 0 && (
                                                                    <Box>
                                                                        <Text fontSize="xs" fontWeight="semibold" color="gray.500"
                                                                            textTransform="uppercase" letterSpacing="wide" mb={2}>
                                                                            Additional Charges
                                                                        </Text>
                                                                        <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                                                                            <Table variant="striped" size="sm">
                                                                                <Thead>
                                                                                    <Tr>
                                                                                        {['#', 'Charge Type', 'Value', 'Final Amount', 'Remarks'].map(h => (
                                                                                            <DarkTh key={h}>{h}</DarkTh>
                                                                                        ))}
                                                                                    </Tr>
                                                                                </Thead>
                                                                                <Tbody>
                                                                                    {selectedInvoiceData.financial_charges?.map((charge: any, i: number) => {
                                                                                        const isVat = charge.charge_type?.is_vat;
                                                                                        const isSubtract = charge.charge_type?.calculation_type === 'subtract';
                                                                                        const isPercent = charge.charge_type?.charge_type === 'percent';
                                                                                        return (
                                                                                            <Tr key={charge.id} bg={isVat ? 'orange.50' : undefined}>
                                                                                                <Td fontSize="xs">{i + 1}</Td>
                                                                                                <Td fontSize="xs">
                                                                                                    <HStack spacing={1}>
                                                                                                        <Text fontWeight="semibold">{charge.charge_type?.name ?? '—'}</Text>
                                                                                                        {isVat && <Badge colorScheme="orange" variant="subtle" fontSize="9px">VAT</Badge>}
                                                                                                    </HStack>
                                                                                                </Td>
                                                                                                <Td fontSize="xs">{isPercent ? `${charge.input_value}%` : charge.input_value}</Td>
                                                                                                <Td fontSize="xs" fontWeight="semibold"
                                                                                                    color={isSubtract ? 'red.500' : 'green.600'}>
                                                                                                    {isSubtract ? '−' : '+'} {parseFloat(charge.final_amount ?? 0).toFixed(2)}
                                                                                                </Td>
                                                                                                <Td fontSize="xs" color="gray.500">{charge.remarks ?? '—'}</Td>
                                                                                            </Tr>
                                                                                        );
                                                                                    })}
                                                                                </Tbody>
                                                                            </Table>
                                                                        </Box>
                                                                    </Box>
                                                                )}

                                                                <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={3}>
                                                                    <HStack justify="flex-end" spacing={8} flexWrap="wrap">
                                                                        {selectedInvoiceData.sub_total != null && (
                                                                            <HStack spacing={2}>
                                                                                <Text fontSize="xs" color="gray.500">Sub Total:</Text>
                                                                                <Text fontSize="xs" fontWeight="bold" color="blue.600">
                                                                                    {parseFloat(String(selectedInvoiceData.sub_total)).toFixed(2)}
                                                                                </Text>
                                                                            </HStack>
                                                                        )}
                                                                        {!!selectedInvoiceData.total_financial_charges && (
                                                                            <HStack spacing={2}>
                                                                                <Text fontSize="xs" color="gray.500">Charges:</Text>
                                                                                <Text fontSize="xs" fontWeight="bold"
                                                                                    color={selectedInvoiceData.total_financial_charges < 0 ? 'red.500' : 'green.600'}>
                                                                                    {selectedInvoiceData.total_financial_charges >= 0 ? '+' : ''}
                                                                                    {parseFloat(String(selectedInvoiceData.total_financial_charges)).toFixed(2)}
                                                                                </Text>
                                                                            </HStack>
                                                                        )}
                                                                        <HStack spacing={2}>
                                                                            <Text fontSize="xs" color="gray.500">Invoice Amount:</Text>
                                                                            <Text fontSize="xs" fontWeight="bold" color="brand.600">
                                                                                {parseFloat(String(selectedInvoiceData.invoice_amount ?? 0)).toFixed(2)}
                                                                            </Text>
                                                                        </HStack>
                                                                    </HStack>
                                                                </Box>
                                                            </Stack>
                                                        )}
                                                    </Stack>
                                                </LoadingOverlay>
                                            </SectionCard>
                                        )}

                                        {/* ── Bank & Vendor Details ── */}
                                        <SectionCard title="Bank & Vendor Details">
                                            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                                                <FieldSelect
                                                    key={`customer_bank_${invoiceId}_${returnOrderId}_${resetKey}`}
                                                    label="Customer Bank" name="customer_bank_id"
                                                    required="Customer Bank is required"
                                                    placeholder="Select bank..."
                                                    selectProps={{ isLoading: customerDetailsLoading || bankLoading }}
                                                    options={custBankOptions}
                                                    isDisabled={!isReferenceSet}
                                                    size="sm" isCaseSensitive
                                                    addNew={{
                                                        label: '+ Add New',
                                                        CreateModal: (p) => (
                                                            <BankModal {...p} customerId={customerId ?? ''} isEdit={false}
                                                                customerInfo={customerDetails?.data} onClose={p.onClose}
                                                                onSuccess={(data) =>
                                                                    handleAddNewSuccess('customer_bank_id', receiptForm, reloadCustomerBanks)(data)
                                                                } />
                                                        ),
                                                    }}
                                                    onValueChange={(val) => setCustomerBankId(val)}
                                                />
                                                <FieldDisplay label="Vendor Bank Details" value={bankDetails} size="sm" isHtml />
                                                <FieldDisplay label="Payment Terms" value={paymentTerms} size="sm" />
                                                <FieldSelect
                                                    key={`payment_mode_${resetKey}`}
                                                    label="Payment Mode" name="payment_mode_id"
                                                    placeholder="Select mode..."
                                                    options={paymentModeOptions}
                                                    selectProps={{ isLoading: dropdownLoading }}
                                                    required="Payment Mode is required"
                                                    isDisabled={!isReferenceSet}
                                                    size="sm"
                                                />
                                            </SimpleGrid>
                                        </SectionCard>

                                        {/* ── Payment Entry ── */}
                                        <SectionCard title="Payment Entry">
                                            <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={4}>
                                                <FieldSelect
                                                    key={`payment_via_id_${resetKey}`}
                                                    label="Payment Via" name="payment_via_id"
                                                    placeholder="Select Payment Via"
                                                    options={paymentViaOptions}
                                                    selectProps={{ isLoading: dropdownLoading }}
                                                    required="Payment Via is required"
                                                    isDisabled={!isReferenceSet}
                                                    onValueChange={(val) => setPaymentViaId(val ?? null)}
                                                    size="sm"
                                                />
                                                {isCard && (
                                                    <FieldSelect key={`finance_card_${resetKey}`}
                                                        label="Card" name="finance_card_id"
                                                        placeholder="Select card..." options={financeCardOptions}
                                                        selectProps={{ isLoading: dropdownLoading }}
                                                        required="Card is required" isDisabled={!isReferenceSet} size="sm"
                                                    />
                                                )}
                                                {isBank && (
                                                    <FieldSelect key={`finance_bank_${resetKey}`}
                                                        label="Bank" name="finance_bank_id"
                                                        placeholder="Select bank..." options={financeBankOptions}
                                                        selectProps={{ isLoading: dropdownLoading }}
                                                        required="Bank is required" isDisabled={!isReferenceSet} size="sm"
                                                    />
                                                )}
                                                {isCheque && (
                                                    <FieldSelect key={`finance_cheque_${resetKey}`}
                                                        label="Cheque" name="finance_cheque_id"
                                                        placeholder="Select cheque..." options={financeChequeOptions}
                                                        selectProps={{ isLoading: dropdownLoading }}
                                                        required="Cheque is required" isDisabled={!isReferenceSet} size="sm"
                                                    />
                                                )}
                                                <FieldInput
                                                    label="Bank Receipt No" name="bank_receipt_number"
                                                    placeholder="Receipt number"
                                                    required="Bank Receipt No is required"
                                                    type="text" size="sm" maxLength={50}
                                                    isDisabled={!isReferenceSet}
                                                />
                                                <FieldInput
                                                    label="Payment Value" name="payment_value"
                                                    placeholder="0.00"
                                                    required="Payment Value is required"
                                                    type="decimal" size="sm"
                                                    isDisabled
                                                />
                                                <FieldDayPicker
                                                    label="Payment Date" name="payment_date"
                                                    placeholder="Select date..."
                                                    required="Payment Date is required"
                                                    size="sm"
                                                    dayPickerProps={{ inputProps: { isDisabled: !isReferenceSet } }}
                                                    disabledDays={{ after: new Date() }}
                                                />
                                                <FieldUpload
                                                    label="Payment Receipt" name="payment_receipt_file"
                                                    placeholder="Upload file"
                                                    required="Receipt file is required"
                                                    isDisabled={!isReferenceSet}
                                                    size="sm" reset={resetKey > 0}
                                                />
                                                <FieldInput
                                                    label="Remarks" name="remarks"
                                                    placeholder="Optional remarks"
                                                    type="text" size="sm"
                                                    isDisabled={!isReferenceSet}
                                                />
                                            </SimpleGrid>
                                        </SectionCard>

                                        {/* ── Actions ── */}
                                        <HStack justify="center" spacing={3} mt={2}>
                                            <Button colorScheme="red" variant="solid" size="sm"
                                                isDisabled={!isReferenceSet}
                                                onClick={() => { receiptForm.reset(); clearSelections(); bumpReset(); }}>
                                                Reset
                                            </Button>
                                            <Button type="submit" colorScheme="brand" size="sm"
                                                isDisabled={
                                                    !isReferenceSet ||
                                                    (!isReturnOrder && (!invoiceId || !isInvoiceReady)) ||
                                                    savePaymentReceipt.isLoading
                                                }
                                                isLoading={savePaymentReceipt.isLoading}
                                                loadingText="Saving…">
                                                Save
                                            </Button>
                                        </HStack>

                                    </Stack>
                                </Formiz>
                            )}
                        </LoadingOverlay>
                    )}

                    <PaymentReceiptInfoModal
                        isOpen={isInfoOpen}
                        onClose={() => { onInfoClose(); setSelectedReceiptId(undefined); }}
                        receiptId={selectedReceiptId}
                    />

                </Stack>
            </Stack>
        </SlideIn>
    );
};

export default PaymentReceiptForm;