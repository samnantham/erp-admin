import { useEffect, useState } from 'react';

import { EditIcon, ViewIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  HStack,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiOutlineSearch, HiOutlineXCircle } from 'react-icons/hi';
import { LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import { useContactGroupIndex } from '@/services/master/customer/service';

const DEBOUNCE_TIME = 1600;

/* =========================================================
   Members Modal
========================================================= */

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
}

const MembersModal = ({ isOpen, onClose, members }: MembersModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered scrollBehavior="inside">
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Group Members ({members.length})</ModalHeader>
      <ModalCloseButton />
      <ModalBody pb={6}>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>#</Th>
              <Th>Business Name</Th>
              <Th>Code</Th>
              <Th>Email</Th>
            </Tr>
          </Thead>
          <Tbody>
            {members.map((m, idx) => (
              <Tr key={m.id ?? idx}>
                <Td>{idx + 1}</Td>
                <Td>{m.contact?.business_name ?? '—'}</Td>
                <Td>{m.contact?.code ?? '—'}</Td>
                <Td>{m.contact?.email ?? '—'}</Td>
              </Tr>
            ))}
            {members.length === 0 && (
              <Tr>
                <Td colSpan={4} textAlign="center" color="gray.400">
                  No members found
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </ModalBody>
    </ModalContent>
  </Modal>
);

/* =========================================================
   Contact Group Master
========================================================= */

export const ContactGroupMaster = () => {
  const { otherPermissions } = useRouterContext();

  const canCreate = otherPermissions.create === 1;
  const canUpdate = otherPermissions.update === 1;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const handleViewMembers = (members: any[]) => {
    setSelectedMembers(members);
    onOpen();
  };

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const initialQueryParams = {
    page: 1,
    limit: itemsPerPage,
    search: '',
  };

  const [queryParams, setQueryParams] = useState<TODO>(initialQueryParams);
  const [searchValue, setSearchValue] = useState('');

  const navigate = useNavigate();
  const [formKey, setFormKey] = useState(0);

  const form = useForm({
    onValidSubmit: (values) => setQueryParams({ search: values }),
  });

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

  const { data: itemList, isLoading: listLoading } = useContactGroupIndex(queryParams);

  const data = itemList?.data ?? [];
  const paginationData: TODO = itemList?.pagination ?? {};

  const columnConfig: DynamicColumn<any>[] = [
    { key: "name", header: "Group Name" },
    { key: "contact_type.name", header: "Contact Type" },
    {
      key: "members",
      header: "Members Count",
      render: (row: any) => (
        <Button
          size="xs"
          colorScheme="brand"
          onClick={() => handleViewMembers(row.members ?? [])}
          leftIcon={<ViewIcon/>}
        >
           View ({row.members?.length ?? 0})
        </Button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      type: "actions",
      actions: [
        {
          label: "View",
          icon: <ViewIcon />,
          onClick: (row: any) => navigate(`/contact-management/contact-group/form/${row.id}/view`),
        },
        ...(canUpdate ? [{
          label: "Edit",
          icon: <EditIcon />,
          onClick: (row: any) => navigate(`/contact-management/contact-group/form/${row.id}/edit`),
        }] : []),
      ],
    },
  ];

  const columns = buildColumns(columnConfig, { showSerial: true });

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            Contact Management - Contact Groups
          </Heading>
          {canCreate && (
            <ResponsiveIconButton
              variant={'@primary'}
              icon={<LuPlus />}
              size={{ base: 'sm', md: 'md' }}
              onClick={() => navigate('/contact-management/contact-group/form')}
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
            <FieldInput
              name="keyword"
              placeholder="Search"
              w={{ base: 'full', md: '20%' }}
              onValueChange={(value) => setSearchValue(String(value ?? ''))}
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
            title={'Contact Group List'}
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

      <MembersModal
        isOpen={isOpen}
        onClose={onClose}
        members={selectedMembers}
      />
    </SlideIn>
  );
};

export default ContactGroupMaster;