import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { useQueryClient } from 'react-query';

import { FieldInput } from '@/components/FieldInput';
import { useToastError } from '@/components/Toast';
import { useLogin } from '@/services/auth/services';

const Login: React.FC = () => {
  const queryCache = useQueryClient();
  const toastError = useToastError();

  const login = useLogin({
    onSuccess: () => {
      queryCache.clear();
    },
    onError: () => {
      toastError({
        title: 'Error',
        description: 'Invalid username or password',
      });
    },
  });

  const form = useForm<{ username: string; password: string }>({
    onValidSubmit: (values) => {
      login.mutate(values);
    },
  });
  return (
    <Flex minH={'100vh'} align={'center'} justify={'center'} bg={'gray.50'}>
      <Stack
        spacing={8}
        mx={'auto'}
        py={12}
        px={6}
        minW={{
          base: '100%',
          md: '80%',
          lg: 'lg',
        }}
      >
        <Box rounded={'lg'} bg={'white'} boxShadow={'lg'} p={8}>
          <Stack spacing={4}>
            <Center>
              <Image
                src="/logo.png"
                alt="Logo"
                width="100px"
                height={32}
                w={'auto'}
              />
            </Center>
            <Stack spacing={0}>
              <Heading textAlign={'center'} fontSize={'2xl'}>
                Sign In
              </Heading>
              <Text textAlign={'center'} color={'gray.500'}>
                Login to your account to continue
              </Text>
            </Stack>

            <Formiz autoForm connect={form}>
              <Stack spacing={8}>
                <FieldInput
                  name="username"
                  required="Username is required"
                  label="Username"
                  formatValue={(v) => v?.toString()?.toLowerCase().trim()}
                  placeholder="Enter Username"
                />
                <FieldInput
                  name="password"
                  type="password"
                  label="Password"
                  required="Password is required"
                  placeholder="Password"
                />
                <Flex>
                  <Button
                    isLoading={login.isLoading || login.isSuccess}
                    isDisabled={form.isSubmitted && !form.isValid}
                    type="submit"
                    variant="@primary"
                    size="lg"
                    flex={1}
                  >
                    Log In
                  </Button>
                </Flex>
              </Stack>
            </Formiz>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
};

export default Login;
