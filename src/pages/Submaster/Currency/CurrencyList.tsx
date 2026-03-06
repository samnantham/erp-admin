import { useState } from 'react';

import { Box, HStack, Heading, Stack } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { LuPlus } from 'react-icons/lu';
import { useQueryClient } from 'react-query';

//Added For Delete and Restore Feature
import ConfirmationPopup from '@/components/ConfirmationPopup';
import { ConfirmationWithReasonPopup } from '@/components/ConfirmationWithReasonPopup';
import { DataTable } from '@/components/DataTable';
import { TableSearchBox } from '@/components/DataTable/SearchBox';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { Status, StatusTabs } from '@/components/StatusTabs';
import SubMasterActions, {
  ActionsHeader,
} from '@/components/SubmasterActionsButton';
import { useToastError, useToastSuccess } from '@/components/Toast';
import ModalForm from '@/pages/Submaster/Currency/ModalForm';
import { CurrencyDataColumn } from '@/services/submaster/currency/schema';
import { useCurrencyIndex } from '@/services/submaster/currency/services';
import {
  ApiResp,
  Vars,
  endPoints,
  useDelete,
} from '@/services/submaster/service';

type ConfirmMode = null | 'soft' | 'restore' | 'permanent';

const CurrencyList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, toggleModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEdit, toggleEdit] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const queryClient = useQueryClient();
  const [queryParams, setQueryParams] = useState<TODO>({ status: 'all' });

  const openModal = (item: any, editStatus: boolean) => {
    setSelected(item);
    toggleModal(true);
    toggleEdit(editStatus);
  };

  const closeModal = () => {
    toggleEdit(false);
    toggleModal(false);
    queryClient.invalidateQueries(['currencyIndex']);
    setRefreshKey((prev) => prev + 1);
    refreshData();
    setSelected(null);
  };

  const {
    data: currencyList,
    isLoading: listLoading,
    refetch: refreshData,
  } = useCurrencyIndex(queryParams);

  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
    setSortBy(columnId);
    setSortDirection(direction);
  };

  //Added For Delete and Restore Feature
  const toastSuccess = useToastSuccess();
  const toastError = useToastError();
  const [mutatingRowId, setMutatingRowId] = useState<number | null>(null);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem] = useState<CurrencyDataColumn | null>(null);

  const { mutateAsync: deleteOrRestoreItem, isLoading: actionLoaderStatus } =
    useDelete<ApiResp, Vars>({
      invalidate: ['currencyIndex'],
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
      queryClient.invalidateQueries(['currencyIndex']);
      refreshData();
      closeConfirm();
    } catch (error: any) {
      const msg = error?.data?.message || error?.message || 'Delete failed.';
      toastError({ status: 'error', title: 'Error', description: msg });
    } finally {
      setMutatingRowId(null);
    }
  }

  const openSoft = (item: CurrencyDataColumn) => {
    setActiveItem(item);
    setConfirmMode('soft');
  };
  const openRestore = (item: CurrencyDataColumn) => {
    setActiveItem(item);
    setConfirmMode('restore');
  };
  const openPermanent = (item: CurrencyDataColumn) => {
    setActiveItem(item);
    setConfirmMode('permanent');
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setActiveItem(null);
  };

  const handleSoftDelete = (item: CurrencyDataColumn, reason: string) => {
    setMutatingRowId(item.id);
    handleDelete({
      deleted_reason: reason,
      permanent: false,
      url: endPoints.soft_delete.currency.replace(':id', String(item.id)),
    });
  };

  const handleRestore = (item: CurrencyDataColumn) => {
    setMutatingRowId(item.id);
    handleDelete({
      url: endPoints.restore.currency.replace(':id', String(item.id)),
    });
  };

  const handlePermanentDelete = (item: CurrencyDataColumn) => {
    setMutatingRowId(item.id);
    handleDelete({
      url: endPoints.delete.currency.replace(':id', String(item.id)),
    });
  };

  const handleStatusChange = (next: Status) => {
    setQueryParams((prevState: TODO) => ({ ...prevState, status: next }));
  };

  const data = currencyList?.items ?? [];

  const columnHelper = createColumnHelper<CurrencyDataColumn>();

  const columns = [
    columnHelper.display({
      cell: (info) => {
        return info.row.index + 1;
      },
      header: '#',
      id: 'sNo',
      size: 60,
    }),
    columnHelper.accessor('code', {
      cell: (info) => info.getValue(),
      header: 'Code',
      meta: {
        accessorKey: 'code',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
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
    columnHelper.accessor('symbol', {
      cell: (info) => info.getValue(),
      header: 'Symbol',
      meta: {
        accessorKey: 'symbol',
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
    }),
    columnHelper.accessor('created_at', {
      cell: (info) => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
      header: 'Created At',
      meta: {
        sortable: true,
        sortType: 'date',
      },
    }),
    columnHelper.accessor('modified_at', {
      cell: (info) => format(new Date(info.getValue()), 'dd/MM/yyyy HH:mm'),
      header: 'Modified At',
      meta: {
        sortable: true,
        sortType: 'date',
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <ActionsHeader />,
      cell: (info) => {
        const rowItem = info.row.original as CurrencyDataColumn;
        const isRowBusy = mutatingRowId === rowItem.id && actionLoaderStatus;

        return (
          <SubMasterActions<CurrencyDataColumn>
            item={rowItem}
            isBusy={isRowBusy}
            onEdit={(item) => openModal(item, true)}
            onAskSoftDelete={openSoft}
            onAskRestore={openRestore}
            onAskPermanentDelete={openPermanent}
          />
        );
      },
    }),
  ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={'space-between'}>
          <Heading as="h4" size={'md'}>
            Customer Submaster - Currencies
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
          <HStack
            bg={'white'}
            justify={'space-between'}
            mb={4}
            p={4}
            borderTopRadius={4}
          >
            <Heading as="h4" size={'md'}>
              Currency List
            </Heading>
            <Box flex="1" maxW="300px">
              <TableSearchBox
                value={searchTerm}
                onChange={setSearchTerm}
                width="100%"
                placeholder={'Search Currency'}
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
      <ModalForm
        isOpen={isOpen}
        onClose={closeModal}
        existInfo={selected}
        isEdit={isEdit}
      />

      <ConfirmationPopup
        isOpen={confirmMode === 'restore' || confirmMode === 'permanent'}
        onClose={closeConfirm}
        onConfirm={() => {
          if (!activeItem) return;
          if (confirmMode === 'restore') handleRestore(activeItem);
          if (confirmMode === 'permanent') handlePermanentDelete(activeItem);
        }}
        isLoading={
          !!activeItem && mutatingRowId === activeItem.id && actionLoaderStatus
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
          !!activeItem && mutatingRowId === activeItem.id && actionLoaderStatus
        }
      />
    </SlideIn>
  );
};

export default CurrencyList;
