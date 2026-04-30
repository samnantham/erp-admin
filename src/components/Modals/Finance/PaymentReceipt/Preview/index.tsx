// src/components/Modals/Finance/PaymentReceiptInfoModal.tsx

import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalCloseButton, HStack, Stack, Box, Text, SimpleGrid,
    Badge, Divider, Table, Thead, Tbody, Tr, Th, Td, Spinner,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { usePaymentReceiptDetails } from '@/services/finance/payment-receipt/service';

interface PaymentReceiptInfoModalProps {
    isOpen:    boolean;
    onClose:   () => void;
    receiptId?: string;
}

const fmt = (date?: string | null) => date ? dayjs(date).format('DD-MMM-YYYY') : '—';

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <HStack align="flex-start" spacing={2}>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" minW="120px">
            {label}
        </Text>
        <Text fontSize="xs" color="gray.300">:</Text>
        <Text fontSize="xs" color="gray.700" fontWeight="medium">{value ?? '—'}</Text>
    </HStack>
);

const DarkTh = ({ children }: { children: string }) => (
    <Th bg="#0C2556" color="white" fontSize="xs" letterSpacing="wide" fontWeight="medium" py={2}>
        {children}
    </Th>
);

export const PaymentReceiptInfoModal = ({
    isOpen, onClose, receiptId,
}: PaymentReceiptInfoModalProps) => {
    const { data, isFetching } = usePaymentReceiptDetails(receiptId);
    const receipt = data?.data;
    const ref     = receipt?.reference as any;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader bg="#0C2556" color="white" borderTopRadius="md" py={3} px={4} pr={12}>
                    <HStack justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                            Payment Receipt
                        </Text>
                        {receipt && (
                            <HStack spacing={2}>
                                <Badge colorScheme="whiteAlpha" variant="outline" color="white" fontSize="xs" px={2} py={1}>
                                    {receipt.code}
                                </Badge>
                                <Badge
                                    colorScheme={receipt.type === 'debit' ? 'orange' : 'green'}
                                    variant="solid" fontSize="xs" px={2} py={1}
                                >
                                    {receipt.type === 'debit' ? 'DEBIT' : 'CREDIT'}
                                </Badge>
                            </HStack>
                        )}
                    </HStack>
                </ModalHeader>
                <ModalCloseButton color="white" top={3} />

                <ModalBody py={4} px={4}>
                    {isFetching ? (
                        <HStack justify="center" py={8}>
                            <Spinner color="#0C2556" />
                            <Text fontSize="sm" color="gray.400">Loading receipt…</Text>
                        </HStack>
                    ) : !receipt ? (
                        <Text fontSize="sm" color="gray.400" textAlign="center" py={8}>
                            Receipt not found.
                        </Text>
                    ) : (
                        <Stack spacing={4}>

                            {/* ── Receipt Info ── */}
                            <Box border="1px solid" borderColor="gray.200" borderRadius="md">
                                <Box bg="#0C2556" px={4} py={2} borderTopRadius="md">
                                    <Text fontSize="xs" color="white" fontWeight="semibold"
                                        textTransform="uppercase" letterSpacing="wide">
                                        Receipt Details
                                    </Text>
                                </Box>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} p={4}>
                                    <InfoRow label="Receipt Code"    value={receipt.code} />
                                    <InfoRow label="Receipt No"      value={receipt.bank_receipt_number} />
                                    <InfoRow label="Payment Date"    value={fmt(receipt.payment_date)} />
                                    <InfoRow label="Payment Value"   value={
                                        <Text fontSize="xs" fontWeight="bold" color="green.600">
                                            {parseFloat(receipt.payment_value.toString() ?? 0).toFixed(2)}
                                        </Text>
                                    } />
                                    <InfoRow label="Payment Mode"    value={receipt.payment_mode?.name} />
                                    <InfoRow label="Customer Bank"   value={receipt.customer_bank?.beneficiary_name} />
                                    <InfoRow label="Type"            value={
                                        <Badge colorScheme={receipt.type === 'debit' ? 'orange' : 'green'} variant="subtle" fontSize="10px" px={4} py={1}>
                                            {receipt.type === 'debit' ? 'DEBIT' : 'CREDIT'}
                                        </Badge>
                                    } />
                                    <InfoRow label="Refer Type"      value={receipt.refer_type?.toUpperCase()} />
                                    {receipt.remarks && (
                                        <InfoRow label="Remarks" value={receipt.remarks} />
                                    )}
                                </SimpleGrid>
                            </Box>

                            {/* ── Linked Invoice / Proforma ── */}
                            {ref && (
                                <Box border="1px solid" borderColor="gray.200" borderRadius="md">
                                    <Box bg="#0C2556" px={4} py={2} borderTopRadius="md">
                                        <HStack spacing={2}>
                                            <Text fontSize="xs" color="white" fontWeight="semibold"
                                                textTransform="uppercase" letterSpacing="wide">
                                                {receipt.reference_type === 'invoice' ? 'Invoice' : 'Proforma Invoice'}
                                            </Text>
                                            <Badge colorScheme={receipt.reference_type === 'invoice' ? 'blue' : 'purple'}
                                                variant="solid" fontSize="9px">
                                                {receipt.linked_code}
                                            </Badge>
                                            {ref.is_ready_for_receipt && (
                                                <Badge colorScheme="green" variant="solid" fontSize="9px">Ready</Badge>
                                            )}
                                        </HStack>
                                    </Box>
                                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} p={4}>
                                        <InfoRow label="Invoice Code"    value={ref.code} />
                                        <InfoRow label="Invoice Amount"  value={
                                            <Text fontSize="xs" fontWeight="bold" color="blue.600">
                                                {parseFloat(ref.invoice_amount ?? 0).toFixed(2)}
                                            </Text>
                                        } />
                                        <InfoRow label="Sub Total"       value={
                                            ref.sub_total != null
                                                ? parseFloat(ref.sub_total).toFixed(2)
                                                : '—'
                                        } />
                                        <InfoRow label="Charges"         value={
                                            ref.total_financial_charges != null
                                                ? parseFloat(ref.total_financial_charges).toFixed(2)
                                                : '—'
                                        } />
                                        <InfoRow label="Payment Term"    value={ref.payment_term?.name} />
                                        <InfoRow label="Customer Bank"   value={ref.customer_bank?.beneficiary_name} />
                                    </SimpleGrid>

                                    {/* Items */}
                                    {(ref.items ?? []).length > 0 && (
                                        <Box px={4} pb={4}>
                                            <Divider mb={3} />
                                            <Text fontSize="xs" fontWeight="semibold" color="gray.500"
                                                textTransform="uppercase" letterSpacing="wide" mb={2}>
                                                Invoice Items
                                            </Text>
                                            <Box overflowX="auto" border="1px solid" borderColor="gray.200" borderRadius="md">
                                                <Table variant="striped" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            {['#', 'Item', 'Pay Qty', 'Pay Amount', 'Total', 'Balance', 'Status'].map((h) => (
                                                                <DarkTh key={h}>{h}</DarkTh>
                                                            ))}
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {ref.items.map((item: any, i: number) => (
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
                                                                <Td fontSize="xs" color={item.balance <= 0 ? 'green.500' : 'red.500'} fontWeight="semibold">
                                                                    {parseFloat(item.balance ?? 0).toFixed(2)}
                                                                </Td>
                                                                <Td fontSize="xs">
                                                                    {item.is_fully_paid
                                                                        ? <Badge colorScheme="green"  variant="subtle" fontSize="9px">Fully Paid</Badge>
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
                                </Box>
                            )}

                            {/* ── Summary ── */}
                            <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={3}>
                                <HStack justify="flex-end" spacing={8} flexWrap="wrap">
                                    <HStack spacing={2}>
                                        <Text fontSize="xs" color="gray.500">Invoice Amount:</Text>
                                        <Text fontSize="xs" fontWeight="bold" color="blue.600">
                                            {parseFloat(receipt.linked_invoice_amount?.toString() ?? "").toFixed(2)}
                                        </Text>
                                    </HStack>
                                    <HStack spacing={2}>
                                        <Text fontSize="xs" color="gray.500">Paid:</Text>
                                        <Text fontSize="xs" fontWeight="bold" color="green.600">
                                            {parseFloat(receipt.payment_value?.toString() ?? 0).toFixed(2)}
                                        </Text>
                                    </HStack>
                                </HStack>
                            </Box>

                        </Stack>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default PaymentReceiptInfoModal;