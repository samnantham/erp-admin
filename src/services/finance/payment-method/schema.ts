import { z } from "zod";
import { zStandardObject, zPagination, zBasicObject } from "@/services/global-schema";


/* =========================================================
   Models
========================================================= */

/* ---------- Finance Bank ---------- */

export const zFinanceBank = zStandardObject.extend({
  name:           z.string(),
  account_label:  z.string(),
  branch:         z.string(),
  address_line1:  z.string(),
  address_line2:  z.string().nullable().optional(),
  ac_iban_no:     z.string(),
  type_of_ac:     z.string(),
  swift:          z.string(),
  aba_routing_no: z.string().nullable().optional(),
  ifsc_code:      z.string().nullable().optional(),
  contact_name:   z.string(),
  phone:          z.string().nullable().optional(),
  fax:            z.string().nullable().optional(),
  mobile:         z.string().nullable().optional(),
  email:          z.string().email().nullable().optional(),
  currency_id:       z.string().uuid().nullable().optional(),
  currency: zBasicObject.nullable().optional(),
  is_default:     z.boolean(),
  is_active:      z.boolean(),
});

export type FinanceBank = z.infer<typeof zFinanceBank>;


/* ---------- Finance Card ---------- */

export const zFinanceCard = zStandardObject.extend({
  card_label:       z.string(),
  card_holder_name: z.string(),
  card_type:        z.string(),
  card_category:    z.string(),
  card_last4:       z.string().length(4),
  expiry_month:     z.string().length(2),
  expiry_year:      z.string().length(4),
  bank_name:        z.string(),
  address_line1:    z.string().nullable().optional(),
  address_line2:    z.string().nullable().optional(),
  contact_name:     z.string(),
  phone:            z.string().nullable().optional(),
  mobile:           z.string().nullable().optional(),
  email:            z.string().email().nullable().optional(),
  currency_id:       z.string().uuid().nullable().optional(),
  currency: zBasicObject.nullable().optional(),
  is_default:       z.boolean(),
  is_active:        z.boolean(),
});

export type FinanceCard = z.infer<typeof zFinanceCard>;


/* ---------- Finance Cheque ---------- */

export const zFinanceCheque = zStandardObject.extend({
  name:           z.string(),
  account_label:  z.string(),
  branch:         z.string(),
  address_line1:  z.string(),
  address_line2:  z.string().nullable().optional(),
  ac_no:          z.string(),
  type_of_ac:     z.string(),
  aba_routing_no: z.string().nullable().optional(),
  ifsc_code:      z.string().nullable().optional(),
  micr_code:      z.string().nullable().optional(),
  contact_name:   z.string(),
  phone:          z.string().nullable().optional(),
  fax:            z.string().nullable().optional(),
  mobile:         z.string().nullable().optional(),
  email:          z.string().email().nullable().optional(),
  currency_id:        z.string().uuid().nullable().optional(),
  currency: zBasicObject.nullable().optional(),
  is_default:     z.boolean(),
  is_active:      z.boolean(),
});

export type FinanceCheque = z.infer<typeof zFinanceCheque>;


/* =========================================================
   API Payloads
========================================================= */

/* ---------- Index ---------- */

export const zFinanceBankIndexPayload = z.object({
  data:       z.array(zFinanceBank),
  pagination: zPagination,
});
export type FinanceBankIndexPayload = z.infer<typeof zFinanceBankIndexPayload>;

export const zFinanceCardIndexPayload = z.object({
  data:       z.array(zFinanceCard),
  pagination: zPagination,
});
export type FinanceCardIndexPayload = z.infer<typeof zFinanceCardIndexPayload>;

export const zFinanceChequeIndexPayload = z.object({
  data:       z.array(zFinanceCheque),
  pagination: zPagination,
});
export type FinanceChequeIndexPayload = z.infer<typeof zFinanceChequeIndexPayload>;


/* ---------- Details ---------- */

export const zFinanceBankDetailsPayload = z.object({
  data:   zFinanceBank,
  status: z.boolean(),
});
export type FinanceBankDetailsPayload = z.infer<typeof zFinanceBankDetailsPayload>;

export const zFinanceCardDetailsPayload = z.object({
  data:   zFinanceCard,
  status: z.boolean(),
});
export type FinanceCardDetailsPayload = z.infer<typeof zFinanceCardDetailsPayload>;

export const zFinanceChequeDetailsPayload = z.object({
  data:   zFinanceCheque,
  status: z.boolean(),
});
export type FinanceChequeDetailsPayload = z.infer<typeof zFinanceChequeDetailsPayload>;


/* ---------- Create / Update ---------- */

const zPaymentMethodCreateResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data:    dataSchema.optional(),
    message: z.string(),
    status:  z.boolean(),
  });

export const zFinanceBankCreateResponse   = () => zPaymentMethodCreateResponse(zFinanceBank);
export const zFinanceCardCreateResponse   = () => zPaymentMethodCreateResponse(zFinanceCard);
export const zFinanceChequeCreateResponse = () => zPaymentMethodCreateResponse(zFinanceCheque);

export type FinanceBankCreateResponse   = z.infer<ReturnType<typeof zFinanceBankCreateResponse>>;
export type FinanceCardCreateResponse   = z.infer<ReturnType<typeof zFinanceCardCreateResponse>>;
export type FinanceChequeCreateResponse = z.infer<ReturnType<typeof zFinanceChequeCreateResponse>>;


/* ---------- Data Columns (for tables) ---------- */

export const zFinanceBankDataColumn   = zFinanceBank.extend({ actions: z.string().optional() });
export const zFinanceCardDataColumn   = zFinanceCard.extend({ actions: z.string().optional() });
export const zFinanceChequeDataColumn = zFinanceCheque.extend({ actions: z.string().optional() });

export type FinanceBankDataColumn   = z.infer<typeof zFinanceBankDataColumn>;
export type FinanceCardDataColumn   = z.infer<typeof zFinanceCardDataColumn>;
export type FinanceChequeDataColumn = z.infer<typeof zFinanceChequeDataColumn>;
