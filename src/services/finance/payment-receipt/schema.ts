// services/finance/payment-receipt-schema.ts

import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomerBank } from "@/services/master/customer/schema";

/* =========================================================
   Payment Receipt
========================================================= */

export const zPaymentReceipt = zStandardObject.extend({
  code:                 z.string(),
  type:                 z.enum(['credit', 'debit']),
  refer_type:           z.enum(['po', 'rpo', 'lo', 'so', 'ro']),
  customer_bank_id:     z.string().uuid(),
  payment_mode_id:      z.string().uuid(),
  invoice_id:           z.string().uuid().nullable().optional(),
  proforma_invoice_id:  z.string().uuid().nullable().optional(),
  bank_receipt_number:  z.string().nullable().optional(),
  payment_value:        z.number(),
  payment_receipt_file: z.string().nullable().optional(),
  payment_date:         z.string(),
  bank_id:              z.string().uuid().nullable().optional(),

  /* ---------- Relations ---------- */
  customer_bank:    zCustomerBank.nullable().optional(),
  payment_mode:     zBasicObject.nullable().optional(),
  invoice:          z.record(z.any()).nullable().optional(),
  proforma_invoice: z.record(z.any()).nullable().optional(),
  bank:             zBasicObject.nullable().optional(),
});

export type PaymentReceipt = z.infer<typeof zPaymentReceipt>;

/* =========================================================
   API Payloads
========================================================= */

/* ---------- Index ---------- */

export const zPaymentReceiptIndexPayload = z.object({
  data:       z.array(zPaymentReceipt),
  pagination: zPagination.optional().nullable(),
});

export type PaymentReceiptIndexPayload = z.infer<typeof zPaymentReceiptIndexPayload>;

export const zPaymentReceiptDataColumn = zPaymentReceipt.extend({
  actions: z.string().optional(),
});

export type PaymentReceiptDataColumn = z.infer<typeof zPaymentReceiptDataColumn>;

/* ---------- Details ---------- */

export const zPaymentReceiptDetailsPayload = z.object({
  data:   zPaymentReceipt,
  status: z.boolean(),
});

export type PaymentReceiptDetailsPayload = z.infer<typeof zPaymentReceiptDetailsPayload>;

/* ---------- Create / Update ---------- */

export const zPaymentReceiptCreateResponse = () =>
  z.object({
    data:    zPaymentReceipt.optional(),
    message: z.string(),
    status:  z.boolean(),
  });

export type PaymentReceiptCreateResponse = z.infer<ReturnType<typeof zPaymentReceiptCreateResponse>>;

/* ---------- List ---------- */

export const zPaymentReceiptListPayload = z.object({
  data:   z.array(zSelectOption),
  status: z.boolean(),
});

export type PaymentReceiptListPayload = z.infer<typeof zPaymentReceiptListPayload>;
