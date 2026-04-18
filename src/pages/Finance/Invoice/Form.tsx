import { useEffect, useRef, useState } from 'react';

import { ChevronRightIcon } from '@chakra-ui/icons';
import {
    Badge,
    Box,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Button,
    Checkbox,
    HStack,
    Heading,
    IconButton,
    Input,
    SimpleGrid,
    Stack,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    FormLabel,
    FormControl
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { HiArrowNarrowLeft, HiEye } from 'react-icons/hi'; //HiCheckCircle
import { LuTrash2, LuPlus, LuRefreshCw, LuInfo } from 'react-icons/lu';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import FieldDisplay from '@/components/FieldDisplay';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldUpload } from '@/components/FieldUpload';
import LoadingOverlay from '@/components/LoadingOverlay';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { BankModal } from '@/components/Modals/CustomerMaster/Bank';
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';

import {
    useInvoiceDropdowns,
    useInvoiceIndex,
    useProformaInvoiceIndex,
    useSaveInvoice,
    useSaveProformaInvoice,
} from '@/services/finance/invoice/service';
import { useCustomerDetails, useCustomerRelationIndex } from '@/services/master/customer/service';
import { usePurchaseOrderDetails, usePurchaseOrderList } from '@/services/purchase/order/service';
import { formatDate } from '@/helpers/commonHelper';
import { useSubmasterItemIndex } from '@/services/submaster/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import { v4 as uuidv4 } from "uuid";
// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { key: 'invoice', label: 'Invoice' },
    { key: 'proforma', label: 'Proforma Invoice' },
] as const;

type NavKey = typeof NAV_ITEMS[number]['key'];
type ReferenceType = 'purchase_order' | 'logistic_order' | '';

const REFERENCE_OPTIONS = [
    { value: 'purchase_order', label: 'Purchase Order', previewUrl: endPoints.preview.purchase_order },
    { value: 'logistic_order', label: 'Logistic Order', isDisabled: true, previewUrl: endPoints.preview.purchase_order },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (date?: string | null) =>
    date ? dayjs(date).format('DD-MMM-YYYY') : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box bg="white" borderRadius="md" boxShadow="sm" border="1px solid" borderColor="gray.200">
        <HStack px={4} py={2} bg="#0C2556">
            <Text fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wide" fontWeight="medium">
                {title}
            </Text>
        </HStack>
        <Box p={4}>{children}</Box>
    </Box>
);

const DarkTh = ({ children, sx }: { children: string; sx?: any }) => (
    <Th bg="#0C2556" color="white" fontSize="xs" letterSpacing="wide" fontWeight="medium" py={3} sx={sx}>
        {children}
    </Th>
);

// ─── Item State Type ──────────────────────────────────────────────────────────

interface ItemState {
    modified_price: string;
    is_finalized: boolean;
    unit_price?: string;
    remarks: string;
}

// ─── Additional Charge Row Type ───────────────────────────────────────────────

interface ChargeRow {
    id: string;             // local uuid for React key / Formiz form name scoping
    charge_type_id: string;
    amount: string;
    remarks: string;
}

const newChargeRow = (): ChargeRow => ({
    id: uuidv4(),
    charge_type_id: '',
    amount: '',
    remarks: '',
});

// ─── Single Charge Row Component ─────────────────────────────────────────────
// Each row owns its Formiz form so FieldSelect/FieldInput work correctly.

interface ChargeRowFormProps {
    row: ChargeRow;
    index: number;
    usedTypeIds: Set<string>;
    chargeTypeOptions: any[];
    canDelete: boolean;
    onTypeChange: (id: string, value: string) => void;
    onAmountChange: (id: string, value: string) => void;
    onRemarksChange: (id: string, value: string) => void;
    onRemove: (id: string) => void;
    onReloadChargeTypes: () => void;
}

const ChargeRowForm = ({
    row,
    index,
    usedTypeIds,
    chargeTypeOptions,
    onTypeChange,
    onAmountChange,
    onRemarksChange,
    onRemove,
    onReloadChargeTypes,
}: ChargeRowFormProps) => {
    const rowForm = useForm({});

    // Sync external charge_type_id into this row's form when it changes
    useEffect(() => {
        if (row.charge_type_id) {
            rowForm.setValues({ charge_type_id: row.charge_type_id });
        }
    }, [row.charge_type_id]);

    // Options: disable types already chosen in other rows
    const options = chargeTypeOptions.map((opt: any) => ({
        ...opt,
        isDisabled: usedTypeIds.has(opt.value) && opt.value !== row.charge_type_id,
    }));

    return (
        <Formiz connect={rowForm}>
            <Tr overflow="auto">
                <Td>{index + 1}</Td>

                {/* Charge Type — creatable FieldSelect, disabled once selected */}
                <Td minW="220px">
                    <FieldSelect
                        name="charge_type_id"
                        placeholder="Select charge type"
                        options={options}
                        size="sm"
                        required="Charge type is required"
                        menuPortalTarget={document.body}
                        isDisabled={!!row.charge_type_id}
                        className={row.charge_type_id ? 'disabled-input' : ''}
                        onValueChange={(val: any) => {
                            if (val) onTypeChange(row.id, String(val));
                        }}
                        selectProps={{
                            type: 'creatable',
                            noOptionsMessage: () => 'No charge types found',
                            menuPosition: 'fixed',                // ← keeps position correct with portal
                            styles: {
                                menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
                            },
                        }}
                        addNew={{
                            label: '+ Add New',
                            CreateModal: (p) => (
                                <SubMasterModalForm
                                    {...p}
                                    model="additional-charges"
                                    isEdit={false}
                                />
                            ),
                            onSuccess: (data: any) => {
                                const record = data?.data ?? data;
                                onReloadChargeTypes();
                                setTimeout(() => {
                                    if (record?.id) {
                                        rowForm.setValues({ charge_type_id: record.id.toString() });
                                        onTypeChange(row.id, record.id.toString());
                                    }
                                }, 150);
                            },
                        }}
                    />
                </Td>

                {/* Amount */}
                <Td>
                    <FieldInput
                        name={`amount_${row.id}`}
                        placeholder="Amount"
                        type="decimal"
                        size="sm"
                        required="Amount is required"
                        defaultValue={row.amount}
                        onValueChange={(val: any) => onAmountChange(row.id, String(val ?? ''))}
                    />
                </Td>

                {/* Remarks */}
                <Td>
                    <FieldInput
                        name={`remarks_${row.id}`}
                        placeholder="Remarks"
                        type="text"
                        size="sm"
                        defaultValue={row.remarks}
                        onValueChange={(val: any) => onRemarksChange(row.id, String(val ?? ''))}
                    />
                </Td>

                {/* Delete */}
                <Td>
                    <IconButton
                        aria-label="Remove charge"
                        icon={<LuTrash2 size={18} />}
                        variant="ghost"
                        color="red.500"
                        size="sm"
                        _hover={{ bg: 'transparent', color: 'red.600' }}
                        onClick={() => onRemove(row.id)}
                    />
                </Td>
            </Tr>
        </Formiz>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const InvoiceForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isProforma = location.pathname.includes('proforma');

    const [activeNav, setActiveNav] = useState<NavKey>(
        isProforma ? 'proforma' : 'invoice'
    );

    const [resetKey, setResetKey] = useState(0);
    const [resetField, setResetField] = useState(false);

    const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
    const [refPreviewTitle, setRefPreviewTitle] = useState<string>('');

    // ── Reference selection state ──
    const [referenceType, setReferenceType] = useState<ReferenceType>('');
    const [referenceId, setReferenceId] = useState<string | null>(null);

    // ── Derived state from reference ──
    const [customerId, setCustomerId] = useState<any>(null);
    const [poCurrency, setPoCurrency] = useState<any>(null);
    const [refernceTotalPrice, setReferneceTotalPrice] = useState<number>(0);

    // ── Local display state ──
    const [refDateVal, setRefDateVal] = useState('—');
    const [refValVal, setRefValVal] = useState('—');
    const [vendorName, setVendorName] = useState('—');
    const [vendorCode, setVendorCode] = useState('—');

    // ── Invoice items state (keyed by reference_item_id) ──
    const [invoiceItems, setInvoiceItems] = useState<Record<string, ItemState>>({});

    // ── Removed item IDs ──
    const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set());

    // ── Per-tab additional charges ──
    const [invoiceCharges, setInvoiceCharges] = useState<ChargeRow[]>([]);
    const [proformaCharges, setProformaCharges] = useState<ChargeRow[]>([]);

    // ── Data fetching ──
    const { data: purchaseOrderList } = usePurchaseOrderList({ enabled: referenceType === 'purchase_order' });
    const purchaseOrderOptions = purchaseOrderList?.data ?? [];

    const { data: currencyList } = useSubmasterItemIndex('currencies', {});
    const { data: paymentTermList } = useSubmasterItemIndex('payment-terms', {});
    const { openPreview } = usePDFPreview();
    const currencies: any[] = currencyList?.data ?? [];
    const paymentTerms: any[] = paymentTermList?.data ?? [];

    const { data: dropdownData, refetch: refetchDropdowns } = useInvoiceDropdowns();
    const currencyOptions = dropdownData?.currencies ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];
    const chargeTypeOptions: any[] = dropdownData?.additional_charges ?? [];

    const isValidReference =
        referenceType === 'purchase_order' &&
        typeof referenceId === 'string' &&
        referenceId.trim().length > 0;

    const { data: poDetails, isFetching: poDetailsFetching } = usePurchaseOrderDetails(
        isValidReference ? referenceId : undefined,
        { enabled: isValidReference }
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

    const customerBankOptions = customerBankList?.data?.map((i: any) => ({
        value: i.id,
        label: i.beneficiary_name,
    })) ?? [];

    const {
        data: proformaList,
        isLoading: proformaListLoading,
        refetch: refetchProforma,
    } = useProformaInvoiceIndex();

    const {
        data: invoiceList,
        isLoading: invoiceListLoading,
        refetch: refetchInvoice,
    } = useInvoiceIndex();

    // ── Derived PO items ──
    const allPoItems: any[] = poDetails?.data?.items ?? [];
    const poItems = allPoItems.filter((item: any) => !removedItemIds.has(item.id));

    // ── PO base amount (sum of all visible line items' totals) ──
    const poBaseAmount = refernceTotalPrice;

    // ── Sum of additional charges per tab ──
    const sumCharges = (charges: ChargeRow[]) =>
        charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    // ── Dynamic maxValue for invoice_amount ──
    const invoiceMaxAmt = poBaseAmount + sumCharges(invoiceCharges);
    const proformaMaxAmt = poBaseAmount + sumCharges(proformaCharges);

    // ── Build items payload ──
    const buildItemsPayload = () =>
        poItems.map((item: any) => ({
            reference_item_id: item.id,
            modified_price: invoiceItems[item.id]?.modified_price
                ? parseFloat(invoiceItems[item.id].modified_price)
                : null,
            is_finalized: invoiceItems[item.id]?.is_finalized ?? false,
            remarks: invoiceItems[item.id]?.remarks?.trim() || null,
        }));

    // ── Build additional charges payload ──
    const buildChargesPayload = (charges: ChargeRow[]) =>
        charges
            .filter((c) => c.charge_type_id && c.amount)
            .map((c) => ({
                charge_type_id: c.charge_type_id,
                amount: parseFloat(c.amount),
                remarks: c.remarks.trim() || null,
            }));

    // ── Forms ──
    const refForm = useForm({});

    const proformaForm = useForm({
        onValidSubmit: (values) => {
            if (!referenceId || !referenceType) return;
            saveProformaInvoice.mutate({
                code: values.code,
                reference_type: referenceType,
                reference_id: referenceId,
                customer_bank_id: values.customer_bank_id,
                date: formatDate(new Date().toISOString()) as string,
                payment_term_id: values.payment_term_id,
                invoice_number: values.invoice_number,
                invoice_date: formatDate(values.invoice_date) as string,
                invoice_amount: values.invoice_amount,
                file: values.file ?? '',
                narration: values.narration ?? '',
                items: buildItemsPayload(),
                additional_charges: buildChargesPayload(proformaCharges),
            });
        },
    });

    const invoiceForm = useForm({
        onValidSubmit: (values) => {
            if (!referenceId || !referenceType) return;
            saveInvoice.mutate({
                code: values.code,
                reference_type: referenceType,
                reference_id: referenceId,
                customer_bank_id: values.customer_bank_id,
                invoice_type: referenceType === 'purchase_order' ? 'po' : 'lo',
                payment_by: values.payment_by,
                payment_date: formatDate(values.payment_date) as string,
                due_date: formatDate(values.due_date) as string,
                tax_invoice_no: values.tax_invoice_no,
                tax_invoice_date: formatDate(values.tax_invoice_date) as string,
                invoice_amount: values.invoice_amount,
                currency_id: values.currency_id,
                payment_term_id: values.payment_term_id,
                file: values.file ?? '',
                remarks: values.remarks ?? '',
                items: buildItemsPayload(),
                additional_charges: buildChargesPayload(invoiceCharges),
            });
        },
    });

    // ── Mutations ──
    const saveProformaInvoice = useSaveProformaInvoice({
        onSuccess: () => {
            proformaForm.reset();
            setProformaCharges([]);
            clearReference();
            refetchProforma();
        },
    });

    const saveInvoice = useSaveInvoice({
        onSuccess: () => {
            invoiceForm.reset();
            setInvoiceCharges([]);
            clearReference();
            refetchInvoice();
        },
    });

    // ── Debounced reference ID setter ──
    const debouncedSetRefId = useRef(
        debounce((value: string) => setReferenceId(value), 500)
    ).current;

    // ── Helpers ──
    const bumpReset = () => {
        setResetKey((k) => k + 1);
        setResetField(true);
    };

    const clearReference = () => {
        debouncedSetRefId.cancel();
        setReferenceId(null);
        setCustomerId(null);
        setPoCurrency(null);
        setReferneceTotalPrice(0);
        setInvoiceItems({});
        setRemovedItemIds(new Set());
        setInvoiceCharges([]);
        setProformaCharges([]);
        setRefDateVal('—');
        setRefValVal('—');
        setVendorName('—');
        setVendorCode('—');
        setRefPreviewUrl(null);
        setRefPreviewTitle('');
        refForm.setValues({ purchase_order_id: '' });
        bumpReset();
    };

    const handleRefTypeChange = (value: any) => {
        setReferenceType((value as ReferenceType) ?? '');
        const option = REFERENCE_OPTIONS.find((o) => o.value === value);
        setRefPreviewUrl(option?.previewUrl ?? null);
        setRefPreviewTitle(option?.label ?? '');
    };

    const handleRefIdChange = (value: any) => {
        if (!value) return;
        setReferenceId(null);
        debouncedSetRefId(value);
    };

    const handleFormReset = (form: ReturnType<typeof useForm>) => {
        form.reset();
        clearReference();
    };

    const handleItemChange = (
        itemId: string,
        field: 'modified_price' | 'is_finalized' | 'remarks',
        value: string | boolean
    ) => {
        setInvoiceItems((prev) => ({
            ...prev,
            [itemId]: {
                modified_price: prev[itemId]?.modified_price ?? '',
                is_finalized: prev[itemId]?.is_finalized ?? false,
                remarks: prev[itemId]?.remarks ?? '',
                [field]: value,
            },
        }));
    };

    const handleRemoveItem = (itemId: string) => {
        setRemovedItemIds((prev) => new Set([...prev, itemId]));
        setInvoiceItems((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
    };

    // ── Charge state mutators ──
    const addCharge = (setter: React.Dispatch<React.SetStateAction<ChargeRow[]>>) => {
        setter((prev) => [...prev, newChargeRow()]);
    };

    const removeCharge = (
        setter: React.Dispatch<React.SetStateAction<ChargeRow[]>>,
        id: string
    ) => {
        setter((prev) => prev.filter((c) => c.id !== id));
    };

    const updateChargeField = (
        setter: React.Dispatch<React.SetStateAction<ChargeRow[]>>,
        id: string,
        field: keyof Omit<ChargeRow, 'id'>,
        value: string
    ) => {
        setter((prev) =>
            prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        );
    };

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

    // ── Effects ──

    useEffect(() => {
        if (activeNav !== 'proforma') return;
        const ciaTerm = paymentTerms.find((t: any) => t.code?.toLowerCase() === 'cia');
        if (ciaTerm) {
            proformaForm.setValues({ payment_term_id: ciaTerm.id.toString() });
        }
    }, [activeNav, paymentTerms]);

    useEffect(() => {
        if (!referenceId || !poDetails?.data) {
            setRefDateVal('—');
            setRefValVal('—');
            setReferneceTotalPrice(0);  // ← reset
            return;
        }
        const { customer_id, currency_id, total_price, created_at } = poDetails.data;
        setCustomerId(customer_id ?? '');
        setReferneceTotalPrice(Number(total_price) || 0);  // ← store it
        const currency = currencies.find((c) => c.id === (currency_id ?? 1));
        setPoCurrency(currency ?? null);
        const val = currency ? `${currency.code} ${total_price}` : String(total_price);
        setRefDateVal(fmt(created_at));
        setRefValVal(val);
        const initialItems: Record<string, ItemState> = {};
        (poDetails.data.items ?? []).forEach((item: any) => {
            initialItems[item.id] = {
                modified_price: item.unit_price != null ? String(item.unit_price) : '',
                is_finalized: false,
                unit_price: item.unit_price != null ? String(item.unit_price) : '',
                remarks: '',
            };
        });
        setInvoiceItems(initialItems);
        setRemovedItemIds(new Set());
    }, [referenceId, poDetails]);

    useEffect(() => {
        if (!customerId || !customerDetails?.data) {
            setVendorName('—');
            setVendorCode('—');
            return;
        }
        setVendorName(customerDetails.data.business_name ?? '—');
        setVendorCode(customerDetails.data.code ?? '—');
        const termId = customerDetails.data.payment_term?.id?.toString();
        if (termId) {
            if (activeNav !== 'proforma') {
                proformaForm.setValues({ payment_term_id: termId });
            }
            invoiceForm.setValues({ payment_term_id: termId, currency_id: customerDetails.data?.currency_id });
        }
    }, [customerId, customerDetails]);

    useEffect(() => {
        if (location.pathname.includes('proforma')) {
            setActiveNav('proforma');
        } else {
            setActiveNav('invoice');
        }
    }, [location.pathname]);

    // ── Derived labels ──
    const refDateLabel = referenceType === 'purchase_order' ? 'PO Date' : referenceType === 'logistic_order' ? 'LO Date' : 'Ref Date';
    const refValLabel = referenceType === 'purchase_order' ? 'PO Value' : referenceType === 'logistic_order' ? 'LO Value' : 'Ref Value';

    const disabled = !referenceId;
    const currencyCode = poCurrency?.code ?? '';

    // ── Shared field renderers ──
    const payTermField = (key: string) => (
        <FieldSelect
            key={`payment_term_${key}_${resetKey}`}
            label="Pay Term" name="payment_term_id"
            required="Payment Term is required"
            placeholder="Select Term"
            options={paymentTermOptions}
            isDisabled={activeNav === 'proforma'}
            size="sm"
            className="disabled-input"
        />
    );

    const bankField = (key: string, targetForm: ReturnType<typeof useForm>) => (
        <FieldSelect
            key={`bank_${key}_${resetKey}`}
            label="Customer Bank" name="customer_bank_id"
            required="Customer Bank is required"
            placeholder="Select Bank"
            selectProps={{
                isLoading: customerDetailsLoading || bankLoading,
                type: 'creatable',
                noOptionsMessage: () => 'No banks found',
            }}
            options={customerBankOptions}
            isDisabled={disabled} size="sm"
            className={disabled ? 'disabled-input' : ''}
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
                            handleAddNewSuccess('customer_bank_id', targetForm, reloadCustomerBanks)(data)
                        }
                    />
                ),
            }}
        />
    );

    // ── Additional Charges Table ──
    const AdditionalChargesTable = ({
        charges,
        setter,
    }: {
        charges: ChargeRow[];
        setter: React.Dispatch<React.SetStateAction<ChargeRow[]>>;
    }) => {
        // All charge_type_ids currently chosen in this tab
        const usedTypeIds = new Set(charges.map((c) => c.charge_type_id).filter(Boolean));

        return (
            <Box mt={4}>
                <HStack justify="space-between" mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                        Additional Charges
                    </Text>
                    <Button
                        leftIcon={<LuPlus />}
                        size="sm"
                        colorScheme="brand"
                        variant="solid"
                        isDisabled={disabled}
                        onClick={() => addCharge(setter)}
                    >
                        Add Charge
                    </Button>
                </HStack>

                {charges.length === 0 ? (
                    <Box
                        border="1px dashed"
                        borderColor="gray.300"
                        borderRadius="md"
                        py={4}
                        textAlign="center"
                    >
                        <Text fontSize="sm" color="gray.400">
                            No additional charges. Click "Add Charge" to add one.
                        </Text>
                    </Box>
                ) : (
                    <Box overflowX="auto">
                        <Table variant="striped" size="sm" overflow="auto">
                            <Thead>
                                <Tr>
                                    <DarkTh>S.No.</DarkTh>
                                    <DarkTh>Charge Type</DarkTh>
                                    <DarkTh>Amount</DarkTh>
                                    <DarkTh>Remarks</DarkTh>
                                    <DarkTh>Action</DarkTh>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {charges.map((charge, i) => (
                                    <ChargeRowForm
                                        key={charge.id}
                                        row={charge}
                                        index={i}
                                        usedTypeIds={usedTypeIds}
                                        chargeTypeOptions={chargeTypeOptions}
                                        canDelete={true}
                                        onTypeChange={(id, val) =>
                                            updateChargeField(setter, id, 'charge_type_id', val)
                                        }
                                        onAmountChange={(id, val) =>
                                            updateChargeField(setter, id, 'amount', val)
                                        }
                                        onRemarksChange={(id, val) =>
                                            updateChargeField(setter, id, 'remarks', val)
                                        }
                                        onRemove={(id) => removeCharge(setter, id)}
                                        onReloadChargeTypes={refetchDropdowns}
                                    />
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                )}
            </Box>
        );
    };

    // ── Reference Items Table ──
    const ReferenceItemsTable = () => {
    if (!referenceId || !poItems.length) return null;
    const canRemove = poItems.length > 1;

    return (
        <SectionCard title={`${REFERENCE_OPTIONS.find(o => o.value === referenceType)?.label ?? 'Reference'} Items`}>
            <TableContainer>
                <Table variant="striped" size="sm">
                    <Thead>
                        <Tr>
                            <DarkTh>S.No.</DarkTh>
                            <DarkTh>Item Name</DarkTh>
                            <DarkTh>Qty</DarkTh>
                            <DarkTh sx={{ textAlign: 'right' }}>Unit Price</DarkTh>
                            <DarkTh sx={{ textAlign: 'right' }}>Total</DarkTh>
                            <DarkTh sx={{ textAlign: 'center' }}>Pay. on Acc</DarkTh>
                            <DarkTh sx={{ textAlign: 'center' }}>Bal Amt</DarkTh>
                            <DarkTh>Remarks</DarkTh>
                            <DarkTh>Action</DarkTh>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {poItems.map((item: any, i: number) => {
                            const qty = item.qty ?? 0;
                            const unitPrice = item.unit_price ?? 0;
                            const itemTotal = qty * unitPrice;

                            // Pay on Account — what user enters (modified_price)
                            const payOnAcc = parseFloat(
                                invoiceItems[item.id]?.modified_price ?? ''
                            ) || 0;

                            // Balance = Total - Pay on Account
                            const balAmt = itemTotal - payOnAcc;

                            return (
                                <Tr key={item.id}>
                                    <Td>{i + 1}</Td>
                                    <Td>{item.part_number?.name ?? item.description ?? '—'}</Td>
                                    <Td>{qty}</Td>
                                    <Td isNumeric>
                                        {unitPrice != null
                                            ? `${currencyCode} ${unitPrice.toFixed(2)}`
                                            : '—'}
                                    </Td>
                                    <Td isNumeric>
                                        {`${currencyCode} ${itemTotal.toFixed(2)}`}
                                    </Td>

                                    {/* ✅ Pay on Account — max is itemTotal */}
                                    <Td sx={{ textAlign: 'center' }}>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            max={itemTotal}
                                            size="sm"
                                            width="140px"
                                            placeholder="Pay on Account"
                                            value={invoiceItems[item.id]?.modified_price ?? ''}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                // Clamp to itemTotal
                                                const clamped = !isNaN(val)
                                                    ? Math.min(val, itemTotal)
                                                    : '';
                                                handleItemChange(
                                                    item.id,
                                                    'modified_price',
                                                    String(clamped)
                                                );
                                            }}
                                        />
                                    </Td>

                                    {/* ✅ Balance Amount — derived, read-only */}
                                    <Td sx={{ textAlign: 'center' }}>
                                        <Text
                                            fontSize="sm"
                                            fontWeight="semibold"
                                            color={balAmt < 0 ? 'red.500' : balAmt === 0 ? 'green.500' : 'gray.700'}
                                        >
                                            {`${currencyCode} ${balAmt.toFixed(2)}`}
                                        </Text>
                                    </Td>

                                    <Td>
                                        <Input
                                            type="text"
                                            size="sm"
                                            width="180px"
                                            placeholder="Remarks"
                                            value={invoiceItems[item.id]?.remarks ?? ''}
                                            onChange={(e) =>
                                                handleItemChange(item.id, 'remarks', e.target.value)
                                            }
                                        />
                                    </Td>
                                    <Td>
                                        <IconButton
                                            aria-label="Remove item"
                                            icon={<LuTrash2 size={20} />}
                                            variant="ghost"
                                            color="red.500"
                                            _hover={{ bg: 'transparent', color: 'red.600' }}
                                            onClick={() => handleRemoveItem(item.id)}
                                            isDisabled={!canRemove}
                                        />
                                    </Td>
                                </Tr>
                            );
                        })}
                    </Tbody>
                </Table>
            </TableContainer>
        </SectionCard>
    );
};

    // ── Render ──
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Header */}
                <HStack justify="space-between" align="flex-end">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={5} color="gray.400" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/finance/invoice">{isProforma ? 'Proforma' : ''} Invoice Entry List</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>Create {isProforma ? 'Proforma' : ''} Invoice Entry</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <HStack spacing={2} align="center">
                            <Heading as="h4" size="md">Create {isProforma ? 'Proforma' : ''} Invoice Entry</Heading>
                            {referenceType && (
                                <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                    {referenceType === 'purchase_order' ? 'PO' : 'LO'}
                                </Badge>
                            )}
                        </HStack>
                    </Stack>
                    <ResponsiveIconButton
                        variant="@primary" icon={<HiArrowNarrowLeft />}
                        size="sm" fontWeight="thin"
                        onClick={() => navigate(-1)}
                    >
                        Back
                    </ResponsiveIconButton>
                </HStack>

                {/* ── Page-level overlay ── */}
                <LoadingOverlay isLoading={poDetailsFetching}>
                    <Stack spacing={3} p={4} bg="white" borderRadius="md" boxShadow="md">

                        {/* Reference Selection */}
                        <SectionCard title="Reference">
                            <Formiz autoForm connect={refForm}>
                                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={4}>
                                    <FieldSelect
                                        key={`ref_type_${resetKey}`}
                                        label="Ref Type" name="reference_type"
                                        placeholder="Select Ref Type"
                                        options={REFERENCE_OPTIONS} size="sm"
                                        onValueChange={handleRefTypeChange}
                                    />

                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">
                                                Ref No
                                            </FormLabel>
                                            <Stack direction="row" align="center" spacing={2}>

                                                <IconButton
                                                    aria-label="Part Info Popup"
                                                    color="black"
                                                    variant="unstyled"
                                                    boxShadow="none"
                                                    minW="auto"
                                                    size="sm"
                                                    background="transparent !important"
                                                    border="none"
                                                    icon={<LuInfo size={18} />}
                                                    isDisabled={referenceId === null}
                                                    onClick={() => {
                                                        console.log(refPreviewUrl, referenceId)
                                                        if (refPreviewUrl && referenceId) {
                                                            const url = `${import.meta.env.VITE_PUBLIC_API_URL}${refPreviewUrl.replace(':id', referenceId)}`;
                                                            openPreview(url, `${refPreviewTitle} Preview`, true);
                                                        }
                                                    }}
                                                    _disabled={{
                                                        background: "transparent",
                                                        border: "none",
                                                        opacity: 0.4,
                                                        cursor: "not-allowed",
                                                    }}
                                                />

                                                <FieldSelect
                                                    key={`ref_id_${resetKey}`}
                                                    // label="Ref No"
                                                    name="reference_id"
                                                    placeholder="Select Ref No"
                                                    options={purchaseOrderOptions}
                                                    isDisabled={!referenceType}
                                                    size="sm"
                                                    onValueChange={handleRefIdChange}
                                                />
                                            </Stack>
                                        </FormControl>
                                    </Box>

                                    <FieldDisplay key={`refDate_${resetKey}`} label={refDateLabel} value={refDateVal} size="sm" />
                                    <FieldDisplay key={`refVal_${resetKey}`} label={refValLabel} value={refValVal} size="sm" />
                                    <FieldDisplay key={`vendor_${resetKey}`} label="Vendor Name" value={vendorName} size="sm" />
                                    <FieldDisplay key={`code_${resetKey}`} label="Vendor Code" value={vendorCode} size="sm" />
                                </SimpleGrid>
                            </Formiz>
                        </SectionCard>

                        {/* Reference Items Table */}
                        <ReferenceItemsTable />

                        {/* Invoice Entry Card */}
                        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="sm">

                            {/* Tab Header */}
                            <HStack px={4} py={2} bg="#0C2556" justify="space-between">
                                <Text fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wide" fontWeight="medium">
                                    {activeNav === 'invoice' ? 'Invoice Entry' : 'Proforma Invoice Entry'}
                                </Text>
                                {/* <HStack spacing={0} border="1px solid" borderColor="white">
                                    {NAV_ITEMS.map((item) => {
                                        const isActive = activeNav === item.key;
                                        return (
                                            <Box
                                                key={item.key}
                                                px={4} py={1}
                                                // cursor="pointer"
                                                // onClick={() => setActiveNav(item.key)}
                                                bg={isActive ? 'white' : 'transparent'}
                                                transform={isActive ? 'scale(1.05)' : 'scale(1)'}
                                                _hover={{ bg: isActive ? 'white' : 'whiteAlpha.200' }}
                                                transition="all 0.25s ease"
                                                _notLast={{ borderRight: '1px solid', borderColor: 'whiteAlpha.800' }}
                                            >
                                                <HStack spacing={1.5}>
                                                    {isActive && <HiCheckCircle color="#0C2556" />}
                                                    <Text
                                                        fontSize="sm"
                                                        fontWeight={isActive ? 'semibold' : 'normal'}
                                                        color={isActive ? '#0C2556' : 'white'}
                                                    >
                                                        {item.label}
                                                    </Text>
                                                </HStack>
                                            </Box>
                                        );
                                    })}
                                </HStack> */}
                            </HStack>

                            {/* Form Body */}
                            <Box p={4}>

                                {/* Proforma Invoice Form */}
                                {activeNav === 'proforma' && (
                                    <Formiz autoForm connect={proformaForm}>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4} mb={4}>
                                            <FieldInput
                                                label="Invoice No" name="invoice_number"
                                                placeholder="Inv. No" size="sm" type="text"
                                                required="Invoice Number is required" isDisabled={disabled}
                                            />
                                            <FieldDayPicker
                                                label="Inv. Date" name="invoice_date"
                                                placeholder="Select Invoice Date"
                                                required="Invoice Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }}
                                                disabledDays={{ after: new Date() }}
                                            />
                                            <FieldInput
                                                label="Inv. Amt" name="invoice_amount"
                                                placeholder="Inv. Amount" size="sm" type="decimal"
                                                required="Invoice Amount is required" isDisabled={disabled}
                                                // maxValue = PO base + sum of proforma additional charges
                                                maxValue={proformaMaxAmt > 0 ? proformaMaxAmt : undefined}
                                            />
                                            {payTermField('proforma')}
                                        </SimpleGrid>

                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={4}>
                                            {bankField('proforma', proformaForm)}
                                            <FieldUpload
                                                label="Inv. File" name="file"
                                                placeholder="Upload Invoice File"
                                                isDisabled={disabled} size="sm"
                                                required="Invoice file is required"
                                                inputProps={{ id: 'proformaFileUpload' }}
                                                reset={resetField}
                                            />
                                            <FieldInput
                                                label="Narration" name="narration"
                                                type="text" placeholder="Narration"
                                                isDisabled={disabled} size="sm"
                                            />
                                        </SimpleGrid>

                                        {/* Proforma — Additional Charges */}
                                        <AdditionalChargesTable
                                            charges={proformaCharges}
                                            setter={setProformaCharges}
                                        />

                                        <HStack justify="center" spacing={3} mt={4}>
                                            <Button leftIcon={<LuRefreshCw />} size="sm" variant="solid" colorScheme="red"
                                                isDisabled={disabled} onClick={() => handleFormReset(proformaForm)}>
                                                Reset
                                            </Button>
                                            <Button leftIcon={<HiEye />} size="sm" variant="solid" colorScheme="green" isDisabled>
                                                Preview
                                            </Button>
                                            <Button leftIcon={<LuPlus />} type="submit" colorScheme="brand" size="sm"
                                                isDisabled={disabled || saveProformaInvoice.isLoading}
                                                isLoading={saveProformaInvoice.isLoading} loadingText="Saving…">
                                                Add Invoice
                                            </Button>
                                        </HStack>
                                    </Formiz>
                                )}

                                {/* Invoice Form */}
                                {activeNav === 'invoice' && (
                                    <Formiz autoForm connect={invoiceForm}>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={4} mb={4}>
                                            <FieldDayPicker
                                                label="Pay Date" name="payment_date"
                                                placeholder="Select Payment Date"
                                                required="Payment Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }}
                                                disabledDays={{ after: new Date() }}
                                            />
                                            <FieldInput
                                                label="Pay By" name="payment_by"
                                                placeholder="Payment By" size="sm" type="text"
                                                required="Payment By is required" isDisabled={disabled}
                                            />
                                            {payTermField('invoice')}
                                            <FieldInput
                                                label="Inv Amt" name="invoice_amount"
                                                placeholder="Inv. Amount" size="sm" type="decimal"
                                                required="Invoice Amount is required" isDisabled={disabled}
                                                // maxValue = PO base + sum of invoice additional charges
                                                maxValue={invoiceMaxAmt > 0 ? invoiceMaxAmt : undefined}
                                            />
                                            <FieldDayPicker
                                                label="Due Date" name="due_date"
                                                placeholder="Select Due Date"
                                                required="Due Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }}
                                            />
                                            <FieldSelect
                                                key={`currency_${resetKey}`}
                                                label="Currency" name="currency_id" size="sm"
                                                required="Currency is required"
                                                options={currencyOptions} isDisabled={disabled}
                                                defaultValue={poCurrency ? poCurrency.id.toString() : '1'}
                                            />
                                        </SimpleGrid>

                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4} mb={4}>
                                            {bankField('invoice', invoiceForm)}
                                            <FieldInput
                                                label="Tax Inv No" name="tax_invoice_no"
                                                placeholder="Tax Inv No" size="sm" type="text"
                                                required="Tax Inv No is required" isDisabled={disabled}
                                            />
                                            <FieldDayPicker
                                                label="Tax Inv Date" name="tax_invoice_date"
                                                placeholder="Select Tax Inv Date"
                                                required="Tax Inv Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }}
                                            />
                                            <FieldUpload
                                                label="Inv File" name="file"
                                                placeholder="Upload Invoice File"
                                                isDisabled={disabled} size="sm"
                                                required="Invoice file is required"
                                                inputProps={{ id: 'invoiceFileUpload' }}
                                                reset={resetField}
                                            />
                                            <FieldInput
                                                label="Remarks" name="remarks"
                                                type="text" placeholder="Remarks"
                                                isDisabled={disabled} size="sm"
                                            />
                                        </SimpleGrid>

                                        {/* Invoice — Additional Charges */}
                                        <AdditionalChargesTable
                                            charges={invoiceCharges}
                                            setter={setInvoiceCharges}
                                        />

                                        <HStack justify="center" spacing={3} mt={4}>
                                            <Button leftIcon={<LuRefreshCw />} size="sm" variant="solid" colorScheme="red"
                                                isDisabled={disabled} onClick={() => handleFormReset(invoiceForm)}>
                                                Reset
                                            </Button>
                                            <Button leftIcon={<HiEye />} size="sm" variant="solid" colorScheme="green" isDisabled>
                                                Preview
                                            </Button>
                                            <Button leftIcon={<LuPlus />} type="submit" colorScheme="brand" size="sm"
                                                isDisabled={disabled || saveInvoice.isLoading}
                                                isLoading={saveInvoice.isLoading} loadingText="Saving…">
                                                Add Invoice
                                            </Button>
                                        </HStack>
                                    </Formiz>
                                )}
                            </Box>
                        </Box>

                        {/* Records Table */}
                        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="sm">

                            {activeNav === 'proforma' && (
                                <TableContainer overflow="auto">
                                    <LoadingOverlay isLoading={proformaListLoading}>
                                        <Table variant="striped" size="sm">
                                            <Thead>
                                                <Tr>
                                                    {['S.No.', 'Code', 'Invoice No', 'Invoice Date', 'Invoice Amt', 'Pay Term', 'Narration', 'Inv File', 'Action'].map((h) => (
                                                        <DarkTh key={h}>{h}</DarkTh>
                                                    ))}
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {!proformaList?.data?.length ? (
                                                    <Tr><Td colSpan={9} textAlign="center" color="gray.400" py={6}>No proforma invoices added yet</Td></Tr>
                                                ) : proformaList.data.map((item: any, i: number) => (
                                                    <Tr key={item.id}>
                                                        <Td>{i + 1}</Td>
                                                        <Td fontWeight="bold">{item.code}</Td>
                                                        <Td>{item.invoice_number}</Td>
                                                        <Td>{fmt(item.invoice_date)}</Td>
                                                        <Td whiteSpace="nowrap">{currencyCode} {item.invoice_amount}</Td>
                                                        <Td>{item.payment_term?.name ?? 'N/A'}</Td>
                                                        <Td>{item.narration ?? '—'}</Td>
                                                        <Td><DocumentDownloadButton size="sm" url={item.file ?? ''} /></Td>
                                                        <Td><IconButton aria-label="Preview" colorScheme="green" size="sm" icon={<HiEye />} /></Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </LoadingOverlay>
                                </TableContainer>
                            )}

                            {activeNav === 'invoice' && (
                                <TableContainer overflow="auto">
                                    <LoadingOverlay isLoading={invoiceListLoading}>
                                        <Table variant="striped" size="sm">
                                            <Thead>
                                                <Tr>
                                                    {['S.No.', 'Code', 'Pay Date', 'Pay By', 'Tax Inv No', 'Invoice Amt', 'Tax Inv Date', 'Due Date', 'Pay Term', 'Remarks', 'Inv File', 'Action'].map((h) => (
                                                        <DarkTh key={h}>{h}</DarkTh>
                                                    ))}
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {!invoiceList?.data?.length ? (
                                                    <Tr><Td colSpan={12} textAlign="center" color="gray.400" py={6}>No invoices added yet</Td></Tr>
                                                ) : invoiceList.data.map((item: any, i: number) => (
                                                    <Tr key={item.id}>
                                                        <Td>{i + 1}</Td>
                                                        <Td fontWeight="bold">{item.code}</Td>
                                                        <Td>{fmt(item.payment_date)}</Td>
                                                        <Td>{item.payment_by}</Td>
                                                        <Td>{item.tax_invoice_no}</Td>
                                                        <Td whiteSpace="nowrap">{currencyCode} {item.invoice_amount}</Td>
                                                        <Td>{fmt(item.tax_invoice_date)}</Td>
                                                        <Td>{fmt(item.due_date)}</Td>
                                                        <Td>{item.payment_term?.name ?? 'N/A'}</Td>
                                                        <Td>{item.remarks ?? '—'}</Td>
                                                        <Td><DocumentDownloadButton size="sm" url={item.file ?? ''} /></Td>
                                                        <Td><IconButton aria-label="Preview" colorScheme="green" size="sm" icon={<HiEye />} /></Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </LoadingOverlay>
                                </TableContainer>
                            )}
                        </Box>

                    </Stack>
                </LoadingOverlay>

            </Stack>
        </SlideIn>
    );
};

export default InvoiceForm;