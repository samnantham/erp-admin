import { CustomerRelationalTable } from "@/pages/Master/Customer/Info/CustomerRelationalTable";
import { BankModal } from "@/components/Modals/CustomerMaster/Bank";
import { endPoints } from "@/api/endpoints";

export function Bank(props: any) {

  const columnConfig =
    [
      {
        key: "beneficiary_name",
        header: "Beneficiary Name",
        meta: { sortable: true, sortParam: "beneficiary_name", searchable: true, }
      },
      {
        key: "name",
        header: "Bank Name",
        meta: { sortable: true, sortParam: "name", searchable: true, }
      },
      {
        key: "branch",
        header: "Branch",
        meta: { sortable: true, sortParam: "branch", searchable: true, }
      },
      {
        key: "ac_iban_no",
        header: "AC/IBAN No",
        meta: { sortable: true, sortParam: "ac_iban_no", searchable: true, }
      },
      {
        key: "type_of_ac",
        header: "Type of AC"
      },
      {
        key: "address_line1",
        header: "Address",
        meta: { searchable: true, },
        render: (row: any) => (
          <>
            {row.address_line1 ?? "-"}
            <br />
            {row.address_line2 ?? "-"}
          </>
        )
      }
    ];

  return (
    <CustomerRelationalTable
      {...props}
      title="Customer Banks"
      data={props.bankData}
      columnConfig={columnConfig}
      ModalComponent={BankModal}
      addButtonLabel="Add Bank"
      searchPlaceholder="Search Bank"
      deleteErrorTitle="Bank deletion Failed"
      restoreErrorTitle="Bank restoration Failed"
      deleteUrl={endPoints.delete.bank}
      downloadFileUrl={import.meta.env.VITE_CUSTOMERS_BANKS_CSV}
      navigateURLComponent={'bank'}
    />
  );
}