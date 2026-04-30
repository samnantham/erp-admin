import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomerBank } from "@/services/master/customer/schema";

/* =========================================================
   Payment Receipt
========================================================= */

export const zPaymentReceipt = zStandardObject.extend({
  code: z.string(),
  type: z.enum(['credit', 'debit']),
  refer_type: z.enum(['po', 'rpo', 'lo', 'so', 'ro']),
  reference_type: z.enum(['invoice', 'proforma', 'return_order']),  // ← add return_order
  reference_id: z.string().uuid(),
  order_reference_id: z.string().uuid().nullable().optional(),
  customer_bank_id: z.string().uuid(),
  payment_mode_id: z.string().uuid(),
  bank_receipt_number: z.string().nullable().optional(),
  payment_value: z.number(),
  payment_receipt_file: z.string().nullable().optional(),
  payment_date: z.string(),
  remarks: z.string().nullable().optional(),

  // ── Relations ──
  customer_bank: zCustomerBank.nullable().optional(),
  payment_mode: zBasicObject.nullable().optional(),
  reference: z.record(z.any()).nullable().optional(),

  // ── Computed from reference ──
  linked_invoice_amount: z.number().nullable().optional(),
  linked_sub_total: z.number().nullable().optional(),
  linked_is_ready_for_receipt: z.boolean().optional(),
  linked_code: z.string().nullable().optional(),
});

export type PaymentReceipt = z.infer<typeof zPaymentReceipt>;

/* =========================================================
   API Payloads
========================================================= */

export const zPaymentReceiptIndexPayload = z.object({
  data: z.array(zPaymentReceipt),
  pagination: zPagination.optional().nullable(),
});
export type PaymentReceiptIndexPayload = z.infer<typeof zPaymentReceiptIndexPayload>;

export const zPaymentReceiptDataColumn = zPaymentReceipt.extend({
  actions: z.string().optional(),
});
export type PaymentReceiptDataColumn = z.infer<typeof zPaymentReceiptDataColumn>;

export const zPaymentReceiptDetailsPayload = z.object({
  data: zPaymentReceipt,
  status: z.boolean(),
});
export type PaymentReceiptDetailsPayload = z.infer<typeof zPaymentReceiptDetailsPayload>;

export const zPaymentReceiptCreateResponse = () =>
  z.object({
    data: zPaymentReceipt.optional(),
    message: z.string(),
    status: z.boolean(),
  });
export type PaymentReceiptCreateResponse = z.infer<ReturnType<typeof zPaymentReceiptCreateResponse>>;

export const zPaymentReceiptListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});
export type PaymentReceiptListPayload = z.infer<typeof zPaymentReceiptListPayload>;