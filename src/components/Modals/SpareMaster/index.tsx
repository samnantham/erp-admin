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
  Stack,
  Text,
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { UseQueryResult } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { FieldUpload } from '@/components/FieldUpload';
import LoadingOverlay from '@/components/LoadingOverlay';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { transformToSelectOptions } from '@/helpers/commonHelper';
import { convertToOptions } from '@/helpers/commonHelper';
import UnOptions from '@/pages/Master/Spares/unOptions';
import { useCreateSpare } from '@/services/spare/services';
import { useHscCodeList } from '@/services/submaster/hsc-code/services';
// import { useSpareClassList } from '@/services/submaster/spareclass/services';
import { useSpareModelList } from '@/services/submaster/sparemodel/services';
import { useSpareTypeList } from '@/services/submaster/sparetype/services';
import { useUnitOfMeasureIndex } from '@/services/submaster/unitofmeasure/services';

type QueryData = {
  status: boolean;
  items?: Record<string, string>;
};

interface Payload {
  [key: string]: any;
}

type AddSpareModalProps = {
  isOpen: boolean;
  onClose: (status: boolean, id: any) => void;
  spareName?: string;
};

function AddSpareModal({
  isOpen,
  onClose,
  spareName = '',
}: AddSpareModalProps) {
  const unitOfMeasureList = useUnitOfMeasureIndex({enabled: isOpen});
  const spareTypeList: UseQueryResult<QueryData, unknown> = useSpareTypeList({enabled: isOpen});
  const spareTypeOptions = transformToSelectOptions(spareTypeList.data);

  const spareModelList: UseQueryResult<QueryData, unknown> = useSpareModelList({enabled: isOpen});
  const spareModelOptions = transformToSelectOptions(spareModelList.data);

  // const spareClassList: UseQueryResult<QueryData, unknown> =
  //   useSpareClassList();
  // const spareClassOptions = transformToSelectOptions(spareClassList.data);

  const hscList: UseQueryResult<QueryData, unknown> = useHscCodeList({enabled: isOpen});
  const hscOptions = transformToSelectOptions(hscList.data);

  const handleClose = () => {
    onClose(false, 0);
  };

  const [resetKey, setResetKey] = useState(0);
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();
  const [unitOfMeasureOptions, setUOMOptions] = useState<any>([]);
  const [spareLoading, setSpareSearchLoading] = useState<boolean>(false);

  const allApiDataLoaded = [
    unitOfMeasureList,
    spareTypeList,
    spareModelList,
  ].every((query) => query.isSuccess);

  const createSpare = useCreateSpare({
    onSuccess: ({ id, message }) => {
      toastSuccess({
        title: 'Spare created successfully - ' + id,
        description: message,
      });
      onClose(true, id);
    },
    onError: (error) => {
      toastError({
        title: 'Failed to create spare',
        description: error.response?.data.message,
      });
    },
  });

  const form = useForm({
    onValidSubmit: async (values) => {
      const {
        part_number,
        description,
        unit_of_measure_id,
        ata,
        spare_type_id,
        spare_model_id,
        hsc_code_id,
        is_shelf_life,
        total_shelf_life,
        is_llp,
        is_serialized,
        is_dg,
        un_id,
        // spare_class_id,
        msds,
        ipc_ref,
        xref,
        picture,
        remarks,
        manufacturer_name,
        cage_code,
        ...optionalValues
      } = values;

      const initialPayload: Payload = {
        part_number,
        description,
        unit_of_measure_id: Number(unit_of_measure_id),
        unit_of_measure_group_id: Number(unit_of_measure_id),
        ata,
        spare_type_id: Number(spare_type_id),
        spare_model_id: Number(spare_model_id),
        hsc_code_id: Number(hsc_code_id),
        is_shelf_life: is_shelf_life === 'true' ? true : false,
        total_shelf_life:
          is_shelf_life === 'true' ? Number(total_shelf_life) : null,
        is_llp: is_llp === 'true' ? true : false,
        is_serialized: is_serialized === 'true' ? true : false,
        is_dg: is_dg === 'true' ? true : false,
        un_id: is_dg === 'true' ? Number(un_id) : null,
        // spare_class_id: is_dg === 'true' ? Number(spare_class_id) : null,
        msds,
        ipc_ref,
        xref,
        picture,
        remarks,
        manufacturer_name,
        cage_code,
        ...optionalValues,
      };

      const payload = Object.entries(initialPayload).reduce<Payload>(
        (acc, [key, value]) => {
          if (value !== null && value !== undefined) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      // console.log(payload);
      // Assuming you have a function to make the API call
      createSpare.mutate(payload as any);
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

  useEffect(() => {
    if (unitOfMeasureList.data?.items) {
      setUOMOptions(unitOfMeasureList.data?.items);
    }
  }, [unitOfMeasureList]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent maxWidth="65vw">
        <Formiz autoForm connect={form}>
          <ModalHeader>Add New Spare</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <LoadingOverlay isLoading={!allApiDataLoaded}>
              <Stack spacing={4}>
                <Stack spacing={2}>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldInput
                      key={`part_number_${resetKey}`}
                      label={'Part Number'}
                      name={'part_number'}
                      type={'alpha-numeric-with-special'}
                      maxLength={40}
                      required={'Part Number is required'}
                      placeholder="Enter part number"
                      defaultValue={spareName ? spareName : ''}
                    />
                  </Stack>

                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldInput
                      label={'Description'}
                      name={'description'}
                      required={'Description is required'}
                      placeholder="Enter description"
                      type={'all-capital'}
                      maxLength={40}
                    />

                    <FieldSelect
                      label={'Unit of Measure'}
                      name={'unit_of_measure_id'}
                      required={'Unit of Measure is required'}
                      placeholder="Select unit of measure"
                      options={convertToOptions(unitOfMeasureOptions)}
                      maxLength={6}
                      isCaseSensitive={true}
                      isDisabled={true}
                      className={'disabled-input'}
                      defaultValue={'6'}
                    />
                  </Stack>

                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldInput
                      label={'ATA'}
                      name={'ata'}
                      placeholder="Enter ATA"
                      allowedSpecialChars={['-']}
                      type={'integer'}
                      maxLength={12}
                    />
                    <FieldSelect
                      label={'Type'}
                      name={'spare_type_id'}
                      required={'Type is required'}
                      placeholder="Select type"
                      options={spareTypeOptions}
                      maxLength={12}
                      isCaseSensitive={true}
                      isDisabled={!allApiDataLoaded}
                    />
                  </Stack>

                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldSelect
                      label={'Spare Model'}
                      name={'spare_model_id'}
                      required={'Spare Model is required'}
                      placeholder="Select spare model"
                      options={spareModelOptions}
                      maxLength={12}
                      isCaseSensitive={true}
                      isDisabled={!allApiDataLoaded}
                    />
                    {/* <FieldInput
                    label={'HSC Code'}
                    name={'hsc_code'}
                    required={'HSC Code is required'}
                    placeholder="Enter HSC Code"
                    type={'all-capital'}
                    maxLength={12}
                  /> */}
                    <FieldSelect
                      label="HSC Code"
                      key="hsc_code_id"
                      name="hsc_code_id"
                      required="HSC Code is required"
                      options={[
                        ...(hscOptions ?? []),
                        {
                          value: 'add_new',
                          label: (
                            <Text color="brand.500" textDecoration="underline">
                              + Add HSC Code
                            </Text>
                          ),
                        },
                      ]}
                      isClearable
                      onValueChange={(value) => {
                        console.log(value);
                      }}
                      selectProps={{
                        noOptionsMessage: () => 'No HSC Code found',
                        isLoading: spareLoading,
                        onInputChange: () => {
                          setSpareSearchLoading(true);
                          setTimeout(() => {
                            setSpareSearchLoading(false);
                          }, 500);
                        },
                      }}
                    />
                  </Stack>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldInput
                      label={'Manufacturer'}
                      name={'manufacturer_name'}
                      placeholder="Enter Manufacturer"
                      type={'text'}
                      maxLength={40}
                    />
                    <FieldInput
                      label={'Cage Code'}
                      name={'cage_code'}
                      placeholder="Enter Cage Code"
                      type={'text'}
                      maxLength={40}
                    />
                  </Stack>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldSelect
                      label={'Shelf Life'}
                      name={'is_shelf_life'}
                      required={'Shelf Life is required'}
                      placeholder="Select shelf life"
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                      onValueChange={(value) => {
                        if (value === 'false') {
                          form.setValues({ ['total_shelf_life']: '' });
                        }
                      }}
                    />
                    <FieldInput
                      label={'Total Shelf Life'}
                      name={'total_shelf_life'}
                      required={
                        fields.is_shelf_life?.value === 'true'
                          ? 'Total Shelf Life is required'
                          : ''
                      }
                      type="integer"
                      isDisabled={
                        fields.is_shelf_life?.value === 'false' ||
                        !fields.is_shelf_life?.value
                      }
                      placeholder="Enter Total Shelf Life"
                      maxLength={5}
                    />
                  </Stack>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldSelect
                      label={'LLP'}
                      name={'is_llp'}
                      required={'LLP is required'}
                      placeholder="Select LLP"
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                    <FieldSelect
                      label={'Serialized Item'}
                      name={'is_serialized'}
                      required={'Serialized Item is required'}
                      placeholder="Select"
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                    <FieldSelect
                      label={'DG'}
                      name={'is_dg'}
                      required={'DG is required'}
                      placeholder="Select DG"
                      options={[
                        { value: 'true', label: 'Yes' },
                        { value: 'false', label: 'No' },
                      ]}
                    />
                  </Stack>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <UnOptions
                      un_id={0}
                      is_llp={fields.is_dg?.value === 'true' ? true : false}
                    />
                  </Stack>
                  {/* <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'UN'}
                    name={'un'}
                    placeholder="Enter UN"
                    isDisabled={fields.is_dg?.value === 'false' || !fields.is_dg?.value}
                    type={'all-capital'}
                    maxLength={15}
                  />
                  <FieldSelect
                    label={'Class'}
                    name={'spare_class_id'}
                    placeholder="Enter Class"
                    isDisabled={fields.is_dg?.value === 'false' || !fields.is_dg?.value}
                    options={spareClassOptions}
                    required={
                      fields.is_dg?.value === 'true' ? 'Class is required' : ''
                    }
                    maxLength={15}
                    isCaseSensitive={true}
                    onlyAlphabets={true}
                    className={fields.is_dg?.value === 'true' ? '' : 'disabled-input'}
                  />
                </Stack> */}
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldUpload
                      label={'MSDS'}
                      name={'msds'}
                      placeholder="Upload MSDS"
                    />
                    <FieldUpload
                      label={'IPC Reference'}
                      name={'ipc_ref'}
                      placeholder="Upload IPC Reference"
                    />
                  </Stack>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldUpload
                      label={'Picture'}
                      name={'picture'}
                      placeholder="Upload Picture"
                    />
                    <FieldUpload
                      label={'X-Ref'}
                      name={'xref'}
                      placeholder="Upload X-Ref"
                    />
                  </Stack>
                  <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                    <FieldTextarea
                      label={'Remarks'}
                      name={'remarks'}
                      placeholder="Enter Remarks"
                      validations={[
                        {
                          handler: (value) => {
                            const strValue =
                              value !== undefined ? value.toString() : '';
                            return strValue.length === 100 ? false : true;
                          },
                          message: 'Character limit is 100',
                        },
                      ]}
                      maxLength={100}
                    />
                  </Stack>
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
              isLoading={createSpare.isLoading}
              disabled={
                !form.isValid || createSpare.isLoading || !allApiDataLoaded
              }
            >
              Add New Spare
            </Button>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
}

export default AddSpareModal;
