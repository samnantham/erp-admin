import { useMemo, useState } from 'react';
import {
    Box, Button, Checkbox, HStack, IconButton, Modal, ModalBody,
    ModalCloseButton, ModalContent, ModalHeader, ModalOverlay,
    Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr,
} from '@chakra-ui/react';
import { TbMailForward } from 'react-icons/tb';
import { HiEye, HiPrinter } from 'react-icons/hi';
import { HiOutlinePlus } from 'react-icons/hi';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import LoadingOverlay from '@/components/LoadingOverlay';
import { usePRFQVendors } from '@/services/purchase/rfq/service';
import { PRFQVendorInfo } from '@/services/purchase/rfq/schema';
import { usePDFPreview } from '@/context/PDFPreviewContext';
import { endPoints } from '@/api/endpoints';
import { AddVendorToRFQModal } from '@/components/Popups/PRFQCustomers/AddVendorToRFQModal'; 

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
    isOpen: boolean;
    onClose: () => void;
    prfqId: string;
    prfqCode?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PRFQVendorsPopup = ({ isOpen, onClose, prfqId, prfqCode }: Props) => {

    const { data, isLoading, refetch: refetchVendors } = usePRFQVendors(isOpen ? prfqId : undefined);
    const vendors: PRFQVendorInfo[] = data?.data ?? [];

    // ── Checkbox state ──────────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isAllChecked, setIsAllChecked] = useState(false);
    const { openPreview } = usePDFPreview();

    // ── Add Vendor modal state ──────────────────────────────────────────────────
    const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

    // ── Derive existVendorIds from already-loaded vendors ─────────────────────
    // Passed to AddVendorToRFQModal so already-added vendors are excluded from dropdown
    const existVendorIds = useMemo(
        () => vendors.map((v) => String(v.vendor_id)),
        [vendors]
    );

    const emailableVendors = vendors.filter((v) => v.contact_email);

    // ── Checkbox helpers ────────────────────────────────────────────────────────
    const handleCheckAll = (checked: boolean) => {
        setIsAllChecked(checked);
        setSelectedIds(checked ? emailableVendors.map((v) => v.customer_contact_manager_id) : []);
    };

    const handleToggle = (checked: boolean, id: string) => {
        setIsAllChecked(false);
        setSelectedIds((prev) =>
            checked ? [...prev, id] : prev.filter((i) => i !== id)
        );
    };

    const handlePrintPreview = (vendor: PRFQVendorInfo) => {
        const baseUrl = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.prfq.replace(':id', prfqId)}`;
        const url = `${baseUrl}?customer_contact_manager_id=${vendor.customer_contact_manager_id}`;
        openPreview(url, `PRFQ ${prfqCode ?? ''} - ${vendor.business_name ?? ''}`, true);
    };

    const handleClose = () => {
        setSelectedIds([]);
        setIsAllChecked(false);
        onClose();
    };

    // ── Send mail ───────────────────────────────────────────────────────────────
    const sendMail = (contactIds: string[]) => {
        // TODO: wire up your email mutation here
        console.log('Send mail to contact manager IDs:', contactIds);
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            {/* ── Main Vendors Modal ── */}
            <Modal
                isOpen={isOpen && !isAddVendorOpen}
                onClose={handleClose}
                size="md"
                blockScrollOnMount={false}
                closeOnOverlayClick={false}
                closeOnEsc={false}
            >
                <ModalOverlay />
                <ModalContent maxWidth="80vw">
                    <ModalHeader textAlign="center">
                        <Text fontSize="lg" fontWeight="bold">
                            {prfqCode ?? 'PRFQ'} — Vendors
                        </Text>
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody minHeight="70vh">
                        <LoadingOverlay isLoading={isLoading} style={{ minHeight: '20vh' }}>

                            <HStack justify="space-between" mb={3}>
                                <Text fontSize="md" fontWeight="700">List of Vendors</Text>

                                {/* ── Toolbar ── */}
                                <HStack spacing={2}>
                                    <Button
                                        leftIcon={<HiOutlinePlus />}
                                        colorScheme="blue"
                                        size="sm"
                                        onClick={() => setIsAddVendorOpen(true)}
                                    >
                                        Add Vendor
                                    </Button>
                                    <Button
                                        colorScheme="brand"
                                        size="sm"
                                        isDisabled={selectedIds.length === 0}
                                        onClick={() => sendMail(selectedIds)}
                                        leftIcon={<TbMailForward />}
                                    >
                                        Email to Selected
                                    </Button>
                                </HStack>
                            </HStack>

                            <TableContainer border="1px" borderColor="gray.500" boxShadow="md">
                                <Table variant="striped" size="sm">
                                    <Thead bg="gray.600">
                                        <Tr>
                                            <Th color="white">
                                                <Checkbox
                                                    colorScheme="green"
                                                    isChecked={isAllChecked}
                                                    isDisabled={emailableVendors.length === 0}
                                                    onChange={(e) => handleCheckAll(e.target.checked)}
                                                    size="lg"
                                                />
                                            </Th>
                                            <Th color="white">S.No</Th>
                                            <Th color="white">Vendor Name</Th>
                                            <Th color="white">Vendor Code</Th>
                                            <Th color="white">Contact</Th>
                                            <Th color="white">Address</Th>
                                            <Th color="white">Email</Th>
                                            <Th color="white" textAlign="center">Action</Th>
                                        </Tr>
                                    </Thead>
                                    <Tbody>
                                        {vendors.length > 0
                                            ? vendors.map((vendor, index) => {
                                                const isChecked = selectedIds.includes(vendor.customer_contact_manager_id);
                                                const hasEmail = !!vendor.contact_email;

                                                return (
                                                    <Tr key={`${vendor.vendor_id}-${vendor.customer_contact_manager_id}`}>
                                                        <Td>
                                                            <Checkbox
                                                                colorScheme="green"
                                                                isChecked={isChecked}
                                                                isDisabled={!hasEmail}
                                                                onChange={(e) => handleToggle(e.target.checked, vendor.customer_contact_manager_id)}
                                                                size="lg"
                                                            />
                                                        </Td>
                                                        <Td>{index + 1}</Td>
                                                        <Td>{vendor.business_name ?? '—'}</Td>
                                                        <Td>{vendor.code ?? '—'}</Td>
                                                        <Td>{vendor.attention ?? '—'}</Td>
                                                        <Td>{vendor.address_line1 ?? '—'}</Td>
                                                        <Td>{vendor.contact_email ?? '—'}</Td>
                                                        <Td textAlign="center">
                                                            <IconButton
                                                                aria-label="Send email"
                                                                icon={<TbMailForward />}
                                                                colorScheme="green"
                                                                size="sm"
                                                                isDisabled={true}
                                                                mr={2}
                                                                onClick={() => sendMail([vendor.customer_contact_manager_id])}
                                                            />
                                                            <IconButton
                                                                aria-label="view"
                                                                icon={<HiEye />}
                                                                size="sm"
                                                                variant="@primary"
                                                                onClick={() => handlePrintPreview(vendor)}
                                                                mr={2}
                                                            />
                                                            <IconButton
                                                                aria-label="Preview"
                                                                icon={<HiPrinter />}
                                                                colorScheme="orange"
                                                                size="sm"
                                                                mr={2}
                                                                onClick={() => {
                                                                    window.open(`/preview/purchase/rfq/${vendor.prfq_id}?token=${vendor.token}`, '_blank');
                                                                }}
                                                            />
                                                            <IconButton
                                                                aria-label="Open Quotation"
                                                                icon={<ExternalLinkIcon />}
                                                                size="sm"
                                                                variant="solid"
                                                                colorScheme="teal"
                                                                isDisabled={true}
                                                            />
                                                        </Td>
                                                    </Tr>
                                                );
                                            })
                                            : !isLoading && (
                                                <Tr>
                                                    <Td colSpan={8} textAlign="center" color="gray.400">
                                                        No vendors found
                                                    </Td>
                                                </Tr>
                                            )}
                                    </Tbody>
                                </Table>
                            </TableContainer>

                            <Box mt={4}>
                                <Stack direction="row" justify="center">
                                    <Button colorScheme="red" size="sm" onClick={handleClose}>
                                        Close
                                    </Button>
                                </Stack>
                            </Box>

                        </LoadingOverlay>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* ── Add Vendor To RFQ Modal (separate reusable component) ── */}
            <AddVendorToRFQModal
                isOpen={isAddVendorOpen}
                onClose={() => setIsAddVendorOpen(false)}
                prfqId={prfqId}
                existVendorIds={existVendorIds}
                onSuccess={refetchVendors}
            />
        </>
    );
};

export default PRFQVendorsPopup;