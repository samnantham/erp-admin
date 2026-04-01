import { Badge } from '@chakra-ui/react';
import { createColumnHelper } from '@tanstack/react-table';

type BaseRow = {
  deleted_at?: string | null;
};

export const getStatusColumn = <T extends BaseRow>() => {
  const columnHelper = createColumnHelper<T>();

  return columnHelper.display({
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const deleted = row.original.deleted_at;

      return (
        <Badge
          colorScheme={deleted ? 'red' : 'green'}
          textAlign="center"
          borderRadius="md"
          size={'sm'}
          px={3}
          py={1}
        >
          {deleted ? 'Trashed' : 'Active'}
        </Badge>
      );
    },
  });
};