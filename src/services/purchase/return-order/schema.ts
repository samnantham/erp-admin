import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zCustomer } from "@/services/master/customer/schema";
/* =========================================================
   Return Order Item
========================================================= */

export const zReturnOrderItem = zStandardObject.extend({
    return_order_id:  z.string().uuid(),
    po_item_id:       z.string().uuid(),
    invoice_item_id:  z.string().uuid().nullable().optional(),
    invoice_type:     z.enum(['invoice', 'proforma']).nullable().optional(),
    return_qty:       z.number(),
    return_amount:    z.number(),
    remarks:          z.string().nullable().optional(),

    // ── Relations ──
    po_item: zStandardObject.extend({
        purchase_order_id:  z.string().uuid(),
        part_number_id:     z.string().uuid(),
        condition_id:       z.string().uuid(),
        unit_of_measure_id: z.string().uuid(),
        qty:                z.number(),
        price:              z.number(),
        unit_price:         z.number(),
        total_value:        z.number(),
        paid_amount:        z.number().nullable().optional(),
        paid_qty:           z.number().nullable().optional(),
        balance:            z.number().nullable().optional(),
        is_closed:          z.boolean().nullable().optional(),
        note:               z.string().nullable().optional(),
        part_number:        zBasicObject.extend({
            name:        z.string(),
            description: z.string().nullable().optional(),
        }).nullable().optional(),
        condition:          zBasicObject.nullable().optional(),
        unit_of_measure:    zBasicObject.nullable().optional(),
    }).nullable().optional(),
});

export type ReturnOrderItem = z.infer<typeof zReturnOrderItem>;

/* =========================================================
   Return Order
========================================================= */

export const zReturnOrder = zStandardObject.extend({
    code:                   z.string(),
    purchase_order_id:      z.string().uuid(),
    invoice_reference_type: z.enum(['invoice', 'proforma']).nullable().optional(),
    invoice_reference_id:   z.string().uuid().nullable().optional(),
    invoice_reference_code: z.string().nullable().optional(),
    return_date:            z.string(),
    remarks:                z.string().nullable().optional(),
    status:                 z.enum(['pending', 'approved', 'completed']),
    total_return_amount:    z.number(),

    // ── Relations ──
    purchase_order: z.object({
        id:          z.string().uuid(),
        code:        z.string().nullable().optional(),
        total_value: z.number().nullable().optional(),
        total_paid:  z.number().nullable().optional(),
        currency:    zBasicObject.extend({
            code:   z.string().nullable().optional(),
            symbol: z.string().nullable().optional(),
        }).nullable().optional(),
        customer: zCustomer.nullable().optional(),
        payment_mode: zBasicObject.nullable().optional(),
        payment_term: zBasicObject.nullable().optional(),
    }).nullable().optional(),

    // ── Invoice or Proforma (resolved polymorphically) ──
    invoice_reference: z.record(z.any()).nullable().optional(),

    // ── include_all ──
    items: z.array(zReturnOrderItem).optional(),
});

export type ReturnOrder = z.infer<typeof zReturnOrder>;

/* =========================================================
   Index Payload
========================================================= */

export const zReturnOrderIndexPayload = z.object({
    data:       z.array(zReturnOrder),
    pagination: zPagination.optional().nullable(),
});
export type ReturnOrderIndexPayload = z.infer<typeof zReturnOrderIndexPayload>;

export const zReturnOrderDataColumn = zReturnOrder.extend({
    actions: z.string().optional(),
});
export type ReturnOrderDataColumn = z.infer<typeof zReturnOrderDataColumn>;

/* =========================================================
   Details Payload
========================================================= */

export const zReturnOrderDetailsPayload = z.object({
    data:   zReturnOrder,
    status: z.boolean(),
});
export type ReturnOrderDetailsPayload = z.infer<typeof zReturnOrderDetailsPayload>;

/* =========================================================
   Create / Update Response
========================================================= */

export const zReturnOrderCreateResponse = () =>
    z.object({
        data:    zReturnOrder.optional(),
        message: z.string(),
        status:  z.boolean(),
    });
export type ReturnOrderCreateResponse = z.infer<ReturnType<typeof zReturnOrderCreateResponse>>;

/* =========================================================
   List Payload
========================================================= */

export const zReturnOrderListPayload = z.object({
    data:   z.array(zSelectOption),
    status: z.boolean(),
});
export type ReturnOrderListPayload = z.infer<typeof zReturnOrderListPayload>;