import { useState } from 'react';
import {
    Box,
    Button,
    HStack,
    Flex,
    IconButton,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    Tooltip,
} from '@chakra-ui/react';
import { FaEdit } from 'react-icons/fa';
import { HiPlus, HiTrash } from 'react-icons/hi';
import { LuDownload, LuUpload } from 'react-icons/lu';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { TraderReferenceModal } from '@/pages/Master/Customer/TraderReferences/ModalForm';
import {
    checkArraysHasSameValues,
    handleDownload,
    parseCSV,
    parseCSVHeaders,
} from '@/helpers/commonHelper';
import { useToastError, useToastSuccess } from '@/components/Toast';

type TraderReferenceField = {
    id?: number;
    customer_id?: number;
    vendor_name?: string;
    attention?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    phone?: string;
    fax?: string;
    email?: string;
    remarks?: string;
};

type CustomerTraderReferencesProps = {
    fields: TraderReferenceField[];
    onAdd: (data: TraderReferenceField) => void;
    onRemove: (index: number) => void;
    onEdit: (index: number, data: TraderReferenceField) => void;
    customerInfo?: any;
};

// Fields expected in the CSV (customer_code stripped on upload)
const CSV_FIELDS: string[] = import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCE_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCE_BULK_UPLOAD_CSV_FIELDS)
    : [];

export const CustomerTraderReferences = ({
    fields,
    onAdd,
    onRemove,
    onEdit,
    customerInfo,
}: CustomerTraderReferencesProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<TraderReferenceField | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [indexToEdit, setIndexToEdit] = useState<number | null>(null);
    const [indexToDelete, setIndexToDelete] = useState<number | null>(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState(0);

    const toastSuccess = useToastSuccess();
    const toastError = useToastError();

    // ── Modal helpers ──────────────────────────────────────────────────────────

    const openModal = (item: TraderReferenceField | null, editStatus: boolean, editIndex?: number) => {
        setSelected(item);
        setIsEdit(editStatus);
        if (editStatus && editIndex !== undefined) setIndexToEdit(editIndex);
        setIsOpen(true);
    };

    const closeModal = (status: boolean, editStatus: boolean, data: TraderReferenceField | null) => {
        setIsOpen(false);
        setSelected(null);
        setIsEdit(false);

        if (status && data) {
            if (editStatus && indexToEdit !== null) {
                // Edit: check duplicate against other fields (exclude current record being edited)
                const isDuplicate = fields.some(
                    (f, i) =>
                        i !== indexToEdit &&
                        (
                            (data.attention && f.attention && f.attention.toLowerCase() === data.attention.toLowerCase()) ||
                            (data.email && f.email && f.email.toLowerCase() === data.email.toLowerCase())
                        )
                );
                if (isDuplicate) {
                    toastError({ title: 'Duplicate entry — Attention or Email already exists.' });
                    setIndexToEdit(null);
                    return;
                }
                // Keep customer_id if the record already has one
                const payload: TraderReferenceField = { ...data };
                if (selected?.customer_id) payload.customer_id = selected.customer_id;
                onEdit(indexToEdit, payload);
            } else {
                // Create: check duplicate against all existing fields
                const isDuplicate = fields.some(
                    (f) =>
                        (data.attention && f.attention && f.attention.toLowerCase() === data.attention.toLowerCase()) ||
                        (data.email && f.email && f.email.toLowerCase() === data.email.toLowerCase())
                );
                if (isDuplicate) {
                    toastError({ title: 'Duplicate entry — Attention or Email already exists.' });
                    setIndexToEdit(null);
                    return;
                }
                // Never include customer_id on create (unknown at this point)
                const { customer_id, ...rest } = data as any;
                onAdd(rest);
            }
        }
        setIndexToEdit(null);
    };

    // ── Delete helpers ─────────────────────────────────────────────────────────

    const handleDelete = (index: number) => {
        setUploadedFile(null);
        setIndexToDelete(index);
        setConfirmationOpen(true);
    };

    const confirmDelete = () => {
        if (indexToDelete !== null) onRemove(indexToDelete);
        setConfirmationOpen(false);
        setIndexToDelete(null);
    };

    // ── CSV helpers ────────────────────────────────────────────────────────────

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadedFile(file);
        setConfirmationOpen(true);
    };

    const handleCSVConfirm = async () => {
        if (!uploadedFile) return;

        // Validate headers — exclude customer_code since it's not present in the upload CSV
        const parsedHeaders: TODO = await parseCSVHeaders(uploadedFile);
        const expectedFields = CSV_FIELDS.filter((f) => f !== 'customer_code');
        if (expectedFields.length > 0 && !checkArraysHasSameValues(expectedFields, parsedHeaders)) {
            toastError({ title: 'Not a valid CSV file.' });
            setConfirmationOpen(false);
            resetFileInput();
            return;
        }

        // Validate row count
        const parsedRows: TODO = await parseCSV(uploadedFile);
        if (parsedRows.length > 100) {
            toastError({ title: 'Uploaded CSV has more than 100 rows. Please upload with max 100 rows.' });
            setConfirmationOpen(false);
            resetFileInput();
            return;
        }

        // Strip customer_code & customer_id; normalise email
        const mappedRows: TraderReferenceField[] = parsedRows.map((row: any) => {
            const { customer_code, customer_id, ...rest } = row;
            return {
                ...rest,
                email: rest.email?.toLowerCase().trim() ?? '',
            };
        });

        // Check duplicates — (1) within the uploaded CSV itself, (2) against existing fields
        // Unique identifier: attention + email (case-insensitive)
        const seenAttention = new Set<string>();
        const seenEmail = new Set<string>();
        const duplicates: number[] = [];
        const uniqueRows: TraderReferenceField[] = [];

        mappedRows.forEach((row, i) => {
            const rowNum = i + 1;
            const rowAttention = row.attention?.toLowerCase() ?? '';
            const rowEmail = row.email?.toLowerCase() ?? '';

            // Within-CSV duplicate
            const inBatchDupe =
                (rowAttention && seenAttention.has(rowAttention)) ||
                (rowEmail && seenEmail.has(rowEmail));

            // Against already-loaded fields
            const inFieldsDupe = fields.some(
                (f) =>
                    (rowAttention && f.attention && f.attention.toLowerCase() === rowAttention) ||
                    (rowEmail && f.email && f.email.toLowerCase() === rowEmail)
            );

            if (inBatchDupe || inFieldsDupe) {
                duplicates.push(rowNum);
            } else {
                if (rowAttention) seenAttention.add(rowAttention);
                if (rowEmail) seenEmail.add(rowEmail);
                uniqueRows.push(row);
            }
        });

        if (duplicates.length > 0) {
            toastError({
                title: `${duplicates.length} duplicate row(s) skipped (row${duplicates.length > 1 ? 's' : ''}: ${duplicates.join(', ')}) — Attention or Email already exists.`,
            });
        }

        if (uniqueRows.length === 0) {
            setConfirmationOpen(false);
            resetFileInput();
            return;
        }

        uniqueRows.forEach((row) => onAdd(row));
        toastSuccess({ title: `${uniqueRows.length} trader reference(s) added from CSV.` });

        setConfirmationOpen(false);
        resetFileInput();
    };

    const resetFileInput = () => {
        setUploadedFile(null);
        setFileKey((k) => k + 1);
    };

    // Distinguish between delete confirmation and CSV upload confirmation
    const isCSVConfirm = !!uploadedFile;

    const handleConfirm = () => {
        if (isCSVConfirm) {
            handleCSVConfirm();
        } else {
            confirmDelete();
        }
    };

    const handleConfirmClose = () => {
        setConfirmationOpen(false);
        setIndexToDelete(null);
        resetFileInput();
    };

    return (
        <Box mt={1}>
            <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="md" fontWeight="600">
                    Trader References
                </Text>
                <HStack spacing={2}>
                    <Button
                        leftIcon={<LuDownload />}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => handleDownload(import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCES_CSV)}
                    >
                        Download Sample
                    </Button>

                    <Tooltip label="Remove customer_code from file before upload" hasArrow placement="top">
                        <input
                            type="file"
                            id="trader-reference-file-upload"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                            key={fileKey}
                        />
                        <Button
                            leftIcon={<LuUpload />}
                            colorScheme="green"
                            variant="solid"
                            as="label"
                            htmlFor="trader-reference-file-upload"
                            size="sm"
                        >
                            Upload File
                        </Button>
                    </Tooltip>

                    <Button
                        leftIcon={<HiPlus />}
                        onClick={() => openModal(null, false)}
                        size="sm"
                        colorScheme="brand"
                    >
                        Add Trader Reference
                    </Button>
                </HStack>
            </Flex>

            <TableContainer
                rounded="md"
                overflow="auto"
                border="1px"
                borderColor="gray.500"
                borderRadius="md"
                boxShadow="md"
            >
                <Table variant="simple" size="sm">
                    <Thead bg="#0C2556">
                        <Tr sx={{ '& th': { color: 'white' } }}>
                            <Th>#</Th>
                            <Th>Vendor Name</Th>
                            <Th>Attention</Th>
                            <Th>Address Line 1</Th>
                            <Th>City</Th>
                            <Th>Country</Th>
                            <Th>Phone</Th>
                            <Th>Email</Th>
                            <Th>Remarks</Th>
                            <Th>Action</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {fields.map((field, index) => (
                            <Tr key={index}>
                                <Td>{index + 1}</Td>
                                <Td>{field.vendor_name ?? '-'}</Td>
                                <Td>{field.attention ?? '-'}</Td>
                                <Td>{field.address_line1 ?? '-'}</Td>
                                <Td>{field.city ?? '-'}</Td>
                                <Td>{field.country ?? '-'}</Td>
                                <Td>{field.phone ?? '-'}</Td>
                                <Td>{field.email ?? '-'}</Td>
                                <Td>{field.remarks ?? '-'}</Td>
                                <Td>
                                    <IconButton
                                        aria-label="Edit Trader Reference"
                                        icon={<FaEdit />}
                                        colorScheme="green"
                                        size="sm"
                                        onClick={() => openModal(field, true, index)}
                                        mr={2}
                                    />
                                    <IconButton
                                        aria-label="Remove Trader Reference"
                                        icon={<HiTrash />}
                                        colorScheme="red"
                                        size="sm"
                                        onClick={() => handleDelete(index)}
                                    />
                                </Td>
                            </Tr>
                        ))}
                        {fields.length === 0 && (
                            <Tr>
                                <Td colSpan={10} textAlign="center">
                                    No Trader References Found.
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>

            <TraderReferenceModal
                isOpen={isOpen}
                onClose={closeModal}
                isEdit={isEdit}
                existValues={selected}
                customerInfo={customerInfo}
            />

            <ConfirmationPopup
                isOpen={confirmationOpen}
                onClose={handleConfirmClose}
                onConfirm={handleConfirm}
                headerText={isCSVConfirm ? 'Upload CSV Trader References' : 'Remove Trader Reference'}
                bodyText={
                    isCSVConfirm
                        ? 'Are you sure you want to import trader references from this CSV file?'
                        : 'Are you sure you want to delete this trader reference?'
                }
            />
        </Box>
    );
};

export default CustomerTraderReferences;