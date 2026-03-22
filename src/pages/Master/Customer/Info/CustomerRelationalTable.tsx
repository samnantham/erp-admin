import { useMemo, useState } from "react";
import { Box, Button, useDisclosure, Flex, HStack } from "@chakra-ui/react";
import { HiPlus, HiOutlineUpload, HiOutlineDownload } from "react-icons/hi";

import { ConfirmationWithReasonPopup } from "@/components/ConfirmationWithReasonPopup";
import { DataTable } from "@/components/DataTable";
import { buildColumns, DynamicColumn } from "@/components/ReUsable/table-columns/buildColumns";
import { useDelete } from "@/api/useDelete";
import { BiEdit, BiInfoCircle, BiTrash } from "react-icons/bi";
import { handleDownload } from '@/helpers/commonHelper';
import { useNavigate } from 'react-router-dom';

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

  downloadFileUrl: string;
  navigateURLComponent: string;

  // false = actions visible, true = actions hidden (no update permission)
  actionStatus?: boolean;
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
  deleteUrl,
  downloadFileUrl,
  navigateURLComponent,
  actionStatus = false,
}: Props) {

  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
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
        onSuccess: () => refreshCustomerDetails(),
        onSettled: closeConfirm,
      }
    );
  };

  const actionsColumn: DynamicColumn<any> = {
    key: "actions",
    header: "Actions",
    type: "actions",
    actions: [
      // View — always visible
      {
        label: "View",
        onClick: (row) => openModalFor("view", row),
        icon: <BiInfoCircle />,
      },
      // Edit & Delete — hidden when actionStatus is true (no update permission)
      ...(actionStatus ? [] : [
        {
          label: "Edit",
          onClick: (row: any) => openModalFor("edit", row),
          icon: <BiEdit />,
          isDisabled: (row: any) => !!row.has_pending_request,
          disabledTooltip: (row: any) => row.pending_request_message,
        },
        {
          label: "Delete",
          icon: <BiTrash />,
          onClick: (row: any) => ask("delete", row),
          isDisabled: (row: any) => !!row.has_pending_request,
          disabledTooltip: (row: any) => row.pending_request_message,
        },
      ]),
    ],
  };

  const columns = useMemo(() => {
    return buildColumns([...columnConfig, actionsColumn], { showSerial: true });
  }, [data, actionStatus]);

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
          <HStack ml="auto">
            {/* Bulk Upload & Add — hidden when no update permission */}
            {!actionStatus && (
              <>
                <Flex alignItems="center">
                  <Button
                    leftIcon={<HiOutlineUpload />}
                    size="sm"
                    colorScheme="green"
                    onClick={() => navigate(`/contact-management/customer-master/${navigateURLComponent}/bulk-upload`)}
                  >
                    Bulk Upload
                  </Button>
                </Flex>
                <Flex alignItems="center">
                  <Button
                    leftIcon={<HiPlus />}
                    size="sm"
                    colorScheme="brand"
                    onClick={() => openModalFor("add")}
                  >
                    {addButtonLabel}
                  </Button>
                </Flex>

                <Flex alignItems="center">
                  <Button
                    leftIcon={<HiOutlineDownload />}
                    size="sm"
                    colorScheme="teal"
                    onClick={() => handleDownload(downloadFileUrl)}
                  >
                    Download Sample
                  </Button>
                </Flex>
              </>
            )}
          </HStack>
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
        placeholder="Enter reason to delete"
      />
    </Box>
  );
}