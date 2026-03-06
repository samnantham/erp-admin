import { useEffect, useState } from 'react';

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
import { Formiz, useForm, useFormFields } from '@formiz/core';
import { isEmail } from '@formiz/validations';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { useQueryClient } from 'react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { FieldTextarea } from '@/components/FieldTextarea';
import { LoaderFull } from '@/components/LoaderFull';
import LoadingOverlay from '@/components/LoadingOverlay';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useToastError, useToastSuccess } from '@/components/Toast';
import { countryOptions } from '@/constants';
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import {
  useUpdateWarehouse,
  useWarehouseDetails,
} from '@/services/submaster/warehouse/services';

const WarehouseEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();
  const queryClient = useQueryClient();

  const { data: details, isLoading: detailsLoading } = useWarehouseDetails(
    Number(id)
  );

  const allApiDataLoaded = !detailsLoading;

  const updateWarehouse = useUpdateWarehouse({
    onSuccess: ({ message }) => {
      toastSuccess({
        title: 'Warehouse updated',
        description: message,
      });
      queryClient.invalidateQueries(['warehouseDetails', Number(id)]);
      navigate('/submaster/warehouse');
    },
    onError: (error) => {
      toastError({
        title: 'Failed to update warehouse',
        description: error.response?.data.message,
      });
    },
  });
  const [initialValues, setInitialValues] = useState<any>(null);

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
        id: Number(id),
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
      updateWarehouse.mutate(payload);
    },
  });

  const fields = useFormFields({ connect: form });

  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: ['name', 'consignee_name', 'address', 'email', 'phone', 'city', 'state', 'country', 'zip_code', 'fax', 'remarks',],
  });

  useEffect(() => {
    if (details?.item) {
      console.log(details);
      const init = {
        name: details?.item?.name ?? '',
        consignee_name: details?.item?.consignee_name ?? '',
        address: details?.item?.address ?? '',
        email: details?.item?.email ?? '',
        city: details?.item?.city ?? '',
        state: details?.item?.state ?? '',
        country: details?.item?.country ?? '',
        zip_code: details?.item?.zip_code ?? '',
        fax: details?.item?.fax ?? '',
        phone: details?.item?.phone ?? '',
        remarks: details?.item?.remarks ?? '',
      };
      setInitialValues(init);
      form.setValues(init);
    }
  }, [details]);

  if (!allApiDataLoaded) {
    return <LoaderFull />;
  }

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
                  Warehouse
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem isCurrentPage color={'gray.500'}>
                <BreadcrumbLink>Update Warehouse</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading as="h4" size={'md'}>
              Update Warehouse
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
            Submaster
          </Text>

          <Formiz autoForm connect={form}>
            <LoadingOverlay isLoading={updateWarehouse.isLoading}>
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
                    type={'alpha-with-space'}
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
                    type={'alpha-with-space'}
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
                    defaultValue={details?.item.zip_code ?? ''}
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

                <Stack
                  direction={{ base: 'column', md: 'row' }}
                  justify={'center'}
                  alignItems={'center'}
                  display={'flex'}
                  mt={4}
                >
                  <Button
                    type="submit"
                    colorScheme="brand"
                    mt={4}
                    isLoading={updateWarehouse.isLoading}
                    isDisabled={
                      updateWarehouse.isLoading || !isFormValuesChanged
                    }
                  >
                    Submit
                  </Button>

                  <Button
                    type="button"
                    colorScheme="red"
                    mt={4}
                    isDisabled={updateWarehouse.isLoading}
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </LoadingOverlay>
          </Formiz>
        </Stack>
      </Stack>
    </SlideIn>
  );
};

export default WarehouseEdit;
