import { useState } from 'react';
import { Box, HStack, Heading, Stack } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { DataTable } from '@/components/DataTable';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { getBaseColumns } from '@/components/ReUsable/table-columns/baseColumns';
import { getActionColumn } from '@/components/ReUsable/table-columns/actionColumn';
import { getStatusColumn } from '@/components/ReUsable/table-columns/statusColumn';

import ModalForm from '@/pages/User-Access/Routes/ModalForm';
import { useRouteIndex } from '@/services/user-access/route/service';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';
import { DataColumn } from '@/services/user-access/route/schema';
import { useRouterContext } from '@/services/auth/RouteContext';

type ConfirmMode = null | 'soft' | 'restore' | 'permanent';

export const RouteList = () => {
  const { otherPermissions } = useRouterContext();

  const canCreate = otherPermissions.create === 1;
  const canUpdate = otherPermissions.update === 1;
  const canDelete = otherPermissions.update === 1;

  const queryClient = useQueryClient();
  const [isOpen, toggleModal]   = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEdit, toggleEdit]    = useState(false);
  const [queryParams, setQueryParams] = useState<any>({ status: 'all' });
  const [refreshKey, setRefreshKey]   = useState(0);
  const [sortBy, setSortBy]           = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm]   = useState('');
  const [mutatingRowId, setMutatingRowId] = useState<any>(null);
  const [confirmMode, setConfirmMode]     = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem]       = useState<DataColumn | null>(null);

  const visibleColumns = ['module', 'name', 'path'];
  const config: any = { extraFields: { module: 'Module', path: 'Path' } };

  const openModal = (item: any, editStatus?: boolean) => {
    setSelected(item);
    toggleModal(true);
    toggleEdit(!!editStatus);
  };

  const closeModal = () => {
    queryClient.invalidateQueries(['routeIndex']);
    setRefreshKey((p) => p + 1);
    refreshData();
    setSelected(null);
    toggleEdit(false);
    toggleModal(false);
  };

  const { data: itemList, isLoading: listLoading, refetch: refreshData } =
    useRouteIndex(queryParams);
  const data = itemList?.data ?? [];

  const deleteEndpoint = useDelete({
    url: endPoints.delete.route,
    invalidate: ['routeIndex', 'routeList'],
  });

  const mutateItem = (item: DataColumn) => {
    setMutatingRowId(item.id);
    deleteEndpoint.mutate(
      { id: item.id },
      {
        onSuccess: () => { closeConfirm(); setMutatingRowId(null); },
        onError:   () => { setMutatingRowId(null); },
      }
    );
  };

  const openSoft      = (item: DataColumn) => { setActiveItem(item); setConfirmMode('soft'); };
  const openRestore   = (item: DataColumn) => { setActiveItem(item); setConfirmMode('restore'); };
  const openPermanent = (item: DataColumn) => { setActiveItem(item); setConfirmMode('permanent'); };
  const closeConfirm  = () => { setConfirmMode(null); setActiveItem(null); };

  const baseColumns  = getBaseColumns<DataColumn>();
  const sNoColumn    = baseColumns.filter((col: any) => col.id === 'sNo');
  const nameColumn   = baseColumns.filter((col: any) => col.id === 'name');

  const extraColumns = visibleColumns
    .filter((col) => col !== 'name')
    .map((col) => ({
      id: col,
      header: config.extraFields?.[col] ?? col,
      accessorKey: col,
      meta: { sortable: true, searchable: true, sortType: 'string' },
      cell: ({ row }: any) => {
        const value = row.original[col];
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value ?? '—';
      },
    }));

  const moduleColumn = extraColumns.filter((col) => col.id === 'module');
  const pathColumn   = extraColumns.filter((col) => col.id === 'path');

  const actionColumnConfig = {
    mutatingRowId,
    actionLoaderStatus: deleteEndpoint.isLoading,
    openModal:           canUpdate ? openModal     : () => {},
    openSoftDelete:      canDelete ? openSoft      : () => {},
    openPermenantDelete: canDelete ? openPermanent : () => {},
    openRestore:         canUpdate ? openRestore   : () => {},
    hideEdit:            !canUpdate,
    hideDelete:          !canDelete,
  };

  const columns = [
    ...sNoColumn,
    ...moduleColumn,
    ...nameColumn,
    ...pathColumn,
    getStatusColumn<DataColumn>(),
    getActionColumn<DataColumn>(actionColumnConfig),
  ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify="space-between">
          <Heading as="h4" size="md">User Access - Routes</Heading>
          {canCreate && (
            <ResponsiveIconButton
              variant="@primary"
              icon={<LuPlus />}
              size={{ base: 'sm', md: 'md' }}
              onClick={() => openModal(null, false)}
            >
              Add New
            </ResponsiveIconButton>
          )}
        </HStack>

        <Box borderRadius={4}>
          <DataTable
            columns={columns}
            data={data}
            sortBy={sortBy}
            key={refreshKey}
            sortDirection={sortDirection}
            onSortChange={(id, dir) => { setSortBy(id); setSortDirection(dir); }}
            searchValue={searchTerm}
            enableClientSideSearch={true}
            loading={listLoading}
            onSearchChange={setSearchTerm}
            title="Route List"
            statusTabsStatus={true}
            status={queryParams.status}
            onStatusChange={(next) => setQueryParams((p: any) => ({ ...p, status: next }))}
            searchPlaceholder="Search Route"
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
            onConfirm={() => { if (activeItem) mutateItem(activeItem); }}
            isLoading={!!activeItem && mutatingRowId === activeItem.id && deleteEndpoint.isLoading}
            headerText={confirmMode === 'restore' ? 'Restore !!' : 'Delete !!'}
            bodyText={
              confirmMode === 'restore'
                ? 'Are you sure want to restore this route?'
                : 'Are you sure want to delete this route?'
            }
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default RouteList;