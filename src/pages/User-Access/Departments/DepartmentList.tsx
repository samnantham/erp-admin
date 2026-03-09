import { useState } from 'react';

import { Box, HStack, Heading, Stack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';

import { createColumnHelper } from '@tanstack/react-table';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { DataTable } from '@/components/DataTable';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { getBaseColumns } from '@/components/ReUsable/table-columns/baseColumns';
import { getActionColumn } from '@/components/ReUsable/table-columns/actionColumn';
import { getStatusColumn } from '@/components/ReUsable/table-columns/statusColumn';
import { getDeletedColumn } from '@/components/ReUsable/table-columns/deletedColumn';

import ModalForm from '@/pages/User-Access/Departments/ModalForm';
import { useDepartmentIndex } from '@/services/user-access/department/services';
import { DataColumn } from '@/services/user-access/department/schema';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';

type ConfirmMode = null | 'soft' | 'restore' | 'permanent';

export const DepartmentList = () => {
  const queryClient = useQueryClient();
  const [isOpen, toggleModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEdit, toggleEdit] = useState(false);
  const [queryParams, setQueryParams] = useState<TODO>({ status: 'all' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  const columnHelper = createColumnHelper<DataColumn>();

  const emailColumn = columnHelper.accessor((row) => row.emails, {
    id: 'emails',
    header: 'Emails',
    meta: {
      sortable: true,
      searchable: true,
      sortType: 'string',
    },
    cell: (info) => {
      const emails = info.getValue();
      if (!emails) return '-';

      return (
        <Stack spacing={0}>
          {emails.split(',').map((email: string, index: number) => (
            <Box key={index}>{email.trim()}</Box>
          ))}
        </Stack>
      );
    },
  });

  const openModal = (item: any, editStatus?: boolean) => {
    console.log(item)
    setSelected(item);
    toggleModal(true);
    toggleEdit(!!editStatus);
  };

  const closeModal = () => {
    queryClient.invalidateQueries(['userDepartmentIndex']);
    setRefreshKey((prev) => prev + 1);
    refreshData();
    setSelected(null);
    toggleEdit(false);
    toggleModal(false);
  };

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    setSortBy(columnId);
    setSortDirection(direction);
  };

  const {
    data: itemList,
    isLoading: listLoading,
    refetch: refreshData,
  } = useDepartmentIndex(queryParams);
  const data = itemList?.data ?? [];

  //Added For Delete and Restore Feature
  const [mutatingRowId, setMutatingRowId] = useState<any>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem] = useState<DataColumn | null>(null);

  const deleteDepartment = useDelete(
    {
      url: endPoints.delete.department,
      invalidate: ['userDepartmentIndex', 'userDepartmentList'],
    }
  );

  const mutateDepartment = (item: DataColumn) => {
    setMutatingRowId(item.id);

    deleteDepartment.mutate(
      { id: item.id },
      {
        onSuccess: () => {
          closeConfirm();
          setMutatingRowId(null);
        },
        onError: () => {
          setMutatingRowId(null);
        },
      }
    );
  };

  const openSoft = (item: DataColumn) => {
    setActiveItem(item);
    setConfirmMode('soft');
  };
  const openRestore = (item: DataColumn) => {
    setActiveItem(item);
    setConfirmMode('restore');
  };
  const openPermanent = (item: DataColumn) => {
    setActiveItem(item);
    setConfirmMode('permanent');
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setActiveItem(null);
  };

  const handleSoftDelete = mutateDepartment;
  const handleRestore = mutateDepartment;
  const handlePermanentDelete = mutateDepartment;

  const handleStatusChange = (next: any) => {
    setQueryParams((prevState: TODO) => ({ ...prevState, status: next }));
  };

  const baseColumns = getBaseColumns<DataColumn>();
  const nameIndex = baseColumns.findIndex((col: any) => col.id === 'name');

  const departmentColumns = [
    ...baseColumns.slice(0, nameIndex + 1),
    emailColumn,
    ...baseColumns.slice(nameIndex + 1),
  ];

  const columns =
    queryParams.status === 'trashed'
      ? [
        ...departmentColumns.filter(
          (col: any) => col.id === 'sNo' || col.id === 'name' || col.id === 'emails'
        ),
        getStatusColumn<DataColumn>(),
        getDeletedColumn<DataColumn>(),
        getActionColumn<DataColumn>({
          mutatingRowId,
          actionLoaderStatus: deleteDepartment.isLoading,
          openModal,
          openSoftDelete: openSoft,
          openPermenantDelete: openPermanent,
          openRestore,
        }),
      ]
      : [
        ...departmentColumns,
        getStatusColumn<DataColumn>(),
        getActionColumn<DataColumn>({
          mutatingRowId,
          actionLoaderStatus: deleteDepartment.isLoading,
          openModal,
          openSoftDelete: openSoft,
          openPermenantDelete: openPermanent,
          openRestore,
        }),
      ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            User Access - Department
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

        <Box borderRadius={4}>

          <DataTable
            columns={columns}
            data={data}
            sortBy={sortBy}
            key={refreshKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            searchValue={searchTerm}
            enableClientSideSearch={true}
            loading={listLoading}
            onSearchChange={setSearchTerm}
            title={'Department List'}
            statusTabsStatus={true}
            status={queryParams.status}
            onStatusChange={handleStatusChange}
            searchPlaceholder={'Search Department'}
          />

          <ModalForm
            key={selected?.id ?? 'create'}
            isOpen={isOpen}
            onClose={closeModal}
            existInfo={selected}
            isEdit={isEdit}
          />

          <ConfirmationPopup
            isOpen={confirmMode !== null}
            onClose={closeConfirm}
            onConfirm={() => {
              if (!activeItem) return;
              if (confirmMode === 'restore') handleRestore(activeItem);
              if (confirmMode === 'soft') handleSoftDelete(activeItem);
              if (confirmMode === 'permanent') handlePermanentDelete(activeItem);
            }}
            isLoading={
              !!activeItem &&
              mutatingRowId === activeItem.id &&
              deleteDepartment.isLoading
            }
            headerText={confirmMode === 'restore' ? 'Restore !!' : 'Delete !!'}
            bodyText={
              confirmMode === 'restore'
                ? 'Are you sure want to restore this department?'
                : 'Are you sure want to delete this department?'
            }
          />

        </Box>
      </Stack>
    </SlideIn>
  );
};

export default DepartmentList;
