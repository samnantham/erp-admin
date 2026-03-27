import { useEffect, useState } from 'react';

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';

import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { FieldUpload } from '@/components/FieldUpload';
import LoadingOverlay from '@/components/LoadingOverlay';

import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useSavePartNumber, usePartNumberDropdowns } from "@/services/master/spare/service";

type PartNumberModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  createdInputValue?: string;
  onSuccess?: (createdValue?: unknown) => void;
};

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


export function PartNumberModal({
  isOpen,
  onClose,
  createdInputValue,
  onSuccess
}: PartNumberModalProps) {
  const { data: uNList } = useSubmasterItemIndex("uns", {});
  const unItems: TODO[] = uNList?.data ?? [];

  const { data: dropdownData, isLoading: dropdownLoading } = usePartNumberDropdowns();
  const unitOfMeasureOptions = dropdownData?.unit_of_measures ?? [];
  const spareTypeOptions = dropdownData?.spare_types ?? [];
  const spareModelOptions = dropdownData?.spare_models ?? [];
  const hscCodeOptions = dropdownData?.hsc_codes ?? [];
  const unOptions = dropdownData?.uns ?? [];

  const handleClose = () => {
    onClose(false, 0);
  };

  const handleUNChange = (unId: any) => {
    const selected = unItems?.find((u) => String(u.id) === String(unId));
    console.log(selected)
    form.setValues({
      un_description: selected?.description?.toString() ?? "",
      un_class: selected?.un_class?.toString() ?? "",
    });
  };

  const [resetKey, setResetKey] = useState(0);
  const saveEndpoint = useSavePartNumber({
    onSuccess: ({ data }) => {
      if (onSuccess) {
        onSuccess(data);
      }
      onClose?.(true, data?.id);
    },
  });

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

      saveEndpoint.mutate(payload);
    },
  });

  const fields = useFormFields({
    connect: form,
  });

  useEffect(() => {
    if (isOpen) {
      setResetKey((prevKey) => prevKey + 1);
    }
  }, [isOpen]);
  const isSaving = saveEndpoint.isLoading;
  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxWidth="65vw">
        <div onSubmit={(e) => e.stopPropagation()}>
          <Formiz autoForm connect={form}>
            <ModalHeader>Add New Spare</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <LoadingOverlay isLoading={dropdownLoading}>
                <Stack spacing={4}>
                  {/* Part Number + Description */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldInput label="Part Number" key={`name_${resetKey}`} name="name" placeholder="Enter part number" required="Part Number is required" type="all-capital" maxLength={50} defaultValue={createdInputValue ? createdInputValue : ''} />
                    <FieldInput label="Description" key={`description_${resetKey}`} name="description" placeholder="Enter description" required="Description is required" type="all-capital" maxLength={50} />
                  </Stack>

                  {/* UOM + ATA + Manufacturer + Cage Code */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldSelect label="Unit of Measure" key={`unit_of_measure_id_${resetKey}`} name="unit_of_measure_id" placeholder="Select..." options={unitOfMeasureOptions} required="Unit of Measure is required" selectProps={{ isLoading: dropdownLoading }} />
                    <FieldInput label="ATA" name="ata" key={`ata_${resetKey}`} placeholder="Enter ATA" type="integer" maxLength={12} />
                    <FieldInput label="Manufacturer" key={`manufacturer_name_${resetKey}`} name="manufacturer_name" placeholder="Enter manufacturer" type="alpha-numeric-with-space" maxLength={40} />
                    <FieldInput label="Cage Code" key={`cage_code_${resetKey}`} name="cage_code" placeholder="Enter cage code" type="alpha-numeric" maxLength={40} />
                  </Stack>

                  {/* Spare Type + Model + HSC Code */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldSelect label="Spare Type" name="spare_type_id" key={`spare_type_id_${resetKey}`} placeholder="Select..." options={spareTypeOptions} required="Spare Type is required" selectProps={{ isLoading: dropdownLoading }} />
                    <FieldSelect label="Spare Model" name="spare_model_id" key={`spare_model_id_${resetKey}`} placeholder="Select..." options={spareModelOptions} selectProps={{ isLoading: dropdownLoading }} />
                    <FieldSelect label="HSC Code" name="hsc_code_id" key={`hsc_code_id_${resetKey}`} placeholder="Select..." options={hscCodeOptions} required="HSC Code is required" selectProps={{ isLoading: dropdownLoading }} />
                  </Stack>

                  {/* Shelf Life */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldSelect label="Shelf Life" key={`is_shelf_life_${resetKey}`} name="is_shelf_life" placeholder="Select..." required="Shelf Life is required" options={BOOL_OPTIONS} onValueChange={(v) => { if (v === "false") form.setValues({ total_shelf_life: "" }); }} />
                    <FieldInput label="Total Shelf Life" key={`total_shelf_life_${resetKey}`} name="total_shelf_life" placeholder="Enter total shelf life" type="integer" maxLength={5} required={fields.is_shelf_life?.value === "true" ? "Total Shelf Life is required" : ""} isDisabled={fields.is_shelf_life?.value !== "true"} />
                  </Stack>

                  {/* LLP + Serialized + DG */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldSelect label="LLP" key={`is_llp_${resetKey}`} name="is_llp" placeholder="Select..." required="LLP is required" options={BOOL_OPTIONS} />
                    <FieldSelect label="Serialized" key={`is_serialized_${resetKey}`} name="is_serialized" placeholder="Select..." required="Serialized is required" options={BOOL_OPTIONS} />
                    <FieldSelect label="DG" key={`is_dg_${resetKey}`} name="is_dg" placeholder="Select..." required="DG is required" options={BOOL_OPTIONS} onValueChange={(v) => { if (v === "false") form.setValues({ un_id: "" }); }} />
                  </Stack>

                  {/* UN — shown only when DG = Yes */}
                  {fields.is_dg?.value === "true" && (
                    <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                      <FieldSelect label="UN" key={`un_id_${resetKey}`} name="un_id" placeholder="Select..." required="UN is required" options={unOptions} selectProps={{ isLoading: dropdownLoading }} onValueChange={handleUNChange} />
                      <FieldInput label="UN Description" key={`un_description_${resetKey}`} name="un_description" placeholder="UN Description" isDisabled />
                      <FieldInput label="UN Class" key={`un_class_${resetKey}`} name="un_class" placeholder="UN Class" isDisabled />
                    </Stack>
                  )}

                  {/* Uploads */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldUpload label="MSDS" name="msds" placeholder="Upload MSDS" key={`msds_${resetKey}`} />
                    <FieldUpload label="IPC Reference" name="ipc_ref" placeholder="Upload IPC Reference" key={`ipc_ref_${resetKey}`} />
                  </Stack>
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldUpload label="Picture" name="picture" placeholder="Upload Picture" key={`picture_${resetKey}`} />
                    <FieldUpload label="X-Ref" name="xref" placeholder="Upload X-Ref" key={`xref_${resetKey}`} />
                  </Stack>

                  {/* Remarks */}
                  <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                    <FieldTextarea label="Remarks" name="remarks" placeholder="Enter remarks" maxLength={50} key={`remarks_${resetKey}`} />
                  </Stack>
                </Stack>
              </LoadingOverlay>
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="red" mr={3} onClick={handleClose}>
                Close
              </Button>

              <Button
                type="submit"
                colorScheme="brand"
                isLoading={isSaving}
                disabled={
                  !form.isValid || isSaving || dropdownLoading
                }
              >
                Add New Spare
              </Button>
            </ModalFooter>
          </Formiz>
        </div>
      </ModalContent>
    </Modal>
  );
}

export default PartNumberModal;
