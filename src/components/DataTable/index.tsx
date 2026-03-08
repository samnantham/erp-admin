import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Center,
  Spinner,
  Table,
  TableContainer,
  TableContainerProps,
  TableProps,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Checkbox,
  Flex
} from "@chakra-ui/react";

import { keyframes } from "@emotion/react";

import Pagination from "@/components/Pagination";

import {
  Row,
  ColumnDef,
  SortingFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  sortingFns,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";

import { LuArrowUpDown, LuMoveDown, LuMoveUp } from "react-icons/lu";

type ColumnMeta = {
  sortable?: boolean;
  isNumeric?: boolean;
  sortParam?: string;
  searchable?: boolean;
  sortType?: "string" | "number" | "timestamp" | "date";
};

const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

const timestampSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = Number(rowA.getValue(columnId));
  const b = Number(rowB.getValue(columnId));
  return a > b ? 1 : a < b ? -1 : 0;
};

const dateSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = new Date(rowA.getValue(columnId)).getTime();
  const b = new Date(rowB.getValue(columnId)).getTime();
  return a > b ? 1 : a < b ? -1 : 0;
};

const caseInsensitiveTextSort: SortingFn<any> = (rowA, rowB, columnId) => {
  const a = String(rowA.getValue(columnId) ?? "").trim();
  const b = String(rowB.getValue(columnId) ?? "").trim();

  return a.localeCompare(b, undefined, {
    sensitivity: "base",
    numeric: true,
    ignorePunctuation: true,
  });
};

export type DataTableProps<Data extends object> = {
  data: Data[];
  columns: ColumnDef<Data, any>[];
  loading?: boolean;

  enableRowSelection?: boolean;
  isRowSelectable?: (row: Data) => boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: any) => void;

  containerProps?: TableContainerProps;
  tableProps?: TableProps;

  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (columnId: string, direction: "asc" | "desc") => void;

  searchValue?: string;
  enableClientSideSearch?: boolean;

  getRowProps?: (row: Row<Data>) => React.ComponentProps<typeof Tr>;

  enablePagination?: boolean;
  currentPage?: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;

  stickyColumns?: number;
};

export function DataTable<Data extends object>({
  data,
  columns,
  loading,
  enableRowSelection = false,
  isRowSelectable,
  rowSelection,
  onRowSelectionChange,
  containerProps,
  tableProps,
  sortBy,
  sortDirection,
  onSortChange,
  searchValue = "",
  enableClientSideSearch = false,
  getRowProps,
  enablePagination = false,
  currentPage = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
  stickyColumns = 0
}: DataTableProps<Data>) {

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>(
    sortBy ? [{ id: sortBy, desc: sortDirection === "desc" }] : []
  );

  /* ================= Sorting Enhancement ================= */

  const processedColumns = useMemo(() => {
    return columns.map((column) => {
      const meta = column.meta as ColumnMeta | undefined;
      const sortType =
        meta?.sortType || (meta?.sortable ? "string" : undefined);

      if (!sortType) return column;

      let sortingFn: SortingFn<Data>;

      switch (sortType) {
        case "timestamp":
          sortingFn = timestampSort;
          break;
        case "date":
          sortingFn = dateSort;
          break;
        case "number":
          sortingFn = sortingFns.alphanumeric;
          break;
        default:
          sortingFn = caseInsensitiveTextSort;
      }

      return {
        ...column,
        sortingFn,
        enableSorting: true,
        sortUndefined: 1,
      } as ColumnDef<Data>;
    });
  }, [columns]);

  /* ================= Row Selection ================= */

  const finalColumns = useMemo(() => {
    if (!enableRowSelection) return processedColumns;

    const selectionColumn: ColumnDef<Data> = {
      id: "select",
      size: 50,
      header: ({ table }) => (
        <Checkbox
          colorScheme="green"
          isChecked={table.getIsAllRowsSelected()}
          isIndeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          colorScheme="green"
          isChecked={row.getIsSelected()}
          isDisabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    };

    return [selectionColumn, ...processedColumns];
  }, [enableRowSelection, processedColumns]);

  /* ================= Search ================= */

  const searchableColumns = processedColumns.filter(
    (col) => (col.meta as ColumnMeta)?.searchable
  );

  const globalFuzzyFilter = (
    row: any,
    _columnId: string,
    filterValue: string
  ) =>
    searchableColumns.some((col) => {
      const columnId = col.id || (col as any).accessorKey;
      const value = row.getValue(columnId);
      return String(value ?? "")
        .toLowerCase()
        .includes(filterValue.toLowerCase());
    });

  /* ================= Table Instance ================= */

  const table = useReactTable({
    data,
    columns: finalColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: enableClientSideSearch ? getFilteredRowModel() : undefined,
    getSortedRowModel: enableClientSideSearch ? getSortedRowModel() : undefined,
    manualSorting: !enableClientSideSearch,
    manualFiltering: !enableClientSideSearch,
    globalFilterFn: enableClientSideSearch ? globalFuzzyFilter : undefined,
    onSortingChange: enableClientSideSearch ? setSorting : undefined,
    onGlobalFilterChange: enableClientSideSearch ? setGlobalFilter : undefined,

    enableRowSelection: enableRowSelection
      ? (row) => (isRowSelectable ? isRowSelectable(row.original) : true)
      : false,

    onRowSelectionChange,

    state: {
      sorting: enableClientSideSearch
        ? sorting
        : sortBy
          ? [{ id: sortBy, desc: sortDirection === "desc" }]
          : [],
      globalFilter: enableClientSideSearch ? globalFilter : "",
      rowSelection: rowSelection ?? {},
      columnVisibility: { id: false },
    },
  });

  useEffect(() => {
    if (enableClientSideSearch) {
      setGlobalFilter(searchValue);
    }
  }, [searchValue, enableClientSideSearch]);

  const handleSort = (columnId: string) => {
    if (enableClientSideSearch) {
      const column = table.getColumn(columnId);
      if (column?.getCanSort()) column.toggleSorting();
    } else if (onSortChange) {

      const newDirection =
        sortBy === columnId
          ? sortDirection === "asc"
            ? "desc"
            : "asc"
          : "asc";

      onSortChange(columnId, newDirection);
    }
  };

  let startRecord = 0;
  let endRecord = 0;
  let totalRecords = 0;
  let overallcount = 0;

  if (enablePagination) {
    totalRecords = totalCount;
    startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    endRecord = Math.min(currentPage * pageSize, totalRecords);
    overallcount = totalCount;
  } else {
    totalRecords = data.length;
    startRecord = totalRecords > 0 ? 1 : 0;
    endRecord = totalRecords;
    overallcount = totalRecords;
  }

  /* ================= Loading ================= */

  if (loading) {
    return (
      <Center p="4">
        <Spinner />
      </Center>
    );
  }

  /* ================= Render ================= */

  return (
    <>
      <Flex
        {...containerProps}
        border="1px"
        borderColor="gray.500"
        boxShadow="md"
        borderTopWidth="0"
        overflow="hidden"
      >

        {/* LEFT FROZEN */}
        {stickyColumns > 0 && (
          <TableContainer overflow="hidden">
            <Table size="sm" variant="striped" bg="#0C2556">

              <Thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.slice(0, stickyColumns).map((header) => {

                      const meta = header.column.columnDef.meta as ColumnMeta;
                      const sortParam = meta?.sortParam;
                      const columnId = header.column.id;
                      const isSortable = meta?.sortable === true;

                      const isSorted = enableClientSideSearch
                        ? header.column.getIsSorted()
                        : sortBy === (sortParam ?? columnId);

                      const currentSortDirection = enableClientSideSearch
                        ? header.column.getIsSorted()
                        : sortBy === (sortParam ?? columnId)
                          ? sortDirection
                          : false;

                      return (
                        <Th
                          key={header.id}
                          onClick={
                            isSortable
                              ? () => handleSort(sortParam ?? columnId)
                              : undefined
                          }
                          isNumeric={meta?.isNumeric}
                          color="white"
                          p={4}
                          cursor={isSortable ? "pointer" : "default"}
                        >
                          <Box display="flex" alignItems="center">
                            {flexRender(header.column.columnDef.header, header.getContext())}

                            {isSortable && (
                              <Box ml={2} display="inline-flex"
                                animation={isSorted ? `${blink} 1s ease-in-out infinite` : ""}
                              >
                                {isSorted ? (
                                  currentSortDirection === "desc"
                                    ? <LuMoveDown strokeWidth={4} />
                                    : <LuMoveUp strokeWidth={4} />
                                ) : (
                                  <LuArrowUpDown opacity={0.5} />
                                )}
                              </Box>
                            )}
                          </Box>
                        </Th>
                      );
                    })}
                  </Tr>
                ))}
              </Thead>

              <Tbody bg="white">
                {table.getRowModel().rows.map((row) => {
                  const rowProps = getRowProps?.(row) ?? {};
                  return (
                    <Tr key={row.id} {...rowProps}>
                      {row.getVisibleCells().slice(0, stickyColumns).map((cell) => (
                        <Td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  );
                })}
                {finalColumns.length > 0 && stickyColumns > 0 &&
                  table.getRowModel().rows.length === 0 && (
                    <Tr>
                      <Td colSpan={stickyColumns} textAlign="center">
                        {searchValue
                          ? "No matching results found"
                          : "No items to display"}
                      </Td>
                    </Tr>
                  )}
              </Tbody>
            </Table>
          </TableContainer>
        )}

        {/* RIGHT SCROLL */}
<TableContainer
  flex="1"
  overflowX={(finalColumns.length > 0 && stickyColumns > 0) ? "auto" : "hidden"}
   sx={{
    scrollbarWidth: "thin",                 // Firefox
    scrollbarColor: "#718096 transparent",  // Firefox

    "&::-webkit-scrollbar": {
      height: "8px",                        // horizontal scrollbar height
    },
    "&::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "#718096",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
      background: "#4A5568",
    },
  }}
>
          <Table
            {...tableProps}
            size={tableProps?.size || "sm"}
            variant="striped"
            bg="#0C2556"
            minWidth="max-content"
          >
            <Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Tr key={headerGroup.id}>
                  {headerGroup.headers.slice(stickyColumns).map((header) => {

                    const meta = header.column.columnDef.meta as ColumnMeta;
                    const sortParam = meta?.sortParam;
                    const columnId = header.column.id;
                    const isSortable = meta?.sortable === true;

                    const isSorted = enableClientSideSearch
                      ? header.column.getIsSorted()
                      : sortBy === (sortParam ?? columnId);

                    const currentSortDirection = enableClientSideSearch
                      ? header.column.getIsSorted()
                      : sortBy === (sortParam ?? columnId)
                        ? sortDirection
                        : false;

                    return (
                      <Th
                        key={header.id}
                        onClick={
                          isSortable
                            ? () => handleSort(sortParam ?? columnId)
                            : undefined
                        }
                        isNumeric={meta?.isNumeric}
                        color="white"
                        p={4}
                        cursor={isSortable ? "pointer" : "default"}
                      >
                        <Box display="flex" alignItems="center">
                          {flexRender(header.column.columnDef.header, header.getContext())}

                          {isSortable && (
                            <Box ml={2} display="inline-flex"
                              animation={isSorted ? `${blink} 1s ease-in-out infinite` : ""}
                            >
                              {isSorted ? (
                                currentSortDirection === "desc"
                                  ? <LuMoveDown strokeWidth={4} />
                                  : <LuMoveUp strokeWidth={4} />
                              ) : (
                                <LuArrowUpDown opacity={0.5} />
                              )}
                            </Box>
                          )}
                        </Box>
                      </Th>
                    );
                  })}
                </Tr>
              ))}
            </Thead>

            <Tbody bg="white">
              {table.getRowModel().rows.map((row) => {
                const rowProps = getRowProps?.(row) ?? {};
                return (
                  <Tr key={row.id} {...rowProps}>
                    {row.getVisibleCells().slice(stickyColumns).map((cell) => (
                      <Td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Td>
                    ))}
                  </Tr>
                );
              })}
              {finalColumns.length > 0 && stickyColumns === 0 &&
                table.getRowModel().rows.length === 0 && (
                  <Tr>
                    <Td
                      colSpan={finalColumns.length - stickyColumns}
                      textAlign="center"
                    >
                      {searchValue
                        ? "No matching results found"
                        : "No items to display"}
                    </Td>
                  </Tr>
                )}
            </Tbody>
          </Table>
        </TableContainer>
      </Flex>

      <Flex
        mt={4}
        px={2}
        justify="space-between"
        align="center"
        flexWrap="wrap"
      >
        {overallcount > 0 && (
          <Box fontSize="sm">
            Showing {startRecord} to {endRecord} of {overallcount} records
          </Box>)}
        {enablePagination && (
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={onPageChange!}
          />)}
      </Flex>
    </>
  );
}