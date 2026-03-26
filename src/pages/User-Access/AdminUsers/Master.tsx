import { useEffect, useState } from 'react';

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
import { useAdminUserIndex } from '@/services/user-access/adminuser/services';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import { convertToOptions } from '@/helpers/commonHelper';
import { useDepartmentList } from "@/services/user-access/department/services";

const DEBOUNCE_TIME = 1600;

export const AdminUserMaster = () => {
  const { otherPermissions } = useRouterContext();

  const canCreate = otherPermissions.create === 1;
  const canUpdate = otherPermissions.update === 1;

  const [rolesOptions, setRoleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const { data: dropdownData, isLoading } = useDepartmentList();

  const handleDepartmentChange = (value: any) => {
    if (value) {
      const selected = dropdownData?.data?.find((emp) => String(emp.id) === String(value));
      if (selected && selected?.roles && selected?.roles.length > 0) {
        setRoleOptions(convertToOptions(selected?.roles, 'department_role_id'));
      } else {
        setRoleOptions([]);
      }
    }
  };

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const initialQueryParams = {
    page: 1,
    limit: itemsPerPage,
    search: '',
    department_id: '',
    department_role_id: '',
    is_fixed: false,
  };

  const [queryParams, setQueryParams] = useState<TODO>(initialQueryParams);

  // ✅ Separate state just for the keyword input — updates instantly on every keystroke
  // Does NOT trigger the API call
  const [searchValue, setSearchValue] = useState('');

  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);

  const form = useForm({
    onValidSubmit: (values) => setQueryParams({ search: values }),
  });

  // ✅ Debounce lives here — only updates queryParams (and therefore triggers API)
  // after the user stops typing for DEBOUNCE_TIME ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setQueryParams((prev: any) => ({
        ...prev,
        search: searchValue,
        page: 1,
        limit: itemsPerPage,
      }));
    }, DEBOUNCE_TIME);

    return () => clearTimeout(handler);
  }, [searchValue]);

  const { data: itemList, isLoading: listLoading } = useAdminUserIndex(queryParams);

  const data = itemList?.data ?? [];
  const paginationData: TODO = itemList?.pagination ?? {};

  const columnConfig: DynamicColumn<any>[] = [
    { key: "first_name", header: "First Name" },
    { key: "last_name", header: "Last Name" },
    { key: "username", header: "User Name" },
    { key: "department_role.role.name", header: "Role" },
    { key: "department_role.department.name", header: "Department" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "actions",
      header: "Actions",
      type: "actions",
      actions: [
        {
          label: "View",
          icon: <ViewIcon />,
          onClick: (row: any) => navigate(`/user-access/admin-users/form/${row.id}/view`),
        },
        ...(canUpdate ? [{
          label: "Edit",
          icon: <EditIcon />,
          isDisabled: (row: any) => row.is_fixed,
          onClick: (row: any) => navigate(`/user-access/admin-users/form/${row.id}/edit`),
        }] : []),
      ],
    },
  ];

  const columns = buildColumns(columnConfig, { showSerial: true });

  useEffect(() => {
    if (dropdownData?.data) {
      setDepartmentOptions(convertToOptions(dropdownData?.data));
    }
  }, [dropdownData]);

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            User Access - Admin User's
          </Heading>
          {canCreate && (
            <ResponsiveIconButton
              variant={'@primary'}
              icon={<LuPlus />}
              size={{ base: 'sm', md: 'md' }}
              onClick={() => navigate('/user-access/admin-users/form')}
            >
              Add New
            </ResponsiveIconButton>
          )}
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
            {/* ✅ onValueChange just updates searchValue — no API call, no re-render storm */}
            <FieldInput
              name="keyword"
              placeholder="Search"
              w={{ base: 'full', md: '20%' }}
              onValueChange={(value) => setSearchValue(String(value ?? ''))}
            />
            <FieldSelect
              key={`desk_dept_${formKey}`}
              name="department_id"
              placeholder={'Select Department'}
              options={departmentOptions}
              w={{ base: 'full', md: '20%' }}
              selectProps={{ isLoading }}
              onValueChange={(value) => {
                handleDepartmentChange(value);
                setQueryParams((prev: any) => ({ ...prev, department_id: value ?? '', page: 1, limit: itemsPerPage }))
              }}
            />
            <FieldSelect
              key={`desk_role_${formKey}`}
              name="department_role_id"
              placeholder={'Select User Role'}
              options={rolesOptions}
              w={{ base: 'full', md: '20%' }}
              selectProps={{ isLoading }}
              onValueChange={(value) =>
                setQueryParams((prev: any) => ({ ...prev, department_role_id: value ?? '', page: 1, limit: itemsPerPage }))
              }
              isDisabled={!queryParams?.department_id}
            />
            <Button type="submit" variant="@primary" w={{ base: 'full', md: 'auto' }} leftIcon={<HiOutlineSearch />}>
              Search
            </Button>
            <Button
              type="reset"
              bg={'gray.200'}
              leftIcon={<HiOutlineXCircle />}
              w={{ base: 'full', md: 'auto' }}
              onClick={() => {
                form.setValues({ department_id: '', role_id: '' });
                form.reset();
                setFormKey((k) => k + 1);
                setSearchValue('');
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
            title={'Admin User List'}
            enablePagination
            currentPage={paginationData?.current_page}
            totalCount={paginationData?.total}
            pageSize={itemsPerPage}
            onPageChange={(page) =>
              setQueryParams((prev: any) => ({ ...prev, page }))
            }
            onPageSizeChange={(limit) => {
              setItemsPerPage(limit);
              setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
            }}
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default AdminUserMaster;