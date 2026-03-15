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
import { isEmail, isMinLength } from "@formiz/validations";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FieldInput } from "@/components/FieldInput";
import { FieldPhone } from "@/components/FieldPhone";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';

import {
  useCreateAdminUser,
  useUpdateAdminUser,
  useAdminUserDetails,
  useAdminUserDropdowns,
} from "@/services/user-access/adminuser/services";
import LoadingOverlay from '@/components/LoadingOverlay';


export const AdminUserForm = () => {
  const navigate = useNavigate();

  const { id, mode } = useParams<{id?: string, mode?: string }>();

  const isEdit = mode === "edit";
  const isView = mode === "view";

  const { data: dropdownData, isLoading } = useAdminUserDropdowns();
  const departmentOptions = dropdownData?.departments ?? [];
  const rolesOptions = dropdownData?.roles ?? [];

  const { data: userData, isLoading: infoLoading } = useAdminUserDetails(id, { enabled: !!id });

  const createEndpoint = useCreateAdminUser();
  const updateEndpoint = useUpdateAdminUser();

  const form = useForm({
    onValidSubmit: (values) => {
      const payload: any = {
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        department_id: values.department_id,
        role_id: values.role_id,
        email: values.email,
        phone: values.phone,
      };

      if (!isEdit) {
        payload.password = values.password;
      }

      if (isEdit) {
        updateEndpoint.mutate({
          id,
          ...payload,
        }, {
          onSuccess: () => navigate("/user-access/admin-users"),
        });
      } else {
        createEndpoint.mutate(payload, {
          onSuccess: () => navigate("/user-access/admin-users"),
        });
      }
    },
  });

  /**
   * Prefill form for edit
   */
  useEffect(() => {
    if (userData?.data) {
      const user = userData.data;
      let initialValues = {
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        department_id: user.department_id,
        role_id: user.role_id,
      }
      setInitialValues(initialValues);
      form.setValues(initialValues);
    }
  }, [userData]);
  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });
  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: ['username',
      'first_name',
      'last_name',
      'email',
      'phone',
      'department_id',
      'role_id'],
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
                <BreadcrumbLink as={Link} to="/user-access/admin-users">
                  User Access
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem isCurrentPage color={"gray.500"}>
                <BreadcrumbLink>
                  {isView ? "View User" : isEdit ? "Edit User" : "Add New User"}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading as="h4" size={"md"}>
              {isView ? "View User" : isEdit ? "Edit User" : "Add New User"}
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
        <LoadingOverlay isLoading={isLoading || infoLoading}>
          <Stack spacing={2} p={4} bg={"white"} borderRadius={"md"} boxShadow={"md"}>
            <Formiz autoForm connect={form}>
              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldInput
                  type="text"
                  label="User Name"
                  name="username"
                  placeholder="Enter user name"
                  required={"User name is required"}
                  isDisabled={isView}
                />

                <FieldInput
                  type="email"
                  label="Email"
                  name="email"
                  placeholder="example@gmail.com"
                  validations={[
                    {
                      handler: isEmail(),
                      message: "Invalid email",
                    },
                  ]}
                  maxLength={100}
                  isDisabled={isView}
                />
              </Stack>

              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                {(!isEdit && !isView) && (
                  <FieldInput
                    type="password"
                    label="Password"
                    name="password"
                    placeholder="✱✱✱✱✱✱✱✱"
                    required={"Password is required"}
                    validations={[
                      {
                        handler: isMinLength(8),
                        message: "Password must be at least 8 characters",
                      },
                    ]}
                  />
                )}

                <FieldInput
                  type="text"
                  label="First Name"
                  name="first_name"
                  placeholder="Enter first name"
                  required={"First name is required"}
                  isDisabled={isView}
                />
              </Stack>

              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldInput
                  type="text"
                  label="Last Name"
                  name="last_name"
                  placeholder="Enter last name"
                  required={"Last name is required"}
                  isDisabled={isView}
                />

                <FieldPhone
                  name="phone"
                  label="Phone Number"
                  placeholder="Enter phone number"
                  defaultCountry="AE"
                  required={"Phone number is required"}
                  isDisabled={isView}
                />

              </Stack>

              <Stack spacing={8} direction={{ base: "column", md: "row" }} mb={3}>
                <FieldSelect
                  label="Department"
                  name={"department_id"}
                  placeholder="Select..."
                  options={departmentOptions}
                  required={"Department is required"}
                  selectProps={{
                    isLoading: isLoading,
                  }}
                  isDisabled={isView}
                  className={isView ? 'disabled-input' : ''}
                />

                <FieldSelect
                  label="User Role"
                  name={"role_id"}
                  placeholder="Select..."
                  options={rolesOptions}
                  required={"User Role is required"}
                  selectProps={{
                    isLoading: isLoading,
                  }}
                  isDisabled={isView}
                  className={isView ? 'disabled-input' : ''}
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
                      !form.isValid || (isEdit ? !isFormValuesChanged : false)
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
            </Formiz>
          </Stack>
        </LoadingOverlay>
      </Stack>
    </SlideIn>
  );
};

export default AdminUserForm;