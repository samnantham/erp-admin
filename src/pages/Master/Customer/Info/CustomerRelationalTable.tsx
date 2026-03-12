import { useMemo, useState } from "react";
import { Box, Button, useDisclosure } from "@chakra-ui/react";
import { HiPlus } from "react-icons/hi";

import { ConfirmationWithReasonPopup } from "@/components/ConfirmationWithReasonPopup";
import { DataTable } from "@/components/DataTable";
import { buildColumns, DynamicColumn } from "@/components/ReUsable/table-columns/buildColumns";
import { useDelete } from "@/api/useDelete";
import { BiEdit, BiInfoCircle, BiTrash } from "react-icons/bi";
type ConfirmMode = null | "delete" | "restore";

type Props = {
  title: string;
  data: any[];
  columnConfig: DynamicColumn<any>[];
  ModalComponent: any;

  addButtonLabel: string;
  searchPlaceholder: string;

  customerId: string;
  customerInfo: any;

  refreshCustomerDetails: () => void;

  deleteErrorTitle: string;
  restoreErrorTitle: string;
  deleteUrl: string;
};

export function CustomerRelationalTable({
  title,
  data,
  columnConfig,
  ModalComponent,
  addButtonLabel,
  searchPlaceholder,
  customerId,
  customerInfo,
  refreshCustomerDetails,
  deleteUrl
}: Props) {

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [searchTerm, setSearchTerm] = useState("");
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);

  const [existValues, setExistValues] = useState<any>(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  const [isEdit, setIsEdit] = useState(false);
  const [isView, setIsView] = useState(false);

  const { mutate: triggerDelete, isLoading: isDeleting } = useDelete({
    url: deleteUrl.replace(":customer_id", customerId),
    invalidate: ['customerDetails'],
  });

  const openModalFor = (mode: "add" | "edit" | "view", row?: any) => {
    setExistValues(row ?? null);
    setIsEdit(mode === "edit");
    setIsView(mode === "view");
    onOpen();
  };

  const ask = (mode: ConfirmMode, row: any) => {
    setActiveItem(row);
    setConfirmMode(mode);
  };

  const closeConfirm = () => {
    setConfirmMode(null);
    setActiveItem(null);
  };

  const closeEditView = () => {
    onClose();
    refreshCustomerDetails();
    setExistValues(null);
    setIsEdit(false);
    setIsView(false);
  };

  const onConfirmDelete = (reason: string) => {
    if (!activeItem) return;

    triggerDelete(
      { id: activeItem.id, deleted_reason: reason },
      {
        onSuccess: () => {
          refreshCustomerDetails();
        },
        onSettled: closeConfirm,
      }
    );
  };

  const actionsColumn: DynamicColumn<any> = {
    key: "actions",
    header: "Actions",
    type: "actions",
    actions: [
      {
        label: "View",
        onClick: (row) => openModalFor("view", row),
        icon: <BiInfoCircle />,
      },
      {
        label: "Edit",
        onClick: (row) => openModalFor("edit", row),
        icon: <BiEdit />,
        isDisabled: (row) => !!row.has_pending_request,
        disabledTooltip: (row) => row.pending_request_message,
      },
      {
        label: "Delete",
        icon: <BiTrash/>,
        onClick: (row) => ask("delete", row),
        isDisabled: (row) => !!row.has_pending_request,
        disabledTooltip: (row) => row.pending_request_message,
      }
    ],
  };

  const columns = useMemo(() => {
    return buildColumns([...columnConfig, actionsColumn], {
      showSerial: true,
    });
  }, [data]);

  return (
    <Box bg="white" borderRadius="md" boxShadow="md" borderWidth={1} p={4}>

      <DataTable
        columns={columns}
        data={data}
        title={title}
        enablePagination={false}
        enableClientSideSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={searchPlaceholder}
        noTitlePadding={true}
        headerAction={
          <Button
            leftIcon={<HiPlus />}
            size="sm"
            colorScheme="brand"
            onClick={() => openModalFor("add")}
          >
            {addButtonLabel}
          </Button>
        }
      />

      <ModalComponent
        isOpen={isOpen}
        onClose={closeEditView}
        isEdit={isEdit}
        isView={isView}
        customerId={customerId}
        existValues={existValues}
        customerInfo={customerInfo}
      />

      <ConfirmationWithReasonPopup
        isOpen={confirmMode === "delete"}
        onClose={closeConfirm}
        onConfirm={onConfirmDelete}
        headerText="Confirm Delete"
        showBody={false}
        isInputRequired
        isLoading={isDeleting}
      />
    </Box>
  );
}