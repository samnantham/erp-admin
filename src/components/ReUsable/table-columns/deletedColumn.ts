import { createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';

type BaseRow = {
  deleted_at?: string | null;
};

export const getDeletedColumn = <T extends BaseRow>() => {
  const columnHelper = createColumnHelper<T>();

  return columnHelper.accessor(
    (row) => row.deleted_at,
    {
      id: 'deleted_at',
      header: 'Deleted At',
      cell: (info) =>
        info.getValue()
          ? format(new Date(info.getValue()!), 'yyyy-MM-dd HH:mm')
          : '-',
    }
  );
};