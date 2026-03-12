import { CustomerRelationalTable } from "@/pages/Master/Customer/Info/CustomerRelationalTable";
import { PrincipleOfOwnerModal } from "@/components/Modals/CustomerMaster/PrincipleOfOwner";
import DocumentDownloadButton from "@/components/DocumentDownloadButton";

import { endPoints } from "@/api/endpoints";
export function PrincipleOfOwner(props: any) {

  const columnConfig = [
    {
      key: "owner",
      header: "Owner",
      meta: { searchable: true, sortable: true, sortParam: "owner" },
    },
    {
      key: "phone",
      header: "Phone",
      meta: { searchable: true },
    },
    {
      key: "email",
      header: "Email",
      meta: { searchable: true },
    },
    {
      key: "id_passport_copy",
      header: "ID/Passport Copy",
      render: (row: any) => (
        <DocumentDownloadButton size="sm" url={row?.id_passport_copy || ""} />
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      meta: { searchable: true },
    },
  ];

  return (
    <CustomerRelationalTable
      {...props}
      title="Principle Of Owner"
      data={props.principleData}
      columnConfig={columnConfig}
      ModalComponent={PrincipleOfOwnerModal}
      addButtonLabel="Add Owner"
      searchPlaceholder="Search Owner"
      deleteErrorTitle="Principle of Owner deletion Failed"
      restoreErrorTitle="Principle of Owner restore Failed"
      deleteUrl={endPoints.delete.principle_of_owner}
    />
  );
}

export default PrincipleOfOwner;