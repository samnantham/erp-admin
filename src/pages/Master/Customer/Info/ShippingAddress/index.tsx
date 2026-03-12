import { CustomerRelationalTable } from "@/pages/Master/Customer/Info/CustomerRelationalTable";
import { CustomerShippingAddressModal } from "@/components/Modals/CustomerMaster/ShippingAddress";
import { useState } from "react";
import { endPoints } from "@/api/endpoints";

export function ShippingAddress(props: any) {

  const [skipDefault, setSkipDefault] = useState(
    Boolean(localStorage.getItem("skip_default"))
  );

  const columnConfig = [
    {
      key: "consignee_name",
      header: "Consignee Name",
      meta: { searchable: true },
    },
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

  const onAddNew = (openModal: any) => {
    const shouldSuggestDefault =
      props.customerInfo?.contact_type?.name === "PURCHASE VENDOR" &&
      props.shippingData.length === 0 &&
      !skipDefault;

    if (shouldSuggestDefault) {
      localStorage.setItem("skip_default", "yes");
      setSkipDefault(true);
    }

    openModal("add");
  };

  return (
    <CustomerRelationalTable
      {...props}
      title="Shipping Addresses"
      data={props.shippingData}
      columnConfig={columnConfig}
      ModalComponent={CustomerShippingAddressModal}
      addButtonLabel="Add Shipping"
      searchPlaceholder="Search Shipping Address"
      deleteErrorTitle="Shipping address deletion failed"
      restoreErrorTitle="Shipping address restore failed"
      customAddHandler={onAddNew}
      deleteUrl={endPoints.delete.shipping_address}
    />
  );
}

export default ShippingAddress;