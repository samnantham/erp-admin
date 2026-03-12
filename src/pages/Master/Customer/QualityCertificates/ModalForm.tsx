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
} from '@chakra-ui/react';
import { Formiz, useForm, useFormFields } from '@formiz/core';
import dayjs from 'dayjs';
import { formatDate } from '@/helpers/commonHelper';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { FieldInput } from '@/components/FieldInput';
import { FieldUpload } from '@/components/FieldUpload';

type ModalFormProps = {
  isOpen: boolean;
  isEdit?: boolean;
  existInfo?: any;
  onClose: (status: boolean, isEdit: boolean, qcData: any) => void;
};

const ModalForm = ({
  isOpen,
  isEdit = false,
  existInfo,
  onClose,
}: ModalFormProps) => {
const modalForm = useForm({
  onValidSubmit(values) {
    handleClose(true, isEdit, {
      certificate_type: values.certificate_type,
      doc_no: values.doc_no,
      validity_date: values.validity_date ? formatDate(values.validity_date) : '',
      issue_date: values.issue_date ? formatDate(values.issue_date) : '',
      doc_url: values.doc_url,
      isNew: true
    });
  },
});

  const fields = useFormFields({ connect: modalForm });

  const handleClose = (status: boolean, isEdit: boolean, qcData: any) => {
    onClose(status, isEdit, qcData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleClose(false, isEdit, null);
      }}
      size="md"
      closeOnOverlayClick={false} closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent maxWidth="45vw">
        <Formiz autoForm connect={modalForm}>
          <ModalHeader>
            {isEdit ? 'Update ' : 'Add '} Quality Certificate
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4}>
              <Stack spacing={2}>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    name={`certificate_type`}
                    label={'QC Type'}
                    placeholder={`Enter QC type`}
                    required={`QC type required`}
                    maxLength={30}
                    size={'sm'}
                    defaultValue={existInfo?.certificate_type || ''}
                    type={'alpha-numeric-with-special'}
                  />
                  <FieldInput
                    label={'QC Document No.'}
                    name={`doc_no`}
                    placeholder={`Enter QC document number`}
                    maxLength={30}
                    size={'sm'}
                    required={`QC Document No required`}
                    defaultValue={existInfo?.doc_no ?? ''}
                    type={'alpha-numeric-with-special'}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldUpload
                    label={'QC Document'}
                    name={`doc_url`}
                    placeholder={`Upload QC document`}
                    size={'sm'}
                    required={`QC document required`}
                    existingFileUrl={existInfo?.doc_url || ''}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldDayPicker
                    label={'QC Issue Date'}
                    name={`issue_date`}
                    placeholder={`Select QC issue date`}
                    disabledDays={{ after: new Date() }}
                    size={'sm'}
                    required={
                      !fields?.issue_date?.value &&
                      !fields?.validity_date?.value
                        ? `Issue date or Validity Date required`
                        : ''
                    }
                    defaultValue={
                      existInfo?.issue_date
                        ? dayjs(existInfo?.issue_date)
                        : undefined
                    }
                  />
                  <FieldDayPicker
                    label={'QC Valid Date'}
                    name={`validity_date`}
                    placeholder={`Select QC expiry date`}
                    disabledDays={{ before: new Date() }}
                    required={
                      !fields?.issue_date?.value &&
                      !fields?.validity_date?.value
                        ? `Issue date or Validity Date required`
                        : ''
                    }
                    size={'sm'}
                    defaultValue={
                      existInfo?.validity_date
                        ? dayjs(existInfo?.validity_date)
                        : undefined
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              colorScheme="brand"
              mr={3}
              onClick={() => {
                modalForm.submit();
              }}
            >
              {isEdit ? 'Update ' : 'Add'}
            </Button>
            <Button
              colorScheme="error"
              onClick={() => {
                handleClose(false, isEdit, null);
              }}
            >
              Cancel
            </Button>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
};

export default ModalForm;
