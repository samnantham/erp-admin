import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomerBank } from "@/services/master/customer/schema";

/* =========================================================
   Shared
========================================================= */

export const zInvoiceReference = z.object({
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().uuid().nullable().optional(),
  reference: z.record(z.any()).nullable().optional(),
});

// ── Charge type embedded in financial charge ──
export const zChargeTypeDetail = z.object({
  id: z.string().uuid(),
  name: z.string(),
  charge_type: z.enum(['percent', 'value']),
  calculation_type: z.enum(['add', 'subtract']),
  is_vat: z.boolean().nullable().optional(),   // ← added (returned by to_dict)
}).nullable().optional();

// ── Financial charge (invoice or proforma) ──
export const zFinancialCharge = zStandardObject.extend({
  charge_type_id: z.string().uuid(),
  input_value: z.number(),           // raw value entered (% or fixed)
  final_amount: z.number(),           // server-computed final amount
  remarks: z.string().nullable().optional(),
  charge_type: zChargeTypeDetail,
});

export type FinancialCharge = z.infer<typeof zFinancialCharge>;

export const zInvoiceItem = zStandardObject.extend({
  reference_item_id: z.string().uuid().nullable().optional(),
  pay_on_amount: z.number().nullable().optional(),
  pay_on_qty: z.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  // server-computed fields
  reference_item: z.record(z.any()).nullable().optional(),
  item_total: z.number().optional(),
  total_paid: z.number().optional(),
  balance: z.number().optional(),
  is_fully_paid: z.boolean().optional(),
  total_returned_amount: z.number().optional(),
  returnable_amount: z.number().optional(),
  is_fully_returned: z.boolean().optional(),
});

export type InvoiceItem = z.infer<typeof zInvoiceItem>;

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
  sub_total: z.number().nullable().optional(),          // ← added
  total_financial_charges: z.number().nullable().optional(),          // ← added
  invoice_amount: z.number(),
  currency_id: z.string().uuid(),
  payment_term_id: z.string().uuid(),
  file: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  due_date: z.string(),
  is_ready_for_receipt: z.boolean().optional(),
  // Relations
  customer_bank: zCustomerBank.nullable().optional(),
  currency: zBasicObject.nullable().optional(),
  payment_term: zBasicObject.nullable().optional(),
  // include_all fields
  items: z.array(zInvoiceItem).optional(),
  financial_charges: z.array(zFinancialCharge).optional(),
});

export type Invoice = z.infer<typeof zInvoice>;

/* =========================================================
   Proforma Invoice
========================================================= */

export const zProformaInvoiceItem = zStandardObject.extend({
  reference_item_id: z.string().uuid().nullable().optional(),
  pay_on_amount: z.number().nullable().optional(),
  pay_on_qty: z.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  // server-computed fields
  reference_item: z.record(z.any()).nullable().optional(),
  item_total: z.number().optional(),
  total_paid: z.number().optional(),
  balance: z.number().optional(),
  is_fully_paid: z.boolean().optional(),
  total_returned_amount: z.number().optional(),
  returnable_amount: z.number().optional(),
  is_fully_returned: z.boolean().optional(),
});

export type ProformaInvoiceItem = z.infer<typeof zProformaInvoiceItem>;

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
  sub_total: z.number().nullable().optional(),          // ← added
  total_financial_charges: z.number().nullable().optional(),          // ← added
  invoice_amount: z.number(),
  file: z.string().nullable().optional(),
  narration: z.string().nullable().optional(),
  is_ready_for_receipt: z.boolean().optional(),
  // Relations
  customer_bank: zCustomerBank.nullable().optional(),
  payment_term: zBasicObject.nullable().optional(),
  // include_all fields
  items: z.array(zProformaInvoiceItem).optional(),
  financial_charges: z.array(zFinancialCharge).optional(),
});

export type ProformaInvoice = z.infer<typeof zProformaInvoice>;

/* =========================================================
   Index Payloads
========================================================= */

export const zInvoiceIndexPayload = z.object({
  data: z.array(zInvoice),
  pagination: zPagination.optional().nullable(),
});
export type InvoiceIndexPayload = z.infer<typeof zInvoiceIndexPayload>;

export const zInvoiceDataColumn = zInvoice.extend({ actions: z.string().optional() });
export type InvoiceDataColumn = z.infer<typeof zInvoiceDataColumn>;

export const zProformaInvoiceIndexPayload = z.object({
  data: z.array(zProformaInvoice),
  pagination: zPagination.optional().nullable(),
});
export type ProformaInvoiceIndexPayload = z.infer<typeof zProformaInvoiceIndexPayload>;

export const zProformaInvoiceDataColumn = zProformaInvoice.extend({ actions: z.string().optional() });
export type ProformaInvoiceDataColumn = z.infer<typeof zProformaInvoiceDataColumn>;

/* =========================================================
   Details Payloads
========================================================= */

export const zInvoiceDetailsPayload = z.object({
  data: zInvoice,
  status: z.boolean(),
});
export type InvoiceDetailsPayload = z.infer<typeof zInvoiceDetailsPayload>;

export const zProformaInvoiceDetailsPayload = z.object({
  data: zProformaInvoice,
  status: z.boolean(),
});
export type ProformaInvoiceDetailsPayload = z.infer<typeof zProformaInvoiceDetailsPayload>;

/* =========================================================
   Create / Update Response Payloads
========================================================= */

export const zInvoiceCreateResponse = () =>
  z.object({
    data: zInvoice.optional(),
    message: z.string(),
    status: z.boolean(),
  });
export type InvoiceCreateResponse = z.infer<ReturnType<typeof zInvoiceCreateResponse>>;

export const zProformaInvoiceCreateResponse = () =>
  z.object({
    data: zProformaInvoice.optional(),
    message: z.string(),
    status: z.boolean(),
  });
export type ProformaInvoiceCreateResponse = z.infer<ReturnType<typeof zProformaInvoiceCreateResponse>>;

/* =========================================================
   List Payloads
========================================================= */

export const zInvoiceListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});
export type InvoiceListPayload = z.infer<typeof zInvoiceListPayload>;

export const zProformaInvoiceListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});
export type ProformaInvoiceListPayload = z.infer<typeof zProformaInvoiceListPayload>;
