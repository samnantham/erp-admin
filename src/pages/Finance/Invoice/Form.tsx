import { useEffect, useRef, useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@chakra-ui/icons';
import {
    Badge, Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading, IconButton,
    SimpleGrid, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tr, Menu, MenuButton, MenuList, MenuItem, Tooltip,
    useDisclosure,
    Portal
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import { HiArrowNarrowLeft, HiEye, HiCheckCircle } from 'react-icons/hi';
import { LuTrash2, LuPlus, LuRefreshCw, LuInfo } from 'react-icons/lu';
import { FaClipboardList } from 'react-icons/fa'
import { Link, useLocation, useNavigate } from 'react-router-dom';

import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import ConfirmationPopup from '@/components/ConfirmationPopup';
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
import { InvoiceInfoModal } from '@/components/Modals/Finance/InvoicePreview';
import { ItemTransactionsModal } from '@/components/Modals/Finance/ItemTransaction';

import {
    useInvoiceDropdowns, useInvoiceIndex, useMarkInvoiceReady, useMarkProformaInvoiceReady,
    useProformaInvoiceIndex, useSaveInvoice, useSaveProformaInvoice,
} from '@/services/finance/invoice/service';
import { useCustomerDetails, useCustomerRelationIndex } from '@/services/master/customer/service';
import { usePurchaseOrderDetails, usePurchaseOrderList } from '@/services/purchase/order/service';
import { formatDate } from '@/helpers/commonHelper';
import { useSubmasterItemIndex } from '@/services/submaster/service';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface ItemState {
    pay_on_amount: string;
    pay_on_qty: string;
    remarks: string;
    amount_is_manual: boolean;
}

interface ChargeRow {
    id: string;
    charge_type_id: string;
    input_value: string;
    remarks: string;
}

const newChargeRow = (): ChargeRow => ({
    id: uuidv4(), charge_type_id: '', input_value: '', remarks: '',
});

const fmt = (date?: string | null) => date ? dayjs(date).format('DD-MMM-YYYY') : '—';

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

// ─── ChargeRowForm ────────────────────────────────────────────────────────────

interface ChargeRowFormProps {
    row: ChargeRow;
    index: number;
    usedTypeIds: Set<string>;
    chargeTypeOptions: any[];
    financialCharges: any[];
    baseAmount: number;
    onTypeChange: (id: string, value: string) => void;
    onInputValueChange: (id: string, value: string) => void;
    onRemarksChange: (id: string, value: string) => void;
    onRemove: (id: string) => void;
    onReloadChargeTypes: () => void;
}

const ChargeRowForm = ({
    row, index, usedTypeIds, chargeTypeOptions, financialCharges, baseAmount,
    onTypeChange, onInputValueChange, onRemarksChange, onRemove, onReloadChargeTypes,
}: ChargeRowFormProps) => {
    const rowForm = useForm({});

    useEffect(() => {
        if (row.charge_type_id) rowForm.setValues({ charge_type_id: row.charge_type_id });
    }, [row.charge_type_id]);

    const selectedChargeType = financialCharges.find((o: any) => String(o.id) === String(row.charge_type_id));
    const isPercent = selectedChargeType?.charge_type === 'percent';
    const calcType = selectedChargeType?.calculation_type ?? 'add';
    const inputVal = parseFloat(row.input_value) || 0;
    const computedAmount = isPercent ? parseFloat(((inputVal / 100) * baseAmount).toFixed(2)) : inputVal;
    const options = chargeTypeOptions.map((opt: any) => ({
        ...opt,
        isDisabled: usedTypeIds.has(opt.value) && opt.value !== row.charge_type_id,
    }));

    return (
        <Formiz connect={rowForm}>
            <Tr>
                <Td>{index + 1}</Td>
                <Td minW="220px">
                    <FieldSelect
                        name="charge_type_id" placeholder="Select charge type"
                        options={options} size="sm" required="Charge type is required"
                        menuPortalTarget={document.body}
                        isDisabled={!!row.charge_type_id}
                        className={row.charge_type_id ? 'disabled-input' : ''}
                        onValueChange={(val: any) => { if (val) onTypeChange(row.id, String(val)); }}
                        selectProps={{
                            type: 'creatable',
                            noOptionsMessage: () => 'No charge types found',
                            menuPosition: 'fixed',
                            styles: { menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) },
                        }}
                        addNew={{
                            label: '+ Add New',
                            CreateModal: (p) => <SubMasterModalForm {...p} model="financial-charges" isEdit={false} />,
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
                <Td>
                    <FieldInput
                        name={`input_value_${row.id}`}
                        placeholder={isPercent ? 'e.g. 10 for 10%' : 'Amount'}
                        type="decimal" size="sm" required="Value is required"
                        defaultValue={row.input_value}
                        rightElement={isPercent ? '%' : undefined}
                        onValueChange={(val: any) => onInputValueChange(row.id, String(val ?? ''))}
                    />
                </Td>
                <Td minW="160px">
                    {!row.charge_type_id ? (
                        <Text fontSize="sm" color="gray.400">—</Text>
                    ) : isPercent ? (
                        <Box>
                            <Text fontSize="sm" fontWeight="semibold" color={calcType === 'subtract' ? 'red.500' : 'green.600'}>
                                {calcType === 'subtract' ? '−' : '+'} {computedAmount.toFixed(2)}
                            </Text>
                            <Text fontSize="xs" color="gray.400">{inputVal}% of {baseAmount.toFixed(2)}</Text>
                        </Box>
                    ) : (
                        <Text fontSize="sm" fontWeight="semibold" color={calcType === 'subtract' ? 'red.500' : 'green.600'}>
                            {calcType === 'subtract' ? '−' : '+'} {computedAmount.toFixed(2)}
                        </Text>
                    )}
                </Td>
                <Td>
                    <FieldInput
                        name={`remarks_${row.id}`} placeholder="Remarks" type="text" size="sm"
                        defaultValue={row.remarks}
                        onValueChange={(val: any) => onRemarksChange(row.id, String(val ?? ''))} />
                </Td>
                <Td>
                    <IconButton aria-label="Remove charge" icon={<LuTrash2 size={18} />}
                        variant="ghost" color="red.500" size="sm"
                        _hover={{ bg: 'transparent', color: 'red.600' }}
                        onClick={() => onRemove(row.id)} />
                </Td>
            </Tr>
        </Formiz>
    );
};

// ─── AdditionalChargesTable ───────────────────────────────────────────────────

interface AdditionalChargesTableProps {
    charges: ChargeRow[];
    setter: React.Dispatch<React.SetStateAction<ChargeRow[]>>;
    disabled: boolean;
    chargeTypeOptions: any[];
    financialCharges: any[];
    totalPayOnAccount: number;
    refetchDropdowns: () => void;
}

const AdditionalChargesTable = ({
    charges, setter, disabled, chargeTypeOptions, financialCharges, totalPayOnAccount, refetchDropdowns,
}: AdditionalChargesTableProps) => {
    const usedTypeIds = new Set(charges.map((c) => c.charge_type_id).filter(Boolean));
    const vatCharges = charges.filter((c) => financialCharges.find((o: any) => String(o.id) === String(c.charge_type_id))?.is_vat === true);
    const regularCharges = charges.filter((c) => !financialCharges.find((o: any) => String(o.id) === String(c.charge_type_id))?.is_vat);

    const regularNet = regularCharges.reduce((sum, c) => {
        const ct = financialCharges.find((o: any) => String(o.id) === String(c.charge_type_id));
        const val = parseFloat(c.input_value) || 0;
        const final = ct?.charge_type === 'percent' ? parseFloat(((val / 100) * totalPayOnAccount).toFixed(2)) : val;
        return ct?.calculation_type === 'subtract' ? sum - final : sum + final;
    }, 0);
    const preVatBase = parseFloat(Math.max(0, totalPayOnAccount + regularNet).toFixed(2));

    const chargeRowProps = (id: string) => ({
        onTypeChange: (rowId: string, val: string) => setter((prev) => prev.map((c) => c.id === rowId ? { ...c, charge_type_id: val } : c)),
        onInputValueChange: (rowId: string, val: string) => setter((prev) => prev.map((c) => c.id === rowId ? { ...c, input_value: val } : c)),
        onRemarksChange: (rowId: string, val: string) => setter((prev) => prev.map((c) => c.id === rowId ? { ...c, remarks: val } : c)),
        onRemove: (rowId: string) => setter((prev) => prev.filter((c) => c.id !== rowId)),
        onReloadChargeTypes: refetchDropdowns,
    });

    return (
        <Box>
            <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">Additional Charges</Text>
                <Button leftIcon={<LuPlus />} size="sm" colorScheme="brand" isDisabled={disabled}
                    onClick={() => setter((prev) => [...prev, newChargeRow()])}>
                    Add Charge
                </Button>
            </HStack>
            {charges.length === 0 ? (
                <Box border="1px dashed" borderColor="gray.300" borderRadius="md" py={4} textAlign="center">
                    <Text fontSize="sm" color="gray.400">No additional charges. Click "Add Charge" to add one.</Text>
                </Box>
            ) : (
                <Box overflowX="auto">
                    <Table variant="striped" size="sm">
                        <Thead>
                            <Tr>
                                <DarkTh>S.No.</DarkTh>
                                <DarkTh>Charge Type</DarkTh>
                                <DarkTh>Charge Value</DarkTh>
                                <DarkTh>Final Amount</DarkTh>
                                <DarkTh>Remarks</DarkTh>
                                <DarkTh>Action</DarkTh>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {regularCharges.map((charge, i) => (
                                <ChargeRowForm key={charge.id} row={charge} index={i}
                                    usedTypeIds={usedTypeIds} chargeTypeOptions={chargeTypeOptions}
                                    financialCharges={financialCharges} baseAmount={totalPayOnAccount}
                                    {...chargeRowProps(charge.id)} />
                            ))}
                            {vatCharges.length > 0 && (
                                <>
                                    <Tr><Td colSpan={6} p={0}><Box borderTop="2px dashed" borderColor="orange.300" /></Td></Tr>
                                    <Tr bg="orange.50">
                                        <Td colSpan={6} py={1} px={3}>
                                            <HStack spacing={1}>
                                                <Text fontSize="xs" color="orange.600" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">VAT</Text>
                                                <Text fontSize="xs" color="orange.400">— applied on pre-VAT total ({preVatBase.toFixed(2)})</Text>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                    {vatCharges.map((charge, i) => (
                                        <ChargeRowForm key={charge.id} row={charge} index={regularCharges.length + i}
                                            usedTypeIds={usedTypeIds} chargeTypeOptions={chargeTypeOptions}
                                            financialCharges={financialCharges} baseAmount={preVatBase}
                                            {...chargeRowProps(charge.id)} />
                                    ))}
                                </>
                            )}
                        </Tbody>
                    </Table>
                </Box>
            )}
        </Box>
    );
};

// ─── InvoiceSummary ───────────────────────────────────────────────────────────

const InvoiceSummary = ({ currencyCode, totalPayOnAccount, regularChargesNet, vatNet, preVatAmount, computedInvoiceAmount }: {
    currencyCode: string; totalPayOnAccount: number; regularChargesNet: number;
    vatNet: number; preVatAmount: number; computedInvoiceAmount: number;
}) => (
    <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={4} mt={4}>
        <HStack justify="flex-end" spacing={8} flexWrap="wrap">
            <HStack spacing={2}>
                <Text fontSize="sm" color="gray.500">Sub Total:</Text>
                <Text fontSize="sm" fontWeight="bold" color="blue.600">{currencyCode} {totalPayOnAccount.toFixed(2)}</Text>
            </HStack>
            {regularChargesNet !== 0 && (
                <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.500">Charges:</Text>
                    <Text fontSize="sm" fontWeight="bold" color={regularChargesNet < 0 ? 'red.500' : 'green.600'}>
                        {regularChargesNet >= 0 ? '+' : ''}{regularChargesNet.toFixed(2)}
                    </Text>
                </HStack>
            )}
            {vatNet !== 0 && (
                <>
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="gray.500">Pre-VAT:</Text>
                        <Text fontSize="sm" fontWeight="bold" color="gray.700">{currencyCode} {preVatAmount.toFixed(2)}</Text>
                    </HStack>
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="orange.500">VAT:</Text>
                        <Text fontSize="sm" fontWeight="bold" color="orange.500">{vatNet >= 0 ? '+' : ''}{vatNet.toFixed(2)}</Text>
                    </HStack>
                </>
            )}
            <HStack spacing={2}>
                <Text fontSize="sm" color="gray.500">Invoice Amount:</Text>
                <Text fontSize="sm" fontWeight="bold" color="brand.600">{currencyCode} {computedInvoiceAmount.toFixed(2)}</Text>
            </HStack>
        </HStack>
    </Box>
);

// ─── ActionMenu ───────────────────────────────────────────────────────────────

interface ActionMenuProps {
    item: any;
    onView: () => void;
    onMarkReady: () => void;
}

export const ActionMenu = ({ item, onView, onMarkReady }: ActionMenuProps) => {
    return (
        <Menu isLazy>
            <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                size="sm"
                variant="outline"
                bg="#0C2556"
                color="white"
                _hover={{ color: '#0C2556', bg: '#fff' }}
                _active={{ color: '#0C2556', bg: '#fff' }}
                fontWeight="medium"
                textAlign="left"
            >Action</MenuButton>
            <Portal>
                <MenuList zIndex={1500} minW="150px" fontSize="sm">
                    <MenuItem icon={<HiEye size={15} />} onClick={onView}>
                        View
                    </MenuItem>
                    {!item.is_ready_for_receipt && (
                        <MenuItem
                            icon={<HiCheckCircle size={15} />}
                            color={item.is_ready_for_receipt ? 'gray.400' : 'green.600'}
                            isDisabled={item.is_ready_for_receipt}
                            onClick={onMarkReady}
                        >
                            {item.is_ready_for_receipt ? 'Already Ready' : 'Mark as Ready'}
                        </MenuItem>
                    )}
                </MenuList>
            </Portal>
        </Menu>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const InvoiceForm = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { type: typeFromState } = (location.state ?? {}) as { type?: string };
    const isProforma = typeFromState === 'proforma';
    const pageTitle = isProforma ? 'Proforma Invoice' : 'Invoice';

    const [activeNav, setActiveNav] = useState<NavKey>(isProforma ? 'proforma' : 'invoice');
    const [resetKey, setResetKey] = useState(0);
    const [resetField, setResetField] = useState(false);
    const [txItem, setTxItem] = useState<any>(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const [refPreviewUrl, setRefPreviewUrl] = useState<string | null>(null);
    const [refPreviewTitle, setRefPreviewTitle] = useState<string>('');
    const [referenceType, setReferenceType] = useState<ReferenceType>('');
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<any>(null);
    const [poCurrency, setPoCurrency] = useState<any>(null);
    const [refDateVal, setRefDateVal] = useState('—');
    const [refValVal, setRefValVal] = useState('—');
    const [vendorName, setVendorName] = useState('—');
    const [vendorCode, setVendorCode] = useState('—');
    const [invoiceItems, setInvoiceItems] = useState<Record<string, ItemState>>({});
    const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(new Set());
    const [invoiceCharges, setInvoiceCharges] = useState<ChargeRow[]>([]);
    const [proformaCharges, setProformaCharges] = useState<ChargeRow[]>([]);

    // ── Modal state ──
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [confirmItem, setConfirmItem] = useState<any>(null);
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

    // ── Data ──
    const { data: purchaseOrderList } = usePurchaseOrderList({ enabled: referenceType === 'purchase_order' });
    const purchaseOrderOptions = purchaseOrderList?.data ?? [];
    const { data: currencyList } = useSubmasterItemIndex('currencies', {});
    const { data: paymentTermList } = useSubmasterItemIndex('payment-terms', {});
    const { data: financialChargesList } = useSubmasterItemIndex('financial-charges', {});
    const { openPreview } = usePDFPreview();
    const currencies: any[] = currencyList?.data ?? [];
    const paymentTerms: any[] = paymentTermList?.data ?? [];
    const financialCharges: any[] = financialChargesList?.data ?? [];

    const { data: dropdownData, refetch: refetchDropdowns } = useInvoiceDropdowns();
    const currencyOptions: any[] = dropdownData?.currencies ?? [];
    const paymentTermOptions: any[] = dropdownData?.payment_terms ?? [];
    const chargeTypeOptions: any[] = dropdownData?.financial_charges ?? [];

    const isValidReference = referenceType === 'purchase_order' && typeof referenceId === 'string' && referenceId.trim().length > 0;

    const { data: poDetails, isFetching: poDetailsFetching } = usePurchaseOrderDetails(isValidReference ? referenceId : undefined, { enabled: isValidReference });
    const { data: customerDetails, isLoading: customerDetailsLoading } = useCustomerDetails(customerId ?? '', { enabled: !!customerId && !!referenceId });
    const { data: customerBankList, isLoading: bankLoading, refetch: reloadCustomerBanks } = useCustomerRelationIndex(customerId, 'banks');

    const customerBankOptions = customerBankList?.data?.map((i: any) => ({ value: i.id, label: i.beneficiary_name })) ?? [];

    const { data: proformaList, isLoading: proformaListLoading, refetch: refetchProforma } =
        useProformaInvoiceIndex({ reference_type: referenceType, reference_id: referenceId ?? '' }, { enabled: !!referenceType && !!referenceId });

    const { data: invoiceList, isLoading: invoiceListLoading, refetch: refetchInvoice } =
        useInvoiceIndex({ reference_type: referenceType, reference_id: referenceId ?? '' }, { enabled: !!referenceType && !!referenceId });

    // ── Derived PO items ──
    const allPoItems: any[] = poDetails?.data?.items ?? [];
    const poItems = allPoItems.filter((item: any) => !removedItemIds.has(item.id));

    // ── Totals ──
    const getItemTotal = (item: any) => (item.qty ?? 0) * (item.price ?? item.unit_price ?? 0);
    const getPayOnAmount = (id: string) => parseFloat(invoiceItems[id]?.pay_on_amount ?? '0') || 0;
    const getPayOnQty = (id: string) => parseInt(invoiceItems[id]?.pay_on_qty ?? '0') || 0;

    const totalPayOnAccount = poItems
        .filter((item: any) => (getItemTotal(item) - (item.paid_amount ?? 0)) > 0)
        .reduce((sum, item) => sum + getPayOnAmount(item.id), 0);

    const computeRegularChargesTotal = (charges: ChargeRow[]) =>
        charges.reduce((sum, c) => {
            const ct = financialCharges.find((o: any) => String(o.id) === String(c.charge_type_id));
            if (ct?.is_vat) return sum;
            const val = parseFloat(c.input_value) || 0;
            const final = ct?.charge_type === 'percent' ? parseFloat(((val / 100) * totalPayOnAccount).toFixed(2)) : val;
            return ct?.calculation_type === 'subtract' ? sum - final : sum + final;
        }, 0);

    const computeVatTotal = (charges: ChargeRow[], base: number) =>
        charges.reduce((sum, c) => {
            const ct = financialCharges.find((o: any) => String(o.id) === String(c.charge_type_id));
            if (!ct?.is_vat) return sum;
            const val = parseFloat(c.input_value) || 0;
            const final = ct?.charge_type === 'percent' ? parseFloat(((val / 100) * base).toFixed(2)) : val;
            return ct?.calculation_type === 'subtract' ? sum - final : sum + final;
        }, 0);

    const activeCharges = activeNav === 'proforma' ? proformaCharges : invoiceCharges;
    const regularChargesNet = computeRegularChargesTotal(activeCharges);
    const preVatAmount = parseFloat(Math.max(0, totalPayOnAccount + regularChargesNet).toFixed(2));
    const vatNet = computeVatTotal(activeCharges, preVatAmount);
    const chargesNetEffect = regularChargesNet + vatNet;
    const computedInvoiceAmount = parseFloat(Math.max(0, totalPayOnAccount + chargesNetEffect).toFixed(2));

    // ── Forms ──
    const refForm = useForm({});
    const itemsForm = useForm({});

    const proformaForm = useForm({
        onValidSubmit: (values) => {
            if (!referenceId || !referenceType) return;
            saveProformaInvoice.mutate({
                reference_type: referenceType, reference_id: referenceId,
                customer_bank_id: values.customer_bank_id,
                date: formatDate(new Date().toISOString()) as string,
                payment_term_id: values.payment_term_id,
                invoice_number: values.invoice_number,
                invoice_date: formatDate(values.invoice_date) as string,
                invoice_amount: computedInvoiceAmount,
                sub_total: totalPayOnAccount,
                total_financial_charges: parseFloat(chargesNetEffect.toFixed(2)),
                is_ready_for_receipt: false,
                file: values.file ?? '',
                narration: values.narration ?? '',
                items: buildItemsPayload(),
                financial_charges: buildChargesPayload(proformaCharges),
            });
        },
    });

    const invoiceForm = useForm({
        onValidSubmit: (values) => {
            if (!referenceId || !referenceType) return;
            saveInvoice.mutate({
                reference_type: referenceType, reference_id: referenceId,
                customer_bank_id: values.customer_bank_id,
                invoice_type: referenceType === 'purchase_order' ? 'po' : 'lo',
                payment_by: values.payment_by,
                payment_date: formatDate(values.payment_date) as string,
                due_date: formatDate(values.due_date) as string,
                tax_invoice_no: values.tax_invoice_no,
                tax_invoice_date: formatDate(values.tax_invoice_date) as string,
                invoice_amount: computedInvoiceAmount,
                sub_total: totalPayOnAccount,
                total_financial_charges: parseFloat(chargesNetEffect.toFixed(2)),
                is_ready_for_receipt: false,
                currency_id: values.currency_id,
                payment_term_id: values.payment_term_id,
                file: values.file ?? '',
                remarks: values.remarks ?? '',
                items: buildItemsPayload(),
                financial_charges: buildChargesPayload(invoiceCharges),
            });
        },
    });

    // ── Payloads ──
    const buildItemsPayload = () =>
        poItems
            .filter((item: any) => Math.max(getItemTotal(item) - (item.paid_amount ?? 0), 0) > 0 && getPayOnAmount(item.id) > 0)
            .map((item: any) => ({
                reference_item_id: item.id,
                pay_on_amount: getPayOnAmount(item.id),
                pay_on_qty: getPayOnQty(item.id),
                remarks: invoiceItems[item.id]?.remarks?.trim() || null,
            }));

    const buildChargesPayload = (charges: ChargeRow[]) =>
        charges.filter((c) => c.charge_type_id && c.input_value)
            .map((c) => ({ charge_type_id: c.charge_type_id, input_value: parseFloat(c.input_value), remarks: c.remarks.trim() || null }));

    // ── Mutations ──
    const onSaveSuccess = (isProf: boolean) => () => {
        if (isProf) { proformaForm.reset(); setProformaCharges([]); }
        else { invoiceForm.reset(); setInvoiceCharges([]); }
        clearReference();
        isProf ? refetchProforma() : refetchInvoice();
    };

    const saveProformaInvoice = useSaveProformaInvoice({ onSuccess: onSaveSuccess(true) });
    const saveInvoice = useSaveInvoice({ onSuccess: onSaveSuccess(false) });

    const markInvoiceReady = useMarkInvoiceReady({
        onSuccess: () => { onConfirmClose(); setConfirmItem(null); refetchInvoice(); },
    });
    const markProformaReady = useMarkProformaInvoiceReady({
        onSuccess: () => { onConfirmClose(); setConfirmItem(null); refetchProforma(); },
    });

    const handleMarkReady = (item: any) => { setConfirmItem(item); onConfirmOpen(); };
    const confirmMarkReady = () => {
        if (!confirmItem) return;
        activeNav === 'proforma' ? markProformaReady.mutate(confirmItem.id) : markInvoiceReady.mutate(confirmItem.id);
    };

    const debouncedSetRefId = useRef(debounce((value: string) => setReferenceId(value), 500)).current;
    const bumpReset = () => { setResetKey((k) => k + 1); setResetField(true); };

    const clearReference = () => {
        debouncedSetRefId.cancel();
        setReferenceType(''); setReferenceId(null); setCustomerId(null); setPoCurrency(null);
        setInvoiceItems({}); setRemovedItemIds(new Set());
        setInvoiceCharges([]); setProformaCharges([]);
        setRefDateVal('—'); setRefValVal('—'); setVendorName('—'); setVendorCode('—');
        setRefPreviewUrl(null); setRefPreviewTitle('');
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

    const handleItemChange = (itemId: string, field: keyof ItemState, value: string) => {
        setInvoiceItems((prev) => {
            const current = prev[itemId] ?? { pay_on_amount: '0', pay_on_qty: '0', remarks: '', amount_is_manual: false };
            const updated = { ...current, [field]: value };

            if (field === 'pay_on_qty') {
                const qty = parseInt(value) || 0;
                updated.amount_is_manual = false;
                if (qty === 0) {
                    updated.pay_on_amount = '0';
                    setTimeout(() => itemsForm.setValues({ [`pay_on_qty_${itemId}`]: '0', [`pay_on_amount_${itemId}`]: '0' }), 0);
                } else {
                    const item = allPoItems.find((i: any) => i.id === itemId);
                    if (item) {
                        const unitPrice = parseFloat(item.price ?? item.unit_price ?? 0);
                        const remaining = Math.max(getItemTotal(item) - (item.paid_amount ?? 0), 0);
                        const remainingQty = Math.max((item.qty ?? 0) - (item.paid_qty ?? 0), 0);
                        const clamped = Math.min(qty, remainingQty);
                        const computed = parseFloat(Math.min(clamped * unitPrice, remaining).toFixed(2));
                        updated.pay_on_qty = String(clamped);
                        updated.pay_on_amount = String(computed);
                        setTimeout(() => itemsForm.setValues({ [`pay_on_amount_${itemId}`]: String(computed) }), 0);
                    }
                }
            }

            if (field === 'pay_on_amount') {
                const amount = parseFloat(value) || 0;
                if (amount === 0) {
                    updated.pay_on_qty = '0'; updated.amount_is_manual = false;
                    setTimeout(() => itemsForm.setValues({ [`pay_on_qty_${itemId}`]: '0', [`pay_on_amount_${itemId}`]: '0' }), 0);
                } else {
                    updated.amount_is_manual = true; updated.pay_on_qty = '0';
                    setTimeout(() => itemsForm.setValues({ [`pay_on_qty_${itemId}`]: '0' }), 0);
                }
            }

            return { ...prev, [itemId]: updated };
        });
    };

    const handleRemoveItem = (itemId: string) => {
        setRemovedItemIds((prev) => new Set([...prev, itemId]));
        setInvoiceItems((prev) => { const next = { ...prev }; delete next[itemId]; return next; });
    };

    const handleAddNewSuccess = (fieldName: string, targetForm: ReturnType<typeof useForm>, refetch: () => void) => (data: any) => {
        const record = data?.data ?? data;
        refetch();
        setTimeout(() => targetForm.setValues({ [fieldName]: record?.id }), 150);
    };

    // ── Effects ──
    useEffect(() => {
        if (activeNav !== 'proforma') return;
        const ciaTerm = paymentTerms.find((t: any) => t.code?.toLowerCase() === 'cia');
        if (ciaTerm) proformaForm.setValues({ payment_term_id: ciaTerm.id.toString() });
    }, [activeNav, paymentTerms]);

    useEffect(() => {
        if (!referenceId || !poDetails?.data) { setRefDateVal('—'); setRefValVal('—'); return; }
        const { customer_id, currency_id, total_price, created_at } = poDetails.data;
        setCustomerId(customer_id ?? '');
        const currency = currencies.find((c) => c.id === (currency_id ?? 1));
        setPoCurrency(currency ?? null);
        setRefDateVal(fmt(created_at));
        setRefValVal(currency ? `${currency.code} ${total_price}` : String(total_price));
        const initialItems: Record<string, ItemState> = {};
        (poDetails.data.items ?? []).forEach((item: any) => {
            initialItems[item.id] = { pay_on_amount: '0', pay_on_qty: '0', remarks: '', amount_is_manual: false };
        });
        setInvoiceItems(initialItems);
        setRemovedItemIds(new Set());
    }, [referenceId, poDetails]);

    useEffect(() => {
        if (!customerId || !customerDetails?.data) { setVendorName('—'); setVendorCode('—'); return; }
        setVendorName(customerDetails.data.business_name ?? '—');
        setVendorCode(customerDetails.data.code ?? '—');
        const termId = customerDetails.data.payment_term?.id?.toString();
        if (termId) invoiceForm.setValues({ ...(activeNav !== 'proforma' && { payment_term_id: termId }), currency_id: customerDetails.data?.currency_id });
    }, [customerId, customerDetails, activeNav]);

    // ── Derived ──
    const disabled = !referenceId;
    const currencyCode = poCurrency?.code ?? '';
    const refDateLabel = referenceType === 'purchase_order' ? 'PO Date' : referenceType === 'logistic_order' ? 'LO Date' : 'Ref Date';
    const refValLabel = referenceType === 'purchase_order' ? 'PO Value' : referenceType === 'logistic_order' ? 'LO Value' : 'Ref Value';

    const payTermField = (key: string) => (
        <FieldSelect key={`payment_term_${key}_${resetKey}`} label="Pay Term" name="payment_term_id"
            required="Payment Term is required" placeholder="Select Term" options={paymentTermOptions}
            isDisabled={key === 'proforma'} size="sm" className={key === 'proforma' ? 'disabled-input' : ''} />
    );

    const bankField = (key: string, targetForm: ReturnType<typeof useForm>) => (
        <FieldSelect key={`bank_${key}_${resetKey}`} label="Customer Bank" name="customer_bank_id"
            required="Customer Bank is required" placeholder="Select Bank"
            selectProps={{ isLoading: customerDetailsLoading || bankLoading, type: 'creatable', noOptionsMessage: () => 'No banks found' }}
            options={customerBankOptions} isDisabled={disabled} size="sm"
            className={disabled ? 'disabled-input' : ''} isCaseSensitive
            addNew={{
                label: '+ Add New',
                CreateModal: (p) => (
                    <BankModal {...p} customerId={customerId} isEdit={false}
                        customerInfo={customerDetails?.data} onClose={p.onClose}
                        onSuccess={(data) => handleAddNewSuccess('customer_bank_id', targetForm, reloadCustomerBanks)(data)} />
                ),
            }}
        />
    );

    const summaryProps = { currencyCode, totalPayOnAccount, regularChargesNet, vatNet, preVatAmount, computedInvoiceAmount };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Header */}
                <HStack justify="space-between" align="flex-end">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={5} color="gray.400" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/finance/invoice/master">Invoice Entry List</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>Create {pageTitle} Entry</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <HStack spacing={2} align="center">
                            <Heading as="h4" size="md">Create {pageTitle} Entry</Heading>
                            {referenceType && (
                                <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                                    {referenceType === 'purchase_order' ? 'PO' : 'LO'}
                                </Badge>
                            )}
                        </HStack>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />} size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <LoadingOverlay isLoading={poDetailsFetching}>
                    <Stack spacing={3} p={4} bg="white" borderRadius="md" boxShadow="md">

                        {/* Reference */}
                        <SectionCard title="Reference">
                            <Formiz autoForm connect={refForm}>
                                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={4}>
                                    <FieldSelect key={`ref_type_${resetKey}`} label="Ref Type" name="reference_type"
                                        placeholder="Select Ref Type" options={REFERENCE_OPTIONS} size="sm"
                                        onValueChange={handleRefTypeChange} />
                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">Ref No</FormLabel>
                                            <HStack spacing={2} align="center">
                                                <IconButton
                                                    aria-label="Preview reference" color="black" variant="unstyled"
                                                    boxShadow="none" minW="auto" size="sm" background="transparent !important"
                                                    border="none" icon={<LuInfo size={18} />}
                                                    isDisabled={referenceId === null}
                                                    onClick={() => {
                                                        if (refPreviewUrl && referenceId) {
                                                            const url = `${import.meta.env.VITE_PUBLIC_API_URL}${refPreviewUrl.replace(':id', referenceId)}`;
                                                            openPreview(url, `${refPreviewTitle} Preview`, true);
                                                        }
                                                    }}
                                                    _disabled={{ background: 'transparent', border: 'none', opacity: 0.4, cursor: 'not-allowed' }}
                                                />
                                                <FieldSelect key={`ref_id_${resetKey}`} name="reference_id"
                                                    placeholder="Select Ref No" options={purchaseOrderOptions}
                                                    isDisabled={!referenceType} size="sm" onValueChange={handleRefIdChange} />
                                            </HStack>
                                        </FormControl>
                                    </Box>
                                    <FieldDisplay key={`refDate_${resetKey}`} label={refDateLabel} value={refDateVal} size="sm" />
                                    <FieldDisplay key={`refVal_${resetKey}`} label={refValLabel} value={refValVal} size="sm" />
                                    <FieldDisplay key={`vendor_${resetKey}`} label="Vendor Name" value={vendorName} size="sm" />
                                    <FieldDisplay key={`code_${resetKey}`} label="Vendor Code" value={vendorCode} size="sm" />
                                </SimpleGrid>
                            </Formiz>
                        </SectionCard>

                        {/* ── Reference Items ── */}
                        {referenceId && poItems.length > 0 && (
                            <SectionCard title={`${REFERENCE_OPTIONS.find(o => o.value === referenceType)?.label ?? 'Reference'} Items`}>
                                <Formiz connect={itemsForm}>
                                    <TableContainer>
                                        <Table variant="striped" size="sm">
                                            <Thead>
                                                <Tr>
                                                    <DarkTh>S.No.</DarkTh><DarkTh>Item Name</DarkTh><DarkTh>Qty</DarkTh>
                                                    <DarkTh sx={{ textAlign: 'right' }}>Unit Price</DarkTh>
                                                    <DarkTh sx={{ textAlign: 'right' }}>Total</DarkTh>
                                                    <DarkTh sx={{ textAlign: 'right' }}>Paid</DarkTh>
                                                    <DarkTh sx={{ textAlign: 'center' }}>Pay on Qty</DarkTh>
                                                    <DarkTh sx={{ textAlign: 'center' }}>Pay on Amount</DarkTh>
                                                    <DarkTh sx={{ textAlign: 'center' }}>Balance</DarkTh>
                                                    <DarkTh>Remarks</DarkTh><DarkTh>Action</DarkTh>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {poItems.map((item: any, i: number) => {
                                                    const itemTotal = getItemTotal(item);
                                                    const alreadyPaid = item.paid_amount ?? 0;
                                                    const remaining = Math.max(itemTotal - alreadyPaid, 0);
                                                    const totalQty = item.qty ?? 0;
                                                    const remainingQty = Math.max(totalQty - (item.paid_qty ?? 0), 0);
                                                    const payOnAmt = getPayOnAmount(item.id);
                                                    const balance = Math.max(remaining - payOnAmt, 0);
                                                    const isAlreadyPaid = remaining <= 0;
                                                    const isFullyPaid = balance <= 0 && payOnAmt > 0;
                                                    const unitPrice = parseFloat(item.price ?? item.unit_price ?? 0);
                                                    const hasQty = parseInt(invoiceItems[item.id]?.pay_on_qty ?? '0') > 0;
                                                    const amountIsManual = invoiceItems[item.id]?.amount_is_manual ?? false;
                                                    const qtyDisabled = disabled || isAlreadyPaid || amountIsManual;
                                                    const amountDisabled = disabled || isAlreadyPaid || (hasQty && !amountIsManual);

                                                    return (
                                                        <Tr key={item.id} bg={isAlreadyPaid ? 'gray.100' : isFullyPaid ? 'green.50' : undefined}>
                                                            <Td>{i + 1}</Td>
                                                            <Td>
                                                                <Text color={isAlreadyPaid ? 'gray.400' : undefined}>
                                                                    {item.part_number?.name ?? item.description ?? '—'}
                                                                </Text>
                                                                {isAlreadyPaid && (
                                                                    <HStack spacing={1} mt={0.5}>
                                                                        <Text fontSize="xs" color="red.400" fontWeight="bold">Already Paid</Text>
                                                                        <IconButton
                                                                            aria-label="View transactions"
                                                                            icon={<FaClipboardList size={13} />}
                                                                            variant="ghost" size="xs" color="black.400"
                                                                            _hover={{ bg: 'transparent', color: 'green.600' }}
                                                                            onClick={() => { setTxItem(item); setIsTxModalOpen(true); }}
                                                                        />
                                                                    </HStack>
                                                                )}
                                                                {!isAlreadyPaid && isFullyPaid && (
                                                                    <HStack spacing={1} mt={0.5}>
                                                                        <Text fontSize="xs" color="green.600" fontWeight="bold">Fully Paid</Text>
                                                                        <IconButton
                                                                            aria-label="View transactions"
                                                                            icon={<FaClipboardList size={13} />}
                                                                            variant="ghost" size="xs" color="green.600"
                                                                            _hover={{ bg: 'transparent', color: 'green.700' }}
                                                                            onClick={() => { setTxItem(item); setIsTxModalOpen(true); }}
                                                                        />
                                                                    </HStack>
                                                                )}
                                                            </Td>
                                                            <Td>{totalQty}</Td>
                                                            <Td isNumeric>{`${currencyCode} ${unitPrice.toFixed(2)}`}</Td>
                                                            <Td isNumeric>{`${currencyCode} ${itemTotal.toFixed(2)}`}</Td>
                                                            <Td isNumeric>
                                                                <Text fontSize="sm" color={alreadyPaid > 0 ? 'orange.500' : 'gray.400'} fontWeight="semibold">
                                                                    {`${currencyCode} ${alreadyPaid.toFixed(2)}`}
                                                                </Text>
                                                            </Td>
                                                            <Td sx={{ textAlign: 'center' }}>
                                                                <FieldInput
                                                                    name={`pay_on_qty_${item.id}`}
                                                                    placeholder={remainingQty === 0 ? 'Paid' : '0'}
                                                                    type="number" size="sm"
                                                                    inputProps={{ width: '100px', min: 0, max: remainingQty, step: 1 }}
                                                                    isDisabled={qtyDisabled || remainingQty === 0}
                                                                    className={(qtyDisabled || remainingQty === 0) ? 'disabled-input' : ''}
                                                                    defaultValue={invoiceItems[item.id]?.pay_on_qty ?? ''}
                                                                    maxValue={remainingQty}
                                                                    onValueChange={(val: any) => {
                                                                        const qty = Math.min(Math.max(parseInt(String(val)) || 0, 0), remainingQty);
                                                                        handleItemChange(item.id, 'pay_on_qty', String(qty));
                                                                    }}
                                                                />
                                                            </Td>
                                                            <Td sx={{ textAlign: 'center' }}>
                                                                <FieldInput
                                                                    name={`pay_on_amount_${item.id}`}
                                                                    placeholder={isAlreadyPaid ? 'Paid' : '0.00'}
                                                                    type="decimal" size="sm"
                                                                    isDisabled={amountDisabled}
                                                                    className={amountDisabled ? 'disabled-input' : ''}
                                                                    defaultValue={invoiceItems[item.id]?.pay_on_amount ?? ''}
                                                                    maxValue={remaining}
                                                                    onValueChange={(val: any) => {
                                                                        const clamped = parseFloat(Math.min(Math.max(parseFloat(String(val)) || 0, 0), remaining).toFixed(2));
                                                                        handleItemChange(item.id, 'pay_on_amount', String(clamped));
                                                                    }}
                                                                />
                                                            </Td>
                                                            <Td sx={{ textAlign: 'center' }}>
                                                                <Text fontSize="sm" fontWeight="semibold" color={balance <= 0 ? 'green.500' : 'blue.600'}>
                                                                    {isAlreadyPaid ? '—' : `${currencyCode} ${balance.toFixed(2)}`}
                                                                </Text>
                                                            </Td>
                                                            <Td>
                                                                <FieldInput
                                                                    name={`remarks_${item.id}`} placeholder="Remarks" type="text" size="sm"
                                                                    inputProps={{ width: '180px' }} isDisabled={disabled || isAlreadyPaid}
                                                                    defaultValue={invoiceItems[item.id]?.remarks ?? ''}
                                                                    onValueChange={(val: any) => handleItemChange(item.id, 'remarks', String(val ?? ''))}
                                                                />
                                                            </Td>
                                                            <Td>
                                                                <IconButton aria-label="Remove item" icon={<LuTrash2 size={20} />}
                                                                    variant="ghost" color="red.500"
                                                                    _hover={{ bg: 'transparent', color: 'red.600' }}
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    isDisabled={poItems.length <= 1 || isAlreadyPaid} />
                                                            </Td>
                                                        </Tr>
                                                    );
                                                })}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </Formiz>
                            </SectionCard>
                        )}

                        {/* ── Additional Charges ── */}
                        {referenceId && (
                            <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="sm" p={4}>
                                <AdditionalChargesTable
                                    charges={activeNav === 'proforma' ? proformaCharges : invoiceCharges}
                                    setter={activeNav === 'proforma' ? setProformaCharges : setInvoiceCharges}
                                    disabled={disabled} chargeTypeOptions={chargeTypeOptions}
                                    financialCharges={financialCharges} totalPayOnAccount={totalPayOnAccount}
                                    refetchDropdowns={refetchDropdowns} />
                            </Box>
                        )}

                        {/* ── Invoice Entry Card ── */}
                        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="sm">
                            <HStack px={4} py={2} bg="#0C2556" justify="space-between">
                                <Text fontSize="sm" color="white" textTransform="uppercase" letterSpacing="wide" fontWeight="medium">
                                    {activeNav === 'invoice' ? 'Invoice Entry' : 'Proforma Invoice Entry'}
                                </Text>
                                <HStack spacing={0} border="1px solid" borderColor="white">
                                    {NAV_ITEMS.map((navItem) => {
                                        const isActive = activeNav === navItem.key;
                                        return (
                                            <Box key={navItem.key} px={4} py={1} cursor="pointer"
                                                onClick={() => setActiveNav(navItem.key)}
                                                bg={isActive ? 'white' : 'transparent'}
                                                transform={isActive ? 'scale(1.05)' : 'scale(1)'}
                                                _hover={{ bg: isActive ? 'white' : 'whiteAlpha.200' }}
                                                transition="all 0.25s ease"
                                                _notLast={{ borderRight: '1px solid', borderColor: 'whiteAlpha.800' }}>
                                                <HStack spacing={1.5}>
                                                    {isActive && <HiCheckCircle color="#0C2556" />}
                                                    <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'normal'} color={isActive ? '#0C2556' : 'white'}>
                                                        {navItem.label}
                                                    </Text>
                                                </HStack>
                                            </Box>
                                        );
                                    })}
                                </HStack>
                            </HStack>

                            <Box p={4}>
                                {activeNav === 'proforma' && (
                                    <Formiz autoForm connect={proformaForm}>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4} mb={4}>
                                            <FieldInput label="Invoice No" name="invoice_number" placeholder="Inv. No" size="sm"
                                                required="Invoice Number is required" isDisabled={disabled} />
                                            <FieldDayPicker label="Inv. Date" name="invoice_date" placeholder="Select Invoice Date"
                                                required="Invoice Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }} disabledDays={{ after: new Date() }} />
                                            <FieldDisplay label="Inv. Amount" value={`${currencyCode} ${computedInvoiceAmount.toFixed(2)}`}
                                                size="sm" style={{ backgroundColor: '#f7f7f7' }} />
                                            {payTermField('proforma')}
                                        </SimpleGrid>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} mb={4}>
                                            {bankField('proforma', proformaForm)}
                                            <FieldUpload label="Inv. File" name="file" placeholder="Upload Invoice File"
                                                isDisabled={disabled} size="sm" required="Invoice file is required"
                                                inputProps={{ id: 'proformaFileUpload' }} reset={resetField} />
                                            <FieldInput label="Narration" name="narration" type="text" placeholder="Narration"
                                                isDisabled={disabled} size="sm" />
                                        </SimpleGrid>
                                        <InvoiceSummary {...summaryProps} />
                                        <HStack justify="center" spacing={3} mt={4}>
                                            <Button leftIcon={<LuRefreshCw />} size="sm" colorScheme="red" isDisabled={disabled}
                                                onClick={() => { proformaForm.reset(); setProformaCharges([]); clearReference(); }}>Reset</Button>
                                            <Button leftIcon={<LuPlus />} type="submit" colorScheme="brand" size="sm"
                                                isDisabled={disabled || saveProformaInvoice.isLoading}
                                                isLoading={saveProformaInvoice.isLoading} loadingText="Saving…">Add Invoice</Button>
                                        </HStack>
                                    </Formiz>
                                )}

                                {activeNav === 'invoice' && (
                                    <Formiz autoForm connect={invoiceForm}>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 6 }} spacing={4} mb={4}>
                                            <FieldDayPicker label="Pay Date" name="payment_date" placeholder="Select Payment Date"
                                                required="Payment Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }} disabledDays={{ after: new Date() }} />
                                            <FieldInput label="Pay By" name="payment_by" placeholder="Payment By" size="sm"
                                                required="Payment By is required" isDisabled={disabled} />
                                            {payTermField('invoice')}
                                            <FieldDayPicker label="Due Date" name="due_date" placeholder="Select Due Date"
                                                required="Due Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }} />
                                            <FieldSelect key={`currency_${resetKey}`} label="Currency" name="currency_id" size="sm"
                                                required="Currency is required" options={currencyOptions} isDisabled={disabled}
                                                defaultValue={poCurrency ? poCurrency.id.toString() : '1'} />
                                            <FieldDisplay label="Inv. Amount" value={`${currencyCode} ${computedInvoiceAmount.toFixed(2)}`}
                                                size="sm" style={{ backgroundColor: '#f7f7f7' }} />
                                        </SimpleGrid>
                                        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4} mb={4}>
                                            {bankField('invoice', invoiceForm)}
                                            <FieldInput label="Tax Inv No" name="tax_invoice_no" placeholder="Tax Inv No" size="sm"
                                                required="Tax Inv No is required" isDisabled={disabled} />
                                            <FieldDayPicker label="Tax Inv Date" name="tax_invoice_date" placeholder="Select Tax Inv Date"
                                                required="Tax Inv Date is required" size="sm"
                                                dayPickerProps={{ inputProps: { isDisabled: disabled } }} />
                                            <FieldUpload label="Inv File" name="file" placeholder="Upload Invoice File"
                                                isDisabled={disabled} size="sm" required="Invoice file is required"
                                                inputProps={{ id: 'invoiceFileUpload' }} reset={resetField} />
                                            <FieldInput label="Remarks" name="remarks" type="text" placeholder="Remarks"
                                                isDisabled={disabled} size="sm" />
                                        </SimpleGrid>
                                        <InvoiceSummary {...summaryProps} />
                                        <HStack justify="center" spacing={3} mt={4}>
                                            <Button leftIcon={<LuRefreshCw />} size="sm" colorScheme="red" isDisabled={disabled}
                                                onClick={() => { invoiceForm.reset(); setInvoiceCharges([]); clearReference(); }}>Reset</Button>
                                            <Button leftIcon={<LuPlus />} type="submit" colorScheme="brand" size="sm"
                                                isDisabled={disabled || saveInvoice.isLoading}
                                                isLoading={saveInvoice.isLoading} loadingText="Saving…">Add Invoice</Button>
                                        </HStack>
                                    </Formiz>
                                )}
                            </Box>
                        </Box>

                        {/* ── Records Tables ── */}
                        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" boxShadow="sm">
                            {activeNav === 'proforma' && (
                                <TableContainer overflow="auto">
                                    <LoadingOverlay isLoading={proformaListLoading}>
                                        <Table variant="striped" size="sm">
                                            <Thead><Tr>
                                                {['S.No.', 'Code', 'Invoice No', 'Invoice Date', 'Invoice Amt', 'Pay Term', 'Narration', 'Inv File', 'Action'].map((h) => <DarkTh key={h}>{h}</DarkTh>)}
                                            </Tr></Thead>
                                            <Tbody>
                                                {!proformaList?.data?.length ? (
                                                    <Tr><Td colSpan={9} textAlign="center" color="gray.400" py={6}>No proforma invoices added yet</Td></Tr>
                                                ) : proformaList.data.map((item: any, i: number) => (
                                                    <Tr key={item.id}>
                                                        <Td>{i + 1}</Td>
                                                        <Tooltip
                                                            label={item.is_ready_for_receipt ? "Ready for receipt" : "Not Ready for receipt yet"}
                                                            hasArrow
                                                            bg={item.is_ready_for_receipt ? "green.500" : "orange.500"}
                                                            color="white"
                                                        >
                                                            <Td fontWeight="bold" color={item.is_ready_for_receipt ? "green.600" : "orange.600"}>{item.code}</Td>
                                                        </Tooltip>
                                                        <Td>{item.invoice_number}</Td>
                                                        <Td>{fmt(item.invoice_date)}</Td>
                                                        <Td whiteSpace="nowrap">{currencyCode} {parseFloat(item.invoice_amount ?? 0).toFixed(2)}</Td>
                                                        <Td>{item.payment_term?.name ?? 'N/A'}</Td>
                                                        <Td>{item.narration ?? '—'}</Td>
                                                        <Td><DocumentDownloadButton size="xs" url={item.file ?? ''} /></Td>
                                                        <Td>
                                                            <ActionMenu
                                                                item={item}
                                                                onView={() => { setSelectedInvoice(item); setIsInfoModalOpen(true); }}
                                                                onMarkReady={() => handleMarkReady(item)}
                                                            />
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </LoadingOverlay>
                                </TableContainer>
                            )}
                            {activeNav === 'invoice' && (
                                <TableContainer overflow="auto" sx={{ overflowX: 'auto', overflowY: 'visible' }}>
                                    <LoadingOverlay isLoading={invoiceListLoading}>
                                        <Table variant="striped" size="sm">
                                            <Thead><Tr>
                                                {/* , 'Remarks', 'Tax Inv Date', 'Tax Inv No' */}
                                                {['S.No.', 'Inv No', 'Pay Date', 'Pay By', 'Invoice Amt', 'Due Date', 'Pay Term', 'Inv File', 'Action'].map((h) => <DarkTh key={h}>{h}</DarkTh>)}
                                            </Tr></Thead>
                                            <Tbody>
                                                {!invoiceList?.data?.length ? (
                                                    <Tr><Td colSpan={12} textAlign="center" color="gray.400" py={6}>No invoices added yet</Td></Tr>
                                                ) : invoiceList.data.map((item: any, i: number) => (
                                                    <Tr key={item.id}>
                                                        <Td>{i + 1}</Td>
                                                        <Tooltip
                                                            label={item.is_ready_for_receipt ? "Ready for receipt" : "Not Ready for receipt yet"}
                                                            hasArrow
                                                            bg={item.is_ready_for_receipt ? "green.500" : "orange.500"}
                                                            color="white"
                                                        >
                                                            <Td fontWeight="bold" color={item.is_ready_for_receipt ? "green.600" : "orange.600"}>{item.code}</Td>
                                                        </Tooltip>
                                                        <Td>{fmt(item.payment_date)}</Td>
                                                        <Td>{item.payment_by}</Td>
                                                        {/* <Td>{item.tax_invoice_no}</Td> */}
                                                        <Td whiteSpace="nowrap">{currencyCode} {parseFloat(item.invoice_amount ?? 0).toFixed(2)}</Td>
                                                        {/* <Td>{fmt(item.tax_invoice_date)}</Td> */}
                                                        <Td>{fmt(item.due_date)}</Td>
                                                        <Td>{item.payment_term?.name ?? 'N/A'}</Td>
                                                        {/* <Td>{item.remarks ?? '—'}</Td> */}
                                                        <Td><DocumentDownloadButton size="xs" url={item.file ?? ''} /></Td>
                                                        <Td>
                                                            <ActionMenu
                                                                item={item}
                                                                onView={() => { setSelectedInvoice(item); setIsInfoModalOpen(true); }}
                                                                onMarkReady={() => handleMarkReady(item)}
                                                            />
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </LoadingOverlay>
                                </TableContainer>
                            )}
                        </Box>

                        {/* ── Modals ── */}
                        <InvoiceInfoModal
                            isOpen={isInfoModalOpen}
                            onClose={() => { setIsInfoModalOpen(false); setSelectedInvoice(null); }}
                            invoice={selectedInvoice} currencyCode={currencyCode}
                            isProforma={activeNav === 'proforma'}
                            poData={poDetails} poLoading={poDetailsFetching}
                            onPreviewPo={() => {
                                if (refPreviewUrl && referenceId) {
                                    const url = `${import.meta.env.VITE_PUBLIC_API_URL}${refPreviewUrl.replace(':id', referenceId)}`;
                                    openPreview(url, `${refPreviewTitle} Preview`, true);
                                }
                            }}
                        />

                        <ConfirmationPopup
                            isOpen={isConfirmOpen}
                            onClose={() => { onConfirmClose(); setConfirmItem(null); }}
                            onConfirm={confirmMarkReady}
                            headerText="Mark Ready for Receipt"
                            bodyText={`Are you sure you want to mark ${confirmItem?.code ?? 'this invoice'} as ready for receipt? This action cannot be undone.`}
                        />

                        <ItemTransactionsModal
                            isOpen={isTxModalOpen}
                            onClose={() => { setIsTxModalOpen(false); setTxItem(null); }}
                            referenceItemId={txItem?.id}
                            partName={txItem?.part_number?.name ?? txItem?.description}
                            currencyCode={currencyCode}
                            poCode={poDetails?.data?.code ?? ''} 
                        />

                    </Stack>
                </LoadingOverlay>
            </Stack>
        </SlideIn>
    );
};

export default InvoiceForm;