// services/invoice/invoice-schema.ts

import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomerBank } from "@/services/master/customer/schema";

/* =========================================================
   Shared Reference
========================================================= */

export const zInvoiceReference = z.object({
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  reference: z.record(z.any()).nullable().optional(),
});

/* =========================================================
   Invoice
========================================================= */

export const zInvoice = zStandardObject.extend({
  code: z.string(),
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  reference: z.record(z.any()).nullable().optional(),
  customer_bank_id: z.string().uuid(),
  invoice_type: z.string(),
  payment_by: z.string(),
  payment_date: z.string(),
  tax_invoice_no: z.string(),
  tax_invoice_date: z.string(),
  invoice_amount: z.number(),
  currency_id: z.string().uuid(),
  payment_term_id: z.string().uuid(),
  file: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),

  /* ---------- Relations ---------- */
  customer_bank: zCustomerBank.nullable().optional(),
  currency: zBasicObject.nullable().optional(),
  payment_term: zBasicObject.nullable().optional(),
});

export type Invoice = z.infer<typeof zInvoice>;

/* =========================================================
   Proforma Invoice
========================================================= */

export const zProformaInvoice = zStandardObject.extend({
  code: z.string(),
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  reference: z.record(z.any()).nullable().optional(),
  customer_bank_id: z.string().uuid(),
  date: z.string(),
  payment_term_id: z.string().uuid(),
  invoice_number: z.string(),
  invoice_date: z.string(),
  invoice_amount: z.number(),
  due_date: z.string(),
  file: z.string().nullable().optional(),
  narration: z.string().nullable().optional(),

  /* ---------- Relations ---------- */
  customer_bank: zCustomerBank.nullable().optional(),
  payment_term: zBasicObject.nullable().optional(),
});

export type ProformaInvoice = z.infer<typeof zProformaInvoice>;

/* =========================================================
   Invoice API Payloads
========================================================= */

/* ---------- Index ---------- */

export const zInvoiceIndexPayload = z.object({
  data: z.array(zInvoice),
  pagination: zPagination.optional().nullable(),
});

export type InvoiceIndexPayload = z.infer<typeof zInvoiceIndexPayload>;

export const zInvoiceDataColumn = zInvoice.extend({
  actions: z.string().optional(),
});

export type InvoiceDataColumn = z.infer<typeof zInvoiceDataColumn>;

/* ---------- Details ---------- */

export const zInvoiceDetailsPayload = z.object({
  data: zInvoice,
  status: z.boolean(),
});

export type InvoiceDetailsPayload = z.infer<typeof zInvoiceDetailsPayload>;

/* ---------- Create / Update ---------- */

export const zInvoiceCreateResponse = () =>
  z.object({
    data: zInvoice.optional(),
    message: z.string(),
    status: z.boolean(),
  });

export type InvoiceCreateResponse = z.infer<ReturnType<typeof zInvoiceCreateResponse>>;

/* ---------- List ---------- */

export const zInvoiceListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});

export type InvoiceListPayload = z.infer<typeof zInvoiceListPayload>;

/* =========================================================
   Proforma Invoice API Payloads
========================================================= */

/* ---------- Index ---------- */

export const zProformaInvoiceIndexPayload = z.object({
  data: z.array(zProformaInvoice),
  pagination: zPagination.optional().nullable(),
});

export type ProformaInvoiceIndexPayload = z.infer<typeof zProformaInvoiceIndexPayload>;

export const zProformaInvoiceDataColumn = zProformaInvoice.extend({
  actions: z.string().optional(),
});

export type ProformaInvoiceDataColumn = z.infer<typeof zProformaInvoiceDataColumn>;

/* ---------- Details ---------- */

export const zProformaInvoiceDetailsPayload = z.object({
  data: zProformaInvoice,
  status: z.boolean(),
});

export type ProformaInvoiceDetailsPayload = z.infer<typeof zProformaInvoiceDetailsPayload>;

/* ---------- Create / Update ---------- */

export const zProformaInvoiceCreateResponse = () =>
  z.object({
    data: zProformaInvoice.optional(),
    message: z.string(),
    status: z.boolean(),
  });

export type ProformaInvoiceCreateResponse = z.infer<ReturnType<typeof zProformaInvoiceCreateResponse>>;

/* ---------- List ---------- */

export const zProformaInvoiceListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});

export type ProformaInvoiceListPayload = z.infer<typeof zProformaInvoiceListPayload>;