import { useState } from 'react';
import {
  Box,
  HStack,
  Heading,
  Stack
} from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import { ConfirmationWithReasonPopup } from '@/components/ConfirmationWithReasonPopup';
import { DataTable } from '@/components/DataTable';
//Added For Delete and Restore Feature
import { TableSearchBox } from '@/components/DataTable/SearchBox';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { Status, StatusTabs } from '@/components/StatusTabs';
import SubMasterActions, {
  ActionsHeader,
} from '@/components/SubmasterActionsButton';
import { useToastError, useToastSuccess } from '@/components/Toast';
import {
  ApiResp,
  Vars,
  endPoints,
  useDelete,
} from '@/services/submaster/service';
import { WarehouseDataColumn } from '@/services/submaster/warehouse/schema';
import { useWarehouseIndex } from '@/services/submaster/warehouse/services';

type ConfirmMode = null | 'soft' | 'restore' | 'permanent';

const WarehouseList = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [queryParams, setQueryParams] = useState<TODO>({ status: 'all' });
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    setSortBy(columnId);
    setSortDirection(direction);
  };

  const {
    data: listData,
    isLoading: listLoading,
    refetch: refreshData,
  } = useWarehouseIndex(queryParams);
  // const listData = useWarehouseIndex(queryParams);

  //Added For Delete and Restore Feature
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();
  const [mutatingRowId, setMutatingRowId] = useState<number | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem] = useState<WarehouseDataColumn | null>(null);

  const { mutateAsync: deleteOrRestoreItem, isLoading: actionLoaderStatus } =
    useDelete<ApiResp, Vars>({
      invalidate: ['warehouseIndex'],
      request: (vars) => ({
        url: vars.url,
        method: 'DELETE',
        body: vars.deleted_reason
          ? { deleted_reason: vars.deleted_reason }
          : undefined,
      }),
    });

  async function handleDelete(payLoad: TODO) {
    try {
      const data = await deleteOrRestoreItem(payLoad);
      toastSuccess({ title: data?.message });
      queryClient.invalidateQueries(['warehouseIndex']);
      refreshData();
      closeConfirm();
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || 'Delete failed.';
      toastError({ status: 'error', title: 'Error', description: msg });
    } finally {
      setMutatingRowId(null);
    }
  }

  const openSoft = (item: WarehouseDataColumn) => {
    setActiveItem(item);
    setConfirmMode('soft');
  };
  const openRestore = (item: WarehouseDataColumn) => {
    setActiveItem(item);
    setConfirmMode('restore');
  };
  const openPermanent = (item: WarehouseDataColumn) => {
    setActiveItem(item);
    setConfirmMode('permanent');
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setActiveItem(null);
  };

  const handleSoftDelete = (item: WarehouseDataColumn, reason: string) => {
    setMutatingRowId(item.id);
    handleDelete({
      deleted_reason: reason,
      permanent: false,
      url: endPoints.soft_delete.warehouse.replace(':id', String(item.id)),
    });
  };

  const handleRestore = (item: WarehouseDataColumn) => {
    setMutatingRowId(item.id);
    handleDelete({
      url: endPoints.restore.warehouse.replace(':id', String(item.id)),
    });
  };

  const handlePermanentDelete = (item: WarehouseDataColumn) => {
    setMutatingRowId(item.id);
    handleDelete({
      url: endPoints.delete.warehouse.replace(':id', String(item.id)),
    });
  };

  const handleStatusChange = (next: Status) => {
    setQueryParams((prevState: TODO) => ({ ...prevState, status: next }));
  };

  const data = listData?.items ?? [];

  const columnHelper = createColumnHelper<WarehouseDataColumn>();

  const columns = [
    columnHelper.accessor('id', {
      cell: (info) => info.getValue(),
      header: 'ID No',
    }),
    columnHelper.accessor('name', {
      cell: (info) => info.getValue(),
      header: 'Name',
      meta: {
        accessorKey: 'name',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('consignee_name', {
      cell: (info) => info.getValue(),
      header: 'Consignee Name',
      meta: {
        accessorKey: 'consignee_name',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('phone', {
      cell: (info) => info.getValue(),
      header: () => 'Phone',
      meta: {
        accessorKey: 'phone',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('email', {
      cell: (info) => info.getValue(),
      header: () => 'Email',
      meta: {
        accessorKey: 'email',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('city', {
      cell: (info) => info.getValue(),
      header: 'City',
      meta: {
        accessorKey: 'city',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('state', {
      cell: (info) => info.getValue(),
      header: 'State',
      meta: {
        accessorKey: 'state',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('zip_code', {
      cell: (info) => info.getValue(),
      header: 'Zip Code',
      meta: {
        accessorKey: 'zip_code',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),

    columnHelper.display({
      id: 'actions-new',
      header: () => <ActionsHeader />,
      cell: (info) => {
        const rowItem = info.row.original as WarehouseDataColumn;
        const isRowBusy = mutatingRowId === rowItem.id && actionLoaderStatus;

        return (
          <SubMasterActions<WarehouseDataColumn>
            item={rowItem}
            isBusy={isRowBusy}
            onEdit={(item) => {
              navigate(`/submaster/warehouse/${item.id}/edit`);
            }}
            onView={(item) => {
              navigate(`/submaster/warehouse/${item.id}`);
            }}
            hasView={true}
            onAskSoftDelete={openSoft}
            onAskRestore={openRestore}
            onAskPermanentDelete={openPermanent}
          />
        );
      },
    })
  ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            Warehouses
          </Heading>

          <ResponsiveIconButton
            variant={'@primary'}
            icon={<LuPlus />}
            size={{ base: 'sm', md: 'md' }}
            onClick={() => navigate('/submaster/warehouse/create')}
          >
            Add New Warehouse
          </ResponsiveIconButton>
        </HStack>

        <Box borderRadius={4}>
          {/* Table goes here */}
          <HStack
            bg={'white'}
            justify={'space-between'}
            mb={4}
            p={4}
            borderTopRadius={4}
          >
            <Heading as="h4" size={'md'}>
              Warehouse List
            </Heading>

            <Box flex="1" maxW="300px">
              <TableSearchBox
                value={searchTerm}
                onChange={setSearchTerm}
                width="100%"
                placeholder={'Search Warehouse'}
              />
            </Box>
          </HStack>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <StatusTabs
              status={queryParams?.status}
              onStatusChange={handleStatusChange}
            />
          </Box>
          <DataTable
            columns={columns}
            data={data}
            sortBy={sortBy}
            loading={listLoading}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            searchValue={searchTerm}
            enableClientSideSearch={true}
          />
        </Box>
        <ConfirmationPopup
          isOpen={confirmMode === 'restore' || confirmMode === 'permanent'}
          onClose={closeConfirm}
          onConfirm={() => {
            if (!activeItem) return;
            if (confirmMode === 'restore') handleRestore(activeItem);
            if (confirmMode === 'permanent') handlePermanentDelete(activeItem);
          }}
          isLoading={
            !!activeItem &&
            mutatingRowId === activeItem.id &&
            actionLoaderStatus
          }
          headerText={confirmMode === 'restore' ? 'Restore !!' : 'Delete !!'}
          bodyText={
            confirmMode === 'restore'
              ? 'Are you sure want to restore this item?'
              : 'Permanently remove this item? You won’t be able to recover it.'
          }
        />

        <ConfirmationWithReasonPopup
          isOpen={confirmMode === 'soft'}
          onClose={closeConfirm}
          onConfirm={(reason) => {
            if (!activeItem) return;
            handleSoftDelete(activeItem, reason);
          }}
          headerText="Confirm Delete"
          bodyText="Are you sure you want to delete this item?"
          showBody={false}
          isInputRequired={true}
          isLoading={
            !!activeItem &&
            mutatingRowId === activeItem.id &&
            actionLoaderStatus
          }
        />
      </Stack>
    </SlideIn>
  );
};

export default WarehouseList;
