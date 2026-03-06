import { format } from 'date-fns';
import { createColumnHelper } from '@tanstack/react-table';

type BaseRow = {
    id: string | number;
    name: string;
    created_at: string;
    updated_at: string;
};

export const getBaseColumns = <T extends BaseRow>() => {
    const columnHelper = createColumnHelper<T>();

    return [
        columnHelper.accessor((row) => row.id, {
            id: 'id',
            header: 'ID',
            cell: (info) => info.getValue(),
            enableHiding: true,
            meta: {
                hidden: true,
            },
        }),
        columnHelper.display({
            cell: (info) => info.row.index + 1,
            meta: { sortable: false },
            header: '#',
            id: 'sNo',
            size: 60,
        }),
        columnHelper.accessor((row) => row.name, {
            id: 'name',
            header: 'Name',
            cell: (info) => info.getValue(),
            meta: {
                sortable: true,
                searchable: true,
                sortType: 'string',
            },
        }),

        columnHelper.accessor((row) => row.created_at, {
            id: 'created_at',
            header: 'Created At',
            cell: (info) =>
                format(new Date(info.getValue()), 'dd-MMM-yyyy HH:mm'),
        }),

        columnHelper.accessor((row) => row.updated_at, {
            id: 'updated_at',
            header: 'Modified At',
            cell: (info) =>
                format(new Date(info.getValue()), 'dd-MMM-yyyy HH:mm'),
        }),
    ];
};