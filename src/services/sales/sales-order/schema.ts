import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";

/* =========================================================
   Sales Order Item
========================================================= */

export const zSalesOrderItem = zStandardObject.extend({
    sales_order_id: z.string().uuid(),
    sales_log_item_id: z.string().uuid(),
    condition_id: z.string().uuid(),
    qty: z.number(),
    unit_price: z.number(),
    total_value: z.number(),
    remarks: z.string().nullable().optional(),

    // ── Relations ──
    condition: zBasicObject.nullable().optional(),
    sales_log_item: z.object({
        id: z.string().uuid(),
        qty: z.number(),
        remark: z.string().nullable().optional(),
        part_number: zBasicObject.extend({
            name: z.string(),
            description: z.string().nullable().optional(),
        }).nullable().optional(),
        condition: zBasicObject.nullable().optional(),
        unit_of_measure: zBasicObject.nullable().optional(),
    }).nullable().optional(),
});

export type SalesOrderItem = z.infer<typeof zSalesOrderItem>;

/* =========================================================
   Sales Quotation ref (nested inside SO)
========================================================= */

const zSalesLogRef = z.object({
    id: z.string().uuid(),
    code: z.string().nullable().optional(),
    cust_rfq_no: z.string().nullable().optional(),
    cust_rfq_date: z.string().nullable().optional(),
    due_date: z.string().nullable().optional(),
    customer: z.object({
        id: z.string().uuid(),
        name: z.string().nullable().optional(),
        business_name: z.string().nullable().optional(),
        code: z.string().nullable().optional(),
    }).nullable().optional(),
    currency: zBasicObject.extend({
        code: z.string().nullable().optional(),
        symbol: z.string().nullable().optional(),
        name: z.string().nullable().optional(),
    }).nullable().optional(),
    payment_term: zBasicObject.nullable().optional(),
    payment_mode: zBasicObject.nullable().optional(),
    fob: zBasicObject.nullable().optional(),
    priority: zBasicObject.nullable().optional(),
    customer_contact_manager: z.record(z.any()).nullable().optional(),
    customer_shipping_address: z.record(z.any()).nullable().optional(),
});

const zSalesQuotationRef = z.object({
    id: z.string().uuid(),
    code: z.string().nullable().optional(),
    quotation_date: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    sales_log: zSalesLogRef.nullable().optional(),
});

/* =========================================================
   Sales Order
========================================================= */

export const zSalesOrder = zStandardObject.extend({
    code: z.string(),
    sales_quotation_id: z.string().uuid(),
    order_date: z.string(),
    delivery_date: z.string().nullable().optional(),
    remarks: z.string().nullable().optional(),
    is_closed: z.boolean().nullable().optional(),
    is_editable: z.boolean().nullable().optional(),
    total_value: z.number().optional(),
    total_items: z.number().optional(),

    // ── Relations ──
    sales_quotation: zSalesQuotationRef.nullable().optional(),
    items: z.array(zSalesOrderItem).optional(),
});

export type SalesOrder = z.infer<typeof zSalesOrder>;

/* =========================================================
   Index Payload
========================================================= */

export const zSalesOrderIndexPayload = z.object({
    data: z.array(zSalesOrder),
    pagination: zPagination.optional().nullable(),
});
export type SalesOrderIndexPayload = z.infer<typeof zSalesOrderIndexPayload>;

export const zSalesOrderDataColumn = zSalesOrder.extend({
    actions: z.string().optional(),
});
export type SalesOrderDataColumn = z.infer<typeof zSalesOrderDataColumn>;

/* =========================================================
   Details Payload
========================================================= */

export const zSalesOrderDetailsPayload = z.object({
    data: zSalesOrder,
    status: z.boolean(),
});
export type SalesOrderDetailsPayload = z.infer<typeof zSalesOrderDetailsPayload>;

/* =========================================================
   Create / Update Response
========================================================= */

export const zSalesOrderCreateResponse = () =>
    z.object({
        data: zSalesOrder.optional(),
        message: z.string(),
        status: z.boolean(),
    });
export type SalesOrderCreateResponse = z.infer<ReturnType<typeof zSalesOrderCreateResponse>>;

/* =========================================================
   List Payload
========================================================= */

export const zSalesOrderListPayload = z.object({
    data: z.array(zSelectOption),
    status: z.boolean(),
});
export type SalesOrderListPayload = z.infer<typeof zSalesOrderListPayload>;

/* =========================================================
   Variable Types
========================================================= */

export interface SalesOrderItemVariable {
    id?: string;
    sales_log_item_id: string;
    condition_id: string;
    qty: number;
    unit_price: number;
    total_value: number;
    remarks?: string | null;
}

export interface SalesOrderVariables {
    id?: string;
    sales_quotation_id: string;
    order_date: string;
    delivery_date?: string | null;
    remarks?: string;
    is_closed?: boolean;
    is_editable?: boolean;
    items: SalesOrderItemVariable[];
}