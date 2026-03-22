import { useState } from 'react';
import { Box, HStack, Heading, Stack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { DataTable } from '@/components/DataTable';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { getActionColumn } from '@/components/ReUsable/table-columns/actionColumn';

import ModalForm from '@/pages/User-Access/Department-Roles/ModalForm';
import { useDepartmentRoleIndex } from '@/services/user-access/department-role/service';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';
import { DataColumn } from '@/services/global-schema';
import { ColumnDef } from '@tanstack/react-table';
import { useRouterContext } from '@/services/auth/RouteContext';

type ConfirmMode = null | 'soft' | 'permanent';

export const DepartmentRoleList = () => {
  const { otherPermissions } = useRouterContext();

  const canCreate = otherPermissions.create === 1;
  const canDelete = otherPermissions.update === 1;

  const queryClient = useQueryClient();
  const [isOpen, toggleModal]       = useState(false);
  const [selected, setSelected]     = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [mutatingRowId, setMutatingRowId] = useState<any>(null);
  const [confirmMode, setConfirmMode]     = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem]       = useState<DataColumn | null>(null);

  const openModal  = () => { setSelected(null); toggleModal(true); };
  const closeModal = () => {
    queryClient.invalidateQueries(['departmentRoleIndex']);
    setRefreshKey((p) => p + 1);
    refreshData();
    toggleModal(false);
  };

  const { data: itemList, isLoading: listLoading, refetch: refreshData } =
    useDepartmentRoleIndex();
  const data = itemList?.data ?? [];

  const deleteEndpoint = useDelete({
    url: endPoints.delete.departmentRole,
    invalidate: ['departmentRoleIndex'],
  });

  const mutateItem = (item: DataColumn) => {
    setMutatingRowId(item.id);
    deleteEndpoint.mutate(
      { id: item.id },
      {
        onSuccess: () => { closeConfirm(); setMutatingRowId(null); refreshData(); },
        onError:   () => { setMutatingRowId(null); },
      }
    );
  };

  const openPermanent = (item: DataColumn) => { setActiveItem(item); setConfirmMode('permanent'); };
  const closeConfirm  = () => { setConfirmMode(null); setActiveItem(null); };

  const columns: ColumnDef<DataColumn>[] = [
    {
      id: 'sNo',
      header: '#',
      cell: ({ row }) => row.index + 1,
    },
    {
      id: 'department',
      header: 'Department',
      accessorFn: (row: any) => row.department?.name ?? '-',
    },
    {
      id: 'role',
      header: 'Role',
      accessorFn: (row: any) => row.role?.name ?? '-',
    },
    getActionColumn<DataColumn>({
      mutatingRowId,
      actionLoaderStatus: deleteEndpoint.isLoading,
      openModal: () => {},
      openSoftDelete:      canDelete ? openPermanent : () => {},
      openPermenantDelete: canDelete ? openPermanent : () => {},
      openRestore: () => {},
      // hide delete button entirely if no permission
      hideDelete: !canDelete,
    }),
  ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify="space-between">
          <Heading as="h4" size="md">User Access - Department Role</Heading>
          {canCreate && (
            <ResponsiveIconButton
              variant="@primary"
              icon={<LuPlus />}
              size={{ base: 'sm', md: 'md' }}
              onClick={openModal}
            >
              Add New
            </ResponsiveIconButton>
          )}
        </HStack>

        <Box borderRadius={4}>
          <DataTable
            columns={columns}
            data={data}
            key={refreshKey}
            searchValue={searchTerm}
            enableClientSideSearch={true}
            loading={listLoading}
            onSearchChange={setSearchTerm}
            title="Department Role List"
            searchPlaceholder="Search"
          />

          <ModalForm
            key={isOpen ? 'open' : 'closed'}
            isOpen={isOpen}
            onClose={closeModal}
            existInfo={selected}
          />

          <ConfirmationPopup
            isOpen={confirmMode !== null}
            onClose={closeConfirm}
            onConfirm={() => { if (activeItem) mutateItem(activeItem); }}
            isLoading={!!activeItem && mutatingRowId === activeItem.id && deleteEndpoint.isLoading}
            headerText="Delete !!"
            bodyText="Are you sure want to delete this department role?"
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default DepartmentRoleList;