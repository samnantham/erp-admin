import React, { useEffect, useMemo, useRef, useState } from "react";
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
    case "date":      return dateSort;
    case "number":    return sortingFns.alphanumeric;
    default:          return textSort;
  }
};

// ── Sticky offset calculator ───────────────────────────────────────────────
function useStickyOffsets(
  theadRef: React.RefObject<HTMLTableSectionElement>,
  stickyColumns: number,
  stickyLastColumn: boolean,
  totalColumns: number,
  rowCount: number
) {
  const [leftOffsets, setLeftOffsets] = useState<number[]>([]);

  useEffect(() => {
    const thead = theadRef.current;
    if (!thead) return;
    const ths = Array.from(thead.querySelectorAll<HTMLTableCellElement>("th"));
    if (ths.length === 0) return;
    const offsets: number[] = [];
    let accumulated = 0;
    for (let i = 0; i < stickyColumns; i++) {
      offsets[i] = accumulated;
      accumulated += ths[i]?.getBoundingClientRect().width ?? 0;
    }
    setLeftOffsets(offsets);
  }, [stickyColumns, stickyLastColumn, totalColumns, rowCount]);

  return { leftOffsets };
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

  const rowCount  = table.getRowModel().rows.length;
  const totalCols = finalColumns.length;

  // ── Sticky offsets ────────────────────────────────────────────────────────
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const { leftOffsets } = useStickyOffsets(
    theadRef, stickyColumns, stickyLastColumn, totalCols, rowCount
  );

  // ── Colour constants ──────────────────────────────────────────────────────
  const HEADER_BG   = "#0C2556";
  const EVEN_ROW_BG = "#ffffff";
  const ODD_ROW_BG  = "#F7FAFC";

  // ── Per-cell sticky style ─────────────────────────────────────────────────
  // STACKING CONTEXT RULES:
  //   - Header sticky cells get zIndex:3 so they cover scrolling body rows.
  //   - Body sticky cells get NO zIndex. Setting any zIndex on a positioned
  //     element creates a new stacking context, which would trap portalled
  //     children (Chakra Menu/Popover/Tooltip rendered at <body> level) inside
  //     that context and make them appear behind neighbouring sticky cells.
  //   - The scroll wrapper also has NO transform/filter/will-change/isolation
  //     for the same reason — those also create stacking contexts.
  const getStickyStyle = (
    colIndex: number,
    isHeader: boolean,
    rowIndex?: number
  ): React.CSSProperties => {
    const isLeftSticky  = colIndex < stickyColumns;
    const isRightSticky = stickyLastColumn && colIndex === totalCols - 1;

    if (!isLeftSticky && !isRightSticky) return {};

    const bg = isHeader
      ? HEADER_BG
      : rowIndex !== undefined && rowIndex % 2 !== 0
        ? ODD_ROW_BG
        : EVEN_ROW_BG;

    if (isLeftSticky) {
      return {
        position: "sticky",
        left: leftOffsets[colIndex] ?? 0,
        zIndex: isHeader ? 1 : undefined, // NO zIndex on body cells
        background: bg
      };
    }

    return {
      position: "sticky",
      right: 0,
      zIndex: isHeader ? 1 : undefined, // NO zIndex on body cells
      background: bg
    };
  };

  // ── Shared header renderer ────────────────────────────────────────────────
  const renderHeaderRow = (tableHeaders: Header<Data, unknown>[]) =>
    tableHeaders.map((header, colIndex) => {
      const meta       = header.column.columnDef.meta as ColumnMeta | undefined;
      const sortParam  = meta?.sortParam ?? header.column.id;
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
          style={{ background: "#0C2556", ...getStickyStyle(colIndex, true) }}
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
      {/*
        When a Chakra Menu is open (MenuButton gets aria-expanded="true"),
        this CSS rule elevates the entire <tr> containing that button above
        all other sticky cells. This works even when strategy="fixed" because
        the fixed-position MenuList still needs its TRIGGER (the MenuButton
        inside the sticky td) to be painted on top so Popper.js positions
        the list correctly relative to the viewport.
      */}
      <style>{`
        tr:has([aria-expanded="true"]) td {
          z-index: 2 !important;
        }
      `}</style>

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
        TWO-BOX layout to prevent stacking context from trapping portalled menus:

        OUTER box  — provides the visible border. Has NO overflow, NO transform,
                     NO filter, NO will-change, NO isolation. It is a plain
                     block box and creates no stacking context, so Chakra Menu /
                     Popover / Tooltip portals rendered at <body> can float
                     freely above the table.

        INNER box  — the ONLY element with overflow:auto (needed for scrolling).
                     Also has none of the stacking-context triggers above.

        If the outer box had overflow:hidden/auto AND border/shadow, some
        browsers promote it to a stacking context. Splitting them avoids this.
      */}
      <Box
        {...containerProps}
        border="1px"
        borderColor="gray.500"
        borderTopWidth="0"
        width="100%"
        overflow="visible"
      >
        <Box
          overflowX="auto"
          width="100%"
          sx={{
            "& table": {
              borderCollapse: "separate",
              borderSpacing: 0,
            },
            "& th, & td": {
              borderBottom: "1px solid",
              borderColor: "gray.200",
            },
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
            variant="unstyled"
            bg={HEADER_BG}
            minWidth="max-content"
            width="100%"
          >
            <Thead ref={theadRef}>
              {table.getHeaderGroups().map((hg) => (
                <Tr key={hg.id}>
                  {renderHeaderRow(hg.headers)}
                </Tr>
              ))}
            </Thead>

            <Tbody>
              {rowCount === 0 ? (
                <Tr>
                  <Td colSpan={totalCols} textAlign="center" py={8} bg={EVEN_ROW_BG}>
                    {searchValue ? "No matching results found" : "No items to display"}
                  </Td>
                </Tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const rowProps = getRowProps?.(row) ?? {};
                  const visibleCells = row.getVisibleCells();
                  const rowBg = row.index % 2 === 0 ? EVEN_ROW_BG : ODD_ROW_BG;
                  return (
                    <Tr key={row.id} {...rowProps}>
                      {visibleCells.map((cell, colIndex) => {
                        const isSticky =
                          colIndex < stickyColumns ||
                          (stickyLastColumn && colIndex === totalCols - 1);
                        return (
                          <Td
                            key={cell.id}
                            isNumeric={(cell.column.columnDef.meta as ColumnMeta)?.isNumeric}
                            maxW={isSticky ? undefined : "200px"}
                            whiteSpace={isSticky ? undefined : "normal"}
                            wordBreak={isSticky ? undefined : "break-word"}
                            lineHeight="1.6"
                            bg={rowBg}
                            style={getStickyStyle(colIndex, false, row.index)}
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