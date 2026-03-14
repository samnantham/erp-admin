import { useEffect, useState } from 'react';

import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box, Button, HStack, Heading, IconButton, Stack,
  Table, TableContainer, Tbody, Td, Text, Th, Thead,
  Tooltip, Tr,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { isEmail } from '@formiz/validations';
import { LuDownload, LuPlus, LuUpload, LuInfo } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { FieldInput } from '@/components/FieldInput';
import { FieldPhone } from '@/components/FieldPhone';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldUpload } from '@/components/FieldUpload';
import { SlideIn } from '@/components/SlideIn';
import { useToastError, useToastSuccess } from '@/components/Toast';
import LoadingOverlay from '@/components/LoadingOverlay';
import {
  checkArraysHasSameValues, getOptionValue,
  handleDownload, parseCSV, parseCSVHeaders,
} from '@/helpers/commonHelper';
import { countryOptions } from '@/constants';
import { endPoints } from '@/api/endpoints';
import {
  useCustomerDropdowns,
  useRelationBulkUpload,
  useCheckRelationExists,
} from '@/services/master/customer/service';
import { DownloadSampleOptions, DownloadSampleKeys, contactManagementPageConfig, RELATION_TO_SAMPLE_KEY_MAP } from '@/constants';
import { ActionMenu } from '@/components/ActionMenu';
// ─── Types ────────────────────────────────────────────────────────────────────

type RelationType = 'bank' | 'contact_manager' | 'shipping_address' | 'trader_reference' | 'principle_of_owner';

const VALID_RELATION_TYPES: RelationType[] = [
  'bank', 'contact_manager', 'shipping_address', 'trader_reference', 'principle_of_owner',
];

interface ColDef {
  key: string;
  label: string;
  required?: boolean;
  tip?: string;
  render: (item: any, index: number, helpers: RenderHelpers) => React.ReactNode;
}

interface RenderHelpers {
  k: string;
  fileKey: number;
  isExisting: boolean;
  handleInputChange: (value: any, field: string, index: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RELATION_LABEL_MAP: Record<RelationType, string> = {
  bank: 'Customer Bank',
  contact_manager: 'Customer Contact Managers',
  shipping_address: 'Shipping Address',
  trader_reference: 'Trader Reference',
  principle_of_owner: 'Principle of Owner',
};

const RELATION_UNIQUE_FIELDS_MAP: Record<RelationType, string[]> = {
  bank: ['beneficiary_name', 'customer_id', 'email', 'phone',],
  contact_manager: ['attention', 'email', 'phone', 'customer_id'],
  shipping_address: ['attention', 'email', 'phone', 'customer_id'],
  trader_reference: ['attention', 'email', 'phone', 'customer_id'],
  principle_of_owner: ['owner', 'email', 'phone', 'customer_id'],
};

const BULK_UPLOAD_URL_MAP: Record<RelationType, string> = {
  bank: endPoints.bulk_upload.bank,
  contact_manager: endPoints.bulk_upload.contact_manager,
  shipping_address: endPoints.bulk_upload.shipping_address,
  trader_reference: endPoints.bulk_upload.trader_reference,
  principle_of_owner: endPoints.bulk_upload.principle_of_owner,
};

const CHECK_EXISTS_URL_MAP: Record<RelationType, string> = {
  bank: endPoints.others.check_existing_unique_banks,
  contact_manager: endPoints.others.check_existing_unique_contact_managers,
  shipping_address: endPoints.others.check_existing_unique_shipping_addresses,
  trader_reference: endPoints.others.check_existing_unique_trader_references,
  principle_of_owner: endPoints.others.check_existing_unique_principle_of_owners,
};

const CSV_FIELDS_MAP: Record<RelationType, string[]> = {
  bank: import.meta.env.VITE_CUSTOMER_BANK_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMER_BANK_BULK_UPLOAD_CSV_FIELDS) : [],
  contact_manager: import.meta.env.VITE_CUSTOMER_CONTACT_MANAGER_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMER_CONTACT_MANAGER_BULK_UPLOAD_CSV_FIELDS) : [],
  shipping_address: import.meta.env.VITE_CUSTOMERS_SHIPPING_ADDRESS_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMERS_SHIPPING_ADDRESS_BULK_UPLOAD_CSV_FIELDS) : [],
  trader_reference: import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCE_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCE_BULK_UPLOAD_CSV_FIELDS) : [],
  principle_of_owner: import.meta.env.VITE_CUSTOMERS_PRINCIPAL_OF_OWNER_BULK_UPLOAD_CSV_FIELDS
    ? JSON.parse(import.meta.env.VITE_CUSTOMERS_PRINCIPAL_OF_OWNER_BULK_UPLOAD_CSV_FIELDS) : [],
};

const SAMPLE_CSV_MAP: Record<RelationType, string> = {
  bank: import.meta.env.VITE_CUSTOMERS_BANKS_CSV,
  contact_manager: import.meta.env.VITE_CUSTOMERS_CONTACT_MANAGERS_CSV,
  shipping_address: import.meta.env.VITE_CUSTOMERS_SHIPPING_ADDRESSES_CSV,
  trader_reference: import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCES_CSV,
  principle_of_owner: import.meta.env.VITE_CUSTOMERS_PRINCIPLE_OWNERS_CSV,
};

const EMPTY_ROW_MAP: Record<RelationType, any> = {
  bank: {
    customer_id: '', beneficiary_name: '', name: '', address_line1: '',
    address_line2: '', branch: '', ac_iban_no: '', type_of_ac: '',
    swift: '', aba_routing_no: '', contact_name: '', phone: '',
    fax: '', mobile: '', email: '',
  },
  contact_manager: {
    customer_id: '', attention: '', address_line1: '', address_line2: '',
    city: '', state: '', zip_code: '', country: '', phone: '',
    fax: '', email: '', remarks: '',
  },
  shipping_address: {
    customer_id: '', attention: '', consignee_name: '', address_line1: '',
    address_line2: '', city: '', state: '', zip_code: '', country: '',
    phone: '', fax: '', email: '', remarks: '',
  },
  trader_reference: {
    customer_id: '', vendor_name: '', attention: '', address_line1: '',
    address_line2: '', city: '', state: '', zip_code: '', country: '',
    phone: '', fax: '', email: '', remarks: '',
  },
  principle_of_owner: {
    customer_id: '', owner: '', phone: '', email: '',
    id_passport_copy: '', remarks: '',
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ColHeader = ({
  label, tip, marker = '✱',
}: { label: string; tip?: string; marker?: string }) => (
  <Th color="white">
    {label}{' '}
    {tip ? (
      <Tooltip hasArrow placement="top" label={tip} textTransform="capitalize">
        <Text as="span" marginLeft={0.5} color="red.500" cursor="pointer">{marker}</Text>
      </Tooltip>
    ) : (
      <Text as="span" marginLeft={0.5} color="red.500">{marker}</Text>
    )}
  </Th>
);

const OptionalTh = ({ label }: { label: string }) => (
  <Th color="white">{label}</Th>
);

// ─── Field builders ───────────────────────────────────────────────────────────

const inputField = (
  field: string, placeholder: string, type = 'text',
  maxLength = 50, required?: string, width?: string
) => (item: any, index: number, { k, isExisting, handleInputChange }: RenderHelpers) => (
  <FieldInput
    key={`${field}_${k}`} name={`${field}_${index + 1}`}
    size="sm" placeholder={placeholder} type={type} maxLength={maxLength}
    required={!item.has_error && required ? required : ''}
    defaultValue={item[field] ?? ''} minWidth={width ?? '150px'} maxWidth="100%"
    onValueChange={(v) => handleInputChange(v, field, index)}
    isDisabled={isExisting}
  />
);

const phoneField = (field = 'phone') =>
  (item: any, index: number, { k, isExisting, handleInputChange }: RenderHelpers) => (
    <Box minWidth="180px">
      <FieldPhone
        key={`${field}_${k}`} name={`${field}_${index + 1}`}
        placeholder="Enter phone number"
        defaultCountry="AE"
        defaultValue={item[field] ?? ''}
        onValueChange={(v) => handleInputChange(v, field, index)}
        isDisabled={isExisting}
      />
    </Box>
  );

const selectField = (
  field: string, placeholder: string, options: any[], required?: string, width?: string
) => (item: any, index: number, { k, isExisting, handleInputChange }: RenderHelpers) => (
  <FieldSelect
    key={`${field}_${k}`} name={`${field}_${index + 1}`}
    size="sm" placeholder={placeholder}
    required={!item.has_error && required ? required : ''}
    options={options} width={width ?? '150px'}
    menuPortalTarget={document.body}
    selectProps={{ styles: { menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) } }}
    defaultValue={item[field]?.toString() ?? ''}
    onValueChange={(v) => handleInputChange(v, field, index)}
    isDisabled={isExisting}
  />
);

const emailField = (field = 'email', required?: string) =>
  (item: any, index: number, { k, isExisting, handleInputChange }: RenderHelpers) => (
    <FieldInput
      key={`${field}_${k}`} name={`${field}_${index + 1}`}
      size="sm" type='email' maxLength={100} placeholder="Enter email"
      required={!item.has_error && required ? required : ''}
      defaultValue={item[field] ?? ''} minWidth="180px" maxWidth="100%"
      validations={[{ handler: isEmail(), message: 'Invalid email' }]}
      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
      onValueChange={(v) => handleInputChange(v, field, index)}
      isDisabled={isExisting}
    />
  );

const uploadField = (field: string, label: string, required?: string) =>
  (item: any, index: number, { k, handleInputChange }: RenderHelpers) => (
    <FieldUpload
      key={`${field}_${k}`} name={`${field}_${index + 1}`}
      size="sm" placeholder={label}
      defaultValue={item[field] ?? ''} minWidth="150px" maxWidth="100%"
      required={!item.has_error && required ? required : ''}
      onValueChange={(v) => handleInputChange(v, field, index)}
    />
  );

const customerIdField = (customerOptions: any[]) =>
  (item: any, index: number, { k, isExisting, handleInputChange }: RenderHelpers) => (
    <FieldSelect
      key={`customer_id_${k}`} name={`customer_id_${index + 1}`}
      size="sm" placeholder="Select customer"
      required={!item.has_error ? 'Required' : ''}
      options={customerOptions} width="180px"
      menuPortalTarget={document.body}
      selectProps={{ styles: { menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) } }}
      defaultValue={item.customer_id?.toString() ?? ''}
      onValueChange={(v) => handleInputChange(v, 'customer_id', index)}
      isDisabled={isExisting}
    />
  );

// ─── Column definitions per relation type ────────────────────────────────────

const getColDefs = (type: RelationType, customerOptions: any[]): ColDef[] => {
  const custCol: ColDef = {
    key: 'customer_id', label: 'Customer', required: true,
    render: customerIdField(customerOptions),
  };

  const addressCols: ColDef[] = [
    { key: 'address_line1', label: 'Address Line 1', required: true, render: inputField('address_line1', 'Address line 1', 'text', 50, 'Required', '180px') },
    { key: 'address_line2', label: 'Address Line 2', render: inputField('address_line2', 'Address line 2', 'text', 50, '', '180px') },
    { key: 'city', label: 'City', render: inputField('city', 'City', 'alpha-numeric-with-space', 40) },
    { key: 'state', label: 'State', render: inputField('state', 'State', 'alpha-with-space', 40) },
    { key: 'zip_code', label: 'Zipcode', render: inputField('zip_code', 'Zipcode', 'integer', 8, '', '100px') },
    { key: 'country', label: 'Country', required: true, render: selectField('country', 'Country', countryOptions, 'Required', '160px') },
    { key: 'phone', label: 'Phone', render: phoneField('phone') },
    { key: 'fax', label: 'Fax', render: inputField('fax', 'Fax', 'phone-number', 15) },
    { key: 'email', label: 'Email', render: emailField() },
    { key: 'remarks', label: 'Remarks', render: inputField('remarks', 'Remarks', 'text', 100, '', '200px') },
  ];

  switch (type) {
    case 'bank':
      return [
        custCol,
        { key: 'type_of_ac', label: 'Account Type', required: true, render: inputField('type_of_ac', 'Account type', 'alpha-with-space', 30, 'Required') },
        { key: 'beneficiary_name', label: 'Beneficiary Name', required: true, render: inputField('beneficiary_name', 'Beneficiary name', 'alpha-with-space', 70, 'Required') },
        { key: 'name', label: 'Bank Name', required: true, render: inputField('name', 'Bank name', 'alpha-with-space', 70, 'Required') },
        { key: 'address_line1', label: 'Address Line 1', required: true, render: inputField('address_line1', 'Address line 1', 'text', 50, 'Required', '180px') },
        { key: 'address_line2', label: 'Address Line 2', render: inputField('address_line2', 'Address line 2', 'text', 50) },
        { key: 'branch', label: 'Branch', required: true, render: inputField('branch', 'Branch', 'alpha-with-space', 35, 'Required') },
        { key: 'contact_name', label: 'Contact Name', required: true, render: inputField('contact_name', 'Contact name', 'alpha-with-space', 70, 'Required') },
        { key: 'ac_iban_no', label: 'IBAN Number', required: true, render: inputField('ac_iban_no', 'IBAN number', 'alpha-numeric', 34, 'Required') },
        { key: 'swift', label: 'Swift Code', required: true, render: inputField('swift', 'Swift code', 'alpha-numeric', 11, 'Required') },
        { key: 'aba_routing_no', label: 'ABA Routing No', render: inputField('aba_routing_no', 'ABA routing no', 'alpha-numeric', 11) },
        { key: 'phone', label: 'Phone', render: phoneField('phone') },
        { key: 'fax', label: 'Fax', render: inputField('fax', 'Fax', 'phone-number', 15) },
        { key: 'mobile', label: 'Mobile', render: phoneField('mobile') },
        { key: 'email', label: 'Email', render: emailField() },
      ];

    case 'contact_manager':
      return [
        custCol,
        { key: 'attention', label: 'Attention', required: true, render: inputField('attention', 'Attention', 'alpha-with-space', 40, 'Required') },
        ...addressCols,
      ];

    case 'shipping_address':
      return [
        custCol,
        { key: 'attention', label: 'Attention', required: true, render: inputField('attention', 'Attention', 'alpha-with-space', 40, 'Required') },
        { key: 'consignee_name', label: 'Consignee Name', required: true, render: inputField('consignee_name', 'Consignee name', 'alpha-with-space', 40, 'Required') },
        ...addressCols,
      ];

    case 'trader_reference':
      return [
        custCol,
        { key: 'attention', label: 'Attention', required: true, render: inputField('attention', 'Attention', 'alpha-with-space', 40, 'Required') },
        { key: 'vendor_name', label: 'Vendor Name', required: true, render: inputField('vendor_name', 'Vendor name', 'alpha-numeric-with-space', 40, 'Required') },
        ...addressCols,
      ];

    case 'principle_of_owner':
      return [
        custCol,
        { key: 'owner', label: 'Owner Name', required: true, render: inputField('owner', 'Owner name', 'alpha-with-space', 40, 'Required') },
        { key: 'phone', label: 'Phone', render: phoneField('phone') },
        { key: 'email', label: 'Email', render: emailField() },
        { key: 'id_passport_copy', label: 'ID/Passport Copy', render: uploadField('id_passport_copy', 'Passport copy') },
        { key: 'remarks', label: 'Remarks', render: inputField('remarks', 'Remarks', 'text', 100, '', '200px') },
      ];
  }
};

// ─── Payload cleaner ──────────────────────────────────────────────────────────

const toPayloadRow = (obj: any) => {
  const result = { ...obj };
  delete result.has_error;
  delete result.error_message;
  delete result.is_exist;
  return result;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerRelationsBulkUpload = () => {
  const navigate = useNavigate();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  // ── Read relation type from URL param ─────────────────────────────────────
  // Route should be: /contact-management/customer-master/:relationType/bulk-upload
  const { relationType: relationParam } = useParams<{ relationType: string }>();
  const relationType: RelationType = VALID_RELATION_TYPES.includes(relationParam as RelationType)
    ? (relationParam as RelationType)
    : 'bank';

  // ── State ──────────────────────────────────────────────────────────────────
  const [fileKey, setFileKey] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [uploadedRows, setRows] = useState<any[]>([]);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: dropdownData, isLoading: dropdownLoading } = useCustomerDropdowns();
  const customerOptions = dropdownData?.customers ?? [];

  // ── Generic hooks — URL drives which endpoint is hit ──────────────────────
  const bulkUpload = useRelationBulkUpload(BULK_UPLOAD_URL_MAP[relationType]);
  const checkExists = useCheckRelationExists(CHECK_EXISTS_URL_MAP[relationType]);
  const isSubmitting = bulkUpload.isLoading;

  const colDefs = getColDefs(relationType, customerOptions);
  // Reset rows when relation type changes (e.g. user navigates to a different type)
  useEffect(() => {
    setRows([]);
    setUploadedFile(null);
    setFileKey((k) => k + 1);
  }, [relationType]);

  const filteredOptions = DownloadSampleOptions.filter(
    (opt) => opt.value !== RELATION_TO_SAMPLE_KEY_MAP[relationType]
  );

  // ── Form ───────────────────────────────────────────────────────────────────
  const relationForm = useForm({
    onValidSubmit: () => {
      const payload = uploadedRows
        .filter((row) => !row.has_error && !row.is_exist)
        .map(toPayloadRow);

      bulkUpload.mutate({ rows: payload }, {
        onSuccess: (data) => {
          if (!data) return;

          const duplicateMap = new Map(
            data.duplicates?.map((d: any) => [
              d.row.customer_id,
              d.error ?? 'Duplicate record found',
            ])
          );

          setRows((prev) =>
            prev
              .filter((row) => row.has_error || duplicateMap.has(row.customer_id))
              .map((row) =>
                duplicateMap.has(row.customer_id)
                  ? { ...row, has_error: true, is_exist: true, error_message: duplicateMap.get(row.customer_id) }
                  : row
              )
          );

          toastSuccess({
            title: 'Bulk upload completed',
            description: `${data.inserted_count} inserted, ${data.duplicate_count ?? 0} duplicates`,
          });
        },
        onError: (err) => console.log(err),
      });
    },
  });

  // ── Row helpers ────────────────────────────────────────────────────────────
  const handleInputChange = (value: any, field: string, index: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addNewRow = () =>
    setRows((prev) => [...prev, { ...EMPTY_ROW_MAP[relationType] }]);

  const deleteRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setFileKey((k) => k + 1);
  };

  // ── File upload handlers ───────────────────────────────────────────────────
  const openFileConfirm = (file: File) => {
    setUploadedFile(file);
    setOpenConfirmation(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openFileConfirm(file);
    setFileKey((k) => k + 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) openFileConfirm(file);
  };

  const handleConfirm = async () => {
    const parsedHeaders: any = await parseCSVHeaders(uploadedFile);

    if (!checkArraysHasSameValues(CSV_FIELDS_MAP[relationType], parsedHeaders)) {
      toastError({ title: 'Not a valid CSV file.' });
      setOpenConfirmation(false);
      return;
    }

    const parsedRows: any = await parseCSV(uploadedFile);

    if (parsedRows.length > 100) {
      toastError({ title: 'Uploaded CSV has more than 100 rows. Please upload with max 100 rows.' });
      setOpenConfirmation(false);
      return;
    }

    const updatedRows = parsedRows.map((row: any) => ({
      ...row,
      customer_id: getOptionValue(row.customer_code, customerOptions),
      email: row.email?.toLowerCase().trim(),
    }));

    // Filter out rows where customer_id could not be resolved
    const validRows = updatedRows.filter((row: any) => !!row.customer_id);
    const invalidRows = updatedRows.filter((row: any) => !row.customer_id);

    if (invalidRows.length > 0) {
      toastError({
        title: `${invalidRows.length} row(s) skipped — customer code not found.`,
      });
    }

    if (validRows.length === 0) {
      setOpenConfirmation(false);
      return;
    }

    const allRows = [...uploadedRows, ...validRows];
    setRows(allRows);

    const uniqueFields = RELATION_UNIQUE_FIELDS_MAP[relationType];
    const identifierField = uniqueFields[0];

    const payload = {
      rows: allRows.map((row) =>
        Object.fromEntries(uniqueFields.map((field) => [field, row[field] ?? '']))
      ),
    };

    checkExists.mutate(payload, {
      onSuccess: ({ exists, errors }) => {
        if (!exists) return;

        setRows((prev) =>
          prev.map((row) => {
            const key = row[identifierField];
            const isExists = exists[key];

            return isExists
              ? {
                ...row,
                has_error: true,
                is_exist: true,
                error_message: errors?.[key] ?? `Record already exists: "${key}"`,
              }
              : row;
          })
        );
      },
      onError: (err) => console.log(err),
    });

    setOpenConfirmation(false);
  };

  const handleUploadPageRedirection = (value: DownloadSampleKeys) => {
    navigate(contactManagementPageConfig[value].uploadRoute);
  };
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>

        {/* ── Page header ── */}
        <HStack justify="space-between">
          <Heading as="h4" size="md">
            {RELATION_LABEL_MAP[relationType]} Bulk Upload
          </Heading>

          <HStack spacing={2}>
            <ActionMenu
              label="Bulk Upload"
              icon={<LuUpload />}
              color="green"
              options={filteredOptions}
              onClick={handleUploadPageRedirection}
              isDisabled={dropdownLoading}
            />

            <Button
              leftIcon={<LuDownload />}
              colorScheme="blue"
              size="sm"
              onClick={() => handleDownload(SAMPLE_CSV_MAP[relationType])}
            >
              Download Sample
            </Button>
          </HStack>
        </HStack>

        <Box borderRadius={4} overflowX="auto" width="100%">

          {/* ── Drop-zone ── */}
          <HStack bg="white" justify="space-between" mb={4} p={4} borderTopRadius={4}>
            <Box
              width="100%" margin="auto" padding={4}
              border="2px dashed" borderColor="gray.300"
              borderRadius="md" textAlign="center"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Text fontSize="lg" mb={4}>Drag &amp; Drop or upload a file here.</Text>
              <input
                type="file" id="file-upload" key={fileKey}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={dropdownLoading}
              />
              <label htmlFor="file-upload">
                <Button
                  as="label" htmlFor="file-upload"
                  leftIcon={<LuUpload />} colorScheme="green" size="sm" mb={4}
                  isDisabled={dropdownLoading}
                >
                  Choose File
                </Button>
              </label>
              {uploadedFile && (
                <Box mt={2} mb={4}>
                  <Text fontSize="sm">Selected File: {uploadedFile.name}</Text>
                </Box>
              )}
            </Box>
          </HStack>

          {/* ── Table form ── */}
          <Formiz autoForm connect={relationForm}>

            <HStack justify="flex-end" mb={1}>
              <Button
                leftIcon={<LuPlus />} colorScheme="blue" size="sm"
                onClick={addNewRow} isDisabled={dropdownLoading}
              >
                Add Row
              </Button>
            </HStack>

            <LoadingOverlay isLoading={dropdownLoading || checkExists.isLoading || isSubmitting}>
              <>
                <style>{`
                  @keyframes blinkRowBg {
                    0%, 100% { background-color: #fb9393; }
                    50%       { background-color: #eac7c7; }
                  }
                `}</style>

                <TableContainer
                  rounded="md" border="1px" borderColor="gray.500"
                  borderRadius="md" boxShadow="md" maxWidth="100%"
                >
                  <Table variant="simple" size="sm">

                    {/* ── Head ── */}
                    <Thead bg="gray.500">
                      <Tr>
                        <Th color="white">#</Th>
                        {colDefs.map((col) =>
                          col.required
                            ? <ColHeader key={col.key} label={col.label} tip={col.tip} />
                            : <OptionalTh key={col.key} label={col.label} />
                        )}
                        <Th color="white" isNumeric>Action</Th>
                      </Tr>
                    </Thead>

                    {/* ── Body ── */}
                    <Tbody>
                      {uploadedRows.length === 0 ? (
                        <Tr>
                          <Td colSpan={colDefs.length + 2} textAlign="center" bg="white">
                            No records
                          </Td>
                        </Tr>
                      ) : (
                        uploadedRows.map((item: any, index: number) => {
                          const k = `${fileKey}_${index + 1}`;
                          const isExisting = item.is_exist === true;
                          const helpers: RenderHelpers = { k, fileKey, isExisting, handleInputChange };

                          return (
                            <Tr
                              key={index}
                              sx={item.has_error ? {
                                '& td': { animation: 'blinkRowBg 1.2s ease-in-out infinite' },
                              } : {}}
                            >
                              {/* Row # with error tooltip */}
                              <Td>
                                {item.has_error ? (
                                  <Tooltip
                                    hasArrow label={item.error_message}
                                    placement="right" bg="red.500"
                                    color="white" fontSize="xs" borderRadius="md"
                                  >
                                    <Text as="span" fontWeight="bold" color="red.500" cursor="pointer">
                                      <LuInfo style={{ display: 'inline' }} />
                                    </Text>
                                  </Tooltip>
                                ) : (
                                  index + 1
                                )}
                              </Td>

                              {/* Dynamic columns */}
                              {colDefs.map((col) => (
                                <Td key={col.key}>
                                  {col.render(item, index, helpers)}
                                </Td>
                              ))}

                              {/* Delete */}
                              <Td isNumeric>
                                <IconButton
                                  aria-label="Delete Row" icon={<DeleteIcon />}
                                  colorScheme="red" size="sm"
                                  onClick={() => deleteRow(index)}
                                  isDisabled={uploadedRows.length < 2}
                                />
                              </Td>
                            </Tr>
                          );
                        })
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            </LoadingOverlay>

            {/* ── Actions ── */}
            <Stack direction={{ base: 'column', md: 'row' }} justify="center" alignItems="center" mt={4}>
              <Button
                type="button" colorScheme="red"
                onClick={() => navigate('/contact-management/customer-master')}
                isDisabled={dropdownLoading}
              >
                Go to Master
              </Button>
              <Button
                type="submit" colorScheme="brand"
                isDisabled={uploadedRows.length === 0 || dropdownLoading || isSubmitting}
                isLoading={isSubmitting}
              >
                Submit
              </Button>
            </Stack>

          </Formiz>

        </Box>

        <ConfirmationPopup
          isOpen={openConfirmation}
          onClose={() => setOpenConfirmation(false)}
          onConfirm={handleConfirm}
          headerText="Upload File"
          bodyText="Are you sure you want to upload this file?"
        />

      </Stack>
    </SlideIn>
  );
};

export default CustomerRelationsBulkUpload;