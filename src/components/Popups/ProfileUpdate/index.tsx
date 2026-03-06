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
import { isEmail } from '@formiz/validations';

import { FieldInput } from '@/components/FieldInput';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { useUpdateProfile } from '@/services/profile/services';

type ModalPopupProps = {
  isOpen: boolean;
  userInfo: TODO;
  onClose: () => void;
};

export const ProfileUpdateModal = ({
  isOpen,
  onClose,
  userInfo,
}: ModalPopupProps) => {
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();
  const profileForm = useForm({
    onValidSubmit: (values) => {
      const payload = {
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        department_id: userInfo.department_id,
        role_id: userInfo.role_id,
        email: values.email,
        phone: values.phone,
      };

      updateProfile.mutate(payload);
    },
  });

  const updateProfile = useUpdateProfile({
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
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign={'center'}>
          <Text fontSize="md" fontWeight="bold">
            Profile Update Form
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box borderRadius={4}>
            <Stack spacing={2} bg={'white'} borderRadius={'md'}>
              <Formiz autoForm connect={profileForm}>
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
                          type="text"
                          label="User Name"
                          name="username"
                          placeholder="User name"
                          size={'sm'}
                          defaultValue={userInfo?.username ?? ''}
                          required={'User name is required'}
                          isReadOnly={true}
                        />

                        <FieldInput
                          type="text"
                          label="First Name"
                          name="first_name"
                          placeholder="First name"
                          size={'sm'}
                          defaultValue={userInfo?.first_name ?? ''}
                          required={'First name is required'}
                        />

                        <FieldInput
                          type="text"
                          label="Last Name"
                          name="last_name"
                          placeholder="Last name"
                          size={'sm'}
                          defaultValue={userInfo?.last_name ?? ''}
                          required={'Last name is required'}
                        />

                        <FieldInput
                          type="email"
                          onKeyDown={(e) => {
                            if (e.key === ' ') {
                              e.preventDefault();
                            }
                          }}
                          label="Email"
                          name="email"
                          placeholder="example@gmail.com"
                          size={'sm'}
                          defaultValue={userInfo?.email ? userInfo?.email.toLowerCase() : ''}
                          validations={[
                            {
                              handler: isEmail(),
                              message: 'Invalid email',
                            },
                          ]}
                          required={'Email is required'}
                          maxLength={100}
                        />

                        <FieldInput
                          type="phone-number"
                          label="Phone number"
                          name="phone"
                          placeholder="0123456789"
                          size={'sm'}
                          defaultValue={userInfo?.phone ?? ''}
                          required={'Phone Number is required'}
                          maxLength={15}
                        />
                      </Stack>

                      <HStack justifyContent={'center'} mt={2}>
                        <HStack spacing={2} align="center" marginTop={'1rem'}>
                          <Button
                            colorScheme="green"
                            mx={'auto'}
                            size={'sm'}
                            type="submit"
                            isLoading={updateProfile.isLoading}
                          >
                            Submit
                          </Button>

                          <Button
                            colorScheme="red"
                            mx={'auto'}
                            size={'sm'}
                            onClick={onClose}
                            isDisabled={updateProfile.isLoading}
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

export default ProfileUpdateModal;
