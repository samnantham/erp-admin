import { DisplayProp, ModuleConfig, ViewAction } from '@/pages/UpdateDeleteRequests/modules/types';

/* =========================
   Display Props
========================= */

export interface ArrayColumn {
    key:     string;
    label:   string;
    render?: (value: any, row?: any) => React.ReactNode;
}

const CUSTOMER_DISPLAY_PROPS: DisplayProp[] = [
  { label: 'Business Name', key: 'business_name', showInTable: true },
  { label: 'Business Type', key: 'business_type_id', showInTable: true },
  { label: 'Year of Business', key: 'year_of_business', showInTable: false },
  { label: 'Contact Type', key: 'contact_type_id', showInTable: true },
  // { label: 'Customer Status', key: 'customer_status_id', showInTable: true },
  { label: 'Nature of Business', key: 'nature_of_business', showInTable: false },
  { label: 'License / Trade No', key: 'license_trade_no', showInTable: false },
  { label: 'License Expiry Date', key: 'license_trade_exp_date', showInTable: false },
  { label: 'License URL', key: 'license_trade_url', showInTable: false, renderAs: "doc" },
  { label: 'VAT / Tax ID', key: 'vat_tax_id', showInTable: false },
  { label: 'VAT URL', key: 'vat_tax_url', showInTable: false, renderAs: "doc" },
  { label: 'Email', key: 'email', showInTable: true },
  { label: 'Currency', key: 'currency_id', showInTable: false },
  { label: 'Payment Mode', key: 'payment_mode_id', showInTable: false },
  { label: 'Payment Term', key: 'payment_term_id', showInTable: false },
  { label: 'Total Credit Amount', key: 'total_credit_amount', showInTable: false },
  { label: 'Total Credit Period', key: 'total_credit_period', showInTable: false },
  { label: 'Is Foreign Entity', key: 'is_foreign_entity', showInTable: false },
  { label: 'Remarks', key: 'remarks', showInTable: false },
  // ── Relational list ──
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
   Helper
========================= */

const modalAction = (type: any, row: any): ViewAction => ({
  type,
  payload: {
    customerId: String(row.record?.customer_id),
    existValues: row.record,
  },
});

/* =========================
   Config Map
========================= */

export const CUSTOMER_RELATION_CONFIG: Record<string, ModuleConfig> = {
  customers: {
    value: 'customers',
    label: 'Customers',
    displayProps: CUSTOMER_DISPLAY_PROPS,
    getViewAction: (row) => ({
      type: 'navigate',
      url: `/contact-management/customer-master/info/${row.record_id}`
    }),
  },
  banks: {
    value: 'banks',
    label: 'Banks',
    displayProps: BANK_DISPLAY_PROPS,
    getViewAction: (row) => modalAction('customer_bank', row),
  },
  'contact-managers': {
    value: 'contact-managers',
    label: 'Contact Managers',
    displayProps: CONTACT_MANAGER_DISPLAY_PROPS,
    getViewAction: (row) => modalAction('contact_manager', row),
  },
  'shipping-addresses': {
    value: 'shipping-addresses',
    label: 'Shipping Addresses',
    displayProps: SHIPPING_ADDRESS_DISPLAY_PROPS,
    getViewAction: (row) => modalAction('customer_shipping_address', row),
  },
  'principle-owners': {
    value: 'principle-owners',
    label: 'Principle Owners',
    displayProps: PRINCIPLE_OWNER_DISPLAY_PROPS,
    getViewAction: (row) => modalAction('customer_principle_owner', row),
  },
  'trader-references': {
    value: 'trader-references',
    label: 'Trader References',
    displayProps: TRADER_REFERENCE_DISPLAY_PROPS,
    getViewAction: (row) => modalAction('customer_trader_references', row),
  },
};