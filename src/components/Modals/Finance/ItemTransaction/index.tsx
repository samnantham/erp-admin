// src/components/Modals/Finance/ItemTransactionsModal.tsx

import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
    ModalCloseButton, HStack, Stack, Box, Text, Table,
    Thead, Tr, Th, Tbody, Td, Badge, Spinner,
} from '@chakra-ui/react';
import { HiCheckCircle } from 'react-icons/hi';
import { useItemTransactions } from '@/services/finance/invoice/service';

interface ItemTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    referenceItemId?: string;
    partName?: string;
    currencyCode?: string;
    poCode?: string;
}

export const ItemTransactionsModal = ({
    isOpen, onClose, referenceItemId, partName, currencyCode = '', poCode = ''
}: ItemTransactionsModalProps) => {
    const { data, isLoading } = useItemTransactions(referenceItemId);
    const transactions: any[] = data?.data ?? [];

    const totalPaidAmount = transactions.reduce((sum, t) => sum + (t.pay_on_amount ?? 0), 0);
    const totalPaidQty = transactions.reduce((sum, t) => sum + (t.pay_on_qty ?? 0), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader bg="#0C2556" color="white" borderTopRadius="md" py={3} px={4}  pr={16}>
                    <HStack justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                            Payment Transactions
                        </Text>
                        <HStack spacing={3}>
                            {partName && (
                                <Badge colorScheme="whiteAlpha" variant="outline" color="white" fontSize="xs" px={2} py={1}>
                                    {partName}
                                </Badge>
                            )}
                            {poCode && (
                                <Badge colorScheme="whiteAlpha" variant="outline" color="white" fontSize="xs" px={2} py={1}>
                                    PO: {poCode}
                                </Badge>
                            )}
                        </HStack>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton color="white" top={3} />
                <ModalBody py={4} px={4}>
                    {isLoading ? (
                        <HStack justify="center" py={8}>
                            <Spinner color="#0C2556" />
                            <Text fontSize="sm" color="gray.400">Loading transactions…</Text>
                        </HStack>
                    ) : transactions.length === 0 ? (
                        <Text fontSize="sm" color="gray.400" textAlign="center" py={8}>
                            No transactions found.
                        </Text>
                    ) : (
                        <Stack spacing={4}>
                            <Box overflowX="auto">
                                <Table variant="simple" size="sm">
                                    <Thead>
                                        <Tr>
                                            {['#', 'Type', 'Code', 'Date', 'Pay Qty', 'Pay Amount', 'Remarks', 'Status'].map((h) => (
                                                <Th key={h} bg="gray.50" fontSize="xs" py={2} color="#0C2556">{h}</Th>
                                            ))}
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {transactions.map((t: any, i: number) => (
                                            <Tr key={i}>
                                                <Td fontSize="xs">{i + 1}</Td>
                                                <Td fontSize="sm">
                                                    <Badge
                                                        colorScheme={t.type === 'Invoice' ? 'blue' : 'purple'}
                                                        variant="subtle" size={'sm'} px={2} py={1}>
                                                        {t.type}
                                                    </Badge>
                                                </Td>
                                                <Td fontSize="xs" fontWeight="semibold">{t.code}</Td>
                                                <Td fontSize="xs">{t.date}</Td>
                                                <Td fontSize="xs">{t.pay_on_qty ?? '—'}</Td>
                                                <Td fontSize="xs" color="green.600" fontWeight="semibold">
                                                    {currencyCode} {parseFloat(t.pay_on_amount ?? 0).toFixed(2)}
                                                </Td>
                                                <Td fontSize="xs" color="gray.500">{t.remarks ?? '—'}</Td>
                                                <Td fontSize="xs">
                                                    {t.is_ready_for_receipt ? (
                                                        <HStack spacing={1}>
                                                            <HiCheckCircle color="green" />
                                                            <Text fontSize="xs" color="green.600">Ready</Text>
                                                        </HStack>
                                                    ) : (
                                                        <Text fontSize="xs" color="orange.400">Pending</Text>
                                                    )}
                                                </Td>
                                            </Tr>
                                        ))}
                                    </Tbody>
                                </Table>
                            </Box>

                            {/* Summary */}
                            <Box bg="gray.50" border="1px solid" borderColor="gray.200" borderRadius="md" p={3}>
                                <HStack justify="flex-end" spacing={8}>
                                    <HStack spacing={2}>
                                        <Text fontSize="xs" color="gray.500">Total Transactions:</Text>
                                        <Text fontSize="xs" fontWeight="bold" color="gray.700">{transactions.length}</Text>
                                    </HStack>
                                    {totalPaidQty > 0 && (
                                        <HStack spacing={2}>
                                            <Text fontSize="xs" color="gray.500">Total Paid Qty:</Text>
                                            <Text fontSize="xs" fontWeight="bold" color="blue.600">{totalPaidQty}</Text>
                                        </HStack>
                                    )}
                                    <HStack spacing={2}>
                                        <Text fontSize="xs" color="gray.500">Total Paid:</Text>
                                        <Text fontSize="xs" fontWeight="bold" color="green.600">
                                            {currencyCode} {totalPaidAmount.toFixed(2)}
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

export default ItemTransactionsModal;