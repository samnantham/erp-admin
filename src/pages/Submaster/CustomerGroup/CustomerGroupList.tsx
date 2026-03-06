import { useState } from 'react';

import { EditIcon } from '@chakra-ui/icons';
import {
  Box,
  HStack,
  Heading,
  IconButton,
  Stack,
  Text
} from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';

import { DataTable } from '@/components/DataTable';
import { TableSearchBox } from '@/components/DataTable/SearchBox';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useCustomerGroupIndex } from '@/services/submaster/customer-group/services';
import { DataColumn } from '@/services/submaster/schema';

import ModalForm from '@/pages/Submaster/CustomerGroup/ModalForm';
// import CreateModal from './CreateModal';
// import UpdateModal from './UpdateModal';

const CustomerGroupList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, toggleModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEdit, toggleEdit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  const openModal = (item: any, editStatus: boolean) => {
    setSelected(item);
    toggleModal(true);
    toggleEdit(editStatus);
  };

 
  const closeModal = () => {
    queryClient.invalidateQueries(['customerGroupIndex']);
    setRefreshKey((prev) => prev + 1);
    refreshData();
    setSelected(null);
    toggleEdit(false);
    toggleModal(false);
  };

  const {
    data: itemList,
    isLoading: listLoading,
    refetch: refreshData,
  } = useCustomerGroupIndex();

  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    setSortBy(columnId);
    setSortDirection(direction);
  };

  const data = itemList?.items ?? [];

  const columnHelper = createColumnHelper<DataColumn>();

  const columns = [
    columnHelper.display({
      cell: (info) => {
        return info.row.index + 1;
      },
      header: '#',
      id: 'sNo',
      size: 60,
    }),
  columnHelper.accessor('name', {
      id: 'name',
      header: 'Name',
      cell: (info) => info.getValue(),
      meta: {
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('created_at', {
      cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm'),
      header: 'Created At',
      meta: {
        sortable: true,
        sortType: 'date'
      },
    }),
    columnHelper.accessor('modified_at', {
      cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm'),
      header: 'Modified At',
      meta: {
        sortable: true,
        sortType: 'date'
      },
    }),
    columnHelper.accessor('actions', {
      cell: (info) => {
        return (
          <HStack>
            <IconButton
              aria-label="Edit"
              icon={<EditIcon />}
              size={'sm'}
              onClick={() => openModal(info.row.original, true)}
            />
          </HStack>
        );
      },
      header: () => <Text textAlign="end">Actions</Text>,
    }),
  ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            Submaster - Contact Group
          </Heading>
          <ResponsiveIconButton
            variant={'@primary'}
            icon={<LuPlus />}
            size={{ base: 'sm', md: 'md' }}
            onClick={() => {
              openModal(null, false);
            }}
          >
            Add New
          </ResponsiveIconButton>
        </HStack>

        <ModalForm
            isOpen={isOpen}
            onClose={closeModal}
            existInfo={selected}
            isEdit={isEdit}
        />

        <Box borderRadius={4}>
          <HStack
            bg={'white'}
            justify={'space-between'}
            mb={4}
            p={4}
            borderTopRadius={4}
          >
            <Heading as="h4" size={'md'}>
            Contact Group List
            </Heading>
            <Box flex="1" maxW="300px">
              <TableSearchBox
                value={searchTerm}
                onChange={setSearchTerm}
                width="100%"
                placeholder={'Search Contact Group'}
              />
            </Box>
          </HStack>
          <DataTable
            data={data}
            columns={columns}
            sortBy={sortBy}
            key={refreshKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            searchValue={searchTerm}
            enableClientSideSearch={true}
            loading={listLoading}
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default CustomerGroupList;
