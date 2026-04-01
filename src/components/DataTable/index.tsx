import React, { useEffect, useMemo, useState } from "react";
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
  width?: string;
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

// ── Row display-index context ──────────────────────────────────────────────
// DataTable provides this for each rendered row so makeSnoCellRenderer can
// read the correct sequential position (1-based) without relying on row.index.
export const RowDisplayIndexContext = React.createContext<number>(0);

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
  String(a.getValue(id) ?? "")
    .trim()
    .localeCompare(String(b.getValue(id) ?? "").trim(), undefined, {
      sensitivity: "base",
      numeric: true,
      ignorePunctuation: true,
    });

const sortFnFor = (type?: string): SortingFn<any> => {
  switch (type) {
    case "timestamp": return timestampSort;
    case "date":      return dateSort;
    case "number":    return sortingFns.alphanumeric;
    default:          return textSort;
  }
};

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
  const processedColumns = useMemo<ColumnDef<Data>[]>(
    () =>
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
  const searchableCols = processedColumns.filter(
    (c) => (c.meta as ColumnMeta)?.searchable
  );
  const globalFuzzyFilter = (row: any, _id: string, value: string) =>
    searchableCols.some((c) => {
      const cid = c.id ?? (c as any).accessorKey;
      return String(row.getValue(cid) ?? "")
        .toLowerCase()
        .includes(value.toLowerCase());
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
        : sortBy
        ? [{ id: sortBy, desc: sortDirection === "desc" }]
        : [],
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
    ? enableClientSideSearch && !totalCount ? filteredCount : totalCount
    : enableClientSideSearch ? filteredCount : data.length;

  const startRecord = overallCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, overallCount);

  const rows = table.getRowModel().rows;
  const rowCount = rows.length;

  // ── Colour constants ───────────────────────────────────────────────────
  const HEADER_BG   = "#0C2556";
  const EVEN_ROW_BG = "#ffffff";
  const ODD_ROW_BG  = "#F7FAFC";

  // ── Pre-compute cumulative left offsets for sticky columns ─────────────
  const allHeaders = table.getHeaderGroups()[0]?.headers ?? [];

  // ── Compute explicit table width from column definitions ───────────────
  // Must NOT use "max-content" — when tbody is empty the browser computes
  // max-content from header text alone (ignoring <colgroup>), causing headers
  // to reflow. An explicit pixel width keeps columns locked regardless of data.
  const totalTableWidth = useMemo(() => {
    return allHeaders.reduce((sum, header) => {
      const meta = header.column.columnDef.meta as ColumnMeta | undefined;
      const w = meta?.width ? parseInt(meta.width, 10) : 150;
      return sum + (isNaN(w) ? 150 : w);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHeaders.length]);

  const stickyLeftOffsets = useMemo(() => {
    const offsets: number[] = [];
    let accumulated = 0;
    allHeaders.forEach((header, i) => {
      if (i < stickyColumns) {
        offsets.push(accumulated);
        const meta = header.column.columnDef.meta as ColumnMeta | undefined;
        const w    = meta?.width ? parseInt(meta.width, 10) : 150;
        accumulated += isNaN(w) ? 150 : w;
      } else {
        offsets.push(-1);
      }
    });
    return offsets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allHeaders.length, stickyColumns]);

  // ── Style helpers ──────────────────────────────────────────────────────
  const STICKY_LAST_PAD = "12px";

  const thStyle = (width?: string, stickyLeft?: number, isLastSticky?: boolean): React.CSSProperties => ({
    background: HEADER_BG,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    minWidth: width ?? "150px",
    padding: STICKY_LAST_PAD,
    textAlign: "left",
    ...(width ? { width, maxWidth: width } : {}),
    ...(stickyLeft !== undefined ? { position: "sticky", left: stickyLeft, zIndex: 3 } : {}),
    ...(isLastSticky ? { position: "sticky", right: 0, zIndex: 3 } : {}),
  });

  const tdStyle = (rowIndex: number, width?: string, stickyLeft?: number, isLastSticky?: boolean): React.CSSProperties => ({
    background: rowIndex % 2 === 0 ? EVEN_ROW_BG : ODD_ROW_BG,
    minWidth: width ?? "150px",
    padding: STICKY_LAST_PAD,
    ...(width ? { width, maxWidth: width } : {}),
    ...(stickyLeft !== undefined ? { position: "sticky", left: stickyLeft, zIndex: 2 } : {}),
    ...(isLastSticky ? { position: "sticky", right: 0, zIndex: 2 } : {}),
  });

  // ── Sort icon ──────────────────────────────────────────────────────────
  const SortIcon = ({ header }: { header: Header<Data, unknown> }) => {
    const meta      = header.column.columnDef.meta as ColumnMeta | undefined;
    const sortParam = meta?.sortParam ?? header.column.id;
    const isSorted  = enableClientSideSearch ? !!header.column.getIsSorted() : sortBy === sortParam;
    const sortDir   = enableClientSideSearch
      ? header.column.getIsSorted()
      : sortBy === sortParam ? sortDirection : false;

    return (
      <Box ml={2} flexShrink={0} display="inline-flex" animation={isSorted ? `${blink} 1s ease-in-out infinite` : ""}>
        {isSorted
          ? sortDir === "desc" ? <LuMoveDown strokeWidth={4} /> : <LuMoveUp strokeWidth={4} />
          : <LuArrowUpDown opacity={0.5} />}
      </Box>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return <Center p={4}><Spinner /></Center>;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box>
      <style>{`
        tr:has([aria-expanded="true"]) td { z-index: 4 !important; }
        .chakra-data-table th,
        .chakra-data-table td {
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
          {/* Show PageLimit here only when status tabs are NOT present;
              otherwise it moves to the tabs row below */}
          {enablePagination && onPageSizeChange && !(statusTabsStatus && onStatusChange) && (
            <PageLimit currentLimit={pageSize} loading={loading} changeLimit={onPageSizeChange} total={overallCount} />
          )}
          {enableClientSideSearch && onSearchChange && (
            <Box flex={1} maxW="300px">
              <TableSearchBox value={searchValue} onChange={onSearchChange} width="100%" placeholder={searchPlaceholder} />
            </Box>
          )}
        </HStack>
      )}

      {/* Status tabs + PageLimit on the same row */}
      {statusTabsStatus && onStatusChange && (
        <Flex align="center" justify="space-between">
          <StatusTabs status={status ?? "all"} onStatusChange={onStatusChange} />
          {enablePagination && onPageSizeChange && (
            <PageLimit currentLimit={pageSize} loading={loading} changeLimit={onPageSizeChange} total={overallCount} />
          )}
        </Flex>
      )}

      <Box
        {...containerProps}
        className="chakra-data-table"
        position="relative"
        border="1px"
        borderColor="gray.500"
        borderTopWidth="0"
        width="100%"
        overflowX="auto"
        overflowY="auto"
        height="460px"
        sx={{
          "& table": { borderCollapse: "separate", borderSpacing: 0 },
          "& th, & td": { borderBottom: "1px solid", borderColor: "gray.200" },
          scrollbarWidth: "thin",
          scrollbarColor: "#718096 transparent",
          "&::-webkit-scrollbar":             { height: "8px" },
          "&::-webkit-scrollbar-track":       { background: "#E2E8F0", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb":       { background: "#718096", borderRadius: "4px" },
          "&::-webkit-scrollbar-thumb:hover": { background: "#4A5568" },
        }}
      >
        <Table
          {...tableProps}
          size={tableProps?.size ?? "sm"}
          variant="unstyled"
          style={{ tableLayout: "fixed", width: `${totalTableWidth}px`, minWidth: "100%", background: "white" }}
        >
          <colgroup>
            {allHeaders.map((header) => {
              const meta  = header.column.columnDef.meta as ColumnMeta | undefined;
              const width = meta?.width ?? "150px";
              return <col key={header.id} style={{ width, minWidth: width }} />;
            })}
          </colgroup>

          <Thead style={{ position: "sticky", top: 0, zIndex: 4 }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id}>
                {headerGroup.headers.map((header, colIndex) => {
                  const meta         = header.column.columnDef.meta as ColumnMeta | undefined;
                  const width        = meta?.width;
                  const isSticky     = colIndex < stickyColumns;
                  const isLastSticky = stickyLastColumn && colIndex === headerGroup.headers.length - 1;
                  const leftOffset   = isSticky ? stickyLeftOffsets[colIndex] : undefined;

                  return (
                    <Th
                      key={header.id}
                      isNumeric={false}
                      color="white"
                      cursor={meta?.sortable ? "pointer" : "default"}
                      onClick={meta?.sortable ? () => handleSort(meta?.sortParam ?? header.column.id) : undefined}
                      style={thStyle(width, leftOffset, isLastSticky)}
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
            ))}
          </Thead>

          {/* ── Tbody: ONLY real data rows — no empty-state markup here ── */}
          <Tbody>
            {rows.map((row, displayIndex) => {
              const rowProps = getRowProps?.(row) ?? {};
              const cells    = row.getVisibleCells();

              // Override row.index with the rendered position so that
              // `info.row.index + 1` in column defs (like the S.No column)
              // always shows 1, 2, 3… based on what's visible on screen,
              // even after client-side filtering or sorting.
              const displayRow = Object.create(row, {
                index: { value: displayIndex, enumerable: true },
              });

              return (
                <RowDisplayIndexContext.Provider key={row.id} value={displayIndex}>
                <Tr {...rowProps}>
                  {cells.map((cell, colIndex) => {
                    const meta         = cell.column.columnDef.meta as ColumnMeta | undefined;
                    const width        = meta?.width;
                    const isSticky     = colIndex < stickyColumns;
                    const isLastSticky = stickyLastColumn && colIndex === cells.length - 1;
                    const leftOffset   = isSticky ? stickyLeftOffsets[colIndex] : undefined;

                    // Merge displayRow into the cell context so info.row.index
                    // returns displayIndex instead of the original data-array position.
                    const cellContext = { ...cell.getContext(), row: displayRow };

                    return (
                      <Td
                        key={cell.id}
                        whiteSpace="normal"
                        wordBreak="break-word"
                        overflowWrap="break-word"
                        lineHeight="1.6"
                        style={tdStyle(displayIndex, width, leftOffset, isLastSticky)}
                      >
                        {flexRender(cell.column.columnDef.cell, cellContext)}
                      </Td>
                    );
                  })}
                </Tr>
                </RowDisplayIndexContext.Provider>
              );
            })}
          </Tbody>
        </Table>

        {/* ── Empty-state message: fills remaining container height below header ── */}
        {rowCount === 0 && (
          <Flex
            position="sticky"
            left={0}
            justify="center"
            align="center"
            fontSize="md"
            fontWeight="bold"
            color="gray.500"
            bg={EVEN_ROW_BG}
            style={{ height: "calc(460px - 45px)" }}
          >
            {searchValue ? "No matching results found" : "No items to display"}
          </Flex>
        )}
      </Box>

      {/* Pagination footer */}
      <Flex mt={4} px={2} justify="space-between" align="center" flexWrap="wrap">
        {overallCount > 0 && (
          <Box fontSize="sm">Showing {startRecord} to {endRecord} of {overallCount} records</Box>
        )}
        {enablePagination && (
          <Pagination currentPage={currentPage} totalCount={overallCount} pageSize={pageSize} onPageChange={onPageChange!} />
        )}
      </Flex>
    </Box>
  );
}

// ── S.No helper (export for column definitions) ────────────────────────────
// Uses RowDisplayIndexContext provided by DataTable so the number always
// reflects the row's position in the currently rendered (filtered + sorted)
// list, starting at 1 — regardless of the original data array index.
export function makeSnoCellRenderer({
  enableClientSideSearch = false,
  currentPage = 1,
  pageSize = 10,
}: {
  enableClientSideSearch?: boolean;
  currentPage?: number;
  pageSize?: number;
} = {}) {
  return function SnoCellRenderer() {
    // displayIndex is the 0-based position of this row in the rendered list.
    // DataTable provides it via RowDisplayIndexContext — no need to search rows.
    const displayIndex = React.useContext(RowDisplayIndexContext);
    if (enableClientSideSearch) {
      // Client-side: always 1, 2, 3… through the filtered+sorted results.
      return <>{displayIndex + 1}</>;
    }
    // Server-side pagination: offset by the current page.
    return <>{(currentPage - 1) * pageSize + displayIndex + 1}</>;
  };
}
