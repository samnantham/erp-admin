import React, { useEffect, useState } from 'react';

import {
  Button,
  HStack,
  IconButton,
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
import { isEmail } from '@formiz/validations';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

import { useQueryClient } from 'react-query';
import { FieldInput } from '@/components/FieldInput';
import { FieldEmailInput } from '@/components/FieldEmailInput';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import {
  useCreateDepartment,
  useUpdateDepartment,
} from '@/services/user-access/department/services';

type ModalFormProps = {
  isOpen: boolean;
  isEdit?: boolean;
  existInfo?: any;
  onClose: () => void;
};

const ModalForm = ({
  isOpen,
  isEdit = false,
  existInfo,
  onClose,
}: ModalFormProps) => {
  const queryClient = useQueryClient();
  const initialRef = React.useRef(null);
  const [formRefreshKey, setFormRefreshKey] = useState(0);
  const [emails, setEmails] = useState<any>([{ email: '' }]);
  const addNewEmail = () => {
    const newEmail = { email: '' };
    setEmails((prevRows: any) => [...prevRows, newEmail]);
  };

  const handleCloseModal = () => {
    setEmails([{ email: '' }]);
    onClose();
  };

  const deleteEmail = (index: number) => {
    let updatedEmails = [...emails];
    updatedEmails.splice(index, 1);
    setEmails(updatedEmails);
  };

  const handleInputChange = (value: any, index: number) => {
    const updatedData = [...emails];
    updatedData[index] = { ...updatedData[index], email: value };
    setEmails(updatedData);
  };

  const createItem = useCreateDepartment();
  const updateItem = useUpdateDepartment();

  const removeEmailProperties = (obj: any) => {
    return Object.keys(obj).reduce((acc: any, key) => {
      if (!key.includes('email_')) {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  };

  const form = useForm({
    onValidSubmit(values) {
      const payload: any = removeEmailProperties(values);
      if (isEdit) {
        payload.id = existInfo?.id;
        updateItem.mutate(payload, {
          onSuccess: () => {
            queryClient.invalidateQueries(['departmentIndex', 'departmentList']);
            onClose();
          },
        });
      } else {
        createItem.mutate(payload, {
          onSuccess: () => {
            queryClient.invalidateQueries(['departmentIndex', 'departmentList']);
            onClose();
          },
        });
      }
    },
  });
  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });
  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: ['name', 'emails'],
  });


  useEffect(() => {

    if (isOpen && existInfo) {
      if (isEdit && existInfo?.emails) {
        const emailArray = existInfo.emails.split(',').map((e: string) => ({ email: e.trim() }));
        console.log(emailArray)
        setEmails(emailArray);
      } else {
        setEmails([{ email: '' }]);
      }
      setInitialValues(existInfo);
      form.setValues(existInfo);
    }
  }, [isOpen, existInfo]);

  useEffect(() => {
    if (isOpen) {
      setFormRefreshKey((prev) => prev + 1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const email_items = emails.map((email: any) => email.email);
      form.setValues({
        [`emails`]: email_items
          .filter((item: string) => item.trim() !== '')
          .join(', '),
      });
    }
  }, [isOpen, emails]);

  return (
    <Modal
      initialFocusRef={initialRef}
      isOpen={isOpen}
      onClose={handleCloseModal}
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent>
        <Formiz autoForm connect={form}>
          <ModalHeader>{isEdit ? 'Update ' : 'Add '} Department</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Stack spacing={4} direction={{ base: 'column' }}>
              <FieldInput
                name={`emails`}
                size={'sm'}
                sx={{ display: 'none' }}
              />

              <FieldInput
                name="name"
                placeholder="Enter Department Name"
                required={'Department Name required'}
                size={'sm'}
                defaultValue={existInfo?.name || ''}
                maxLength={10}
                key={`email_${formRefreshKey}`}
              />
            </Stack>

            <Stack spacing={4} direction={{ base: 'column' }}>
              <HStack justify={'space-between'} mt={3}>
                <Text fontSize="lg" fontWeight="600">
                  Emails
                </Text>
                <HStack ml="auto">
                  <Button
                    leftIcon={<LuPlus />}
                    colorScheme="green"
                    size={'xs'}
                    onClick={addNewEmail}
                  >
                    Add
                  </Button>
                </HStack>
              </HStack>
              {emails.map((item: any, index: number) => (
                <FieldEmailInput
                  key={`email_${formRefreshKey}_${index + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
                  name={`email_${index + 1}`}
                  placeholder="example@gmail.com"
                  defaultValue={item.email}
                  required={item.email !== '' ? 'Email is required' : ''}
                  size={'sm'}
                  onValueChange={(value) => handleInputChange(value, index)}
                  validations={[
                    {
                      handler: isEmail(),
                      message: 'Invalid email',
                    },
                  ]}
                  maxLength={100}
                  rightElement={
                    <IconButton
                      aria-label="Delete"
                      color={'red'}
                      icon={<LuTrash2 />}
                      size={'sm'}
                      onClick={() => deleteEmail(index)}
                      isDisabled={emails.length <= 1}
                    />
                  }
                />
              ))}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              colorScheme="brand"
              mr={3}
              isLoading={createItem.isLoading || updateItem.isLoading}
              isDisabled={
                createItem.isLoading ||
                updateItem.isLoading ||
                (isEdit ? !isFormValuesChanged : false)
              }
            >
              {isEdit ? 'Update ' : 'Create'}
            </Button>
            <Button onClick={handleCloseModal}>Cancel</Button>
          </ModalFooter>
        </Formiz>
      </ModalContent>
    </Modal>
  );
};

export default ModalForm;
