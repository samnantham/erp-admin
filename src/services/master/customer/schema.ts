import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination } from "@/services/global-schema";

/* =========================================================
   Sub Models
========================================================= */

/* ---------- Quality Certificate ---------- */

export const zQualityCertificate = zStandardObject.extend({
  certificate_type: z.string(),
  doc_no: z.string(),
  validity_date: z.string().nullable().optional(),
  issue_date: z.string().nullable().optional(),
  doc_url: z.string().nullable().optional(),
});

export type QualityCertificate = z.infer<typeof zQualityCertificate>;

/* ---------- Contact Manager ---------- */

export const zCustomerContactManager = zStandardObject.extend({
  attention: z.string(),
  address_line1: z.string(),
  address_line2: z.string().nullable().optional(),

  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string(),

  phone: z.string(),
  fax: z.string().nullable().optional(),

  email: z.string().email().nullable().optional(),
  remarks: z.string().nullable().optional(),
});

export type CustomerContactManager = z.infer<typeof zCustomerContactManager>;

/* ---------- Shipping Address ---------- */

export const zCustomerShippingAddress = zStandardObject.extend({
  attention: z.string(),
  consignee_name: z.string(),

  address_line1: z.string(),
  address_line2: z.string().nullable().optional(),

  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string(),

  phone: z.string(),
  fax: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),

  remarks: z.string().nullable().optional(),
  is_default: z.boolean(),
});

export type CustomerShippingAddress = z.infer<typeof zCustomerShippingAddress>;

/* ---------- Customer Bank ---------- */

export const zCustomerBank = zStandardObject.extend({
  beneficiary_name: z.string(),

  name: z.string(),
  branch: z.string(),

  address_line1: z.string(),
  address_line2: z.string().nullable().optional(),

  ac_iban_no: z.string(),
  type_of_ac: z.string(),

  swift: z.string(),
  aba_routing_no: z.string().nullable().optional(),

  contact_name: z.string(),

  phone: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  mobile: z.string().nullable().optional(),

  email: z.string().email().nullable().optional(),
});

export type CustomerBank = z.infer<typeof zCustomerBank>;

/* ---------- Principle Owner ---------- */

export const zCustomerPrincipleOwner = zStandardObject.extend({
  owner: z.string(),
  phone: z.string(),
  email: z.string().email().nullable().optional(),
  id_passport_copy: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
});

export type CustomerPrincipleOwner = z.infer<typeof zCustomerPrincipleOwner>;

/* ---------- Trader Reference ---------- */

export const zCustomerTraderReference = zStandardObject.extend({
  vendor_name: z.string(),
  attention: z.string(),

  address_line1: z.string(),
  address_line2: z.string().nullable().optional(),

  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string(),

  phone: z.string(),
  fax: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),

  remarks: z.string().nullable().optional(),
});

export type CustomerTraderReference = z.infer<typeof zCustomerTraderReference>;

/* =========================================================
   Customer
========================================================= */

export const zCustomer = zStandardObject.extend({
  business_name: z.string(),
  code: z.string(),
  email: z.string().email(),

  business_type_id: z.string().uuid(),
  contact_type_id: z.string().uuid(),
  currency_id: z.string().uuid(),
  customer_status_id: z.string().uuid(),
  payment_mode_id: z.string().uuid(),
  payment_term_id: z.string().uuid(),

  nature_of_business: z.string(),
  remarks: z.string().nullable().optional(),

  total_credit_amount: z.number().optional(),
  total_credit_period: z.number().optional(),

  year_of_business: z.number(),
  is_foreign_entity: z.boolean(),

  license_trade_no: z.string().nullable().optional(),
  license_trade_exp_date: z.string().nullable().optional(),
  license_trade_url: z.string().nullable().optional(),

  vat_tax_id: z.string().nullable().optional(),
  vat_tax_url: z.string().nullable().optional(),

  created_by: z.string().nullable().optional(),

  /* ---------- Relations ---------- */

  business_type: zBasicObject.nullable().optional(),
  contact_type: zBasicObject.nullable().optional(),
  customer_status: zBasicObject.extend({
    code: z.string().nullable().optional(),
  }),
  currency: zBasicObject.nullable().optional(),
  payment_mode: zBasicObject.nullable().optional(),
  payment_term: zBasicObject.nullable().optional(),

  quality_certificates: z.array(zQualityCertificate).optional(),
  contact_managers: z.array(zCustomerContactManager).optional(),
  shipping_addresses: z.array(zCustomerShippingAddress).optional(),
  banks: z.array(zCustomerBank).optional(),
  principle_owners: z.array(zCustomerPrincipleOwner).optional(),
  trader_references: z.array(zCustomerTraderReference).optional(),
});

export type Customer = z.infer<typeof zCustomer>;

/* =========================================================
   API Payloads
========================================================= */

export const zCustomerIndexPayload = z.object({
  data: z.array(zCustomer),
  pagination: zPagination,
});

export type CustomerIndexPayload = z.infer<typeof zCustomerIndexPayload>;

export const zCustomerDataColumn = zCustomer.extend({
  actions: z.string().optional(),
});

export type CustomerDataColumn = z.infer<typeof zCustomerDataColumn>;

export const zCreateResponsePayload = z.object({
  id: z.string().uuid().optional(),
  message: z.string(),
  status: z.boolean(),
});

export type CreateResponsePayload = z.infer<typeof zCreateResponsePayload>;

export const zCustomerDetailsPayload = z.object({
  data: zCustomer,
  status: z.boolean(),
});

export type CustomerDetailsPayload = z.infer<typeof zCustomerDetailsPayload>;