import { useState } from "react";
import { useParams } from "react-router-dom";

import { Box, HStack, Heading, Stack } from "@chakra-ui/react";
import { LuPlus } from "react-icons/lu";
import { useQueryClient } from "react-query";
import { useNavigate } from "react-router-dom";

import ConfirmationPopup from "@/components/ConfirmationPopup";
import { DataTable } from "@/components/DataTable";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";

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
import { useRouterContext } from "@/services/auth/RouteContext";

type ConfirmMode = null | "soft" | "restore" | "permanent";

export const SubmasterPage = () => {
  const { otherPermissions } = useRouterContext();

  const canCreate = otherPermissions.create === 1;
  const canUpdate = otherPermissions.update === 1;
  const canDelete = otherPermissions.update === 1;

  const queryClient = useQueryClient();
  const { model }   = useParams<{ model: string }>();

  const title          = formatModelTitle(model);
  const config         = submasterConfig[model ?? ""] ?? submasterConfig.default;
  const visibleColumns = config.columns ?? ["name"];

  type ExtraFields     = typeof config.extraFields;
  type ModelDataColumn = DataColumn<ExtraFields>;

  const navigate = useNavigate();
  const [isOpen, toggleModal]   = useState(false);
  const [selected, setSelected] = useState<ModelDataColumn | null>(null);
  const [isEdit, toggleEdit]    = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [queryParams, setQueryParams] = useState<TODO>({
    status: "all",
    page: 1,
    limit: itemsPerPage,
  });

  const [sortBy, setSortBy]           = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm]   = useState("");

  /* ================= Modal ================= */

  const openModal = (item: ModelDataColumn | null, editStatus?: boolean) => {
    if (config.formType === "page") {
      if (item) {
        navigate(`/submaster/${model}/form/${item.id}/edit`);
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

  const paginationData: TODO       = itemList?.pagination ?? {};
  const data: ModelDataColumn[]    = itemList?.data       ?? [];

  /* ================= Delete / Restore ================= */

  const [mutatingRowId, setMutatingRowId] = useState<string | number | undefined>(undefined);
  const [confirmMode, setConfirmMode]     = useState<ConfirmMode>(null);
  const [activeItem, setActiveItem]       = useState<ModelDataColumn | null>(null);

  const deleteItem = useDelete({
    url: endPoints.delete.submaster.replace(":model", model ?? ""),
    invalidate: ["submasterItemIndex"],
  });

  const mutateItem = (item: ModelDataColumn) => {
    setMutatingRowId(item.id);
    deleteItem.mutate(
      { id: item.id },
      {
        onSuccess: () => { closeConfirm(); setMutatingRowId(undefined); },
        onError:   () => { setMutatingRowId(undefined); },
      }
    );
  };

  const openSoft      = (item: ModelDataColumn) => { setActiveItem(item); setConfirmMode("soft"); };
  const openRestore   = (item: ModelDataColumn) => { setActiveItem(item); setConfirmMode("restore"); };
  const openPermanent = (item: ModelDataColumn) => { setActiveItem(item); setConfirmMode("permanent"); };
  const closeConfirm  = () => { setConfirmMode(null); setActiveItem(null); };

  const handleSoftDelete      = mutateItem;
  const handleRestore         = mutateItem;
  const handlePermanentDelete = mutateItem;

  /* ================= Status Filter ================= */

  const handleStatusChange = (next: any) =>
    setQueryParams((prev: any) => ({ ...prev, status: next }));

  /* ================= Columns ================= */

  const baseColumns  = getBaseColumns<ModelDataColumn>();

  const extraColumns = visibleColumns
    .filter((col: string) => col !== "name")
    .map((col: string) => ({
      id: col,
      header: config.extraFields?.[col] ?? formatModelTitle(col),
      accessorKey: col,
      meta: { sortable: true, searchable: true, sortType: 'string' },
      cell: ({ row }: any) => {
        const value = row.original[col];
        if (typeof value === "boolean") return value ? "Yes" : "No";
        return value;
      },
    }));

  const beforeName = baseColumns.filter((col: any) => col.id === "sNo");
  const nameColumn = baseColumns.find((col: any) => col.id === "name");
  const afterName  = baseColumns.filter((col: any) =>
    ["created_at", "updated_at", "deleted_at"].includes(col.id)
  );

  const filteredColumns = [...beforeName, nameColumn, ...extraColumns, ...afterName];

  const actionColumnConfig = {
    mutatingRowId,
    actionLoaderStatus: deleteItem.isLoading,
    openModal:           canUpdate ? openModal     : () => {},
    openSoftDelete:      canDelete ? openSoft      : () => {},
    openPermenantDelete: canDelete ? openPermanent : () => {},
    openRestore:         canUpdate ? openRestore   : () => {},
    hideEdit:            !canUpdate,
    hideDelete:          !canDelete,
  };

  const columns =
    queryParams.status === "trashed"
      ? [
          ...filteredColumns,
          getStatusColumn<ModelDataColumn>(),
          getDeletedColumn<ModelDataColumn>(),
          getActionColumn<ModelDataColumn>(actionColumnConfig),
        ]
      : [
          ...filteredColumns,
          getStatusColumn<ModelDataColumn>(),
          getActionColumn<ModelDataColumn>(actionColumnConfig),
        ];

  return (
    <SlideIn>
      <Stack pl={2} spacing={4}>
        <HStack justify={"space-between"}>
          <Heading as="h4" size={"md"}>SubMaster - {title}</Heading>
          {canCreate && (
            <ResponsiveIconButton
              variant={"@primary"}
              icon={<LuPlus />}
              size={{ base: "sm", md: "md" }}
              onClick={() => openModal(null, false)}
            >
              Add New
            </ResponsiveIconButton>
          )}
        </HStack>

        <Box borderRadius={4}>
          <DataTable
            columns={columns}
            data={data}
            sortBy={sortBy}
            resetKey={model}
            key={model}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            searchValue={searchTerm}
            enableClientSideSearch={true}
            loading={listLoading}
            stickyColumns={config.stickyColumns ?? 0}
            title={`${title} List`}
            statusTabsStatus={true}
            status={queryParams.status}
            onStatusChange={handleStatusChange}
            onSearchChange={setSearchTerm}
            searchPlaceholder={`Search ${title}`}
            enablePagination={true}
            currentPage={paginationData?.current_page}
            totalCount={paginationData?.total}
            pageSize={itemsPerPage}
            onPageChange={(page) =>
              setQueryParams((prev: any) => ({ ...prev, page }))
            }
            onPageSizeChange={(limit) => {
              setItemsPerPage(limit);
              setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
            }}
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
              if (confirmMode === "restore")   handleRestore(activeItem);
              if (confirmMode === "soft")      handleSoftDelete(activeItem);
              if (confirmMode === "permanent") handlePermanentDelete(activeItem);
            }}
            isLoading={!!activeItem && mutatingRowId === activeItem.id && deleteItem.isLoading}
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