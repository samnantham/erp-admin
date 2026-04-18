export type Currency = {
  id: string;
  code: string;
  name: string;
  symbol?: string;
};

/* =========================
   Card
========================= */
export type CardData = {
  card_label: string;
  card_holder_name: string;
  card_type: string;
  card_category: string;

  card_last4: string | number;
  expiry_month: string | number;
  expiry_year: string | number;

  bank_name: string;

  address_line1?: string | null;
  address_line2?: string | null;

  contact_name: string;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;

  currency_id?: string;
  currency?: Currency | null;

  is_default: boolean;
  is_active: boolean;
};


/* =========================
   Bank
========================= */
export type BankData = {
  name: string;
  account_label: string;
  branch: string;

  address_line1: string;
  address_line2?: string | null;

  ac_iban_no: string;
  type_of_ac: string;

  swift: string;
  aba_routing_no?: string | null;
  ifsc_code?: string | null;

  contact_name: string;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  email?: string | null;

  currency_id: string;
  currency?: Currency | null;

  is_default: boolean;
  is_active: boolean;
};


/* =========================
   Cheque
========================= */
export type ChequeData = {
  name: string;
  account_label: string;
  branch: string;

  address_line1: string;
  address_line2?: string | null;

  ac_no: string;
  type_of_ac: string;

  aba_routing_no?: string | null;
  ifsc_code?: string | null;
  micr_code?: string | null;

  contact_name: string;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  email?: string | null;

  currency_id?: string;
  currency?: Currency | null;

  is_default: boolean;
  is_active: boolean;
};