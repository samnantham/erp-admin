import { DisplayProp, ModuleConfig, ViewAction } from '@/pages/CUDRequests/modules/types';
import { endPoints } from '@/api/endpoints';
/* =========================
   Helpers
========================= */


export interface ArrayColumn {
  key: string;
  label: string;
  render?: (value: any, row?: any) => React.ReactNode;
}

const navigateAction = (url: string): ViewAction => ({
  type: 'navigate',
  url,
});

const modalAction = (type: any, row: any, parentKey = 'customer_id'): ViewAction => ({
  type,
  payload: {
    parentId: String(row.record?.[parentKey]),
    existValues: row.record,
  },
});

/* =========================
   Customer Display Props
========================= */

const CUSTOMER_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Business Name', key: 'business_name', showInTable: true },
  { label: 'Business Type', key: 'business_type_id', showInTable: true },
  { label: 'Year of Business', key: 'year_of_business', showInTable: false },
  { label: 'Contact Type', key: 'contact_type_id', showInTable: true },
  { label: 'Nature of Business', key: 'nature_of_business', showInTable: false },
  { label: 'License / Trade No', key: 'license_trade_no', showInTable: false },
  { label: 'License Expiry Date', key: 'license_trade_exp_date', showInTable: false },
  { label: 'License URL', key: 'license_trade_url', showInTable: false, renderAs: 'doc' },
  { label: 'VAT / Tax ID', key: 'vat_tax_id', showInTable: false },
  { label: 'VAT URL', key: 'vat_tax_url', showInTable: false, renderAs: 'doc' },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'Currency', key: 'currency_id', showInTable: false },
  { label: 'Payment Mode', key: 'payment_mode_id', showInTable: false },
  { label: 'Payment Term', key: 'payment_term_id', showInTable: false },
  { label: 'Total Credit Amount', key: 'total_credit_amount', showInTable: false },
  { label: 'Total Credit Period', key: 'total_credit_period', showInTable: false },
  { label: 'Is Foreign Entity', key: 'is_foreign_entity', showInTable: false },
  { label: 'Remarks', key: 'remarks', showInTable: false },
  {
    kind: 'array',
    label: 'Quality Certificates',
    key: 'quality_certificates',
    showInTable: false,
    rowKey: 'id',
    emptyText: 'No certificates attached',
    columns: [
      { key: 'certificate_type', label: 'QC Type' },
      { key: 'doc_no', label: 'QC Doc No' },
      { key: 'issue_date', label: 'Issued Date', renderAs: 'date' },
      { key: 'validity_date', label: 'Validity Date', renderAs: 'date' },
      { key: 'doc_url', label: 'Document', renderAs: 'doc' },
    ],
  },
];

const BANK_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Beneficiary Name', key: 'beneficiary_name', showInTable: true },
  { label: 'Bank Name', key: 'name', showInTable: true },
  { label: 'Branch', key: 'branch', showInTable: true },
  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },
  { label: 'Account / IBAN No', key: 'ac_iban_no', showInTable: true },
  { label: 'Type of Account', key: 'type_of_ac', showInTable: false },
  { label: 'Swift Code', key: 'swift', showInTable: false },
  { label: 'ABA Routing No', key: 'aba_routing_no', showInTable: false },
  { label: 'Contact Name', key: 'contact_name', showInTable: false },
  { label: 'Phone', key: 'phone', showInTable: true },
  { label: 'Fax', key: 'fax', showInTable: false },
  { label: 'Mobile', key: 'mobile', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },
];

const CONTACT_MANAGER_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Attention', key: 'attention', showInTable: true },
  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },
  { label: 'City', key: 'city', showInTable: true },
  { label: 'State', key: 'state', showInTable: false },
  { label: 'Zip Code', key: 'zip_code', showInTable: false },
  { label: 'Country', key: 'country', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: true },
  { label: 'Fax', key: 'fax', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'Remarks', key: 'remarks', showInTable: false },
];

const SHIPPING_ADDRESS_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Attention', key: 'attention', showInTable: true },
  { label: 'Consignee Name', key: 'consignee_name', showInTable: true },
  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },
  { label: 'City', key: 'city', showInTable: true },
  { label: 'State', key: 'state', showInTable: false },
  { label: 'Zip Code', key: 'zip_code', showInTable: false },
  { label: 'Country', key: 'country', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: true },
  { label: 'Fax', key: 'fax', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'Remarks', key: 'remarks', showInTable: false },
  { label: 'Is Default', key: 'is_default', showInTable: true },
];

const PRINCIPLE_OWNER_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Owner', key: 'owner', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: true },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'ID / Passport Copy', key: 'id_passport_copy', showInTable: false },
  { label: 'Remarks', key: 'remarks', showInTable: false },
];

const TRADER_REFERENCE_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Vendor Name', key: 'vendor_name', showInTable: true },
  { label: 'Attention', key: 'attention', showInTable: false },
  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },
  { label: 'City', key: 'city', showInTable: true },
  { label: 'State', key: 'state', showInTable: false },
  { label: 'Zip Code', key: 'zip_code', showInTable: false },
  { label: 'Country', key: 'country', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: true },
  { label: 'Fax', key: 'fax', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'Remarks', key: 'remarks', showInTable: false },
];

/* =========================
   Part Number Display Props
========================= */

const PART_NUMBER_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Part Number', key: 'name', showInTable: true },
  { label: 'Description', key: 'description', showInTable: true },
  { label: 'Manufacturer', key: 'manufacturer_name', showInTable: true },
  { label: 'Cage Code', key: 'cage_code', showInTable: true },
  { label: 'ATA', key: 'ata', showInTable: false },
  { label: 'Unit of Measure', key: 'unit_of_measure_id', showInTable: false },
  { label: 'Spare Type', key: 'spare_type_id', showInTable: true },
  { label: 'Spare Model', key: 'spare_model_id', showInTable: false },
  { label: 'HSC Code', key: 'hsc_code_id', showInTable: true },
  { label: 'Shelf Life', key: 'is_shelf_life', showInTable: false },
  { label: 'Total Shelf Life', key: 'total_shelf_life', showInTable: false },
  { label: 'LLP', key: 'is_llp', showInTable: false },
  { label: 'Serialized', key: 'is_serialized', showInTable: false },
  { label: 'DG', key: 'is_dg', showInTable: true },
  { label: 'UN', key: 'un_id', showInTable: false },
  { label: 'MSDS', key: 'msds', showInTable: false, renderAs: 'doc' },
  { label: 'IPC Reference', key: 'ipc_ref', showInTable: false, renderAs: 'doc' },
  { label: 'Picture', key: 'picture', showInTable: false, renderAs: 'doc' },
  { label: 'X-Ref', key: 'xref', showInTable: false, renderAs: 'doc' },
  { label: 'Remarks', key: 'remarks', showInTable: false },
];

const PART_NUMBER_ALTERNATE_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Part Number ID', key: 'part_number_id', showInTable: true },
  { label: 'Alternate Part Number ID', key: 'alternate_part_number_id', showInTable: true },
  { label: 'Remark', key: 'remark', showInTable: true },
];

const SALES_LOG_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'ID', key: 'code', showInTable: true },
  { label: 'RFQ No', key: 'cust_rfq_no', showInTable: true },
  { label: 'RFQ Date', key: 'cust_rfq_date', showInTable: true, renderAs: 'date' },
  { label: 'Due Date', key: 'due_date', showInTable: true, renderAs: 'date' },
  { label: 'Customer', key: 'customer_id', showInTable: true },
  { label: 'Contact Manager', key: 'customer_contact_manager_id', showInTable: true },
  { label: 'Shipping Address', key: 'customer_shipping_address_id', showInTable: true },
  { label: 'Mode of Rec.', key: 'mode_of_receipt_id', showInTable: true },
  { label: 'Priority', key: 'priority_id', showInTable: true },
  { label: 'Currency', key: 'currency_id', showInTable: true },
  {
    kind: 'array',
    label: 'SEL Items',
    key: 'items',
    showInTable: false,
    rowKey: 'id',
    emptyText: 'No Items added',
    columns: [
      { key: 'part_number_id', label: 'Part Number' },
      { key: 'condition_id', label: 'COndition' },
      { key: 'qty', label: 'Quantity' },
      { key: 'unit_of_measure_id', label: 'UOM' },
      { key: 'remark', label: 'Remark' },
    ],
  },
];

const MATERIAL_REQUEST_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'ID', key: 'code', showInTable: true },
  { label: 'Priority', key: 'priority_id', showInTable: true },
  { label: 'Due Date', key: 'due_date', showInTable: true, renderAs: 'date' },
  { label: 'Type', key: 'type_label', showInTable: true },
  {
    kind: 'array',
    label: 'MR Items',
    key: 'items',
    showInTable: false,
    rowKey: 'id',
    emptyText: 'No Items added',
    columns: [
      { key: 'part_number_id', label: 'Part Number' },
      { key: 'condition_id', label: 'COndition' },
      { key: 'qty', label: 'Quantity' },
      { key: 'unit_of_measure_id', label: 'UOM' },
      { key: 'remark', label: 'Remark' },
    ],
  },
];

const PRFQ_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'ID', key: 'code', showInTable: true },
  { label: 'Need By Date', key: 'need_by_date', showInTable: true, renderAs: 'date' },
  { label: 'Priority', key: 'priority_id', showInTable: true },
  {
    kind: 'array',
    label: 'PRFQ Items',
    key: 'items',
    showInTable: false,
    rowKey: 'items',
    emptyText: 'No Items added',
    columns: [
      { key: 'part_number_id', label: 'Part Number' },
      { key: 'condition_id', label: 'COndition' },
      { key: 'qty', label: 'Quantity' },
      { key: 'unit_of_measure_id', label: 'UOM' },
      { key: 'remark', label: 'Remark' },
    ],
  }, {
    kind: 'array',
    label: 'Vendors',
    key: 'vendors',
    showInTable: false,
    rowKey: 'vendors',
    emptyText: 'No vendors added',
    columns: [
      { key: 'vendor_id', label: 'Vendor' },
      { key: 'customer_contact_manager_id', label: 'Contact Manager' }
    ],
  },
];

const PO_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'ID', key: 'code', showInTable: true },
  { label: 'Vendor', key: 'customer_id', showInTable: true },
  { label: 'Contact Manager', key: 'customer_contact_manager_id', showInTable: true },
  { label: 'Shipping Address', key: 'customer_shipping_address_id', showInTable: false },
  { label: 'Shipping Type', key: 'ship_type_id', showInTable: false },
  { label: 'Shipping Mode', key: 'ship_mode_id', showInTable: false },
  { label: 'Shipping Account', key: 'ship_account_id', showInTable: false },
  { label: 'Priority', key: 'priority_id', showInTable: true },
  { label: 'Currency', key: 'currency_id', showInTable: false },
  { label: 'Payment Mode', key: 'payment_mode_id', showInTable: false },
  { label: 'Payment Term', key: 'payment_term_id', showInTable: false },
  { label: 'FOB', key: 'fob_id', showInTable: false },
  { label: 'Bank Charge', key: 'bank_charge', showInTable: false },
  { label: 'Freight Charge', key: 'freight', showInTable: false },
  { label: 'Misc Charge', key: 'miscellaneous_charges', showInTable: false },
  { label: 'VAT', key: 'vat', showInTable: false },
  { label: 'Discount', key: 'discount', showInTable: false },
  { label: 'Remarks', key: 'remarks', showInTable: false },
  {
    kind: 'array',
    label: 'PO Items',
    key: 'items',
    showInTable: false,
    rowKey: 'items',
    emptyText: 'No Items added',
    columns: [
      { key: 'part_number_id', label: 'Part Number' },
      { key: 'condition_id', label: 'COndition' },
      { key: 'qty', label: 'Quantity' },
      { key: 'unit_of_measure_id', label: 'UOM' },
      { key: 'price', label: 'Price' },
      { key: 'note', label: 'Note' },
    ],
  }
];

const FINANCE_BANK_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Bank Name', key: 'name', showInTable: true },
  { label: 'Account Label', key: 'account_label', showInTable: true },
  { label: 'Branch', key: 'branch', showInTable: true },

  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },

  { label: 'Account / IBAN No', key: 'ac_iban_no', showInTable: true },
  { label: 'Type of Account', key: 'type_of_ac', showInTable: false },

  { label: 'Swift Code', key: 'swift', showInTable: false },
  { label: 'ABA Routing No', key: 'aba_routing_no', showInTable: false },
  { label: 'IFSC Code', key: 'ifsc_code', showInTable: false },

  { label: 'Contact Name', key: 'contact_name', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: true },
  { label: 'Fax', key: 'fax', showInTable: false },
  { label: 'Mobile', key: 'mobile', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'Currency', key: 'currency.code', showInTable: true },

  { label: 'Default', key: 'is_default', showInTable: false },
  { label: 'Active', key: 'is_active', showInTable: true },
];

const FINANCE_CARD_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Card Label', key: 'card_label', showInTable: true },
  { label: 'Card Holder', key: 'card_holder_name', showInTable: true },

  { label: 'Card Type', key: 'card_type', showInTable: true },
  { label: 'Category', key: 'card_category', showInTable: false },

  { label: 'Last 4 Digits', key: 'card_last4', showInTable: true },

  { label: 'Expiry Month', key: 'expiry_month', showInTable: false },
  { label: 'Expiry Year', key: 'expiry_year', showInTable: false },

  { label: 'Bank Name', key: 'bank_name', showInTable: true },

  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },

  { label: 'Contact Name', key: 'contact_name', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: false },
  { label: 'Mobile', key: 'mobile', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },

  // 🔥 Currency (nested)
  { label: 'Currency', key: 'currency.code', showInTable: true },

  { label: 'Default', key: 'is_default', showInTable: false },
  { label: 'Active', key: 'is_active', showInTable: true },
];

const FINANCE_CHEQUE_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Name', key: 'name', showInTable: true },
  { label: 'Account Label', key: 'account_label', showInTable: true },
  { label: 'Branch', key: 'branch', showInTable: true },

  { label: 'Account No', key: 'ac_no', showInTable: true },
  { label: 'Type of Account', key: 'type_of_ac', showInTable: false },

  { label: 'Address Line 1', key: 'address_line1', showInTable: false },
  { label: 'Address Line 2', key: 'address_line2', showInTable: false },

  { label: 'ABA Routing No', key: 'aba_routing_no', showInTable: false },
  { label: 'IFSC Code', key: 'ifsc_code', showInTable: false },
  { label: 'MICR Code', key: 'micr_code', showInTable: false },

  { label: 'Contact Name', key: 'contact_name', showInTable: true },
  { label: 'Phone', key: 'phone', showInTable: false },
  { label: 'Fax', key: 'fax', showInTable: false },
  { label: 'Mobile', key: 'mobile', showInTable: false },
  { label: 'Email', key: 'email', showInTable: true },

  // 🔥 Currency (NOTE: your schema currently uses string, not object)
  { label: 'Currency', key: 'currency', showInTable: true },

  { label: 'Default', key: 'is_default', showInTable: false },
  { label: 'Active', key: 'is_active', showInTable: true },
];

/* =========================
   Config Map
========================= */

export const MODULE_CONFIG: Record<string, ModuleConfig> = {

  // ── Customer ──
  customers: {
    value: 'customers',
    label: 'Customers',
    displayProps: CUSTOMER_DISPLAY_PROPS,
    allowDelete: true,
    allowCreate: false,
    getViewAction: (row) => navigateAction(`/contact-management/master/info/${row.record_id}`),
  },
  banks: {
    value: 'banks',
    label: 'Banks',
    displayProps: BANK_DISPLAY_PROPS,
    allowDelete: true,
    allowCreate: false,
    getViewAction: (row) => modalAction('customer_bank', row),
  },
  contact_managers: {
    value: 'contact-managers',
    label: 'Contact Managers',
    displayProps: CONTACT_MANAGER_DISPLAY_PROPS,
    allowDelete: true,
    allowCreate: false,
    getViewAction: (row) => modalAction('contact_manager', row),
  },
  shipping_addresses: {
    value: 'shipping-addresses',
    label: 'Shipping Addresses',
    displayProps: SHIPPING_ADDRESS_DISPLAY_PROPS,
    allowDelete: true,
    allowCreate: false,
    getViewAction: (row) => modalAction('customer_shipping_address', row),
  },
  principle_owners: {
    value: 'principle-owners',
    label: 'Principle Owners',
    displayProps: PRINCIPLE_OWNER_DISPLAY_PROPS,
    allowDelete: true,
    allowCreate: false,
    getViewAction: (row) => modalAction('customer_principle_owner', row),
  },
  trader_references: {
    value: 'trader-references',
    label: 'Trader References',
    displayProps: TRADER_REFERENCE_DISPLAY_PROPS,
    allowCreate: false,
    allowDelete: true,
    getViewAction: (row) => modalAction('customer_trader_references', row),
  },

  // ── Part Numbers ──
  part_numbers: {
    value: 'part_numbers',
    label: 'Part Numbers',
    displayProps: PART_NUMBER_DISPLAY_PROPS,
    allowCreate: false,
    allowDelete: true,
    getViewAction: (row) => navigateAction(`/spare-management/info/${row.record_id}`),
  },
  alternates: {
    value: 'alternates',
    label: 'Alternates',
    displayProps: PART_NUMBER_ALTERNATE_DISPLAY_PROPS,
    allowCreate: false,
    allowDelete: true,
    getViewAction: (row) => modalAction('part_number_alternate', row, 'part_number_id'),
  },

  sales_logs: {
    value: 'sales_logs',
    label: 'Sales Log',
    displayProps: SALES_LOG_DISPLAY_PROPS,
    allowDelete: false,
    allowCreate: false,
    getViewAction: (row) => ({
      type: 'pdf',
      title: `SEL Preview - #${row.record?.code}`,
      url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.sales_log.replace(":id", row.record_id)}`,
    }),
    preview: {
      enabled: true,

      getOldPreviewUrl: (row) =>
        `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.sales_log.replace(":id", row.record_id)}`,

      getNewPreviewRequest: (row) => ({
        url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview_post.sales_log}`,
        method: "POST",
        body: row.raw_new_data,
      }),
    },
  },

  material_requests: {
    value: 'material_requests',
    label: 'Material Request',
    displayProps: MATERIAL_REQUEST_DISPLAY_PROPS,
    allowDelete: false,
    allowCreate: false,
    getViewAction: (row) => ({
      type: 'pdf',
      title: `Material Request Preview - #${row.record?.code}`,
      url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.material_request.replace(":id", row.record_id)}`,
    }),
    preview: {
      enabled: true,
      getOldPreviewUrl: (row) =>
        `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.material_request.replace(":id", row.record_id)}`,

      getNewPreviewRequest: (row) => ({
        url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview_post.material_request}`,
        method: "POST",
        body: row.raw_new_data,
      }),
    },
  },
  prfqs: {
    value: 'prfqs',
    label: 'PRFQ',
    displayProps: PRFQ_DISPLAY_PROPS,
    allowDelete: false,
    allowCreate: false,
    getViewAction: (row) => ({
      type: 'pdf',
      title: `Purchase RFQ Preview - #${row.record?.code}`,
      url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.prfq.replace(":id", row.record_id)}`,
    }),
    preview: {
      enabled: true,
      getOldPreviewUrl: (row) =>
        `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.prfq.replace(":id", row.record_id)}`,

      getNewPreviewRequest: (row) => ({
        url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview_post.prfq}`,
        method: "POST",
        body: row.raw_new_data,
      }),
    },
  },

  purchase_orders: {
    value: 'purchase_orders',
    label: 'Purchase Order',
    displayProps: PO_DISPLAY_PROPS,
    allowDelete: false,
    allowCreate: true,
    getViewAction: (row) => ({
      type: 'pdf',
      title: `Purchase Order Preview - #${row.record?.code}`,
      url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.purchase_order.replace(":id", row.record_id)}`,
    }),
    preview: {
      enabled: true,
      getOldPreviewUrl: (row) =>
        `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.purchase_order.replace(":id", row.record_id)}`,

      getNewPreviewRequest: (row) => ({
        url: `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview_post.purchase_order}`,
        method: "POST",
        body: row.raw_new_data,
      }),
    },
  },

  finance_banks: {
    value: 'finance_banks',
    label: 'Finance Banks',
    displayProps: FINANCE_BANK_DISPLAY_PROPS,
    allowDelete: true,
    allowCreate: false,
    getViewAction: (row) => modalAction('finance_bank', row),
  },

  finance_cards: {
    value: 'finance_cards',
    label: 'Finance Cards',
    displayProps: FINANCE_CARD_DISPLAY_PROPS,
    allowCreate: false,
    allowDelete: true,
    getViewAction: (row) => modalAction('finance_card', row),
  },

  finance_cheques: {
    value: 'finance_cheques',
    label: 'Finance Cheques',
    displayProps: FINANCE_CHEQUE_DISPLAY_PROPS,
    allowCreate: false,
    allowDelete: true,
    getViewAction: (row) => modalAction('finance_cheque', row),
  },


};