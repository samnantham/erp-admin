import { useState } from 'react';

import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  HStack,
  Heading,
  Stack,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiOutlineSearch, HiOutlineXCircle } from 'react-icons/hi';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useAdminUserIndex, useAdminUserDropdowns } from '@/services/user-access/adminuser/services';

import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns'

export const AdminUserMaster = () => {
  const { data: dropdownData, isLoading } = useAdminUserDropdowns();

  const departmentOptions = dropdownData?.departments ?? [];
  const rolesOptions = dropdownData?.roles ?? [];

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const initialQueryParams = {
    page: 1,
    limit: itemsPerPage,
    search: '',
    department_id: '',
    role_id: '',
  };
  const [queryParams, setQueryParams] = useState<TODO>(initialQueryParams);
  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);
  const form = useForm({
    onValidSubmit: (values) => {
      setQueryParams({ search: values });
    },
  });

  const {
    data: itemList,
    isLoading: listLoading
  } = useAdminUserIndex(queryParams);

  const data = itemList?.data ?? [];
  const paginationData: TODO = itemList?.pagination ?? {};

  const columnConfig: DynamicColumn<any>[] = [
    { key: "first_name", header: "First Name" },
    { key: "last_name", header: "Last Name" },
    { key: "username", header: "User Name" },
    { key: "role.name", header: "Role" },
    { key: "department.name", header: "Department" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },

    {
      key: "actions",
      header: "Actions",
      type: "actions",
      // isDisabled: (row) => row.is_fixed,

      actions: [
        {
          label: "View",
          icon: <ViewIcon />,
          onClick: (row: any) => navigate("/user-access/admin-users/form", {
            state: { id: row.id, mode: "view" }
          }),
        },
        {
          label: "Edit",
          icon: <EditIcon />,
          isDisabled: (row) => row.is_fixed,
          onClick: (row: any) => navigate("/user-access/admin-users/form", {
            state: { id: row.id, mode: "edit" }
          }),
        },
      ],
    },
  ];

  const columns = buildColumns(columnConfig, { showSerial: true });

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            User Access - Admin User's
          </Heading>
          <ResponsiveIconButton
            variant={'@primary'}
            icon={<LuPlus />}
            size={{ base: 'sm', md: 'md' }}
            onClick={() => navigate('/user-access/admin-users/form')}
          >
            Add New
          </ResponsiveIconButton>

        </HStack>

        <Formiz autoForm connect={form}>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            display={{ base: 'none', md: 'flex' }}
            bg={'white'}
            p={6}
            borderRadius={4}
            spacing={4}
            align={'flex-start'}
            justify={'flex-start'}
            mt={2}
          >
            <FieldInput
              name="keyword"
              placeholder="Search"
              w={{ base: 'full', md: '20%' }}
            />

            <FieldSelect
              key={`desk_dept_${formKey}`}
              name="department_id"
              placeholder={'Select Department'}
              options={departmentOptions}
              w={{ base: 'full', md: '20%' }}
              selectProps={{
                isLoading: isLoading
              }}
              onValueChange={(value) => {
                setQueryParams((prevState: any) => ({
                  ...prevState,
                  department_id: value ?? '',
                  page: 1,
                  limit: itemsPerPage
                }));
              }}
            />

            <FieldSelect
              key={`desk_role_${formKey}`}
              name="role_id"
              placeholder={'Select User Role'}
              options={rolesOptions}
              w={{ base: 'full', md: '20%' }}
              selectProps={{
                isLoading: isLoading
              }}
              onValueChange={(value) => {
                setQueryParams((prevState: any) => ({
                  ...prevState,
                  role_id: value ?? '',
                  page: 1,
                  limit: itemsPerPage
                }));
              }}
            />

            <Button
              type="submit"
              variant="@primary"
              w={{ base: 'full', md: 'auto' }}
              leftIcon={<HiOutlineSearch />}
            >
              Search
            </Button>

            <Button
              type="reset"
              bg={'gray.200'}
              leftIcon={<HiOutlineXCircle />}
              w={{ base: 'full', md: 'auto' }}
              onClick={() => {
                form.setValues({ [`department_id`]: '', [`role_id`]: '' });
                form.reset();
                setFormKey((prevKey) => prevKey + 1);
                setQueryParams(initialQueryParams);
              }}
            >
              Clear
            </Button>
          </Stack>
        </Formiz>

        <Box borderRadius={4}>
          <DataTable
            columns={columns}
            data={data}
            loading={listLoading}
            title={' Admin User List'}
            enablePagination={true}
            currentPage={paginationData?.current_page}
            totalCount={paginationData?.total}
            pageSize={itemsPerPage}                // ✅ required
            onPageChange={(page) =>      // ✅ required
              setQueryParams((prev: any) => ({
                ...prev,
                page
              }))
            }
            onPageSizeChange={(limit) => {
              setItemsPerPage(limit);   // ✅ required
              setQueryParams((prev: any) => ({
                ...prev,
                limit,
                page: 1
              }))
            }}
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default AdminUserMaster;
