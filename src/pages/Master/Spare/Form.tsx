import { useState, useEffect } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Button, HStack, Heading, Stack,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { FieldUpload } from "@/components/FieldUpload";
import { FieldTextarea } from "@/components/FieldTextarea";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useSavePartNumber, usePartNumberDetails, usePartNumberDropdowns } from "@/services/master/spare/service";

// ─── Constants ────────────────────────────────────────────────────────────────

const BOOL_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const FORM_KEYS = [
  "name", "description", "ata", "unit_of_measure_id",
  "spare_type_id", "spare_model_id", "hsc_code_id",
  "manufacturer_name", "cage_code",
  "is_shelf_life", "total_shelf_life", "is_llp", "is_serialized", "is_dg",
  "un_id", "msds", "ipc_ref", "picture", "xref", "remarks",
];

// ─── Component ────────────────────────────────────────────────────────────────

export const SpareForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string; }>();
  const isEdit = !!id;

  const { data: uNList } = useSubmasterItemIndex("uns", {});
  const unItems: TODO[] = uNList?.data ?? [];

  const { data: dropdownData, isLoading: dropdownLoading } = usePartNumberDropdowns();
  const unitOfMeasureOptions = dropdownData?.unit_of_measures ?? [];
  const spareTypeOptions = dropdownData?.spare_types ?? [];
  const spareModelOptions = dropdownData?.spare_models ?? [];
  const hscCodeOptions = dropdownData?.hsc_codes ?? [];
  const unOptions = dropdownData?.uns ?? [];

  const { data: spareData, isLoading: infoLoading } = usePartNumberDetails(id, { enabled: !!id });
  const saveEndpoint = useSavePartNumber();

  const form = useForm({
    onValidSubmit: (values) => {
      const payload: any = Object.fromEntries(FORM_KEYS.map((key) => [key, values[key]]));

      // Transform boolean strings and conditional fields
      payload.is_shelf_life = values.is_shelf_life === "true";
      payload.is_llp = values.is_llp === "true";
      payload.is_serialized = values.is_serialized === "true";
      payload.is_dg = values.is_dg === "true";
      payload.total_shelf_life = values.is_shelf_life === "true" ? Number(values.total_shelf_life) : null;
      payload.un_id = values.is_dg === "true" ? values.un_id : null;

      saveEndpoint.mutate(
        isEdit ? { id, ...payload } : payload,
        { onSuccess: () => navigate("/spare-management/master") }
      );
    },
  });

  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });

  const handleUNChange = (unId: any) => {
    const selected = unItems?.find((u) => String(u.id) === String(unId));
    console.log(selected)
    form.setValues({
      un_description: selected?.description?.toString() ?? "",
      un_class: selected?.un_class?.toString() ?? "",
    });
  };

  useEffect(() => {
    if (!spareData?.data) return;
    const s = spareData.data;
    const values = Object.fromEntries(FORM_KEYS.map((key) => [key, (s as any)[key]]));

    // Boolean fields need to be strings for FieldSelect
    values.is_shelf_life = String(s.is_shelf_life);
    values.is_llp = String(s.is_llp);
    values.is_serialized = String(s.is_serialized);
    values.is_dg = String(s.is_dg);
    values.un_id = null;
    if(s.is_dg){
      values.un_id = s.un_id;
    }

    setInitialValues(values);
    form.setValues(values);
  }, [spareData]);

  useEffect(() => {
    if (!isEdit) return;              
    if (!unItems?.length) return;  
    if (!spareData?.data) return;

    const s = spareData.data;

    if (s.is_dg && s.un_id) {
      handleUNChange(s.un_id);
    }

  }, [unItems, isEdit, spareData]);

  const isFormValuesChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });

  const title = isEdit ? "Edit Spare" : "Add New Spare";
  const isSaving = saveEndpoint.isLoading;

  return (
    <SlideIn>
      <Stack pl={2} spacing={2}>

        {/* Header */}
        <HStack justify="space-between">
          <Stack spacing={0}>
            <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
              <BreadcrumbItem color="brand.500">
                <BreadcrumbLink as={Link} to="/spares-master">Part Number Master</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage color="gray.500">
                <BreadcrumbLink>{title}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <Heading as="h4" size="md">{title}</Heading>
          </Stack>
          <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />} size="sm" onClick={() => navigate(-1)}>
            Back
          </ResponsiveIconButton>
        </HStack>

        <LoadingOverlay isLoading={dropdownLoading || infoLoading}>
          <Stack spacing={2} p={4} bg="white" borderRadius="md" boxShadow="md">
            <Formiz autoForm connect={form}>

              {/* Part Number + Description */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldInput label="Part Number" name="name" placeholder="Enter part number" required="Part Number is required" type="all-capital" maxLength={50} />
                <FieldInput label="Description" name="description" placeholder="Enter description" required="Description is required" type="all-capital" maxLength={50} />
              </Stack>

              {/* UOM + ATA + Manufacturer + Cage Code */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldSelect label="Unit of Measure" name="unit_of_measure_id" placeholder="Select..." options={unitOfMeasureOptions} required="Unit of Measure is required" selectProps={{ isLoading: dropdownLoading }} />
                <FieldInput label="ATA" name="ata" placeholder="Enter ATA" type="integer" maxLength={12} />
                <FieldInput label="Manufacturer" name="manufacturer_name" placeholder="Enter manufacturer" type="alpha-numeric-with-space" maxLength={40} />
                <FieldInput label="Cage Code" name="cage_code" placeholder="Enter cage code" type="alpha-numeric" maxLength={40} />
              </Stack>

              {/* Spare Type + Model + HSC Code */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldSelect label="Spare Type" name="spare_type_id" placeholder="Select..." options={spareTypeOptions} required="Spare Type is required" selectProps={{ isLoading: dropdownLoading }} />
                <FieldSelect label="Spare Model" name="spare_model_id" placeholder="Select..." options={spareModelOptions} selectProps={{ isLoading: dropdownLoading }} />
                <FieldSelect label="HSC Code" name="hsc_code_id" placeholder="Select..." options={hscCodeOptions} required="HSC Code is required" selectProps={{ isLoading: dropdownLoading }} />
              </Stack>

              {/* Shelf Life */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldSelect label="Shelf Life" name="is_shelf_life" placeholder="Select..." required="Shelf Life is required" options={BOOL_OPTIONS} onValueChange={(v) => { if (v === "false") form.setValues({ total_shelf_life: "" }); }} />
                <FieldInput label="Total Shelf Life" name="total_shelf_life" placeholder="Enter total shelf life" type="integer" maxLength={5} required={fields.is_shelf_life?.value === "true" ? "Total Shelf Life is required" : ""} isDisabled={fields.is_shelf_life?.value !== "true"} />
              </Stack>

              {/* LLP + Serialized + DG */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldSelect label="LLP" name="is_llp" placeholder="Select..." required="LLP is required" options={BOOL_OPTIONS} />
                <FieldSelect label="Serialized" name="is_serialized" placeholder="Select..." required="Serialized is required" options={BOOL_OPTIONS} />
                <FieldSelect label="DG" name="is_dg" placeholder="Select..." required="DG is required" options={BOOL_OPTIONS} onValueChange={(v) => { if (v === "false") form.setValues({ un_id: "" }); }} />
              </Stack>

              {/* UN — shown only when DG = Yes */}
              {fields.is_dg?.value === "true" && (
                <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                  <FieldSelect label="UN" name="un_id" placeholder="Select..." required="UN is required" options={unOptions} selectProps={{ isLoading: dropdownLoading }} onValueChange={handleUNChange} />
                  <FieldInput label="UN Description" name="un_description" placeholder="UN Description" isDisabled />
                  <FieldInput label="UN Class" name="un_class" placeholder="UN Class" isDisabled />
                </Stack>
              )}

              {/* Uploads */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldUpload label="MSDS" name="msds" placeholder="Upload MSDS" />
                <FieldUpload label="IPC Reference" name="ipc_ref" placeholder="Upload IPC Reference" />
              </Stack>
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldUpload label="Picture" name="picture" placeholder="Upload Picture" />
                <FieldUpload label="X-Ref" name="xref" placeholder="Upload X-Ref" />
              </Stack>

              {/* Remarks */}
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldTextarea label="Remarks" name="remarks" placeholder="Enter remarks" maxLength={50} />
              </Stack>

              {/* Actions */}
              <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={6}>
                <Button colorScheme="red" isDisabled={isSaving} onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" colorScheme="green" isLoading={isSaving} isDisabled={isSaving || !form.isValid || (isEdit ? !isFormValuesChanged : false)}>
                  {isEdit ? "Update" : "Submit"}
                </Button>
              </Stack>

            </Formiz>
          </Stack>
        </LoadingOverlay>
      </Stack>
    </SlideIn>
  );
};

export default SpareForm;