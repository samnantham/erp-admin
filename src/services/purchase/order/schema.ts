import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomerContactManager, zCustomerShippingAddress, zCustomer } from "@/services/master/customer/schema";

/* =========================================================
   Sub-models
========================================================= */
const zPurchaseOrderItem = zStandardObject.extend({
    purchase_order_id:  z.string().uuid(),
    part_number_id:     z.string().uuid(),
    condition_id:       z.string().uuid(),
    unit_of_measure_id: z.string().uuid(),
    quotation_item_id:  z.string().uuid().nullable().optional(),
    qty:                z.number(),
    price:              z.number(),
    unit_price:         z.number(),
    total_value:        z.number(),
    note:               z.string().max(60).nullable().optional(),
    is_group:           z.boolean(),
    is_closed:          z.boolean().nullable().optional(),
    quotation_id:       z.string().uuid().nullable().optional(),
    // Relations
    part_number: zBasicObject.extend({
        name:              z.string(),
        description:       z.string(),
        manufacturer_name: z.string().nullable().optional(),
        cage_code:         z.string().nullable().optional(),
        is_dg:             z.boolean().optional(),
        is_llp:            z.boolean().optional(),
        is_serialized:     z.boolean().optional(),
        is_shelf_life:     z.boolean().optional(),
    }).nullable().optional(),
    condition:       zBasicObject.nullable().optional(),
    unit_of_measure: zBasicObject.nullable().optional(),
});
export type PurchaseOrderItem = z.infer<typeof zPurchaseOrderItem>;

/* =========================================================
   Quotation linked to purchase order
========================================================= */
const zPurchaseOrderQuotation = z.object({
    id:                    z.string().uuid(),
    vendor_quotation_no:   z.string().nullable().optional(),
    vendor_quotation_date: z.string().nullable().optional(),
    expiry_date:           z.string().nullable().optional(),
    code:                  z.string().nullable().optional(),
});
export type PurchaseOrderQuotation = z.infer<typeof zPurchaseOrderQuotation>;

/* =========================================================
   PRFQ reference
========================================================= */
const zPRFQRef = z.object({
    id:   z.string().uuid(),
    code: z.string().nullable().optional(),
});
export type PRFQRef = z.infer<typeof zPRFQRef>;

/* =========================================================
   Material request reference
========================================================= */
const zMaterialRequestRef = z.object({
    id:   z.string().uuid(),
    ref:  z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    type: z.string().nullable().optional(),
});
export type MaterialRequestRef = z.infer<typeof zMaterialRequestRef>;

/* =========================================================
   Purchase Order
========================================================= */
export const zPurchaseOrder = zStandardObject.extend({
    code:                  z.string().nullable().optional(),
    token:                 z.string().nullable().optional(),
    remarks:               z.string().nullable().optional(),
    bank_charge:           z.number().nullable().optional(),
    freight:               z.number().nullable().optional(),
    discount:              z.number().nullable().optional(),
    miscellaneous_charges: z.number().nullable().optional(),
    vat:                   z.number().nullable().optional(),
    reference_file:        z.string().nullable().optional(), // ← added
    // Flags
    is_closed:             z.boolean().nullable().optional(),
    is_editable:           z.boolean().nullable().optional(),
    update_request_status: z.boolean().nullable().optional(),
    version:               z.number().nullable().optional(),
    // Audit
    has_pending_request:     z.boolean().nullable().optional(),
    pending_request_message: z.string().nullable().optional(),
    // Print URL
    print: z.string().nullable().optional(),
    // Foreign Keys
    customer_contact_manager_id:  z.string().uuid(),
    priority_id:                  z.string().uuid(),
    customer_id:                  z.string().uuid().nullable().optional(),
    customer_shipping_address_id: z.string().uuid().nullable().optional(),
    payment_mode_id:              z.string().uuid(),
    payment_term_id:              z.string().uuid(),
    fob_id:                       z.string().uuid(),
    currency_id:                  z.string().uuid(),
    ship_type_id:                 z.string().uuid(),
    ship_mode_id:                 z.string().uuid(),
    ship_account_id:              z.string().uuid(),
    // Computed totals
    total_items:          z.number().optional(),
    total_qty:            z.number().optional(),
    total_closed:         z.number().optional(),
    total_open:           z.number().optional(),
    total_value:          z.number().optional(),
    total_quotations:     z.number().optional(),
    subtotal:             z.number().optional(),
    vat_amount:           z.number().optional(),
    total_price:          z.number().optional(),
    total_price_in_words: z.string().optional(),
    // Always-present shallow relations
    priority: zBasicObject.extend({
        name:      z.string(),
        days:      z.number().nullable().optional(),
        is_custom: z.boolean().optional(),
    }).nullable().optional(),
    customer:                  zCustomer.nullable().optional(),
    customer_contact_manager:  zCustomerContactManager.nullable().optional(),
    customer_shipping_address: zCustomerShippingAddress.nullable().optional(),
    payment_mode:              zBasicObject.nullable().optional(),
    payment_term: zBasicObject.extend({
        credit_days: z.number().nullable().optional(),
        is_fixed:    z.boolean().optional(),
    }).nullable().optional(),
    fob:      zBasicObject.nullable().optional(),
    currency: zBasicObject.extend({
        code:           z.string().nullable().optional(),
        symbol:         z.string().nullable().optional(),
        symbol_native:  z.string().nullable().optional(),
        name_plural:    z.string().nullable().optional(),
        decimal_digits: z.number().nullable().optional(),
        rounding:       z.number().nullable().optional(),
    }).nullable().optional(),
    ship_type:    zBasicObject.nullable().optional(),
    ship_mode:    zBasicObject.nullable().optional(),
    ship_account: zBasicObject.extend({
        account_number: z.string().nullable().optional(),
    }).nullable().optional(),
    // Conditional (include_relations=True)
    items:             z.array(zPurchaseOrderItem).nullable().optional(),
    quotations:        z.array(zPurchaseOrderQuotation).nullable().optional(),
    prfq_ids:          z.array(z.string().uuid()).nullable().optional(),
    prfqs:             z.array(zPRFQRef).nullable().optional(),
    material_requests: z.array(zMaterialRequestRef).nullable().optional(),
});
export type PurchaseOrder = z.infer<typeof zPurchaseOrder>;

/* =========================================================
   API Payloads
========================================================= */
export const zPurchaseOrderIndexPayload = z.object({
    data:       z.array(zPurchaseOrder),
    pagination: zPagination,
});
export type PurchaseOrderIndexPayload = z.infer<typeof zPurchaseOrderIndexPayload>;

export const zPurchaseOrderDetailsPayload = z.object({
    data:   zPurchaseOrder,
    status: z.boolean(),
});
export type PurchaseOrderDetailsPayload = z.infer<typeof zPurchaseOrderDetailsPayload>;

export const zPurchaseOrderSaveResponsePayload = z.object({
    data:    zPurchaseOrder.optional(),
    message: z.string(),
    status:  z.boolean(),
});
export type PurchaseOrderSaveResponsePayload = z.infer<typeof zPurchaseOrderSaveResponsePayload>;

export const zPurchaseOrderItemSaveResponsePayload = z.object({
    data:    zPurchaseOrderItem.optional(),
    message: z.string(),
    status:  z.boolean(),
});
export type PurchaseOrderItemSaveResponsePayload = z.infer<typeof zPurchaseOrderItemSaveResponsePayload>;

export const zPurchaseOrderListPayload = z.object({
    data:   z.array(zSelectOption),
    status: z.boolean(),
});
export type PurchaseOrderListPayload = z.infer<typeof zPurchaseOrderListPayload>;