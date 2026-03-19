import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  Spinner,
  Table,
  TableContainerProps,
  TableProps,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Checkbox,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import {
  ColumnDef,
  Header,
  Row,
  RowSelectionState,
  SortingFn,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  sortingFns,
  useReactTable,
} from "@tanstack/react-table";
import { LuArrowUpDown, LuMoveDown, LuMoveUp } from "react-icons/lu";

import { TableSearchBox } from "@/components/DataTable/SearchBox";
import { Status, StatusTabs } from "@/components/StatusTabs";
import { PageLimit } from "@/components/PageLimit";
import Pagination from "@/components/Pagination";

// ── Types ──────────────────────────────────────────────────────────────────
type ColumnMeta = {
  sortable?: boolean;
  isNumeric?: boolean;
  sortParam?: string;
  searchable?: boolean;
  sortType?: "string" | "number" | "timestamp" | "date";
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
  stickyColumns?: number;

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
  onPageSizeChange?: (value: number) => void;

  title?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  headerAction?: React.ReactNode;
  showtitleBar?: boolean;
  noTitlePadding?: boolean;

  statusTabsStatus?: boolean;
  status?: Status;
  onStatusChange?: (value: string) => void;

  resetKey?: string | number;
};

// ── Sorting helpers ────────────────────────────────────────────────────────
const blink = keyframes`
  0%,100% { opacity: 1; }
  50%      { opacity: 0.3; }
`;

const timestampSort: SortingFn<any> = (a, b, id) =>
  Number(a.getValue(id)) - Number(b.getValue(id));

const dateSort: SortingFn<any> = (a, b, id) =>
  new Date(a.getValue(id)).getTime() - new Date(b.getValue(id)).getTime();

const textSort: SortingFn<any> = (a, b, id) =>
  String(a.getValue(id) ?? "").trim().localeCompare(
    String(b.getValue(id) ?? "").trim(),
    undefined,
    { sensitivity: "base", numeric: true, ignorePunctuation: true }
  );

const sortFnFor = (type?: string): SortingFn<any> => {
  switch (type) {
    case "timestamp": return timestampSort;
    case "date":      return dateSort;
    case "number":    return sortingFns.alphanumeric;
    default:          return textSort;
  }
};

// ── Row height sync hook ───────────────────────────────────────────────────
// Measures every row in the RIGHT table and mirrors the exact pixel height
// onto the corresponding row in the LEFT (frozen) table.
// Uses ResizeObserver so it re-fires whenever content reflows.
function useSyncRowHeights(
  leftTbodyRef: React.RefObject<HTMLTableSectionElement>,
  rightTbodyRef: React.RefObject<HTMLTableSectionElement>,
  rowCount: number,
  enabled: boolean
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const left  = leftTbodyRef.current;
    const right = rightTbodyRef.current;
    if (!left || !right) return;

    const sync = () => {
      const rightRows = right.querySelectorAll<HTMLTableRowElement>("tr");
      const leftRows  = left.querySelectorAll<HTMLTableRowElement>("tr");
      rightRows.forEach((rr, i) => {
        if (leftRows[i]) {
          const h = rr.getBoundingClientRect().height;
          leftRows[i].style.height = `${h}px`;
        }
      });
    };

    sync();

    const ro = new ResizeObserver(sync);
    right.querySelectorAll("tr").forEach((tr) => ro.observe(tr));

    return () => ro.disconnect();
  }, [enabled, rowCount]);

  // Also sync the single header row
  const leftTheadRef  = useRef<HTMLTableSectionElement>(null);
  const rightTheadRef = useRef<HTMLTableSectionElement>(null);

  useLayoutEffect(() => {
    if (!enabled) return;
    const lh = leftTheadRef.current?.querySelector("tr") as HTMLTableRowElement | null;
    const rh = rightTheadRef.current?.querySelector("tr") as HTMLTableRowElement | null;
    if (!lh || !rh) return;
    const sync = () => { lh.style.height = `${rh.getBoundingClientRect().height}px`; };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(rh);
    return () => ro.disconnect();
  }, [enabled]);

  return { leftTheadRef, rightTheadRef };
}

// ── Component ──────────────────────────────────────────────────────────────
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
  stickyColumns = 0,
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
  onPageSizeChange,
  title,
  searchPlaceholder = "Search",
  onSearchChange,
  headerAction,
  showtitleBar = true,
  noTitlePadding = false,
  statusTabsStatus = false,
  status,
  onStatusChange,
  resetKey = "",
}: DataTableProps<Data>) {

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>(
    sortBy ? [{ id: sortBy, desc: sortDirection === "desc" }] : []
  );

  // ── Column processing ─────────────────────────────────────────────────────
  const processedColumns = useMemo<ColumnDef<Data>[]>(() =>
    columns.map((col) => {
      const meta = col.meta as ColumnMeta | undefined;
      const sortType = meta?.sortType ?? (meta?.sortable ? "string" : undefined);
      if (!sortType) return col;
      return { ...col, sortingFn: sortFnFor(sortType), enableSorting: true, sortUndefined: 1 };
    }),
    [columns]
  );

  const finalColumns = useMemo<ColumnDef<Data>[]>(() => {
    if (!enableRowSelection) return processedColumns;
    const selectionCol: ColumnDef<Data> = {
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
    return [selectionCol, ...processedColumns];
  }, [enableRowSelection, processedColumns]);

  // ── Client-side search ────────────────────────────────────────────────────
  const searchableCols = processedColumns.filter((c) => (c.meta as ColumnMeta)?.searchable);
  const globalFuzzyFilter = (row: any, _id: string, value: string) =>
    searchableCols.some((c) => {
      const cid = c.id ?? (c as any).accessorKey;
      return String(row.getValue(cid) ?? "").toLowerCase().includes(value.toLowerCase());
    });

  // ── Table instance ────────────────────────────────────────────────────────
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
        : sortBy ? [{ id: sortBy, desc: sortDirection === "desc" }] : [],
      globalFilter: enableClientSideSearch ? globalFilter : "",
      rowSelection: rowSelection ?? {},
      columnVisibility: { id: false },
    },
  });

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (enableClientSideSearch) setGlobalFilter(searchValue);
  }, [searchValue, enableClientSideSearch]);

  useEffect(() => {
    if (enablePagination && onPageChange) onPageChange(1);
    if (onPageSizeChange) onPageSizeChange(10);
  }, [resetKey]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (columnId: string) => {
    if (enableClientSideSearch) {
      table.getColumn(columnId)?.toggleSorting();
    } else if (onSortChange) {
      const next = sortBy === columnId && sortDirection === "asc" ? "desc" : "asc";
      onSortChange(columnId, next);
    }
  };

  // ── Pagination counts ─────────────────────────────────────────────────────
  const filteredCount = enableClientSideSearch
    ? table.getFilteredRowModel().rows.length
    : data.length;

  const overallCount = enablePagination
    ? (enableClientSideSearch && !totalCount ? filteredCount : totalCount)
    : (enableClientSideSearch ? filteredCount : data.length);

  const startRecord = overallCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord   = Math.min(currentPage * pageSize, overallCount);

  // ── Row height sync ───────────────────────────────────────────────────────
  const hasStickyColumns = stickyColumns > 0 && table.getRowModel().rows.length > 0;
  const leftTbodyRef  = useRef<HTMLTableSectionElement>(null);
  const rightTbodyRef = useRef<HTMLTableSectionElement>(null);
  const { leftTheadRef, rightTheadRef } = useSyncRowHeights(
    leftTbodyRef,
    rightTbodyRef,
    table.getRowModel().rows.length,
    hasStickyColumns
  );

  // ── Shared header/row renderers ───────────────────────────────────────────
  const renderHeaderRow = (tableHeaders: Header<Data, unknown>[]) =>
    tableHeaders.map((header) => {
      const meta      = header.column.columnDef.meta as ColumnMeta | undefined;
      const sortParam = meta?.sortParam ?? header.column.id;
      const isSortable = meta?.sortable === true;
      const isSorted   = enableClientSideSearch
        ? !!header.column.getIsSorted()
        : sortBy === sortParam;
      const sortDir    = enableClientSideSearch
        ? header.column.getIsSorted()
        : sortBy === sortParam ? sortDirection : false;

      return (
        <Th
          key={header.id}
          isNumeric={meta?.isNumeric}
          color="white"
          p={4}
          h="46px"
          cursor={isSortable ? "pointer" : "default"}
          onClick={isSortable ? () => handleSort(sortParam) : undefined}
        >
          <Box display="flex" alignItems="center">
            {flexRender(header.column.columnDef.header, header.getContext())}
            {isSortable && (
              <Box
                ml={2}
                display="inline-flex"
                animation={isSorted ? `${blink} 1s ease-in-out infinite` : ""}
              >
                {isSorted
                  ? (sortDir === "desc" ? <LuMoveDown strokeWidth={4} /> : <LuMoveUp strokeWidth={4} />)
                  : <LuArrowUpDown opacity={0.5} />}
              </Box>
            )}
          </Box>
        </Th>
      );
    });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return <Center p={4}><Spinner /></Center>;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box>

      {/* Title bar */}
      {(title || enableClientSideSearch || enablePagination || headerAction) && showtitleBar && (
        <HStack
          bg="white"
          justify="space-between"
          mb={4}
          p={noTitlePadding ? 0 : 4}
          borderTopRadius={4}
        >
          {title && <Heading size="md">{title}</Heading>}
          {headerAction}
          {enablePagination && onPageSizeChange && (
            <PageLimit
              currentLimit={pageSize}
              loading={loading}
              changeLimit={onPageSizeChange}
              total={overallCount}
            />
          )}
          {enableClientSideSearch && onSearchChange && (
            <Box flex={1} maxW="300px">
              <TableSearchBox
                value={searchValue}
                onChange={onSearchChange}
                width="100%"
                placeholder={searchPlaceholder}
              />
            </Box>
          )}
        </HStack>
      )}

      {/* Status tabs */}
      {statusTabsStatus && onStatusChange && (
        <StatusTabs status={status ?? "all"} onStatusChange={onStatusChange} />
      )}

      {/*
        Two-table layout for sticky columns.

        Why two tables instead of CSS sticky:
        - CSS `position:sticky` on <th>/<td> requires `border-collapse:separate`
          which breaks the existing striped variant border rendering.
        - More importantly: sticky <th> cells with bg="inherit" don't reliably
          pick up the #0C2556 header background on scroll in all browsers,
          creating the visible color-break shown in the screenshot.

        Why the old two-table approach had the scroll glitch:
        - Row heights in the left table didn't match the right when content
          wrapped, causing the two scrolling surfaces to desync visually.

        Fix: keep two tables, but use ResizeObserver (useSyncRowHeights) to
        mirror the exact pixel height of every right-table row onto the
        corresponding left-table row. This eliminates the height mismatch
        while preserving correct bg colours in both tables.
      */}
      <Flex
        {...containerProps}
        border="1px"
        borderColor="gray.500"
        boxShadow="md"
        borderTopWidth="0"
        overflow="hidden"
        width="100%"
        minWidth={0}
      >

        {/* ── LEFT: frozen columns ── */}
        {hasStickyColumns && (
          <Box overflow="hidden" flexShrink={0}>
            <Table
              size={tableProps?.size ?? "sm"}
              variant="striped"
              bg="#0C2556"
              minWidth="max-content"
            >
              <Thead ref={leftTheadRef}>
                {table.getHeaderGroups().map((hg) => (
                  <Tr key={hg.id}>
                    {renderHeaderRow(hg.headers.slice(0, stickyColumns))}
                  </Tr>
                ))}
              </Thead>
              <Tbody ref={leftTbodyRef} bg="white">
                {table.getRowModel().rows.map((row) => {
                  const rowProps = getRowProps?.(row) ?? {};
                  return (
                    <Tr
                      key={row.id}
                      {...rowProps}
                      bg={row.index % 2 === 0 ? "white" : "gray.50"}
                    >
                      {row.getVisibleCells().slice(0, stickyColumns).map((cell) => (
                        <Td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* ── RIGHT: scrollable columns ── */}
        <Box
          flex={1}
          minWidth={0}
          overflowX="auto"
          sx={{
            scrollbarWidth: "thin",
            scrollbarColor: "#718096 transparent",
            "&::-webkit-scrollbar":             { height: "8px" },
            "&::-webkit-scrollbar-track":       { background: "transparent" },
            "&::-webkit-scrollbar-thumb":       { background: "#718096", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb:hover": { background: "#4A5568" },
          }}
        >
          <Table
            {...tableProps}
            size={tableProps?.size ?? "sm"}
            variant="striped"
            bg="#0C2556"
            minWidth="max-content"
          >
            <Thead ref={rightTheadRef}>
              {table.getHeaderGroups().map((hg) => (
                <Tr key={hg.id}>
                  {renderHeaderRow(hg.headers.slice(stickyColumns))}
                </Tr>
              ))}
            </Thead>
            <Tbody ref={rightTbodyRef} bg="white">
              {table.getRowModel().rows.length === 0 ? (
                <Tr>
                  <Td
                    colSpan={finalColumns.length - stickyColumns}
                    textAlign="center"
                    py={8}
                  >
                    {searchValue ? "No matching results found" : "No items to display"}
                  </Td>
                </Tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const rowProps = getRowProps?.(row) ?? {};
                  return (
                    <Tr
                      key={row.id}
                      {...rowProps}
                      bg={row.index % 2 === 0 ? "white" : "gray.50"}
                    >
                      {row.getVisibleCells().slice(stickyColumns).map((cell) => (
                        <Td
                          key={cell.id}
                          maxW="200px"
                          whiteSpace="normal"
                          wordBreak="break-word"
                          lineHeight="1.6"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </Flex>

      {/* Pagination footer */}
      <Flex mt={4} px={2} justify="space-between" align="center" flexWrap="wrap">
        {overallCount > 0 && (
          <Box fontSize="sm">
            Showing {startRecord} to {endRecord} of {overallCount} records
          </Box>
        )}
        {enablePagination && (
          <Pagination
            currentPage={currentPage}
            totalCount={overallCount}
            pageSize={pageSize}
            onPageChange={onPageChange!}
          />
        )}
      </Flex>
    </Box>
  );
}