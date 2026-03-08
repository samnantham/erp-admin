import { useState } from "react";
import { useParams } from "react-router-dom";

import { Box, HStack, Heading, Stack } from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import ConfirmationPopup from "@/components/ConfirmationPopup";
import { DataTable } from "@/components/DataTable";
import { TableSearchBox } from "@/components/DataTable/SearchBox";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import { Status, StatusTabs } from "@/components/StatusTabs";

import { getBaseColumns } from "@/components/ReUsable/table-columns/baseColumns";
import { getActionColumn } from "@/components/ReUsable/table-columns/actionColumn";
import { getStatusColumn } from "@/components/ReUsable/table-columns/statusColumn";
import { getDeletedColumn } from "@/components/ReUsable/table-columns/deletedColumn";

import { formatModelTitle } from "@/helpers/commonHelper";

import ModalForm from "@/pages/Submaster/ModalForm";

import { DataColumn } from "@/services/submaster/schema";
import { useDelete } from "@/api/useDelete";
import { endPoints } from "@/api/endpoints";

import { useSubmasterItemIndex } from "@/services/submaster/service";
import { submasterConfig } from "@/pages/Submaster/submasterConfig";

type ConfirmMode = null | "soft" | "restore" | "permanent";

export const SubmasterPage = () => {
  const queryClient = useQueryClient();
  const { model } = useParams<{ model: string }>();

  const title = formatModelTitle(model);
  const config = submasterConfig[model ?? ""] ?? submasterConfig.default;
  const visibleColumns = config.columns ?? ["name"];

  type ExtraFields = typeof config.extraFields;
  type ModelDataColumn = DataColumn<ExtraFields>;

  const navigate = useNavigate();
  const [isOpen, toggleModal] = useState(false);
  const [selected, setSelected] = useState<ModelDataColumn | null>(null);
  const [isEdit, toggleEdit] = useState(false);

  const [queryParams, setQueryParams] = useState<{ status: Status }>({
    status: "all",
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  /* ================= Modal ================= */

  const openModal = (item: ModelDataColumn | null, editStatus?: boolean) => {

    if (config.formType === "page") {
      if (item) {
        navigate(`/submaster/${model}/form`, {
          state: { id: item.id, mode: "edit" }
        });
      } else {
        navigate(`/submaster/${model}/form`);
      }
      return;
    }

    setSelected(item);
    toggleModal(true);
    toggleEdit(!!editStatus);
  };

  const closeModal = () => {
    queryClient.invalidateQueries(["submasterItemIndex", model]);

    setRefreshKey((prev) => prev + 1);
    refreshData();

    setSelected(null);
    toggleEdit(false);
    toggleModal(false);
  };

  /* ================= Sorting ================= */

  const handleSortChange = (columnId: string, direction: "asc" | "desc") => {
    setSortBy(columnId);
    setSortDirection(direction);
  };

  /* ================= API ================= */

  const {
    data: itemList,
    isLoading: listLoading,
    refetch: refreshData,
  } = useSubmasterItemIndex(model ?? "", queryParams);

  const data: ModelDataColumn[] = itemList?.data ?? [];

  /* ================= Delete / Restore ================= */

  const [mutatingRowId, setMutatingRowId] = useState<
    string | number | undefined
  >(undefined);

  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem] = useState<ModelDataColumn | null>(null);

  const deleteItem = useDelete({
    url: endPoints.delete.submaster.replace(":model", model ?? ""),
    invalidate: ["submasterItemIndex"],
  });

  const mutateItem = (item: ModelDataColumn) => {
    setMutatingRowId(item.id);

    deleteItem.mutate(
      { id: item.id },
      {
        onSuccess: () => {
          closeConfirm();
          setMutatingRowId(undefined);
        },
        onError: () => {
          setMutatingRowId(undefined);
        },
      }
    );
  };

  const openSoft = (item: ModelDataColumn) => {
    setActiveItem(item);
    setConfirmMode("soft");
  };

  const openRestore = (item: ModelDataColumn) => {
    setActiveItem(item);
    setConfirmMode("restore");
  };

  const openPermanent = (item: ModelDataColumn) => {
    setActiveItem(item);
    setConfirmMode("permanent");
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setActiveItem(null);
  };

  const handleSoftDelete = mutateItem;
  const handleRestore = mutateItem;
  const handlePermanentDelete = mutateItem;

  /* ================= Status Filter ================= */

  const handleStatusChange = (next: Status) => {
    setQueryParams((prev) => ({ ...prev, status: next }));
  };

  /* ================= Columns ================= */

  const baseColumns = getBaseColumns<ModelDataColumn>();

  const extraColumns = visibleColumns
    .filter((col: string) => col !== "name")
    .map((col: string) => ({
      id: col,
      header: config.extraFields?.[col] ?? formatModelTitle(col),
      accessorKey: col,
      meta: {
        sortable: true,
        searchable: true,
        sortType: 'string',
      },
      cell: ({ row }: any) => {
        const value = row.original[col];

        if (typeof value === "boolean") {
          return value ? "Yes" : "No";
        }

        return value;
      },
    }));


  const beforeName = baseColumns.filter(
    (col: any) => col.id === "sNo"
  );

  const nameColumn = baseColumns.find(
    (col: any) => col.id === "name"
  );

  const afterName = baseColumns.filter(
    (col: any) =>
      ["created_at", "updated_at", "deleted_at"].includes(col.id)
  );

  const filteredColumns = [
    ...beforeName,
    nameColumn,
    ...extraColumns,
    ...afterName,
  ];

  const columns =
    queryParams.status === "trashed"
      ? [
        ...filteredColumns,
        getStatusColumn<ModelDataColumn>(),
        getDeletedColumn<ModelDataColumn>(),
        getActionColumn<ModelDataColumn>({
          mutatingRowId,
          actionLoaderStatus: deleteItem.isLoading,
          openModal,
          openSoftDelete: openSoft,
          openPermenantDelete: openPermanent,
          openRestore,
        }),
      ]
      : [
        ...filteredColumns,
        getStatusColumn<ModelDataColumn>(),
        getActionColumn<ModelDataColumn>({
          mutatingRowId,
          actionLoaderStatus: deleteItem.isLoading,
          openModal,
          openSoftDelete: openSoft,
          openPermenantDelete: openPermanent,
          openRestore,
        }),
      ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={"space-between"}>
          <Heading as="h4" size={"md"}>
            SubMaster - {title}
          </Heading>

          <ResponsiveIconButton
            variant={"@primary"}
            icon={<LuPlus />}
            size={{ base: "sm", md: "md" }}
            onClick={() => openModal(null, false)}
          >
            Add New
          </ResponsiveIconButton>
        </HStack>

        <Box borderRadius={4}>
          <HStack
            bg={"white"}
            justify={"space-between"}
            mb={4}
            p={4}
            borderTopRadius={4}
          >
            <Heading as="h4" size={"md"}>
              {title} List
            </Heading>

            <Box flex="1" maxW="300px">
              <TableSearchBox
                value={searchTerm}
                onChange={setSearchTerm}
                width="100%"
                placeholder={`Search ${title}`}
              />
            </Box>
          </HStack>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <StatusTabs
              status={queryParams.status}
              onStatusChange={handleStatusChange}
            />
          </Box>

          <DataTable
            columns={columns}
            data={data}
            sortBy={sortBy}
            key={refreshKey}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            searchValue={searchTerm}
            enableClientSideSearch
            loading={listLoading}
            stickyColumns={config.stickyColumns ?? 0}
          />

          <ModalForm
            key={selected?.id ?? "create"}
            isOpen={isOpen}
            onClose={closeModal}
            existInfo={selected}
            isEdit={isEdit}
            model={model}
          />

          <ConfirmationPopup
            isOpen={confirmMode !== null}
            onClose={closeConfirm}
            onConfirm={() => {
              if (!activeItem) return;

              if (confirmMode === "restore") handleRestore(activeItem);
              if (confirmMode === "soft") handleSoftDelete(activeItem);
              if (confirmMode === "permanent")
                handlePermanentDelete(activeItem);
            }}
            isLoading={
              !!activeItem &&
              mutatingRowId === activeItem.id &&
              deleteItem.isLoading
            }
            headerText={confirmMode === "restore" ? "Restore !!" : "Delete !!"}
            bodyText={
              confirmMode === "restore"
                ? `Are you sure want to restore this ${model}?`
                : `Are you sure want to delete this ${model}?`
            }
          />
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default SubmasterPage;