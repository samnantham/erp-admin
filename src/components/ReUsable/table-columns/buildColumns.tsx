import React from "react";
import {
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Tooltip,
} from "@chakra-ui/react";
import { FiChevronDown } from "react-icons/fi";
import { createColumnHelper, ColumnDef } from "@tanstack/react-table";

/**
 * Action type for action dropdown
 */
export type TableAction<T> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  color?: string;
  isVisible?: (row: T) => boolean;
  isDisabled?: (row: T) => boolean;
  disabledTooltip?: (row: T) => string | undefined;
};

/**
 * Dynamic column configuration
 */
export type DynamicColumn<T> = {
  key: string;
  header: string | React.ReactNode | (() => React.ReactNode);
  type?: "text" | "nested" | "actions";
  render?: (row: T) => React.ReactNode;
  actions?: TableAction<T>[];
  isNumeric?: boolean;
  size?: number;
  isDisabled?: (row: T) => boolean;
  disabledTooltip?: (row: T) => string | undefined;
  meta?: Record<string, any>;
};

/**
 * Options for builder
 */
type BuildColumnOptions = {
  showSerial?: boolean;
};

/**
 * Helper to read nested values like role.name
 */
const getNestedValue = (obj: any, path: string) => {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
};

const resolveHeader = (header: string | React.ReactNode | (() => React.ReactNode)) =>
  typeof header === "function" ? header() : header;

/**
 * Main reusable column builder
 */
export function buildColumns<T extends object>(
  columns: DynamicColumn<T>[],
  options?: BuildColumnOptions
): ColumnDef<T>[] {
  const columnHelper = createColumnHelper<T>();

  const dynamicColumns: ColumnDef<T>[] = columns.map((col) => {
    /**
     * ACTION COLUMN
     */
    if (col.type === "actions" && col.actions) {
      return columnHelper.display({
        id: col.key,
        header: "Action",
        size: col.size,
        meta: { isNumeric: col.isNumeric, ...col.meta },
        cell: (info) => {
          const row = info.row.original;

          const visibleActions = col.actions?.filter((action) =>
            action.isVisible ? action.isVisible(row) : true
          );

          if (!visibleActions?.length) return null;

          const menuDisabled = col.isDisabled?.(row);
          const menuTooltip = col.disabledTooltip?.(row);  // ← new

          return (
            <Tooltip
              label={menuDisabled ? menuTooltip : ''}
              isDisabled={!menuDisabled || !menuTooltip}
              hasArrow
              placement="left"
              bg="orange.500"
            >
              {/* span needed — Tooltip requires a non-disabled child to attach */}
              <span>
                <Menu placement="bottom-end" strategy="fixed" isLazy>
                  <MenuButton
                    as={Button}
                    size="sm"
                    bg={menuDisabled ? "gray.300" : "#0C2556"}
                    color={menuDisabled ? "gray.500" : "white"}
                    _hover={{ color: menuDisabled ? "gray.500" : "#0C2556", bg: menuDisabled ? "gray.300" : "#fff" }}
                    _active={{ color: menuDisabled ? "gray.500" : "#0C2556", bg: menuDisabled ? "gray.300" : "#fff" }}
                    rightIcon={<FiChevronDown />}
                    onClick={(e) => e.stopPropagation()}
                    isDisabled={menuDisabled}
                    cursor={menuDisabled ? "not-allowed" : "pointer"}
                  >
                    Actions
                  </MenuButton>

                  <MenuList
                    zIndex={9999}
                    width="150px" maxW="150px" minW="150px"
                    boxShadow="md"
                    sx={{ overflow: "hidden", padding: "4px" }}
                  >
                    {visibleActions.map((action, index) => {
                      const disabled = action.isDisabled?.(row);
                      const tooltip = action.disabledTooltip?.(row);
                      return (
                        <Tooltip
                          key={index}
                          label={disabled ? tooltip : ""}
                          isDisabled={!disabled || !tooltip}
                          placement="left"
                          hasArrow
                          bg="red.600"
                        >
                          <span>
                            <MenuItem
                              color={action.color}
                              onClick={() => action.onClick(row)}
                              isDisabled={disabled}
                            >
                              {action.icon && <span style={{ marginRight: 6 }}>{action.icon}</span>}
                              {action.label}
                            </MenuItem>
                          </span>
                        </Tooltip>
                      );
                    })}
                  </MenuList>
                </Menu>
              </span>
            </Tooltip>
          );
        },
      });
    }

    /**
     * CUSTOM RENDER COLUMN
     */
    if (col.render) {
      return columnHelper.display({
        id: col.key,
        header: () => <>{resolveHeader(col.header)}</>, // ← wrap in function to accept ReactNode
        size: col.size,
        meta: {
          isNumeric: col.isNumeric,
          ...col.meta,
        },
        cell: (info) => col.render?.(info.row.original),
      });
    }

    /**
     * DEFAULT ACCESSOR COLUMN
     */
    return columnHelper.accessor((row) => getNestedValue(row, col.key), {
      id: col.key,
      header: () => <>{resolveHeader(col.header)}</>,// ← wrap in function to accept ReactNode
      size: col.size,
      meta: {
        isNumeric: col.isNumeric,
        ...col.meta,
      },
      cell: (info) => {
        const value = info.getValue();
        const fontWeight = (info.column.columnDef.meta as any)?.fontWeight;
        if (value === null || value === undefined || value === "") return <Text fontWeight="bold">—</Text>;
        return fontWeight ? <Text fontWeight={fontWeight}>{value as React.ReactNode}</Text> : value as React.ReactNode;
      },
    });
  });

  /**
   * SERIAL NUMBER COLUMN
   */
  if (options?.showSerial) {
    dynamicColumns.unshift(
      columnHelper.display({
        id: "sNo",
        header: "#",
        size: 60,
        cell: (info) => info.row.index + 1,
        meta: {
          width: 50
        },
      })
    );
  }

  return dynamicColumns;
}