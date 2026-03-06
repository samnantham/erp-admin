import { useState } from 'react';

import {
  Box,
  Button,
  Container,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';

import { FieldInput } from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { isStrongPassword } from '@/helpers/customValidation';
import { useUpdatePassword } from '@/services/profile/services';

type ModalPopupProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const PasswordUpdateModal = ({ isOpen, onClose }: ModalPopupProps) => {
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const [new_password, setNewPassword] = useState<any>('');
  const passwordForm = useForm({
    onValidSubmit: (values) => {
      const payload = {
        current_password: values.current_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      };

      updatePassword.mutate(payload);
    },
  });

  const updatePassword = useUpdatePassword({
      onSuccess: ({ message }) => {
        toastSuccess({
          title: 'Profile updated successfully',
          description: message,
        });
        onClose();
        // navigate(0);
      },
      onError: (error) => {
        console.log(error);
        toastError({
          title: 'Failed to update Profile',
          description: error.message,
        });
      },
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      size="xl"
      closeOnEsc={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign={'center'}>
          <Text fontSize="md" fontWeight="bold">
            Password Update Form
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box borderRadius={4}>
            <Stack spacing={2} bg={'white'} borderRadius={'md'}>
              <Formiz autoForm connect={passwordForm}>
                <Container maxW="container.2xl" p={1}>
                  <Stack spacing={2} direction={{ base: 'column', md: 'row' }}>
                    <Box
                      flex="1"
                      rounded={'md'}
                      border={'1px solid'}
                      borderColor={'gray.300'}
                      p={4}
                    >
                      <Stack>
                        <FieldInput
                          type="password"
                          label="Current Password"
                          name="current_password"
                          placeholder="✱✱✱✱✱✱✱✱"
                          size={'sm'}
                          defaultValue={''}
                          required={'Enter your Current Password'}
                        />

                        <FieldInput
                          type="password"
                          label="New Password"
                          name="new_password"
                          placeholder="✱✱✱✱✱✱✱✱"
                          size={'sm'}
                          defaultValue={''}
                          required={'Enter your new Password'}
                          onValueChange={(value) => {
                            setNewPassword(value);
                          }}
                          validations={[isStrongPassword()]}
                        />

                        <FieldInput
                          type="password"
                          label="Confirm Password"
                          name="confirm_password"
                          placeholder="✱✱✱✱✱✱✱✱"
                          size={'sm'}
                          defaultValue={''}
                          required={'Confirm your new Password'}
                          validations={[
                            {
                              handler: (value: TODO) => value === new_password,
                              message: 'Must match your new password',
                              deps: [new_password],
                            },
                            isStrongPassword(),
                          ]}
                        />
                      </Stack>

                      <HStack justifyContent={'center'} mt={2}>
                        <HStack spacing={2} align="center" marginTop={'1rem'}>
                          <Button
                            colorScheme="green"
                            mx={'auto'}
                            size={'sm'}
                            type="submit"
                            isLoading={updatePassword.isLoading}
                          >
                            Submit
                          </Button>

                          <Button
                            colorScheme="red"
                            mx={'auto'}
                            size={'sm'}
                            onClick={onClose}
                            isDisabled={updatePassword.isLoading}
                          >
                            Close
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  </Stack>
                </Container>
              </Formiz>
            </Stack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PasswordUpdateModal;
