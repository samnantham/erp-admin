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
          minW="90px"
          px={3}
          py={1}
          textAlign="center"
          borderRadius="md"
        >
          {deleted ? 'Trashed' : 'Active'}
        </Badge>
      );
    },
  });
};