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
  stickyLastColumn?: boolean;

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
    case "date": return dateSort;
    case "number": return sortingFns.alphanumeric;
    default: return textSort;
  }
};

// ── Row-height sync ────────────────────────────────────────────────────────
// Keeps left-pane row heights in sync with right-pane (source of truth)
function useSyncRowHeights(
  sourceTbodyRef: React.RefObject<HTMLTableSectionElement>,
  mirrorTbodyRef: React.RefObject<HTMLTableSectionElement>,
  rowCount: number
) {
  const sync = () => {
    const src = sourceTbodyRef.current;
    const mir = mirrorTbodyRef.current;
    if (!src || !mir) return;
    const srcRows = Array.from(src.querySelectorAll<HTMLTableRowElement>("tr"));
    const mirRows = Array.from(mir.querySelectorAll<HTMLTableRowElement>("tr"));
    srcRows.forEach((srcRow, i) => {
      const h = srcRow.getBoundingClientRect().height;
      if (mirRows[i]) mirRows[i].style.height = `${h}px`;
    });
  };

  // Run after every render
  useLayoutEffect(() => { sync(); });

  // Also watch for resize (content changes, font load, etc.)
  useEffect(() => {
    const src = sourceTbodyRef.current;
    if (!src) return;
    const ro = new ResizeObserver(sync);
    ro.observe(src);
    return () => ro.disconnect();
  }, [rowCount]);
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
  stickyLastColumn = false,
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

  // ── Column processing ──────────────────────────────────────────────────
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

  // ── Client-side search ─────────────────────────────────────────────────
  const searchableCols = processedColumns.filter((c) => (c.meta as ColumnMeta)?.searchable);
  const globalFuzzyFilter = (row: any, _id: string, value: string) =>
    searchableCols.some((c) => {
      const cid = c.id ?? (c as any).accessorKey;
      return String(row.getValue(cid) ?? "").toLowerCase().includes(value.toLowerCase());
    });

  // ── Table instance ─────────────────────────────────────────────────────
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

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (enableClientSideSearch) setGlobalFilter(searchValue);
  }, [searchValue, enableClientSideSearch]);

  useEffect(() => {
    if (enablePagination && onPageChange) onPageChange(1);
    if (onPageSizeChange) onPageSizeChange(10);
  }, [resetKey]);

  // ── Sort handler ───────────────────────────────────────────────────────
  const handleSort = (columnId: string) => {
    if (enableClientSideSearch) {
      table.getColumn(columnId)?.toggleSorting();
    } else if (onSortChange) {
      const next = sortBy === columnId && sortDirection === "asc" ? "desc" : "asc";
      onSortChange(columnId, next);
    }
  };

  // ── Pagination counts ──────────────────────────────────────────────────
  const filteredCount = enableClientSideSearch
    ? table.getFilteredRowModel().rows.length
    : data.length;

  const overallCount = enablePagination
    ? (enableClientSideSearch && !totalCount ? filteredCount : totalCount)
    : (enableClientSideSearch ? filteredCount : data.length);

  const startRecord = overallCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, overallCount);

  const rows = table.getRowModel().rows;
  const rowCount = rows.length;

  // ── Split columns: left pane (sticky) vs right pane (scrollable) ───────
  const allHeaders = table.getHeaderGroups()[0]?.headers ?? [];
  const leftHeaders = allHeaders.slice(0, stickyColumns);
  const rightHeaders = allHeaders.slice(stickyColumns);

  // ── Colour constants ───────────────────────────────────────────────────
  const HEADER_BG = "#0C2556";
  const EVEN_ROW_BG = "#ffffff";
  const ODD_ROW_BG = "#F7FAFC";

  // ── Refs for row/header height sync ───────────────────────────────────
  const rightTbodyRef = useRef<HTMLTableSectionElement>(null);
  const leftTbodyRef = useRef<HTMLTableSectionElement>(null);
  const rightTheadRef = useRef<HTMLTableSectionElement>(null);
  const leftTheadRef = useRef<HTMLTableSectionElement>(null);

  // Sync row heights (right → left)
  useSyncRowHeights(rightTbodyRef, leftTbodyRef, rowCount);

  // Sync header height (right → left)
  useLayoutEffect(() => {
    const src = rightTheadRef.current;
    const mir = leftTheadRef.current;
    if (!src || !mir) return;
    const h = src.getBoundingClientRect().height;
    Array.from(mir.querySelectorAll<HTMLTableCellElement>("th")).forEach(
      (th) => { th.style.height = `${h}px`; }
    );
  });

  // ── Style helpers ──────────────────────────────────────────────────────
  const baseThStyle = (width?: string): React.CSSProperties => ({
    background: HEADER_BG,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    ...(width ? { width, maxWidth: width } : {}),
  });

  const rowBg = (rowIndex: number) =>
    rowIndex % 2 === 0 ? EVEN_ROW_BG : ODD_ROW_BG;

  const baseTdStyle = (rowIndex: number, width?: string): React.CSSProperties => ({
    background: rowBg(rowIndex),
    ...(width ? { width, maxWidth: width } : {}),
  });

  // ── Sort icon renderer ─────────────────────────────────────────────────
  const SortIcon = ({ header }: { header: Header<Data, unknown> }) => {
    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
    const sortParam = meta?.sortParam ?? header.column.id;
    const isSorted = enableClientSideSearch ? !!header.column.getIsSorted() : sortBy === sortParam;
    const sortDir = enableClientSideSearch
      ? header.column.getIsSorted()
      : sortBy === sortParam ? sortDirection : false;

    return (
      <Box ml={2} flexShrink={0} display="inline-flex"
        animation={isSorted ? `${blink} 1s ease-in-out infinite` : ""}
      >
        {isSorted
          ? (sortDir === "desc" ? <LuMoveDown strokeWidth={4} /> : <LuMoveUp strokeWidth={4} />)
          : <LuArrowUpDown opacity={0.5} />}
      </Box>
    );
  };

  // ── Shared table sx ────────────────────────────────────────────────────
  const tableSx = {
    "& table": { borderCollapse: "separate", borderSpacing: 0 },
    "& th, & td": { borderBottom: "1px solid", borderColor: "gray.200" },
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return <Center p={4}><Spinner /></Center>;

  const hasLeftPane = stickyColumns > 0;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box>
      <style>{`
        tr:has([aria-expanded="true"]) td { z-index: 2 !important; }
        .chakra-data-table th {
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
      `}</style>

      {/* Title bar */}
      {(title || enableClientSideSearch || enablePagination || headerAction) && showtitleBar && (
        <HStack bg="white" justify="space-between" mb={4} p={noTitlePadding ? 0 : 4} borderTopRadius={4}>
          {title && <Heading size="md">{title}</Heading>}
          {headerAction}
          {enablePagination && onPageSizeChange && (
            <PageLimit currentLimit={pageSize} loading={loading} changeLimit={onPageSizeChange} total={overallCount} />
          )}
          {enableClientSideSearch && onSearchChange && (
            <Box flex={1} maxW="300px">
              <TableSearchBox value={searchValue} onChange={onSearchChange} width="100%" placeholder={searchPlaceholder} />
            </Box>
          )}
        </HStack>
      )}

      {/* Status tabs */}
      {statusTabsStatus && onStatusChange && (
        <StatusTabs status={status ?? "all"} onStatusChange={onStatusChange} />
      )}

      {/* ── Main table wrapper: side-by-side flex ── */}
      <Box
        {...containerProps}
        position="relative"
        minH={rowCount === 0 ? "200px": undefined}
        border="1px"
        borderColor="gray.500"
        borderTopWidth="0"
        width="100%"
        overflow="hidden"
        display="flex"
        alignItems="stretch"
      >

        {rowCount === 0 && (
          <Center
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%" // 🔥 full container height
            pointerEvents="none"
            zIndex={2}
          >
            <Box
              fontSize="md"
              fontWeight="bold"
              color="gray.700"
              textAlign="center"
            >
              {searchValue ? "No matching results found" : "No items to display"}
            </Box>
          </Center>
        )}
        {/* ══ LEFT PANE — fixed sticky columns, no scroll ══ */}
        {hasLeftPane && (
          <Box
            className="chakra-data-table"
            flexShrink={0}
            overflow="hidden"
            sx={{
              ...tableSx
            }}
            background={"#fff"}
          >
            <Table
              {...tableProps}
              size={tableProps?.size ?? "sm"}
              variant="unstyled"
              // bg={HEADER_BG}
              style={{ tableLayout: "auto", width: "max-content", background: "white" }}
            >
              <Thead ref={leftTheadRef}>
                <Tr>
                  {leftHeaders.map((header) => {
                    const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                    const width = (meta as any)?.width;
                    return (
                      <Th
                        key={header.id}
                        isNumeric={meta?.isNumeric}
                        color="white"
                        p={4}
                        minW="100px"
                        cursor={meta?.sortable ? "pointer" : "default"}
                        onClick={meta?.sortable ? () => handleSort(meta?.sortParam ?? header.column.id) : undefined}
                        style={baseThStyle(width)}
                      >
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                          <Box flex="1" minW={0} whiteSpace="normal" wordBreak="break-word" overflowWrap="break-word">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </Box>
                          {meta?.sortable && <SortIcon header={header} />}
                        </Box>
                      </Th>
                    );
                  })}
                </Tr>
              </Thead>
              <Tbody ref={leftTbodyRef} sx={{
                border: "none"
              }}>
                {rows.map((row) => {
                  const rowProps = getRowProps?.(row) ?? {};
                  return (
                    <Tr key={row.id} {...rowProps}>
                      {row.getVisibleCells().slice(0, stickyColumns).map((cell) => {
                        const width = (cell.column.columnDef.meta as any)?.width;
                        return (
                          <Td
                            key={cell.id}
                            isNumeric={(cell.column.columnDef.meta as ColumnMeta)?.isNumeric}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            overflowWrap="break-word"
                            lineHeight="1.6"
                            style={baseTdStyle(row.index, width)}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        );
                      })}
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* ══ RIGHT PANE — scrollable columns, scrollbar only here ══ */}
        <Box
          className="chakra-data-table"
          flex={1}
          minW={0}
          overflowX="auto"
          overflowY="hidden"
          background={"#fff"}
          sx={{
            ...tableSx,
            scrollbarWidth: "thin",
            scrollbarColor: "#718096 transparent",
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-track": { background: "#E2E8F0", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb": { background: "#718096", borderRadius: "4px" },
            "&::-webkit-scrollbar-thumb:hover": { background: "#4A5568" },
          }}
        >
          <Table
            {...tableProps}
            size={tableProps?.size ?? "sm"}
            variant="unstyled"
            // bg={HEADER_BG}
            style={{ tableLayout: "auto", width: "max-content", minWidth: "100%", background: "white" }}
          >
            <Thead ref={rightTheadRef}>
              <Tr>
                {rightHeaders.map((header, i) => {
                  const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                  const isLastSticky = stickyLastColumn && i === rightHeaders.length - 1;
                  const width = (meta as any)?.width;
                  return (
                    <Th
                      key={header.id}
                      isNumeric={meta?.isNumeric}
                      color="white"
                      p={4}
                      minH="46px"
                      minW="100px"
                      cursor={meta?.sortable ? "pointer" : "default"}
                      onClick={meta?.sortable ? () => handleSort(meta?.sortParam ?? header.column.id) : undefined}
                      style={{
                        ...baseThStyle(width),
                        ...(isLastSticky ? { position: "sticky", right: 0, zIndex: 1 } : {}),
                      }}
                    >
                      <Box display="flex" alignItems="center" flexWrap="wrap">
                        <Box flex="1" minW={0} whiteSpace="normal" wordBreak="break-word" overflowWrap="break-word">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Box>
                        {meta?.sortable && <SortIcon header={header} />}
                      </Box>
                    </Th>
                  );
                })}
              </Tr>
            </Thead>

            <Tbody ref={rightTbodyRef}>
              {(
                rows.map((row) => {
                  const rowProps = getRowProps?.(row) ?? {};
                  const rightCells = row.getVisibleCells().slice(stickyColumns);
                  return (
                    <Tr key={row.id} {...rowProps}>
                      {rightCells.map((cell, i) => {
                        const isLastSticky = stickyLastColumn && i === rightCells.length - 1;
                        const width = (cell.column.columnDef.meta as any)?.width;
                        return (
                          <Td
                            key={cell.id}
                            isNumeric={(cell.column.columnDef.meta as ColumnMeta)?.isNumeric}
                            maxW={isLastSticky ? undefined : "200px"}
                            whiteSpace="normal"
                            wordBreak="break-word"
                            overflowWrap="break-word"
                            lineHeight="1.6"
                            style={{
                              ...baseTdStyle(row.index, width),
                              ...(isLastSticky ? { position: "sticky", right: 0 } : {}),
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        );
                      })}
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>

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