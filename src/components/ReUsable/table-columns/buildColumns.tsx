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
        meta: {
          isNumeric: col.isNumeric,
          ...col.meta,
        },
        cell: (info) => {
          const row = info.row.original;

          const visibleActions = col.actions?.filter((action) =>
            action.isVisible ? action.isVisible(row) : true
          );

          if (!visibleActions?.length) return null;

          return (
            <Menu placement="bottom-end" strategy="fixed" isLazy>
              <MenuButton
                as={Button}
                size="sm"
                bg="#0C2556"
                color="white"
                _hover={{ color: "#0C2556", bg: "#fff" }}
                _active={{ color: "#0C2556", bg: "#fff" }}
                rightIcon={<FiChevronDown />}
                onClick={(e) => e.stopPropagation()}
                isDisabled={col.isDisabled?.(row)}
              >
                Actions
              </MenuButton>

              <MenuList
                zIndex={9999}
                width="120px"
                maxW="120px"
                minW="120px"
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
                          {action.icon && (
                            <span style={{ marginRight: 6 }}>
                              {action.icon}
                            </span>
                          )}
                          {action.label}
                        </MenuItem>
                      </span>
                    </Tooltip>
                  );
                })}
              </MenuList>
            </Menu>
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
      cell: (info) => info.getValue(),
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
      })
    );
  }

  return dynamicColumns;
}