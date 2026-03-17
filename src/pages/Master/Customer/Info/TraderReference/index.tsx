import { CustomerRelationalTable } from "@/pages/Master/Customer/Info/CustomerRelationalTable";
import { TraderReferenceModal } from "@/components/Modals/CustomerMaster/TraderReference";
import { endPoints } from "@/api/endpoints";

export function TraderReference(props: any) {

  const columnConfig = [
    {
      key: "attention",
      header: "Attention",
      meta: { searchable: true },
    },
    {
      key: "address_line1",
      header: "Address",
      meta: { searchable: true },
      render: (row: any) => (
        <>
          {row?.address_line1 ?? "-"}
          <br />
          {row?.address_line2 ?? "-"}
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
  ];

  return (
    <CustomerRelationalTable
      {...props}
      title="Trader References"
      data={props.traderReferenceData}
      columnConfig={columnConfig}
      ModalComponent={TraderReferenceModal}
      addButtonLabel="Add Reference"
      searchPlaceholder="Search Trader Reference"
      deleteErrorTitle="Trader Reference deletion Failed"
      restoreErrorTitle="Trader Reference restore Failed"
      deleteUrl={endPoints.delete.trader_reference}
      downloadFileUrl={import.meta.env.VITE_CUSTOMERS_TRADER_REFERENCES_CSV}
      navigateURLComponent={'trader_reference'}
    />
  );
}

export default TraderReference;