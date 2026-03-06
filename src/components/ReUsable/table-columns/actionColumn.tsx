import { createColumnHelper } from '@tanstack/react-table';
import BasicTableActions, { ActionsHeader } from '@/components/ReUsable/table-columns/BasicTableActions';

type Props<T> = {
  mutatingRowId?: number | string;
  actionLoaderStatus?: boolean;
  openModal: (item: T, edit?: boolean) => void;
  openSoftDelete: (item: T) => void;
  openPermenantDelete?: (item: T) => void;
  openRestore: (item: T) => void;
};

export const getActionColumn = <
  T extends { id: string | number; is_fixed?: boolean | null }
>(
  props: Props<T>
) => {
  const columnHelper = createColumnHelper<T>();

  const {
    mutatingRowId,
    actionLoaderStatus,
    openModal,
    openSoftDelete,
    openPermenantDelete,
    openRestore,
  } = props;

  return columnHelper.display({
    id: 'actions',
    header: () => <ActionsHeader />,
    cell: (info) => {
      const rowItem = info.row.original;

      const isRowBusy =
        mutatingRowId === rowItem.id && actionLoaderStatus;

      return (
        <BasicTableActions<T>
          item={rowItem}
          isBusy={isRowBusy}
          disableAll={!!rowItem.is_fixed}
          onEdit={(item) => openModal(item, true)}
          onAskSoftDelete={openSoftDelete}
          onAskPermanentDelete={openPermenantDelete}
          onAskRestore={openRestore}
        />
      );
    },
  });
};