import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";

/* =========================================================
   QuotationLineItem (offer/alternative under a QuotationItem)
========================================================= */
const zQuotationLineItem = zStandardObject.extend({
    quotation_item_id: z.string().uuid(),
    part_number_id: z.string().uuid().nullable().optional(),
    requested_part_number_id: z.string().uuid().nullable().optional(),
    condition_id: z.string().uuid().nullable().optional(),
    unit_of_measure_id: z.string().uuid().nullable().optional(),
    qty: z.number().nullable().optional(),
    price: z.string().nullable().optional(),
    moq: z.number().nullable().optional(),
    mov: z.string().nullable().optional(),
    delivery_options: z.string().nullable().optional(),
    remark: z.string().nullable().optional(),
    // Relations
    part_number: zBasicObject.extend({
        name: z.string(),
        description: z.string().nullable().optional(),
    }).nullable().optional(),
    requested_part_number: zBasicObject.extend({
        name: z.string(),
        description: z.string().nullable().optional(),
    }).nullable().optional(),
    condition: zBasicObject.nullable().optional(),
    unit_of_measure: zBasicObject.nullable().optional(),
    // Extra fields injected by PurchaseQuotation.to_dict
    prfq_item_id: z.string().uuid().nullable().optional(),
    is_item_closed: z.boolean().nullable().optional(),
});
export type QuotationLineItem = z.infer<typeof zQuotationLineItem>;

/* =========================================================
   QuotationItem (slot — one per prfq_item per quotation)
========================================================= */
const zQuotationItem = zStandardObject.extend({
    quotation_id: z.string().uuid(),
    prfq_item_id: z.string().uuid().nullable().optional(),
    // Flags
    is_no_quote: z.boolean(),
    is_closed: z.boolean().nullable().optional(),
    has_pending_request: z.boolean().optional(),
    pending_request_message: z.string().nullable().optional(),
    // Computed
    material_request: z.object({
        id: z.string().uuid(),
        type: z.string().nullable().optional(),
        ref: z.string().nullable().optional(),
    }).nullable().optional(),
    // Relations
    prfq_item: zStandardObject.nullable().optional(),
    lines: z.array(zQuotationLineItem).optional(),
});
export type QuotationItem = z.infer<typeof zQuotationItem>;

/* =========================================================
   Purchase Quotation
========================================================= */
export const zPurchaseQuotation = zStandardObject.extend({
    vendor_quotation_no: z.string().nullable().optional(),
    vendor_quotation_date: z.string(),
    expiry_date: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    quotation_file: z.string().nullable().optional(),
    version: z.number().nullable().optional(),
    code: z.string().nullable().optional(),
    // Flags
    is_closed: z.boolean().nullable().optional(),
    is_editable: z.boolean().nullable().optional(),
    is_empty: z.boolean().nullable().optional(),
    update_request_status: z.boolean().nullable().optional(),
    has_pending_request: z.boolean().optional(),
    pending_request_message: z.string().nullable().optional(),
    // Computed
    total_items: z.number().optional(),
    total_qty: z.number().optional(),
    total_closed: z.number().optional(),
    total_open: z.number().optional(),
    total_value: z.number().optional(),
    // Foreign Keys
    prfq_id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    currency_id: z.string().uuid(),
    // Relations
    prfq: zStandardObject.extend({
        code: z.string().nullable().optional(),
        need_by_date: z.string().nullable().optional(),
    }).nullable().optional(),
    vendor: zStandardObject.extend({
        business_name: z.string().nullable().optional(),
        code: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
    }).nullable().optional(),
    currency: zBasicObject.extend({
        name: z.string().nullable().optional(),
        symbol: z.string().nullable().optional(),
    }).nullable().optional(),
    items: z.array(zQuotationItem).optional(),
    // Extra
    rfq_need_by_date: z.string().nullable().optional(),
    material_requests: z.array(z.object({
        id: z.string().uuid(),
        ref: z.string().nullable().optional(),
        type: z.string().nullable().optional(),
        due_date: z.string().nullable().optional(),
    })).optional(),
    // ─── Flattened line items (all lines across all items) ────────────────
    line_items: z.array(zQuotationLineItem).optional(),
});
export type PurchaseQuotation = z.infer<typeof zPurchaseQuotation>;

/* =========================================================
   API Payloads
========================================================= */
export const zPurchaseQuotationIndexPayload = z.object({
    data: z.array(zPurchaseQuotation),
    pagination: zPagination,
});
export type PurchaseQuotationIndexPayload = z.infer<typeof zPurchaseQuotationIndexPayload>;

export const zPurchaseQuotationDetailsPayload = z.object({
    data: zPurchaseQuotation,
    status: z.boolean(),
});
export type PurchaseQuotationDetailsPayload = z.infer<typeof zPurchaseQuotationDetailsPayload>;

export const zPurchaseQuotationSaveResponsePayload = z.object({
    data: zPurchaseQuotation.optional(),
    message: z.string(),
    status: z.boolean(),
});
export type PurchaseQuotationSaveResponsePayload = z.infer<typeof zPurchaseQuotationSaveResponsePayload>;

export const zQuotationItemSaveResponsePayload = z.object({
    data: z.array(zQuotationItem).optional(),
    message: z.string(),
    status: z.boolean(),
});
export type QuotationItemSaveResponsePayload = z.infer<typeof zQuotationItemSaveResponsePayload>;

export const zQuotationListPayload = z.object({
    data: z.array(zSelectOption),
    status: z.boolean(),
});
export type QuotationListPayload = z.infer<typeof zQuotationListPayload>;

export const zQuotationItemsPayload = z.object({
    data: z.array(zQuotationItem),
    status: z.boolean(),
});
export type QuotationItemsPayload = z.infer<typeof zQuotationItemsPayload>;

/* =========================================================
   Update Line Item
========================================================= */
export const zQuotationLineItemUpdatePayload = z.object({
    part_number_id: z.string().uuid().nullable().optional(),
    requested_part_number_id: z.string().uuid().nullable().optional(),
    condition_id: z.string().uuid().nullable().optional(),
    unit_of_measure_id: z.string().uuid().nullable().optional(),
    qty: z.number().nullable().optional(),
    price: z.number().nullable().optional(),
    moq: z.number().nullable().optional(),
    mov: z.number().nullable().optional(),
    delivery_options: z.string().nullable().optional(),
    remark: z.string().nullable().optional(),
});
export type QuotationLineItemUpdatePayload = z.infer<typeof zQuotationLineItemUpdatePayload>;

export const zQuotationLineItemUpdateVariables = zQuotationLineItemUpdatePayload.extend({
    quotation_id: z.string(),
    line_item_id: z.string(),
});
export type QuotationLineItemUpdateVariables = z.infer<typeof zQuotationLineItemUpdateVariables>;

export const zQuotationLineItemUpdateResponsePayload = z.object({
    data: zQuotationItem.optional(),
    message: z.string(),
    status: z.boolean(),
});
export type QuotationLineItemUpdateResponsePayload = z.infer<typeof zQuotationLineItemUpdateResponsePayload>;

export const zQuotationsByRfqPayload = z.object({
    data: z.array(zPurchaseQuotation),
    status: z.boolean(),
});
export type QuotationsByRfqPayload = z.infer<typeof zQuotationsByRfqPayload>;