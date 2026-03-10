import { useState, useEffect } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  HStack,
  Heading,
  Stack,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { isEmail } from "@formiz/validations";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FieldTextarea } from '@/components/FieldTextarea';

import { FieldEmailInput } from "@/components/FieldEmailInput";
import { FieldInput } from "@/components/FieldInput";
import { FieldPhone } from "@/components/FieldPhone"
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import { formatModelTitle } from "@/helpers/commonHelper";
import { countryOptions } from '@/constants';
import { submasterConfig } from "@/pages/Submaster/submasterConfig";

import {
  useCreateSubmasterItem,
  useUpdateSubmasterItem,
  useSubmasterItemDetails
} from "@/services/submaster/service";

import { useLocation } from "react-router-dom";
import LoadingOverlay from '@/components/LoadingOverlay';

export const SubmasterForm = () => {
  const navigate = useNavigate();
  const { model } = useParams<{ model: string }>();
  const location = useLocation();
  const title = formatModelTitle(model);
  const { id, mode } = location.state || {};
  const redirectLink = `/submaster/${model}`;
  const isEdit = mode === "edit";
  const isView = mode === "view";

  const config = submasterConfig[model ?? ""] ?? submasterConfig.default;
  const fieldsConfig = config.fields ?? [];

  const { data: itemData, isLoading: infoLoading } = useSubmasterItemDetails( model ?? "",
    id ?? "", { enabled: !!id });

  const createEndpoint = useCreateSubmasterItem(model ?? "");
  const updateEndpoint = useUpdateSubmasterItem(model ?? "");

  const form = useForm({
    onValidSubmit: (values) => {
      const payload: any = {};

      fieldsConfig.forEach((field: any) => {
        payload[field.name] = values[field.name];
      });

      if (isEdit) {
        updateEndpoint.mutate({
          id,
          ...payload,
        }, {
          onSuccess: () => navigate(redirectLink),
        });
      } else {
        createEndpoint.mutate(payload, {
          onSuccess: () => navigate(redirectLink),
        });
      }
    },
  });

  const [formKeys, setFormKeys] = useState<any>([]);

  /**
   * Prefill form for edit
   */
  useEffect(() => {
    console.log(itemData)
    if (itemData?.data) {
      const itemInfo = itemData.data;
      let initialValues:any = {};
      let submasterFormKeys : any = [];
      fieldsConfig.forEach((field: any) => {
        submasterFormKeys.push(field.name)
        initialValues[field.name] = itemInfo[field.name];
      });
      setFormKeys(submasterFormKeys);
      setInitialValues(initialValues);
      form.setValues(initialValues);
    }
  }, [itemData]);
  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });

  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: formKeys
  });


  return (
    <SlideIn>
      <Stack pl={2} spacing={2}>
        <HStack justify={"space-between"}>
          <Stack spacing={0}>
            <Breadcrumb
              fontWeight="medium"
              fontSize="sm"
              separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
            >
              <BreadcrumbItem color={"brand.500"}>
                <BreadcrumbLink as={Link} to={redirectLink}>
                  Submaster
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem isCurrentPage color={"gray.500"}>
                <BreadcrumbLink>
                  {isView ? `View ${title}` : isEdit ? `Edit ${title}` : `Add New ${title}`}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading as="h4" size={"md"}>
              {isView ? `View ${title}` : isEdit ? `Edit ${title}` : `Add New ${title}`}
            </Heading>
          </Stack>

          <ResponsiveIconButton
            variant={"@primary"}
            icon={<HiArrowNarrowLeft />}
            size={"sm"}
            onClick={() => navigate(-1)}
          >
            Back
          </ResponsiveIconButton>
        </HStack>
        <LoadingOverlay isLoading={infoLoading}>
          <Stack spacing={2} p={4} bg={"white"} borderRadius={"md"} boxShadow={"md"}>
            <Formiz autoForm connect={form}>
              <Stack spacing={2}>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldInput
                    label={'Name'}
                    name={'name'}
                    required={'Name is required'}
                    placeholder="Enter Name"
                    type="alpha-numeric-with-space"
                    maxLength={15}
                  />

                  <FieldInput
                    label={'Consignee Name'}
                    name={'consignee_name'}
                    required={'Consignee Name is required'}
                    placeholder="Enter Consignee Name"
                    type="alpha-numeric-with-space"
                  />

                  <FieldEmailInput
                    label={'Email'}
                    name={`email`}
                    placeholder="example@gmail.com"
                    validations={[
                      {
                        handler: isEmail(),
                        message: 'Invalid email',
                      },
                    ]}
                    maxLength={100}
                  />
                </Stack>

                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldPhone
                    name="phone"
                    label="Phone Number"
                    placeholder="Enter phone number"
                    defaultCountry="AE"
                    required={"Phone number is required"}
                    isDisabled={isView}
                  />

                  <FieldInput
                    label={'Fax No'}
                    name={'fax'}
                    placeholder="Enter Fax No"
                    type="phone-number"
                    maxLength={15}
                  />

                  <FieldInput
                    label={'City'}
                    name={'city'}
                    placeholder="Enter city"
                    maxLength={40}
                  />

                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>

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
                    type="integer"
                    maxLength={8}
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
                  <FieldTextarea
                    label="Remarks"
                    name="remarks"
                    placeholder="Enter Remarks"
                    maxLength={100}
                  />
                </Stack>

                <Stack
                  direction={{ base: "column", md: "row" }}
                  justify={"center"}
                  alignItems={"center"}
                  mt={6}
                >
                  {!isView && (
                    <Button
                      type="submit"
                      colorScheme="brand"
                      isLoading={
                        createEndpoint.isLoading || updateEndpoint.isLoading
                      }
                      isDisabled={
                        createEndpoint.isLoading ||
                        updateEndpoint.isLoading ||
                        (isEdit ? !isFormValuesChanged : false)
                      }
                    >
                      {isEdit ? "Update" : "Submit"}
                    </Button>
                  )}
                  <Button
                    colorScheme="red"
                    isDisabled={
                      createEndpoint.isLoading || updateEndpoint.isLoading
                    }
                    onClick={() => navigate(-1)}
                  >
                    Go Back
                  </Button>
                </Stack>
              </Stack>
            </Formiz>
          </Stack>
        </LoadingOverlay>
      </Stack>
    </SlideIn>
  );
};

export default SubmasterForm;