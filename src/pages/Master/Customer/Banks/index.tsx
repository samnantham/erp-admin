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
import { BankModal } from '@/pages/Master/Customer/Banks/ModalForm';
import {
    checkArraysHasSameValues,
    handleDownload,
    parseCSV,
    parseCSVHeaders,
} from '@/helpers/commonHelper';
import { useToastError, useToastSuccess } from '@/components/Toast';

type BankField = {
    id?: number;
    customer_id?: number;
    beneficiary_name?: string;
    name?: string;
    address_line1?: string;
    address_line2?: string;
    branch?: string;
    ac_iban_no?: string;
    type_of_ac?: string;
    swift?: string;
    aba_routing_no?: string;
    contact_name?: string;
    phone?: string;
    fax?: string;
    mobile?: string;
    email?: string;
};

type CustomerBanksProps = {
    fields: BankField[];
    onAdd: (data: BankField) => void;
    onRemove: (index: number) => void;
    onEdit: (index: number, data: BankField) => void;
    customerInfo?: any;
};

// Fields expected in the CSV (customer_code is only used to resolve customer_id during edit, stripped on create)
const CSV_FIELDS: string[] = import.meta.env.VITE_CUSTOMER_BANK_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMER_BANK_BULK_UPLOAD_CSV_FIELDS)
    : [];

export const CustomerBanks = ({
    fields,
    onAdd,
    onRemove,
    onEdit,
    customerInfo,
}: CustomerBanksProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<BankField | null>(null);
    const [isEdit, setIsEdit] = useState(false);
    const [indexToEdit, setIndexToEdit] = useState<number | null>(null);
    const [indexToDelete, setIndexToDelete] = useState<number | null>(null);
    const [confirmationOpen, setConfirmationOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState(0);

    const toastSuccess = useToastSuccess();
    const toastError = useToastError();

    // ── Modal helpers ──────────────────────────────────────────────────────────

    const openModal = (item: BankField | null, editStatus: boolean, editIndex?: number) => {
        setSelected(item);
        setIsEdit(editStatus);
        if (editStatus && editIndex !== undefined) setIndexToEdit(editIndex);
        setIsOpen(true);
    };

    const closeModal = (status: boolean, editStatus: boolean, data: BankField | null) => {
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
                            (data.ac_iban_no && f.ac_iban_no && f.ac_iban_no === data.ac_iban_no) ||
                            (data.swift && f.swift && f.swift === data.swift)
                        )
                );
                if (isDuplicate) {
                    toastError({ title: 'Duplicate entry — IBAN or Swift already exists.' });
                    setIndexToEdit(null);
                    return;
                }
                // Keep customer_id if the record already has one
                const payload: BankField = { ...data };
                if (selected?.customer_id) payload.customer_id = selected.customer_id;
                onEdit(indexToEdit, payload);
            } else {
                // Create: check duplicate against all existing fields
                const isDuplicate = fields.some(
                    (f) =>
                        (data.ac_iban_no && f.ac_iban_no && f.ac_iban_no === data.ac_iban_no) ||
                        (data.swift && f.swift && f.swift === data.swift)
                );
                if (isDuplicate) {
                    toastError({ title: 'Duplicate entry — IBAN or Swift already exists.' });
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
        setUploadedFile(null);           // make sure confirmDelete knows this is a row delete
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

        // Strip customer_code & customer_id on create; normalise email
        const mappedRows: BankField[] = parsedRows.map((row: any) => {
            const { customer_code, customer_id, ...rest } = row;
            return {
                ...rest,
                email: rest.email?.toLowerCase().trim() ?? '',
            };
        });

        // Check duplicates — (1) within the uploaded CSV itself, (2) against existing fields
        const seenIban = new Set<string>();
        const seenSwift = new Set<string>();
        const duplicates: number[] = [];
        const uniqueRows: BankField[] = [];

        mappedRows.forEach((row, i) => {
            const rowNum = i + 1;

            // Within-CSV duplicate (same file has two rows with same IBAN or Swift)
            const inBatchDupe =
                (row.ac_iban_no && seenIban.has(row.ac_iban_no)) ||
                (row.swift && seenSwift.has(row.swift));

            // Against already-loaded fields
            const inFieldsDupe = fields.some(
                (f) =>
                    (row.ac_iban_no && f.ac_iban_no && f.ac_iban_no === row.ac_iban_no) ||
                    (row.swift && f.swift && f.swift === row.swift)
            );

            if (inBatchDupe || inFieldsDupe) {
                duplicates.push(rowNum);
            } else {
                // Track for within-batch checks of subsequent rows
                if (row.ac_iban_no) seenIban.add(row.ac_iban_no);
                if (row.swift) seenSwift.add(row.swift);
                uniqueRows.push(row);
            }
        });

        if (duplicates.length > 0) {
            toastError({
                title: `${duplicates.length} duplicate row(s) skipped (row${duplicates.length > 1 ? 's' : ''}: ${duplicates.join(', ')}) — IBAN or Swift already exists.`,
            });
        }

        if (uniqueRows.length === 0) {
            setConfirmationOpen(false);
            resetFileInput();
            return;
        }

        uniqueRows.forEach((row) => onAdd(row));
        toastSuccess({ title: `${uniqueRows.length} bank(s) added from CSV.` });

        setConfirmationOpen(false);
        resetFileInput();
    };

    const resetFileInput = () => {
        setUploadedFile(null);
        setFileKey((k) => k + 1);   // remount the <input> so same file can be re-uploaded
    };

    // Distinguish between a delete confirmation and a CSV upload confirmation
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
                    Customer Banks
                </Text>
                <HStack spacing={2}>
                    <Button
                        leftIcon={<LuDownload />}
                        colorScheme="blue"
                        size="sm"
                        onClick={() => handleDownload(import.meta.env.VITE_CUSTOMERS_BANKS_CSV)}
                    >
                        Download Sample
                    </Button>

                    <Tooltip label="Remove customer_code from file before upload" hasArrow placement="top">
                        <input
                            type="file"
                            id="bank-file-upload"
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
                            htmlFor="bank-file-upload"
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
                        Add Bank
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
                            <Th>Type of Account</Th>
                            <Th>Beneficiary Name</Th>
                            <Th>Bank Name</Th>
                            <Th>Branch</Th>
                            <Th>IBAN No</Th>
                            <Th>Swift Code</Th>
                            <Th>Contact Name</Th>
                            <Th>Action</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {fields.map((field, index) => (
                            <Tr key={index}>
                                <Td>{index + 1}</Td>
                                <Td>{field.type_of_ac ?? '-'}</Td>
                                <Td>{field.beneficiary_name ?? '-'}</Td>
                                <Td>{field.name ?? '-'}</Td>
                                <Td>{field.branch ?? '-'}</Td>
                                <Td>{field.ac_iban_no ?? '-'}</Td>
                                <Td>{field.swift ?? '-'}</Td>
                                <Td>{field.contact_name ?? '-'}</Td>
                                <Td>
                                    <IconButton
                                        aria-label="Edit Bank"
                                        icon={<FaEdit />}
                                        colorScheme="green"
                                        size="sm"
                                        onClick={() => openModal(field, true, index)}
                                        mr={2}
                                    />
                                    <IconButton
                                        aria-label="Remove Bank"
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
                                <Td colSpan={9} textAlign="center">
                                    No Banks Found.
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>

            <BankModal
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
                headerText={isCSVConfirm ? 'Upload CSV Banks' : 'Remove Bank'}
                bodyText={
                    isCSVConfirm
                        ? 'Are you sure you want to import banks from this CSV file?'
                        : 'Are you sure you want to delete this bank?'
                }
            />
        </Box>
    );
};

export default CustomerBanks;