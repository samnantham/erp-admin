import { ChevronRightIcon } from '@chakra-ui/icons';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  HStack,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { isEmail } from '@formiz/validations';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { Link, useNavigate } from 'react-router-dom';

import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { countryOptions } from '@/constants';
import { useCreateWarehouse } from '@/services/submaster/warehouse/services';

const WarehouseCreate = () => {
  const navigate = useNavigate();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();

  const createWarehouse = useCreateWarehouse({
    onSuccess: ({ message }) => {
      toastSuccess({
        title: 'Warehouse created successfully',
        description: message,
      });
      navigate('/submaster/warehouse');
    },
    onError: (error) => {
      toastError({
        title: 'Failed to create Warehouse',
        description: error.response?.data.message,
      });
    },
  });

  const form = useForm({
    onValidSubmit: (values) => {
      // Destructure mandatory fields directly
      const {
        name,
        consignee_name,
        address,
        city,
        state,
        zip_code,
        country,
        phone,
        fax,
        email,
        remarks,
        ...optionalValues
      } = values;

      // Construct the final payload, excluding null or undefined optional fields and empty quality_certificates
      const payload: any = {
        name,
        consignee_name,
        address,
        city,
        state,
        zip_code,
        country,
        phone,
        fax,
        email,
        remarks,
        ...Object.fromEntries(
          Object.entries(optionalValues).filter(
            ([_, value]) => value !== null && value !== ''
          )
        ),
      };
      // console.log(payload);
      // Assuming you have a function to make the API call
      createWarehouse.mutate(payload);
    },
  });

  return (
    <SlideIn>
      <Stack pl={2} spacing={2}>
        <HStack justify={'space-between'}>
          <Stack spacing={0}>
            <Breadcrumb
              fontWeight="medium"
              fontSize="sm"
              separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
            >
              <BreadcrumbItem color={'brand.500'}>
                <BreadcrumbLink as={Link} to="/submaster/warehouse">
                  Submaster
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem isCurrentPage color={'gray.500'}>
                <BreadcrumbLink>Add New Warehouse</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading as="h4" size={'md'}>
              Add New warehouse
            </Heading>
          </Stack>
          <ResponsiveIconButton
            variant={'@primary'}
            icon={<HiArrowNarrowLeft />}
            size={'sm'}
            fontWeight={'thin'}
            onClick={() => navigate(-1)}
          >
            Back
          </ResponsiveIconButton>
        </HStack>

        <Stack
          spacing={2}
          p={4}
          bg={'white'}
          borderRadius={'md'}
          boxShadow={'md'}
        >
          <Text fontSize={'md'} fontWeight={'700'}>
            Warehouses
          </Text>

          <Formiz autoForm connect={form}>
            <Stack spacing={2}>
              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput
                  label={'Name'}
                  name={'name'}
                  required={'Name is required'}
                  placeholder="Enter Name"
                  type="all-capital"
                  maxLength={15}
                />

                <FieldInput
                  label={'Consignee Name'}
                  name={'consignee_name'}
                  required={'Consignee Name is required'}
                  placeholder="Enter Consignee Name"
                />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldTextarea
                  label="Address"
                  name="address"
                  placeholder="Enter Address"
                  required={'Address is required'}
                  maxLength={100}
                />
              </Stack>
              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput
                  label={'City'}
                  name={'city'}
                  placeholder="Enter city"
                  maxLength={40}
                />
                <FieldInput
                  label={'State'}
                  name={'state'}
                  placeholder="Enter State"
                  maxLength={40}
                  type={'alpha-with-space'}
                />

                <FieldSelect
                  label={'Country'}
                  name={'country'}
                  placeholder="Enter Country"
                  required={'Country is required'}
                  options={countryOptions}
                />

                <FieldInput
                  label={'Zipcode'}
                  name={'zip_code'}
                  placeholder="Enter Zipcode"
                  maxLength={8}
                />
              </Stack>
              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldInput
                  label={'Phone Number'}
                  name={'phone'}
                  required={'Phone Number is required'}
                  placeholder="Enter Phone Number"
                  type="phone-number"
                  maxLength={15}
                />

                <FieldInput
                  label={'Email'}
                  name={'email'}
                  placeholder="Enter Email"
                  maxLength={40}
                  validations={[
                    {
                      handler: isEmail(),
                      message: 'Invalid email',
                    },
                  ]}
                />

                <FieldInput
                  label={'Fax No'}
                  name={'fax'}
                  placeholder="Enter Fax No"
                  type="phone-number"
                  maxLength={15}
                />
              </Stack>
              <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                <FieldTextarea
                  label="Remarks"
                  name="remarks"
                  placeholder="Enter Remarks"
                  maxLength={100}
                />
              </Stack>
              <Button
                type="submit"
                colorScheme="brand"
                mx={'auto'}
                mt={4}
                isLoading={createWarehouse.isLoading}
                disabled={createWarehouse.isLoading || !form.isValid}
              >
                Add New Warehouse
              </Button>
            </Stack>
          </Formiz>
        </Stack>
      </Stack>
    </SlideIn>
  );
};

export default WarehouseCreate;