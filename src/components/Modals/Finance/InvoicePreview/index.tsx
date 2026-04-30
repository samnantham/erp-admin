import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalCloseButton, HStack, Badge,
    Stack, Box, Text, Table, Thead, Tr, Th, Tbody, Td,
    Button,
    SimpleGrid, Spinner,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import { HiEye } from 'react-icons/hi';
interface InvoiceInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
    currencyCode: string;
    isProforma?: boolean;
    poData?: any;        // ← new: full PO details passed from parent
    poLoading?: boolean; // ← new: loading state from parent
    onPreviewPo?: () => void;
}

const fmt = (date?: string | null) => date ? dayjs(date).format('DD-MMM-YYYY') : '—';

const InfoRow = ({ label, value, valueColor }: { label: string; value: any; valueColor?: string }) => (
    <HStack justify="space-between" py={1} borderBottom="1px solid" borderColor="gray.100">
        <Text fontSize="xs" color="gray.500" fontWeight="medium" minW="120px">{label}</Text>
        <Text fontSize="xs" fontWeight="semibold" color={valueColor ?? "gray.700"} textAlign="right">{value ?? '—'}</Text>
    </HStack>
);

export const InvoiceInfoModal = ({
    isOpen, onClose, invoice, currencyCode, isProforma, poData, poLoading, onPreviewPo
}: InvoiceInfoModalProps) => {
    if (!invoice) return null;

    const po = poData?.data;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader bg="#0C2556" color="white" borderTopRadius="md" py={3} px={4}  pr={16}>
                    <HStack justify="space-between">
                        <Text fontSize="sm" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                            {isProforma ? 'Proforma Invoice Info' : 'Invoice Info'}
                        </Text>
                        <HStack spacing={2}>
                            {po && (
                                <Badge colorScheme="whiteAlpha" variant="outline" color="white" fontSize="xs">
                                    PO: {po.code}
                                </Badge>
                            )}
                            <Badge colorScheme="whiteAlpha" variant="outline" color="white" fontSize="xs">
                                {invoice.code}
                            </Badge>
                        </HStack>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton color="white" top={3} />
                <ModalBody py={4} px={4}>
                    <Stack spacing={4}>

                        {/* ── Reference + Invoice side by side ── */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>

                            {/* Invoice Info */}
                            <Box>
                                <Text fontSize="xs" fontWeight="bold" color="#0C2556" textTransform="uppercase"
                                    letterSpacing="wider" mb={2}>Invoice Details</Text>
                                <Stack spacing={0}>
                                    <InfoRow label="Our Ref" value={invoice.code} />
                                    {!isProforma && <InfoRow label="Tax Inv No" value={invoice.tax_invoice_no} />}
                                    {isProforma && <InfoRow label="Invoice No" value={invoice.invoice_number} />}
                                    <InfoRow label="Date" value={fmt(isProforma ? invoice.invoice_date : invoice.payment_date)} />
                                    {!isProforma && <InfoRow label="Tax Inv Date" value={fmt(invoice.tax_invoice_date)} />}
                                    <InfoRow label="Terms" value={invoice.payment_term?.name} />
                                    {!isProforma && (
                                        <>
                                            <InfoRow label="Due" value={fmt(invoice.due_date)} />
                                            <InfoRow label="Payment By" value={invoice.payment_by} />
                                        </>
                                    )}
                                    <InfoRow
                                        label="SubTotal"
                                        value={`${currencyCode} ${parseFloat(invoice.sub_total ?? 0).toFixed(2)}`}
                                        valueColor="green.600"
                                    />
                                    <InfoRow
                                        label="Financial Charges"
                                        value={`${currencyCode} ${parseFloat(invoice.total_financial_charges ?? 0).toFixed(2)}`}
                                        valueColor="green.600"
                                    />
                                    <InfoRow
                                        label="Invoice Amount"
                                        value={`${currencyCode} ${parseFloat(invoice.invoice_amount ?? 0).toFixed(2)}`}
                                        valueColor="green.600"
                                    />
                                    <InfoRow label="Bank" value={invoice.customer_bank?.beneficiary_name} />
                                    {isProforma && <InfoRow label="Narration" value={invoice.narration} />}
                                    {!isProforma && <InfoRow label="Remarks" value={invoice.remarks} />}
                                </Stack>
                            </Box>

                            {/* PO Info */}
                            <Box>
                                <Text fontSize="xs" fontWeight="bold" color="#0C2556" textTransform="uppercase"
                                    letterSpacing="wider" mb={2}>PO Details</Text>
                                {poLoading ? (
                                    <HStack py={4}><Spinner size="sm" color="#0C2556" /><Text fontSize="xs" color="gray.400">Loading…</Text></HStack>
                                ) : !po ? (
                                    <Text fontSize="xs" color="gray.400">No PO data.</Text>
                                ) : (
                                    <Stack spacing={0}>
                                        <InfoRow label="PO No" value={po.code} />
                                        <InfoRow label="PO Date" value={fmt(po.created_at)} />
                                        <InfoRow label="Vendor" value={po.customer?.business_name} />
                                        <InfoRow label="Vendor Code" value={po.customer?.code} />
                                        <InfoRow label="Payment Mode" value={po.payment_mode?.name} />
                                        <InfoRow label="Payment Term" value={po.payment_term?.name} />
                                        <InfoRow label="Currency" value={po.currency?.name} />
                                        <InfoRow label="FOB" value={po.fob?.name} />
                                        <InfoRow label="Ship Mode" value={po.ship_mode?.name} />
                                        <InfoRow
                                            label="PO Value W/O Charges"
                                            value={`${currencyCode} ${parseFloat(po.total_price ?? 0).toFixed(2)}`}
                                            valueColor="green.600"
                                        />
                                        <InfoRow
                                            label="Balance W/O Charges"
                                            value={`${currencyCode} ${Math.max(
                                                parseFloat(po.total_price ?? 0) - parseFloat(invoice.sub_total ?? 0), 0
                                            ).toFixed(2)}`}
                                            valueColor="red.600"
                                        />
                                    </Stack>
                                )}
                            </Box>
                        </SimpleGrid>

                        {/* ── Items ── */}
                        {invoice.items?.length > 0 && (
                            <Box>
                                <Text fontSize="xs" fontWeight="bold" color="#0C2556" textTransform="uppercase"
                                    letterSpacing="wider" mb={2}>Items</Text>
                                <Box overflowX="auto">
                                    <Table variant="simple" size="xs">
                                        <Thead>
                                            <Tr>
                                                {['#', 'Part No', 'Qty', 'Pay Qty', 'Value', 'Pay Amt', 'Balance'].map((h) => (
                                                    <Th key={h} bg="gray.50" fontSize="9px" py={2}>{h}</Th>
                                                ))}
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {invoice.items.map((item: any, i: number) => {
                                                const ref = item.reference_item ?? {};
                                                const part = ref.part_number ?? {};
                                                return (
                                                    <Tr key={item.id}>
                                                        <Td fontSize="xs">{i + 1}</Td>
                                                        <Td fontSize="xs" fontWeight="semibold">
                                                            {part.name ?? ref.description ?? '—'}
                                                        </Td>
                                                        <Td fontSize="xs">{ref.qty ?? '—'}</Td>
                                                        <Td fontSize="xs">{item.pay_on_qty ?? '—'}</Td>
                                                        <Td fontSize="xs">
                                                            {`${currencyCode} ${((ref.qty ?? 0) * (ref.price ?? ref.unit_price ?? 0)).toFixed(2)}`}
                                                        </Td>
                                                        <Td fontSize="xs" color="green.600" fontWeight="semibold">
                                                            {`${currencyCode} ${parseFloat(item.pay_on_amount ?? 0).toFixed(2)}`}
                                                        </Td>
                                                        <Td fontSize="xs" color="blue.600">
                                                            {`${currencyCode} ${parseFloat(item.balance ?? 0).toFixed(2)}`}
                                                        </Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </Box>
                            </Box>
                        )}

                        <Box>
                            <Text fontSize="xs" fontWeight="bold" color="#0C2556" textTransform="uppercase"
                                letterSpacing="wider" mb={2}>Enclosed</Text>
                            <Stack spacing={0}>
                                {po && (
                                    <HStack justify="space-between" py={1} borderBottom="1px solid" borderColor="gray.100">
                                        <Text fontSize="xs" color="gray.500" fontWeight="medium" minW="120px">PO Copy</Text>
                                        <Button
                                            borderRadius="md"
                                            bg="gray.50"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            leftIcon={<HiEye />}
                                            isDisabled={!onPreviewPo}
                                            onClick={() => onPreviewPo?.()}
                                            size={'xs'}
                                        >
                                            Preview
                                        </Button>
                                    </HStack>
                                )}
                                <HStack justify="space-between" py={1} borderBottom="1px solid" borderColor="gray.100">
                                    <Text fontSize="xs" color="gray.500" fontWeight="medium" minW="120px">Invoice File</Text>
                                    {invoice.file
                                        ? <DocumentDownloadButton size="xs" url={invoice.file} />
                                        : <Text fontSize="xs" fontWeight="semibold" color="gray.700">—</Text>
                                    }
                                </HStack>
                            </Stack>
                        </Box>

                    </Stack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default InvoiceInfoModal;