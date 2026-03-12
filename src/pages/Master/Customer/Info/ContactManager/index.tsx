import { CustomerRelationalTable } from "@/pages/Master/Customer/Info/CustomerRelationalTable";
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";

import { endPoints } from "@/api/endpoints";
export function ContactManager(props: any) {

  const columnConfig = [
    {
      key: "attention",
      header: "Attention",
      meta: { sortable: true, searchable: true, sortParam: "attention" },
    },
    {
      key: "email",
      header: "Email",
      meta: { searchable: true },
    },
    {
      key: "phone",
      header: "Phone No",
      meta: { searchable: true },
    },
    {
      key: "address_line1",
      header: "Address",
      meta: { searchable: true },
      render: (row: any) => (
        <>
          {row.address_line1 ?? "-"}
          <br />
          {row.address_line2 ?? "-"}
        </>
      ),
    },
    {
      key: "city",
      header: "City",
      meta: { searchable: true },
    },
    {
      key: "country",
      header: "Country",
      meta: { searchable: true },
    },
    
  ];

  return (
    <CustomerRelationalTable
      {...props}
      title="Contact Managers"
      data={props.contactManagerData}
      columnConfig={columnConfig}
      ModalComponent={ContactManagerModal}
      addButtonLabel="Add Contact"
      searchPlaceholder="Search Contact"
      deleteErrorTitle="Contact deletion Failed"
      restoreErrorTitle="Contact restore Failed"
      deleteUrl={endPoints.delete.contact_manager}
    />
  );
}

export default ContactManager;