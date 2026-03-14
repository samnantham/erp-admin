import { useEffect, useState } from 'react';

import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box, Button, HStack, Heading, IconButton, Stack,
  Table, TableContainer, Tbody, Td, Text, Th, Thead,
  Tooltip, Tr
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { isEmail } from '@formiz/validations';
import dayjs from 'dayjs';
import { LuDownload, LuPlus, LuUpload, LuInfo } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useSubmasterItemIndex } from '@/services/submaster/service';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldUpload } from '@/components/FieldUpload';
import { FieldYearPicker } from '@/components/FieldYearPicker';
import { SlideIn } from '@/components/SlideIn';
import { useToastError, useToastSuccess } from '@/components/Toast';
import {
  checkArraysHasSameValues, getOptionValue,
  getOptionValueFromValue, handleDownload, parseCSV,
  parseCSVHeaders, formatDate
} from '@/helpers/commonHelper';
import { useCustomerDropdowns, useCheckExistingUniqueCustomers, useBulkUploadCustomers } from '@/services/master/customer/service';
import { DownloadSampleOptions, DownloadSampleKeys, contactManagementPageConfig } from '@/constants';
import { ActionMenu } from '@/components/ActionMenu';

// ─── Constants ───────────────────────────────────────────────────────────────

const FOREIGN_ENTITY_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const CSV_FIELDS: string[] = import.meta.env.VITE_CUSTOMERS_BULK_UPLOAD_CSV_FIELDS
  ? JSON.parse(import.meta.env.VITE_CUSTOMERS_BULK_UPLOAD_CSV_FIELDS)
  : [];

const EMPTY_ROW = {
  business_name: '', business_type_id: '', year_of_business: '',
  contact_type_id: '', is_foreign_entity: '', nature_of_business: '',
  license_trade_no: '', email: '', currency_id: '', payment_mode_id: '',
  payment_term_id: '', total_credit_amount: '', total_credit_period: '',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Column header with an optional mandatory indicator tooltip */
const ColHeader = ({
  label,
  tip = 'Mandatory Field',
  marker = '✱',
}: {
  label: string;
  tip?: string;
  marker?: string;
}) => (
  <Th color="white">
    {label}{' '}
    <Tooltip hasArrow placement="top" label={tip} textTransform="capitalize">
      <Text as="span" marginLeft={0.5} color="red.500" cursor="pointer">
        {marker}
      </Text>
    </Tooltip>
  </Th>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerBulkUpload = () => {
  const navigate = useNavigate();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: dropdownData, isLoading: dropdownLoading } = useCustomerDropdowns();
  const { data: paymentTermList } = useSubmasterItemIndex('payment-terms', {});
  const checkExistingUniqueCustomers = useCheckExistingUniqueCustomers();
  const paymentTerms: TODO[] = paymentTermList?.data ?? [];
  const contactTypeOptions = dropdownData?.contact_types ?? [];
  const businessTypeOptions = dropdownData?.business_types ?? [];
  const paymentModeOptions = dropdownData?.payment_modes ?? [];
  const paymentTermOptions = dropdownData?.payment_terms ?? [];
  const currencyOptions = dropdownData?.currencies ?? [];

  // ── Local state ────────────────────────────────────────────────────────────
  const [resetKey, setResetKey] = useState(0);
  const [fileKey, setFileKey] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<TODO>(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [uploadedRows, setRows] = useState<any[]>([]);

  const converttoPayloadRow = (obj: any) => {
    const result = { ...obj };

    // Coerce "true"/"false" strings to booleans
    Object.keys(result).forEach((key) => {
      if (result[key] === 'true') result[key] = true;
      if (result[key] === 'false') result[key] = false;
    });

    // Clean up UI-only / meta fields
    delete result.business_since;
    delete result.has_error;
    delete result.error_message;
    delete result.is_exist;

    if (result.license_trade_exp_date) {
      result.license_trade_exp_date = formatDate(result.license_trade_exp_date);
    }

    result.total_credit_amount = Number(result.total_credit_amount);
    result.total_credit_period = Number(result.total_credit_period);
    result.year_of_business = Number(result.year_of_business);

    return result;
  };

  const filteredOptions = DownloadSampleOptions.filter(
    (opt) => opt.value !== 'customer_master'
  );



  // ── Form ───────────────────────────────────────────────────────────────────
  const customerForm = useForm({
    onValidSubmit: () => {
      const payload = uploadedRows
        .filter((row) => !row.has_error && !row.is_exist)
        .map(converttoPayloadRow);

      bulkUploadCustomers.mutate(
        {
          rows: payload,
        },
        {
          onSuccess: (data) => {
            if (!data) return;

            const duplicateMap = new Map(
              data.duplicates?.map((d: any) => [
                d.row.business_name,
                d.error || `Customer already exists: "${d.row.business_name}"`,
              ])
            );

            setRows((prev) =>
              prev
                .filter((row) => row.has_error || duplicateMap.has(row.business_name))
                .map((row) =>
                  duplicateMap.has(row.business_name)
                    ? {
                      ...row,
                      has_error: true,
                      is_exist: true,
                      error_message: duplicateMap.get(row.business_name),
                    }
                    : row
                )
            );

            toastSuccess({
              title: "Bulk upload completed",
              description: `${data.inserted_count} inserted, ${data.duplicate_count} duplicates`,
              status: data.duplicate_count > 0 ? "warning" : "success",
              duration: 4000,
              isClosable: true,
            });
          },
          onError: (error) => {
            console.log(error);
          },
        }
      );
    },
  });
  const bulkUploadCustomers = useBulkUploadCustomers();

  // ── Row helpers ────────────────────────────────────────────────────────────
  const handleInputChange = (value: any, field: string, index: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'payment_term_id') {
        const selected = paymentTerms?.find((pt) => String(pt.id) === String(value));

        // Always reset credit amount when payment term changes
        next[index].total_credit_amount = '';

        if (selected?.is_fixed === true) {
          // Fixed term: clear both credit fields and force re-mount inputs
          setResetKey((k) => k + 1);
          next[index].total_credit_period = '';
        } else {
          // Non-fixed (NET) term: auto-fill credit period from term's credit_days
          next[index].total_credit_period = selected?.credit_days ?? '';
        }
      }

      return next;
    });
  };

  const addNewRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);

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
    const parsedHeaders: TODO = await parseCSVHeaders(uploadedFile);

    if (!checkArraysHasSameValues(CSV_FIELDS, parsedHeaders)) {
      toastError({ title: 'Not a valid CSV file.' });
      setOpenConfirmation(false);
      return;
    }

    const parsedRows: TODO = await parseCSV(uploadedFile);

    if (parsedRows.length > 100) {
      toastError({
        title: 'Uploaded CSV has more than 100 rows. Please upload with the max of 100 rows.',
      });
      setOpenConfirmation(false);
      return;
    }

    const currentYear = dayjs().year();

    const updatedRows = parsedRows.map((row: any) => {
      const businessYear = row.business_from ? dayjs(row.business_from).year() : null;
      const paymentTermId = getOptionValue(row.payment_term_id, paymentTermOptions);
      const selectedTerm = paymentTerms?.find((pt) => String(pt.id) === String(paymentTermId));
      const isFixedTerm = selectedTerm?.is_fixed === true;

      return {
        ...row,
        business_type_id: getOptionValue(row.business_type_id, businessTypeOptions),
        contact_type_id: getOptionValue(row.contact_type_id, contactTypeOptions),
        currency_id: getOptionValue(row.currency_id, currencyOptions),
        payment_mode_id: getOptionValue(row.payment_mode_id, paymentModeOptions),
        payment_term_id: paymentTermId,
        is_foreign_entity: getOptionValueFromValue(row.is_foreign_entity, FOREIGN_ENTITY_OPTIONS),
        year_of_business: businessYear ? currentYear - businessYear : '',
        business_since: businessYear ? dayjs(`${businessYear}-01-01`) : null,
        email: row.email?.toLowerCase().trim(),
        // Credit amount: only meaningful for NET (non-fixed) terms
        total_credit_amount: isFixedTerm ? '0' : (row.total_credit_amount || '0'),
        // Credit period: auto-fill from term master if non-fixed, else use CSV value
        total_credit_period: isFixedTerm ? '' : (selectedTerm?.credit_days ?? row.total_credit_period ?? '0'),
      };
    });

    const allRows = [...uploadedRows, ...updatedRows];

    setRows(allRows);

    const payload = {
      rows: allRows.map((row) => ({
        business_name: row.business_name,
        email: row.email,
      })),
    };

    checkExistingUniqueCustomers.mutate(payload, {
      onSuccess: ({ exists, errors }) => {
        if (!exists) return;

        setRows((prev) =>
          prev.map((customer) => {
            const isExists = exists[customer.business_name];

            return isExists
              ? {
                ...customer,
                has_error: true,
                is_exist: true,
                error_message:
                  errors?.[customer.business_name] ??
                  `Customer already exists: "${customer.business_name}"`,
              }
              : customer;
          })
        );
      },
      onError: (error) => console.log(error),
    });

    setOpenConfirmation(false);
  };

  // ── Debug ──────────────────────────────────────────────────────────────────
  useEffect(() => { console.log(uploadedRows); }, [uploadedRows]);

  const handleUploadPageRedirection = (value: DownloadSampleKeys) => {
    navigate(contactManagementPageConfig[value].uploadRoute);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>

        <HStack justify="space-between">
          <Heading as="h4" size="md">
            Contact Bulk Upload
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
              onClick={() => handleDownload(import.meta.env.VITE_CUSTOMERS_SAMPLE_CSV)}
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
                  leftIcon={<LuUpload />}
                  colorScheme="green" size="sm" mb={4}
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
          <Formiz autoForm connect={customerForm}>
            <HStack justify="space-between" mb={1}>
              <HStack ml="auto">
                <Button leftIcon={<LuPlus />} colorScheme="blue" size="sm" onClick={addNewRow} isDisabled={dropdownLoading}>
                  Add Row
                </Button>
              </HStack>
            </HStack>

            <LoadingOverlay isLoading={dropdownLoading || checkExistingUniqueCustomers.isLoading || bulkUploadCustomers.isLoading}>
              <>
                <style>{`
    @keyframes blinkRowBg {
      0%, 100% { background-color: #ffb5b5; }
      50%       { background-color: #f4d9d9; }
    }
  `}</style>
                <TableContainer
                  rounded="md" border="1px" borderColor="gray.500"
                  borderRadius="md" boxShadow="md" maxWidth="100%"
                >
                  <Table variant="simple" size="sm">
                    {/* ── Table head ── */}
                    <Thead bg="gray.500">
                      <Tr>
                        <Th color="white">#</Th>
                        <ColHeader label="Type of Contact" />
                        <ColHeader label="Business Name" />
                        <ColHeader label="Type of Business" />
                        <Th color="white">Business Since</Th>
                        <Th color="white">Years in Business</Th>
                        <ColHeader label="Is foreign entity" />
                        <Th color="white">Nature of Business</Th>
                        <Th color="white">Lic./Trade No</Th>
                        <Th color="white">Lic./Trade Exp.Date</Th>
                        <Th color="white">Lic./Trade Document</Th>
                        <ColHeader label="Email" />
                        <ColHeader label="Currency" />
                        <ColHeader label="Pay. Mode" />
                        <ColHeader label="Pay. Terms" />
                        <ColHeader label="Total Credit Amount" tip="Mandatory for NET Payment terms" marker="(✱)" />
                        <ColHeader label="Total Credit Period" tip="Mandatory for NET Payment terms" marker="(✱)" />
                        <Th color="white" isNumeric>Action</Th>
                      </Tr>
                    </Thead>

                    {/* ── Table body ── */}
                    <Tbody>
                      {uploadedRows.length === 0 ? (
                        <Tr>
                          <Td colSpan={17} textAlign="center" bg="white">No records</Td>
                        </Tr>
                      ) : (
                        uploadedRows.map((item: any, index: number) => {
                          const k = `${fileKey}_${index + 1}`;
                          const isExisting = item.is_exist === true;
                          const selectedTerm = paymentTerms?.find((pt) => String(pt.id) === String(item.payment_term_id));
                          const isFixedTerm = selectedTerm?.is_fixed === true;
                          const isNetTerm = !!item.payment_term_id && !isFixedTerm && !isExisting;

                          // Shared select props for portal z-index
                          const portalStyles = {
                            styles: { menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) },
                          };

                          return (

                            <Tr
                              key={index}
                              sx={item.has_error ? {
                                '& td': {
                                  animation: 'blinkRowBg 1.2s ease-in-out infinite',
                                },
                              } : {}}
                            >
                              {/* Row number — shows error tooltip on hover when row has an error */}
                              <Td>
                                {item.has_error ? (
                                  <Tooltip
                                    hasArrow
                                    label={item.error_message}
                                    placement="right"
                                    bg="red.500"
                                    color="white"
                                    fontSize="xs"
                                    borderRadius="md"
                                  >
                                    <Text
                                      as="span"
                                      fontWeight="bold"
                                      color="red.500"
                                      cursor="pointer"
                                    >
                                      <LuInfo style={{ display: 'inline' }} />
                                    </Text>
                                  </Tooltip>
                                ) : (
                                  index + 1
                                )}
                              </Td>

                              {/* Contact Type */}
                              <Td>
                                <FieldSelect
                                  key={`contact_type_id_${k}`} name={`contact_type_id_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Contact type"
                                  options={contactTypeOptions}
                                  menuPortalTarget={document.body} selectProps={portalStyles}
                                  defaultValue={item.contact_type_id?.toString() ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'contact_type_id', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Business Name */}
                              <Td>
                                <FieldInput
                                  key={`business_name_${k}`} name={`business_name_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Business name"
                                  maxLength={40} type="alpha-numeric-with-space"
                                  defaultValue={item.business_name ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'business_name', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Business Type */}
                              <Td>
                                <FieldSelect
                                  key={`business_type_id_${k}`} name={`business_type_id_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Business type"
                                  options={businessTypeOptions}
                                  menuPortalTarget={document.body} selectProps={portalStyles}
                                  defaultValue={item.business_type_id?.toString() ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'business_type_id', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Business Since (year picker) */}
                              <Td>
                                <FieldYearPicker
                                  name="business_since" placeholder="Select year" size="sm"
                                  yearRange={{ start: 1950, end: dayjs().year() }}
                                  defaultValue={item.business_since ?? null}
                                  isDisabled={isExisting}
                                  onValueChange={(value) => {
                                    if (value) {
                                      const yearsInBiz = dayjs().year() - dayjs(value).year();
                                      customerForm.setValues({
                                        [`year_of_business_${index + 1}`]: yearsInBiz.toString(),
                                      });
                                      handleInputChange(yearsInBiz, 'year_of_business', index);
                                    }
                                  }}
                                />
                              </Td>

                              {/* Years in Business (read-only, derived) */}
                              <Td>
                                <FieldInput
                                  key={`year_of_business_${k}`} name={`year_of_business_${index + 1}`}
                                  size="sm" type="integer" maxLength={4}
                                  placeholder="Years in business" isDisabled
                                  defaultValue={item.year_of_business ?? ''} minWidth="120px" maxWidth="100%"
                                />
                              </Td>

                              {/* Foreign Entity */}
                              <Td>
                                <FieldSelect
                                  key={`is_foreign_entity_${k}`} name={`is_foreign_entity_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Foreign entity"
                                  options={FOREIGN_ENTITY_OPTIONS}
                                  menuPortalTarget={document.body} selectProps={portalStyles}
                                  defaultValue={item.is_foreign_entity?.toString() ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'is_foreign_entity', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Nature of Business */}
                              <Td>
                                <FieldInput
                                  key={`nature_of_business_${k}`} name={`nature_of_business_${index + 1}`}
                                  size="sm" maxLength={35} type="alpha-numeric-with-space"
                                  placeholder="Nature of business"
                                  defaultValue={item.nature_of_business ?? ''} minWidth="200px" maxWidth="100%"
                                  onValueChange={(v) => handleInputChange(v, 'nature_of_business', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* License / Trade No */}
                              <Td>
                                <FieldInput
                                  key={`license_trade_no_${k}`} name={`license_trade_no_${index + 1}`}
                                  size="sm" maxLength={25} type="alpha-numeric-with-special"
                                  placeholder="License trade no"
                                  defaultValue={item.license_trade_no ?? ''} minWidth="200px" maxWidth="100%"
                                  required={item.has_error ? '' : (item.license_trade_exp_date || item.license_trade_url ? 'Required' : '')}
                                  onValueChange={(v) => handleInputChange(v, 'license_trade_no', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* License / Trade Exp Date */}
                              <Td>
                                <FieldDayPicker
                                  key={`license_trade_exp_date_${k}`} name="license_trade_exp_date"
                                  size="sm" placeholder="Lic./Trade Exp.Date"
                                  disabledDays={{ before: new Date() }}
                                  defaultValue={item.license_trade_exp_date ?? ''}
                                  required={item.has_error ? '' : (item.license_trade_no || item.license_trade_url ? 'Required' : '')}
                                  onValueChange={(v) => handleInputChange(v, 'license_trade_exp_date', index)}
                                />
                              </Td>

                              {/* License / Trade Document */}
                              <Td>
                                <FieldUpload
                                  key={`license_trade_url_${k}`} name={`license_trade_url_${index + 1}`}
                                  size="sm" placeholder="Lic./Trade Doc"
                                  defaultValue={item.license_trade_url ?? ''}
                                  required={item.has_error ? '' : (item.license_trade_no || item.license_trade_exp_date ? 'Required' : '')}
                                  onValueChange={(v) => handleInputChange(v, 'license_trade_url', index)}
                                />
                              </Td>

                              {/* Email */}
                              <Td>
                                <FieldInput
                                  key={`email_${k}`} name={`email_${index + 1}`}
                                  size="sm" type="email" maxLength={100} required={!item.has_error && 'Required'}
                                  placeholder="Enter email"
                                  defaultValue={item.email ?? ''} minWidth="200px" maxWidth="100%"
                                  validations={[{ handler: isEmail(), message: 'Invalid email' }]}
                                  onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                                  onValueChange={(v) => handleInputChange(v, 'email', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Currency */}
                              <Td>
                                <FieldSelect
                                  key={`currency_id_${k}`} name={`currency_id_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Currency code"
                                  options={currencyOptions}
                                  menuPortalTarget={document.body} selectProps={portalStyles}
                                  defaultValue={item.currency_id?.toString() ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'currency_id', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Payment Mode */}
                              <Td>
                                <FieldSelect
                                  key={`payment_mode_id_${k}`} name={`payment_mode_id_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Pay. mode"
                                  options={paymentModeOptions}
                                  menuPortalTarget={document.body} selectProps={portalStyles}
                                  defaultValue={item.payment_mode_id?.toString() ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'payment_mode_id', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Payment Terms */}
                              <Td>
                                <FieldSelect
                                  key={`payment_term_id_${k}`} name={`payment_term_id_${index + 1}`}
                                  size="sm" required={!item.has_error && 'Required'} placeholder="Pay. Terms"
                                  options={paymentTermOptions}
                                  menuPortalTarget={document.body} selectProps={portalStyles}
                                  defaultValue={item.payment_term_id?.toString() ?? ''}
                                  onValueChange={(v) => handleInputChange(v, 'payment_term_id', index)}
                                  isDisabled={isExisting}
                                />
                              </Td>

                              {/* Total Credit Amount */}
                              <Td>
                                <FieldInput
                                  key={`total_credit_amount_${resetKey}_${index + 1}`}
                                  name={`total_credit_amount_${index + 1}`}
                                  size="sm" type="decimal" maxLength={10}
                                  placeholder="Total credit amount"
                                  required={isNetTerm ? 'Required' : ''}
                                  defaultValue={item.total_credit_amount ?? ''}
                                  onValueChange={(v) => handleInputChange(Number(v), 'total_credit_amount', index)}
                                  isDisabled={!isNetTerm || isExisting}
                                />
                              </Td>

                              {/* Total Credit Period */}
                              <Td>
                                <FieldInput
                                  key={`total_credit_period_${resetKey}_${index + 1}`}
                                  name={`total_credit_period_${index + 1}`}
                                  size="sm" type="integer" maxLength={6}
                                  placeholder="Total credit period"
                                  required={isNetTerm ? 'Required' : ''}
                                  defaultValue={item.total_credit_period ?? ''}
                                  onValueChange={(v) => handleInputChange(Number(v), 'total_credit_period', index)}
                                  isDisabled={!isNetTerm || isExisting}
                                />
                              </Td>

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

            {/* ── Action buttons ── */}
            <Stack direction={{ base: 'column', md: 'row' }} justify="center" alignItems="center" mt={4}>
              <Button type="button" colorScheme="red" onClick={() => navigate('/contact-management/customer-master')} isDisabled={dropdownLoading}>
                Go to Master
              </Button>
              <Button type="submit" colorScheme="brand" isDisabled={uploadedRows.length === 0 || dropdownLoading || bulkUploadCustomers.isLoading} isLoading={bulkUploadCustomers.isLoading}>
                Submit
              </Button>
            </Stack>
          </Formiz>

          <ConfirmationPopup
            isOpen={openConfirmation}
            onClose={() => setOpenConfirmation(false)}
            onConfirm={handleConfirm}
            headerText="Upload File"
            bodyText="Are you sure you want to upload this file?"
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default CustomerBulkUpload;
