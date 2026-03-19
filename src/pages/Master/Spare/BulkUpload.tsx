import { useEffect, useState } from 'react';
import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box, Button, HStack, Heading, IconButton, Stack,
  Table, TableContainer, Tbody, Td, Text, Th, Thead,
  Tooltip, Tr,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { LuDownload, LuPlus, LuUpload, LuInfo } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '@/components/LoadingOverlay';
import ConfirmationPopup from '@/components/ConfirmationPopup';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { SlideIn } from '@/components/SlideIn';
import { useToastError, useToastSuccess } from '@/components/Toast';
import {
  checkArraysHasSameValues, getOptionValue,
  handleDownload, parseCSV, parseCSVHeaders,
} from '@/helpers/commonHelper';
import {
  usePartNumberDropdowns,
  useCheckExistingUniquePartNumbers,
  useBulkUploadPartNumbers,
} from '@/services/master/spare/service';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOL_OPTIONS = [
  { value: 'true',  label: 'Yes' },
  { value: 'false', label: 'No' },
];

const CSV_FIELDS: string[] = import.meta.env.VITE_SPARES_BULK_UPLOAD_CSV_FIELDS
  ? JSON.parse(import.meta.env.VITE_SPARES_BULK_UPLOAD_CSV_FIELDS)
  : [];

const EMPTY_ROW = {
  name: '', description: '', ata: '', manufacturer_name: '', cage_code: '',
  unit_of_measure_id: '', spare_type_id: '', spare_model_id: '', hsc_code_id: '',
  is_shelf_life: '', total_shelf_life: '', is_llp: '', is_serialized: '',
  is_dg: '', un_id: '', remarks: '',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ColHeader = ({
  label, tip = 'Mandatory Field', marker = '✱',
}: {
  label: string; tip?: string; marker?: string;
}) => (
  <Th color="white">
    {label}{' '}
    <Tooltip hasArrow placement="top" label={tip} textTransform="capitalize">
      <Text as="span" marginLeft={0.5} color="red.500" cursor="pointer">{marker}</Text>
    </Tooltip>
  </Th>
);

const OptHeader = ({ label }: { label: string }) => <Th color="white">{label}</Th>;

// ─── Main Component ───────────────────────────────────────────────────────────

export const SpareBulkUpload = () => {
  const navigate = useNavigate();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: dropdownData, isLoading: dropdownLoading } = usePartNumberDropdowns();
  const unitOfMeasureOptions = dropdownData?.unit_of_measures ?? [];
  const spareTypeOptions     = dropdownData?.spare_types ?? [];
  const spareModelOptions    = dropdownData?.spare_models ?? [];
  const hscCodeOptions       = dropdownData?.hsc_codes ?? [];
  const unOptions            = dropdownData?.uns ?? [];

  const checkExisting   = useCheckExistingUniquePartNumbers();
  const bulkUpload      = useBulkUploadPartNumbers();

  // ── Local state ────────────────────────────────────────────────────────────
  const [fileKey, setFileKey]               = useState(0);
  const [uploadedFile, setUploadedFile]     = useState<any>(null);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [uploadedRows, setRows]             = useState<any[]>([]);

  // ── Payload converter ──────────────────────────────────────────────────────
  const convertToPayloadRow = (row: any) => {
    const result = { ...row };
    delete result.has_error;
    delete result.error_message;
    delete result.is_exist;

    result.is_shelf_life = result.is_shelf_life === 'true' || result.is_shelf_life === true;
    result.is_llp        = result.is_llp === 'true'        || result.is_llp === true;
    result.is_serialized = result.is_serialized === 'true'  || result.is_serialized === true;
    result.is_dg         = result.is_dg === 'true'          || result.is_dg === true;
    result.total_shelf_life = result.is_shelf_life ? Number(result.total_shelf_life) : null;
    result.un_id         = result.is_dg ? result.un_id : null;

    return result;
  };

  // ── Form ───────────────────────────────────────────────────────────────────
  const partNumberForm = useForm({
    onValidSubmit: () => {
      const payload = uploadedRows
        .filter((row) => !row.has_error && !row.is_exist)
        .map(convertToPayloadRow);

      bulkUpload.mutate({ rows: payload }, {
        onSuccess: (data) => {
          if (!data) return;

          const duplicateMap = new Map(
            data.duplicates?.map((d: any) => [
              d.row.name,
              d.error || `Part number already exists: "${d.row.name}"`,
            ])
          );

          setRows((prev) =>
            prev
              .filter((row) => row.has_error || duplicateMap.has(row.name))
              .map((row) =>
                duplicateMap.has(row.name)
                  ? { ...row, has_error: true, is_exist: true, error_message: duplicateMap.get(row.name) }
                  : row
              )
          );

          toastSuccess({
            title: 'Bulk upload completed',
            description: `${data.inserted_count} inserted, ${data.duplicate_count} duplicates`,
            status: data.duplicate_count > 0 ? 'warning' : 'success',
            duration: 4000,
            isClosable: true,
          });
        },
        onError: (error) => console.error(error),
      });
    },
  });

  // ── Row helpers ────────────────────────────────────────────────────────────
  const handleInputChange = (value: any, field: string, index: number) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Clear dependent fields
      if (field === 'is_shelf_life' && value === 'false') next[index].total_shelf_life = '';
      if (field === 'is_dg'         && value === 'false') next[index].un_id = '';
      return next;
    });
  };

  const addNewRow  = () => setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  const deleteRow  = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setFileKey((k) => k + 1);
  };

  // ── File upload handlers ───────────────────────────────────────────────────
  const openFileConfirm  = (file: File) => { setUploadedFile(file); setOpenConfirmation(true); };
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

    if (!checkArraysHasSameValues(CSV_FIELDS, parsedHeaders)) {
      toastError({ title: 'Not a valid CSV file.' });
      setOpenConfirmation(false);
      return;
    }

    const parsedRows: any = await parseCSV(uploadedFile);

    if (parsedRows.length > 100) {
      toastError({ title: 'Uploaded CSV has more than 100 rows. Max allowed is 100.' });
      setOpenConfirmation(false);
      return;
    }

    const updatedRows = parsedRows.map((row: any) => ({
      ...row,
      unit_of_measure_id: getOptionValue(row.unit_of_measure_id, unitOfMeasureOptions),
      spare_type_id:      getOptionValue(row.spare_type_id, spareTypeOptions),
      spare_model_id:     getOptionValue(row.spare_model_id, spareModelOptions),
      hsc_code_id:        getOptionValue(row.hsc_code_id, hscCodeOptions),
      un_id:              getOptionValue(row.un_id, unOptions),
    }));

    const allRows = [...uploadedRows, ...updatedRows];
    setRows(allRows);

    checkExisting.mutate(
      { rows: allRows.map((row) => ({ name: row.name })) },
      {
        onSuccess: ({ exists, errors }) => {
          if (!exists) return;
          console.log(exists)
          setRows((prev) =>
            prev.map((row) =>
              exists[row.name]
                ? {
                    ...row,
                    has_error: true,
                    is_exist: true,
                    error_message: errors?.[row.name] ?? `Part number already exists: "${row.name}"`,
                  }
                : row
            )
          );
        },
        onError: (error) => console.error(error),
      }
    );

    setOpenConfirmation(false);
  };

  useEffect(() => { console.log(uploadedRows); }, [uploadedRows]);

  // ── Shared select portal styles ────────────────────────────────────────────
  const portalStyles = {
    styles: { menuPortal: (base: any) => ({ ...base, zIndex: 9999 }) },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>

        <HStack justify="space-between">
          <Heading as="h4" size="md">Part Number Bulk Upload</Heading>
          <Button
            leftIcon={<LuDownload />} colorScheme="blue" size="sm"
            onClick={() => handleDownload(import.meta.env.VITE_SPARES_SAMPLE_CSV)}
          >
            Download Sample
          </Button>
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
          <Formiz autoForm connect={partNumberForm}>
            <HStack justify="space-between" mb={1}>
              <HStack ml="auto">
                <Button leftIcon={<LuPlus />} colorScheme="blue" size="sm" onClick={addNewRow} isDisabled={dropdownLoading}>
                  Add Row
                </Button>
              </HStack>
            </HStack>

            <LoadingOverlay isLoading={dropdownLoading || checkExisting.isLoading || bulkUpload.isLoading}>
              <>
                <style>{`
                  @keyframes blinkRowBg {
                    0%, 100% { background-color: #ffb5b5; }
                    50%       { background-color: #f4d9d9; }
                  }
                `}</style>
                <TableContainer rounded="md" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md" maxWidth="100%">
                  <Table variant="simple" size="sm">

                    <Thead bg="gray.500">
                      <Tr>
                        <Th color="white">#</Th>
                        <ColHeader label="Part Number" />
                        <ColHeader label="Description" />
                        <ColHeader label="Unit of Measure" />
                        <ColHeader label="Spare Type" />
                        <OptHeader label="Spare Model" />
                        <ColHeader label="HSC Code" />
                        <OptHeader label="ATA" />
                        <OptHeader label="Manufacturer" />
                        <OptHeader label="Cage Code" />
                        <ColHeader label="Shelf Life" />
                        <OptHeader label="Total Shelf Life" />
                        <ColHeader label="LLP" />
                        <ColHeader label="Serialized" />
                        <ColHeader label="DG" />
                        <OptHeader label="UN" />
                        <OptHeader label="Remarks" />
                        <Th color="white" isNumeric>Action</Th>
                      </Tr>
                    </Thead>

                    <Tbody>
                      {uploadedRows.length === 0 ? (
                        <Tr>
                          <Td colSpan={18} textAlign="center" bg="white">No records</Td>
                        </Tr>
                      ) : (
                        uploadedRows.map((item: any, index: number) => {
                          const k          = `${fileKey}_${index + 1}`;
                          const isExisting = item.is_exist === true;
                          const isDG       = item.is_dg === 'true' || item.is_dg === true;
                          const isShelfLife = item.is_shelf_life === 'true' || item.is_shelf_life === true;

                          return (
                            <Tr
                              key={index}
                              sx={item.has_error ? { '& td': { animation: 'blinkRowBg 1.2s ease-in-out infinite' } } : {}}
                            >
                              {/* Row number / error indicator */}
                              <Td>
                                {item.has_error ? (
                                  <Tooltip hasArrow label={item.error_message} placement="right" bg="red.500" color="white" fontSize="xs" borderRadius="md">
                                    <Text as="span" fontWeight="bold" color="red.500" cursor="pointer">
                                      <LuInfo style={{ display: 'inline' }} />
                                    </Text>
                                  </Tooltip>
                                ) : index + 1}
                              </Td>

                              {/* Part Number */}
                              <Td>
                                <FieldInput key={`name_${k}`} name={`name_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="Part number" maxLength={50} type="all-capital" defaultValue={item.name ?? ''} onValueChange={(v) => handleInputChange(v, 'name', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Description */}
                              <Td>
                                <FieldInput key={`description_${k}`} name={`description_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="Description" maxLength={50} type="all-capital" defaultValue={item.description ?? ''} onValueChange={(v) => handleInputChange(v, 'description', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Unit of Measure */}
                              <Td>
                                <FieldSelect key={`uom_${k}`} name={`unit_of_measure_id_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="UOM" options={unitOfMeasureOptions} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.unit_of_measure_id?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'unit_of_measure_id', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Spare Type */}
                              <Td>
                                <FieldSelect key={`spare_type_${k}`} name={`spare_type_id_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="Spare type" options={spareTypeOptions} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.spare_type_id?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'spare_type_id', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Spare Model */}
                              <Td>
                                <FieldSelect key={`spare_model_${k}`} name={`spare_model_id_${index + 1}`} size="sm" placeholder="Spare model" options={spareModelOptions} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.spare_model_id?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'spare_model_id', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* HSC Code */}
                              <Td>
                                <FieldSelect key={`hsc_${k}`} name={`hsc_code_id_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="HSC code" options={hscCodeOptions} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.hsc_code_id?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'hsc_code_id', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* ATA */}
                              <Td>
                                <FieldInput key={`ata_${k}`} name={`ata_${index + 1}`} size="sm" placeholder="ATA" type="integer" maxLength={12} defaultValue={item.ata ?? ''} onValueChange={(v) => handleInputChange(v, 'ata', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Manufacturer */}
                              <Td>
                                <FieldInput key={`mfr_${k}`} name={`manufacturer_name_${index + 1}`} size="sm" placeholder="Manufacturer" type="alpha-numeric-with-space" maxLength={40} defaultValue={item.manufacturer_name ?? ''} onValueChange={(v) => handleInputChange(v, 'manufacturer_name', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Cage Code */}
                              <Td>
                                <FieldInput key={`cage_${k}`} name={`cage_code_${index + 1}`} size="sm" placeholder="Cage code" type="alpha-numeric" maxLength={40} defaultValue={item.cage_code ?? ''} onValueChange={(v) => handleInputChange(v, 'cage_code', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Shelf Life */}
                              <Td>
                                <FieldSelect key={`shelf_${k}`} name={`is_shelf_life_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="Shelf life" options={BOOL_OPTIONS} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.is_shelf_life?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'is_shelf_life', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Total Shelf Life */}
                              <Td>
                                <FieldInput key={`tsl_${k}`} name={`total_shelf_life_${index + 1}`} size="sm" placeholder="Total shelf life" type="integer" maxLength={5} required={!item.has_error && isShelfLife ? 'Required' : ''} defaultValue={item.total_shelf_life ?? ''} onValueChange={(v) => handleInputChange(v, 'total_shelf_life', index)} isDisabled={isExisting || !isShelfLife} />
                              </Td>

                              {/* LLP */}
                              <Td>
                                <FieldSelect key={`llp_${k}`} name={`is_llp_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="LLP" options={BOOL_OPTIONS} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.is_llp?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'is_llp', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Serialized */}
                              <Td>
                                <FieldSelect key={`serial_${k}`} name={`is_serialized_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="Serialized" options={BOOL_OPTIONS} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.is_serialized?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'is_serialized', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* DG */}
                              <Td>
                                <FieldSelect key={`dg_${k}`} name={`is_dg_${index + 1}`} size="sm" required={!item.has_error && 'Required'} placeholder="DG" options={BOOL_OPTIONS} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.is_dg?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'is_dg', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* UN */}
                              <Td>
                                <FieldSelect key={`un_${k}`} name={`un_id_${index + 1}`} size="sm" placeholder="UN" options={unOptions} required={!item.has_error && isDG ? 'Required' : ''} menuPortalTarget={document.body} selectProps={portalStyles} defaultValue={item.un_id?.toString() ?? ''} onValueChange={(v) => handleInputChange(v, 'un_id', index)} isDisabled={isExisting || !isDG} />
                              </Td>

                              {/* Remarks */}
                              <Td>
                                <FieldInput key={`remarks_${k}`} name={`remarks_${index + 1}`} size="sm" placeholder="Remarks" maxLength={50} defaultValue={item.remarks ?? ''} onValueChange={(v) => handleInputChange(v, 'remarks', index)} minW={'120px'} isDisabled={isExisting} />
                              </Td>

                              {/* Delete */}
                              <Td isNumeric>
                                <IconButton aria-label="Delete Row" icon={<DeleteIcon />} colorScheme="red" size="sm" onClick={() => deleteRow(index)}/>
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
              <Button type="button" colorScheme="red" onClick={() => navigate('/spares-master')} isDisabled={dropdownLoading}>
                Go to Master
              </Button>
              <Button
                type="submit" colorScheme="brand"
                isDisabled={uploadedRows.length === 0 || dropdownLoading || bulkUpload.isLoading}
                isLoading={bulkUpload.isLoading}
              >
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

export default SpareBulkUpload;