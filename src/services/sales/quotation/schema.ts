import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";

/* =========================================================
   Sales Quotation Item
========================================================= */

export const zSalesQuotationItem = zStandardObject.extend({
    sales_quotation_id: z.string().uuid(),
    sales_log_item_id:  z.string().uuid(),
    condition_id:       z.string().uuid(),
    qty:                z.number(),
    unit_price:         z.number(),
    total_value:        z.number(),
    remarks:            z.string().nullable().optional(),

    // ── Relations ──
    condition: zBasicObject.nullable().optional(),
    sales_log_item: z.object({
        id:     z.string().uuid(),
        qty:    z.number(),
        remark: z.string().nullable().optional(),
        part_number: zBasicObject.extend({
            name:        z.string(),
            description: z.string().nullable().optional(),
        }).nullable().optional(),
        condition:       zBasicObject.nullable().optional(),
        unit_of_measure: zBasicObject.nullable().optional(),
    }).nullable().optional(),
});

export type SalesQuotationItem = z.infer<typeof zSalesQuotationItem>;

/* =========================================================
   Sales Log (nested inside SQ)
========================================================= */

const zSalesLogRef = z.object({
    id:            z.string().uuid(),
    code:          z.string().nullable().optional(),
    cust_rfq_no:   z.string().nullable().optional(),
    cust_rfq_date: z.string().nullable().optional(),
    due_date:      z.string().nullable().optional(),
    customer: z.object({
        id:            z.string().uuid(),
        name:          z.string().nullable().optional(),
        business_name: z.string().nullable().optional(),
        code:          z.string().nullable().optional(),
    }).nullable().optional(),
    currency: zBasicObject.extend({
        code:   z.string().nullable().optional(),
        symbol: z.string().nullable().optional(),
        name:   z.string().nullable().optional(),
    }).nullable().optional(),
    payment_term:              zBasicObject.nullable().optional(),
    payment_mode:              zBasicObject.nullable().optional(),
    fob:                       zBasicObject.nullable().optional(),
    priority:                  zBasicObject.nullable().optional(),
    customer_contact_manager:  z.record(z.any()).nullable().optional(),
    customer_shipping_address: z.record(z.any()).nullable().optional(),
});

/* =========================================================
   Sales Quotation
========================================================= */

export const zSalesQuotation = zStandardObject.extend({
    code:           z.string(),
    sales_log_id:   z.string().uuid(),
    quotation_date: z.string(),                              // ← renamed from validity_date
    expiry_date:    z.string().nullable().optional(),        // ← new
    quotation_file: z.string().nullable().optional(),        // ← new
    remarks:        z.string().nullable().optional(),
    is_closed:      z.boolean().nullable().optional(),       // ← new
    is_editable:    z.boolean().nullable().optional(),       // ← new
    total_value:    z.number().optional(),
    total_items:    z.number().optional(),

    // ── Relations ──
    sales_log: zSalesLogRef.nullable().optional(),
    items:     z.array(zSalesQuotationItem).optional(),
});

export type SalesQuotation = z.infer<typeof zSalesQuotation>;

/* =========================================================
   Index Payload
========================================================= */

export const zSalesQuotationIndexPayload = z.object({
    data:       z.array(zSalesQuotation),
    pagination: zPagination.optional().nullable(),
});
export type SalesQuotationIndexPayload = z.infer<typeof zSalesQuotationIndexPayload>;

export const zSalesQuotationDataColumn = zSalesQuotation.extend({
    actions: z.string().optional(),
});
export type SalesQuotationDataColumn = z.infer<typeof zSalesQuotationDataColumn>;

/* =========================================================
   Details Payload
========================================================= */

export const zSalesQuotationDetailsPayload = z.object({
    data:   zSalesQuotation,
    status: z.boolean(),
});
export type SalesQuotationDetailsPayload = z.infer<typeof zSalesQuotationDetailsPayload>;

/* =========================================================
   Create / Update Response
========================================================= */

export const zSalesQuotationCreateResponse = () =>
    z.object({
        data:    zSalesQuotation.optional(),
        message: z.string(),
        status:  z.boolean(),
    });
export type SalesQuotationCreateResponse = z.infer<ReturnType<typeof zSalesQuotationCreateResponse>>;

/* =========================================================
   List Payload
========================================================= */

export const zSalesQuotationListPayload = z.object({
    data:   z.array(zSelectOption),
    status: z.boolean(),
});
export type SalesQuotationListPayload = z.infer<typeof zSalesQuotationListPayload>;

/* =========================================================
   Variable Types
========================================================= */

export interface SalesQuotationItemVariable {
    sales_log_item_id: string;
    condition_id:      string;
    qty:               number;
    unit_price:        number;
    remarks?:          string | null;
}

export interface SalesQuotationVariables {
    id?:            string;
    sales_log_id:   string;
    quotation_date: string;                                  // ← renamed
    expiry_date?:   string | null;                           // ← new
    quotation_file?: string | null;                          // ← new
    remarks?:       string;
    is_closed?:     boolean;                                 // ← new
    is_editable?:   boolean;                                 // ← new
    items:          SalesQuotationItemVariable[];
}