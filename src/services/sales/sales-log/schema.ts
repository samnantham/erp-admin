import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomerContactManager, zCustomerShippingAddress } from "@/services/master/customer/schema"

/* =========================================================
   Sub Models
========================================================= */

const zSalesLogItem = zStandardObject.extend({
  sales_log_id:                 z.string().uuid(),
  part_number_id:               z.string().uuid(),
  condition_id:                 z.string().uuid(),
  unit_of_measure_id:           z.string().uuid(),
  qty:                          z.number(),
  remark:                       z.string().nullable().optional(),
  is_closed:                    z.boolean().nullable().optional(),
  is_purchase_request_fulfilled: z.boolean().nullable().optional(),
  has_pending_request:          z.boolean().optional(),
  pending_request_message:      z.string().nullable().optional(),

  // Relations
  part_number:     zBasicObject.extend({
    name:              z.string(),
    description:       z.string(),
    manufacturer_name: z.string().nullable().optional(),
    cage_code:         z.string().nullable().optional(),
  }).nullable().optional(),
  condition:       zBasicObject.nullable().optional(),
  unit_of_measure: zBasicObject.nullable().optional(),
});

export type SalesLogItem = z.infer<typeof zSalesLogItem>;

/* =========================================================
   SalesLog
========================================================= */

export const zSalesLog = zStandardObject.extend({
  cust_rfq_no:   z.string(),
  cust_rfq_date: z.string(),
  due_date:      z.string(),
  remarks:       z.string().nullable().optional(),
  code:          z.string().nullable().optional(),
  version:       z.number(),

  // Flags
  is_closed:                       z.boolean().nullable().optional(),
  is_purchase_request_fulfilled:   z.boolean().nullable().optional(),
  is_editable:                     z.boolean().nullable().optional(),
  has_pending_request:             z.boolean().optional(),
  pending_request_message:         z.string().nullable().optional(),
  created_by:                      z.string().nullable().optional(),

  // Computed
  total_items:  z.number().optional(),
  total_qty:    z.number().optional(),
  total_closed: z.number().optional(),
  total_open:   z.number().optional(),

  // Foreign Keys
  customer_id:                  z.string().uuid(),
  mode_of_receipt_id:           z.string().uuid(),
  priority_id:                  z.string().uuid(),
  customer_contact_manager_id:  z.string().uuid(),
  customer_shipping_address_id: z.string().uuid(),
  currency_id:                  z.string().uuid(),
  fob_id:                       z.string().uuid().nullable().optional(),
  payment_mode_id:              z.string().uuid().nullable().optional(),
  payment_term_id:              z.string().uuid().nullable().optional(),

  // Relations
  customer:                  zStandardObject.extend({ business_name: z.string().optional() }).nullable().optional(),
  mode_of_receipt:           zBasicObject.nullable().optional(),
  priority:                  zBasicObject.nullable().optional(),
  customer_contact_manager:  zCustomerContactManager.nullable().optional(),
  customer_shipping_address: zCustomerShippingAddress.nullable().optional(),
  currency:                  zBasicObject.extend({ code: z.string().optional(), symbol: z.string().optional() }).nullable().optional(),
  fob:                       zBasicObject.nullable().optional(),
  payment_mode:              zBasicObject.nullable().optional(),
  payment_term:              zBasicObject.nullable().optional(),
  items:                     z.array(zSalesLogItem).optional(),
});

export type SalesLog = z.infer<typeof zSalesLog>;

/* =========================================================
   API Payloads
========================================================= */

export const zSalesLogIndexPayload = z.object({
  data:       z.array(zSalesLog),
  pagination: zPagination,
});
export type SalesLogIndexPayload = z.infer<typeof zSalesLogIndexPayload>;

export const zSalesLogDetailsPayload = z.object({
  data:   zSalesLog,
  status: z.boolean(),
});
export type SalesLogDetailsPayload = z.infer<typeof zSalesLogDetailsPayload>;

export const zSalesLogSaveResponsePayload = z.object({
  data:    zSalesLog.optional(),
  message: z.string(),
  status:  z.boolean(),
});
export type SalesLogSaveResponsePayload = z.infer<typeof zSalesLogSaveResponsePayload>;

export const zSalesLogItemSaveResponsePayload = z.object({
  data:    zSalesLogItem.optional(),
  message: z.string(),
  status:  z.boolean(),
});
export type SalesLogItemSaveResponsePayload = z.infer<typeof zSalesLogItemSaveResponsePayload>;

export const zSalesLogListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});