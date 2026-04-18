import { useEffect, useRef, useState } from 'react';

import { ChevronRightIcon } from '@chakra-ui/icons';
import {
    Badge,
    Box,
    Button,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Center,
    HStack,
    Heading,
    SimpleGrid,
    Stack,
    Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { HiArrowNarrowLeft } from 'react-icons/hi';
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
} from '@/services/finance/payment-receipt/service';
import {
    useInvoiceList,
    useInvoiceDetails,
    useProformaInvoiceList,
    useProformaInvoiceDetails,
} from '@/services/finance/invoice/service';
import { useCustomerDetails, useCustomerRelationIndex } from '@/services/master/customer/service';
import { usePurchaseOrderDetails, usePurchaseOrderList } from '@/services/purchase/order/service';

import { formatDate } from '@/helpers/commonHelper';

// ─── Constants ────────────────────────────────────────────────────────────────

type EntryType = 'credit' | 'debit' | '';
type ReferType = 'po' | 'rpo' | 'lo' | 'so' | 'ro' | '';
type InvoiceType = 'proforma' | 'tax' | '';

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
    { value: 'ro', label: 'Return Order', isDisabled: true },
];

const INVOICE_TYPE_OPTIONS = [
    { value: 'proforma', label: 'Proforma' },
    { value: 'tax', label: 'Tax Invoice' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (date?: string | null) =>
    date ? dayjs(date).format('DD-MMM-YYYY') : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({
    title,
    badge,
    children,
}: {
    title?: string;
    badge?: string;
    children: React.ReactNode;
}) => (
    <Box bg="white" borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
        {title && (
            <HStack
                px={5} py={3} bg="#0C2556"
                borderBottom="1px solid" borderColor="gray.200"
                borderTopLeftRadius="md" borderTopRightRadius="md"
            >
                <Text fontWeight="semibold" fontSize="sm" color="white">{title}</Text>
                {badge && <Badge bg="white" color="#0C2556" fontSize="xs">{badge}</Badge>}
            </HStack>
        )}
        <Box p={5}>{children}</Box>
    </Box>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PaymentReceiptForm = () => {
    const navigate = useNavigate();

    // ── UI state ──
    const [resetKey, setResetKey] = useState(0);

    // ── Entry classification state ──
    const [entryType, setEntryType] = useState<EntryType>('');
    const [referType, setReferType] = useState<ReferType>('');
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('');
    const [invoiceId, setInvoiceId] = useState<string | null>(null);

    // ── Reference state ──
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<any>(null);
    const [customerBankId, setCustomerBankId] = useState<any>(null);
    const [paymentViaId, setPaymentViaId] = useState<string | null>(null);

    // ── Local display state ──
    const [orderDate, setOrderDate] = useState('—');
    const [orderValue, setOrderValue] = useState('—');
    const [vendorName, setVendorName] = useState('—');
    const [vendorCode, setVendorCode] = useState('—');
    const [paymentTerms, setPaymentTerms] = useState('—');
    const [invoiceAmt, setInvoiceAmt] = useState('—');

    // ── Data fetching ──
    const { data: dropdownData, isLoading: dropdownLoading } = usePaymentReceiptDropdowns();
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentViaOptions = dropdownData?.payment_vias ?? [];
    const financeBankOptions = dropdownData?.finance_banks ?? [];
    const financeCardOptions = dropdownData?.finance_cards ?? [];
    const financeChequeOptions = dropdownData?.finance_cheques ?? [];

    const { data: paymentViaItems } = useSubmasterItemIndex('payment-vias', {});
    const paymentVias: any[] = paymentViaItems?.data ?? [];

    const selectedPaymentVia = paymentVias.find(
        (o: any) => String(o.id) === String(paymentViaId)
    );

    console.log(selectedPaymentVia, paymentViaId, paymentVias)

    const paymentModeLabel = selectedPaymentVia?.code?.toLowerCase() ?? '';
    const isCard = paymentModeLabel === 'card';
    const isCheque = paymentModeLabel === 'cheque';
    const isBank =  paymentModeLabel === 'bank';

    const { data: purchaseOrderList } = usePurchaseOrderList({ enabled: referType === 'po' });
    const purchaseOrderOptions = purchaseOrderList?.data ?? [];

    const isValidPO =
        referType === 'po' &&
        typeof referenceId === 'string' &&
        referenceId.trim().length > 0;

    const { data: poDetails, isFetching: poFetching } = usePurchaseOrderDetails(
        isValidPO ? referenceId : undefined,
        { enabled: isValidPO }
    );

    const { data: customerDetails, isLoading: customerDetailsLoading } = useCustomerDetails(
        customerId ?? '',
        { enabled: !!customerId && !!referenceId }
    );

    const {
        data: customerBankList,
        isLoading: bankLoading,
        refetch: reloadCustomerBanks,
    } = useCustomerRelationIndex(customerId, 'banks');

    const custBankOptions = customerBankList?.data?.map((i: any) => ({
        value: i.id,
        label: i.beneficiary_name,
    })) ?? [];

    // ── Invoice option lists (for the dropdown) ──
    const { data: proformaList } = useProformaInvoiceList({
        enabled: !!referenceId && invoiceType === 'proforma',
    });
    const { data: taxInvoiceList } = useInvoiceList({
        enabled: !!referenceId && invoiceType === 'tax',
    });

    const proformaOptions = proformaList?.data ?? [];
    const taxOptions = taxInvoiceList?.data ?? [];

    // ── Selected invoice detail fetch ──
    // Fetches the full record for the selected invoice so we can read invoice_amount.
    const { data: proformaDetails, isFetching: proformaDetailsFetching } = useProformaInvoiceDetails(
        invoiceType === 'proforma' && invoiceId ? invoiceId : undefined,
        { enabled: invoiceType === 'proforma' && !!invoiceId }
    );

    const { data: taxInvoiceDetails, isFetching: taxDetailsFetching } = useInvoiceDetails(
        invoiceType === 'tax' && invoiceId ? invoiceId : undefined,
        { enabled: invoiceType === 'tax' && !!invoiceId }
    );

    const invoiceDetailsFetching = proformaDetailsFetching || taxDetailsFetching;

    // ── Forms ──
    const classificationForm = useForm({});
    const receiptForm = useForm({
        onValidSubmit: (values) => {
            if (!referenceId || !referType || !entryType) return;
            savePaymentReceipt.mutate({
                code: values.code,
                type: entryType,
                refer_type: referType,
                customer_bank_id: values.customer_bank_id,
                payment_mode_id: values.payment_mode_id,
                invoice_id: invoiceType === 'tax' ? invoiceId ?? undefined : undefined,
                proforma_invoice_id: invoiceType === 'proforma' ? invoiceId ?? undefined : undefined,
                bank_receipt_number: values.bank_receipt_number,
                payment_value: Number(values.payment_value),
                payment_receipt_file: values.payment_receipt_file ?? '',
                payment_date: formatDate(values.payment_date) as string,
                bank_id: values.bank_id,
            });
        },
    });

    // ── Generic Add New success handler (same as InvoiceForm) ──
    const handleAddNewSuccess = (
        fieldName: string,
        targetForm: ReturnType<typeof useForm>,
        refetch: () => void,
        options?: { onValueChange?: (val: any, fullData?: any) => void }
    ) => (data: any) => {
        const record = data?.data ?? data;
        const id = record?.id;
        refetch();
        setTimeout(() => {
            targetForm.setValues({ [fieldName]: id });
            options?.onValueChange?.(id, record);
        }, 150);
    };

    // ── Mutation ──
    const savePaymentReceipt = useSavePaymentReceipt({
        onSuccess: () => {
            receiptForm.reset();
            clearSelections();
            bumpReset();
        },
    });

    // ── Debounced reference ID ──
    const debouncedSetRefId = useRef(
        debounce((value: string) => setReferenceId(value), 500)
    ).current;

    // ── Helpers ──
    const bumpReset = () => setResetKey((k) => k + 1);

    const clearSelections = () => {
        debouncedSetRefId.cancel();
        setReferenceId(null);
        setCustomerId(null);
        setInvoiceId(null);
        setInvoiceType('');
        setOrderDate('—');
        setOrderValue('—');
        setVendorName('—');
        setVendorCode('—');
        setPaymentTerms('—');
        setInvoiceAmt('—');
    };

    const handleEntryTypeChange = (value: any) => {
        setEntryType((value as EntryType) ?? '');
        setReferType('');
        clearSelections();
    };

    const handleReferTypeChange = (value: any) => {
        setReferType((value as ReferType) ?? '');
        clearSelections();
    };

    const handleRefIdChange = (value: any) => {
        if (!value) return;
        setReferenceId(null);
        debouncedSetRefId(value);
    };

    const handleInvoiceTypeChange = (value: any) => {
        setInvoiceType((value as InvoiceType) ?? '');
        setInvoiceId(null);
        setInvoiceAmt('—');
    };

    const handleInvoiceIdChange = (value: any) => {
        if (!value) { setInvoiceId(null); return; }
        setInvoiceId(value);
    };

    // ── Effects ──

    // PO details → order display state (referenceId in deps for reactive reset)
    useEffect(() => {
        if (!referenceId || !poDetails?.data) {
            setOrderDate('—');
            setOrderValue('—');
            setPaymentTerms('—');
            return;
        }
        const { customer_id, total_price, created_at, payment_term } = poDetails.data;
        setCustomerId(customer_id ?? '');
        setOrderDate(fmt(created_at));
        setOrderValue(String(total_price ?? '—'));
        setPaymentTerms(payment_term?.name ?? '—');
    }, [referenceId, poDetails]);

    // Customer details → vendor display (customerId in deps for reactive reset)
    useEffect(() => {
        if (!customerId || !customerDetails?.data) {
            setVendorName('—');
            setVendorCode('—');
            return;
        }
        const d = customerDetails.data;
        setVendorName(d.business_name ?? '—');
        setVendorCode(d.code ?? '—');
    }, [customerId, customerDetails]);

    const selectedBank = customerBankList?.data?.find(
        (i: any) => String(i.id) === String(customerBankId)   // ← use state
    );
    const bankDetails = selectedBank
        ? `
    <table style="border-collapse: collapse;">
      <tr>
        <td style="font-weight: 700; padding-right:8px; white-space:nowrap;">Name</td>
        <td style="padding-right:8px;">:</td>
        <td>${selectedBank.name || '—'} (${selectedBank.type_of_ac || '—'})</td>
      </tr>
      <tr>
        <td style="font-weight: 700; padding-right:8px;">Beneficiary</td>
        <td style="padding-right:8px;">:</td>
        <td>${selectedBank.beneficiary_name || '—'}</td>
      </tr>
      <tr>
        <td style="font-weight: 700; padding-right:8px;">Branch</td>
        <td style="padding-right:8px;">:</td>
        <td>${selectedBank.branch || '—'}</td>
      </tr>
      <tr>
        <td style="font-weight: 700; padding-right:8px;">IBAN</td>
        <td style="padding-right:8px;">:</td>
        <td>${selectedBank.ac_iban_no || '—'}</td>
      </tr>
      <tr>
        <td style="font-weight: 700; padding-right:8px;">SWIFT</td>
        <td style="padding-right:8px;">:</td>
        <td>${selectedBank.swift || '—'}</td>
      </tr>
    </table>
  `
        : '—';

    console.log(selectedBank)

    // Selected proforma invoice details → invoice amount
    useEffect(() => {
        if (invoiceType !== 'proforma') return;
        if (!invoiceId || !proformaDetails?.data) {
            setInvoiceAmt('—');
            return;
        }
        setInvoiceAmt(String(proformaDetails.data.invoice_amount ?? '—'));
    }, [invoiceId, invoiceType, proformaDetails]);

    // Selected tax invoice details → invoice amount
    useEffect(() => {
        if (invoiceType !== 'tax') return;
        if (!invoiceId || !taxInvoiceDetails?.data) {
            setInvoiceAmt('—');
            return;
        }
        setInvoiceAmt(String(taxInvoiceDetails.data.invoice_amount ?? '—'));
    }, [invoiceId, invoiceType, taxInvoiceDetails]);

    // Reset invoice amount when invoice type changes
    useEffect(() => {
        setInvoiceAmt('—');
    }, [invoiceType]);

    // ── Derived ──
    const isReferenceSet = !!referenceId;
    const orderLabel = referType === 'lo' ? 'LO' : 'PO';
    const invoiceLabel = invoiceType === 'proforma' ? 'Proforma' : 'Tax';
    const showForm = !!entryType && !!referType;
    const isUnsupported = showForm && referType !== 'po';

    // ── Render ──
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Header */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={5} color="gray.400" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/finance/payment-receipt">Payment Receipt</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>Create Receipt</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">Create Payment Receipt</Heading>
                    </Stack>
                    <ResponsiveIconButton
                        variant="@primary" icon={<HiArrowNarrowLeft />}
                        size="sm" fontWeight="thin"
                        onClick={() => navigate(-1)}
                    >
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
                        <LoadingOverlay isLoading={poFetching}>
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

                                        {/* ── 2a: Order & Vendor ── */}
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
                                                <FieldDisplay key={`vendor_name_${resetKey}`} label="Vendor Name" value={vendorName} size="sm" />
                                                <FieldDisplay key={`vendor_code_${resetKey}`} label="Vendor Code" value={vendorCode} size="sm" />
                                                <FieldDisplay key={`order_date_${resetKey}`} label={`${orderLabel} Date`} value={orderDate} size="sm" />
                                                <FieldDisplay key={`order_value_${resetKey}`} label={`${orderLabel} Value`} value={orderValue} size="sm" />
                                            </SimpleGrid>
                                        </SectionCard>

                                        {/* ── 2b: Invoice Selection ── */}
                                        <SectionCard title="Invoice Details">
                                            <LoadingOverlay isLoading={invoiceDetailsFetching}>
                                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
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
                                                        value={invoiceAmt}
                                                        size="sm"
                                                    />
                                                </SimpleGrid>
                                            </LoadingOverlay>
                                        </SectionCard>

                                        {/* ── 2c: Bank & Vendor Details ── */}
                                        <SectionCard title="Bank & Vendor Details">
                                            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
                                                <FieldSelect
                                                    key={`customer_bank_${resetKey}`}
                                                    label="Customer Bank" name="customer_bank_id"
                                                    required="Customer Bank is required"
                                                    placeholder="Select bank..."
                                                    selectProps={{ isLoading: customerDetailsLoading || bankLoading }}
                                                    options={custBankOptions}
                                                    isDisabled={!isReferenceSet}
                                                    size="sm"
                                                    isCaseSensitive
                                                    addNew={{
                                                        label: '+ Add New',
                                                        CreateModal: (p) => (
                                                            <BankModal
                                                                {...p}
                                                                customerId={customerId}
                                                                isEdit={false}
                                                                customerInfo={customerDetails?.data}
                                                                onClose={p.onClose}
                                                                onSuccess={(data) =>
                                                                    handleAddNewSuccess(
                                                                        'customer_bank_id',
                                                                        receiptForm,
                                                                        reloadCustomerBanks
                                                                    )(data)
                                                                }
                                                            />
                                                        ),
                                                    }}
                                                    onValueChange={(val) => setCustomerBankId(val ?? null)}
                                                />
                                                <FieldDisplay key={`bank_details_${resetKey}`} label="Vendor Bank Details" value={bankDetails} size="sm" isHtml />
                                                <FieldDisplay key={`payment_terms_${resetKey}`} label="Payment Terms" value={paymentTerms} size="sm" />
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

                                        {/* ── 2d: Payment Entry ── */}
                                        {/* ── 2d: Payment Entry ── */}
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
                                                
                                                

                                                {/* ── Conditional extra dropdown based on payment mode ── */}
                                                {isCard && (
                                                    <FieldSelect
                                                        key={`finance_card_${resetKey}`}
                                                        label="Card" name="finance_card_id"
                                                        placeholder="Select card..."
                                                        options={financeCardOptions}
                                                        selectProps={{ isLoading: dropdownLoading }}
                                                        required="Card is required"
                                                        isDisabled={!isReferenceSet}
                                                        size="sm"
                                                    />
                                                )}
                                                {(isBank) && (
                                                    <FieldSelect
                                                        key={`finance_bank_${resetKey}`}
                                                        label="Bank" name="finance_bank_id"
                                                        placeholder="Select bank..."
                                                        options={financeBankOptions}
                                                        selectProps={{ isLoading: dropdownLoading }}
                                                        required="Bank is required"
                                                        isDisabled={!isReferenceSet}
                                                        size="sm"
                                                    />
                                                )}
                                                {isCheque && (
                                                    <FieldSelect
                                                        key={`finance_cheque_${resetKey}`}
                                                        label="Cheque" name="finance_cheque_id"
                                                        placeholder="Select cheque..."
                                                        options={financeChequeOptions}
                                                        selectProps={{ isLoading: dropdownLoading }}
                                                        required="Cheque is required"
                                                        isDisabled={!isReferenceSet}
                                                        size="sm"
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
                                                    isDisabled={!isReferenceSet}
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
                                                    size="sm"
                                                    reset={resetKey > 0}
                                                />
                                            </SimpleGrid>
                                        </SectionCard>
                                        {/* ── Actions ── */}
                                        <HStack justify="center" spacing={3} mt={2}>
                                            <Button
                                                colorScheme="red" variant="solid" size="sm"
                                                isDisabled={!isReferenceSet}
                                                onClick={() => { receiptForm.reset(); clearSelections(); bumpReset(); }}
                                            >
                                                Reset
                                            </Button>
                                            <Button colorScheme="green" variant="solid" size="sm" isDisabled>
                                                Preview
                                            </Button>
                                            <Button
                                                type="submit" colorScheme="brand" size="sm"
                                                isDisabled={!isReferenceSet || savePaymentReceipt.isLoading}
                                                isLoading={savePaymentReceipt.isLoading}
                                                loadingText="Saving…"
                                            >
                                                Save
                                            </Button>
                                        </HStack>

                                    </Stack>
                                </Formiz>
                            )}
                        </LoadingOverlay>
                    )}

                </Stack>
            </Stack>
        </SlideIn>
    );
};

export default PaymentReceiptForm;