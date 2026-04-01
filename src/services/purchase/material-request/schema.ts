import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zSalesLog } from "@/services/sales-log/schema";

/* =========================================================
Sub Models
========================================================= */

export const zMaterialRequestItem = zStandardObject.extend({
    material_request_id: z.string().uuid(),

    part_number_id: z.string().uuid(),
    condition_id: z.string().uuid(),
    unit_of_measure_id: z.string().uuid(),
    sales_log_item_id: z.string().uuid().nullable().optional(),
    qty: z.number(),
    remark: z.string().nullable().optional(),

    is_closed: z.boolean().nullable().optional(),

    has_pending_request: z.boolean().optional(),
    pending_request_message: z.string().nullable().optional(),

    // Relations
    part_number: zBasicObject.extend({
        name: z.string(),
        description: z.string(),
        manufacturer_name: z.string().nullable().optional(),
        cage_code: z.string().nullable().optional(),
    }).nullable().optional(),

    condition: zBasicObject.nullable().optional(),
    unit_of_measure: zBasicObject.nullable().optional(),
});

export type MaterialRequestItem = z.infer<typeof zMaterialRequestItem>;

/* =========================================================
Material Request
========================================================= */

export const zMaterialRequest = zStandardObject.extend({
    code: z.string().nullable().optional(),

    // ✅ FIXED ENUM
    type: z.enum(["sel", "wo", "oe"]),
    type_label: z.string(),

    due_date: z.string(),
    remarks: z.string().nullable().optional(),

    version: z.number(),

    // Flags
    is_closed: z.boolean().nullable().optional(),
    is_editable: z.boolean().nullable().optional(),
    update_request_status: z.boolean().nullable().optional(),

    has_pending_request: z.boolean().optional(),
    pending_request_message: z.string().nullable().optional(),
    created_by: z.string().nullable().optional(),

    // Computed
    total_items: z.number().optional(),
    total_qty: z.number().optional(),
    total_closed: z.number().optional(),
    total_open: z.number().optional(),

    // Foreign Keys
    priority_id: z.string().uuid(),
    sales_log_id: z.string().uuid().nullable().optional(),

    // Relations
    priority: zBasicObject.nullable().optional(),

    user: zBasicObject.extend({
        full_name: z.string().optional(),
    }).nullable().optional(),

    sales_log: zSalesLog.extend({
        code: z.string().optional(),
    }).nullable().optional(),

    items: z.array(zMaterialRequestItem).optional(),
});

export type MaterialRequest = z.infer<typeof zMaterialRequest>;

/* =========================================================
API Payloads
========================================================= */

export const zMaterialRequestIndexPayload = z.object({
    data: z.array(zMaterialRequest),
    pagination: zPagination,
});
export type MaterialRequestIndexPayload = z.infer<typeof zMaterialRequestIndexPayload>;

export const zMaterialRequestDetailsPayload = z.object({
    data: zMaterialRequest,
    status: z.boolean(),
});
export type MaterialRequestDetailsPayload = z.infer<typeof zMaterialRequestDetailsPayload>;

export const zMaterialRequestSaveResponsePayload = z.object({
    data: zMaterialRequest.optional(),
    message: z.string(),
    status: z.boolean(),
});
export type MaterialRequestSaveResponsePayload = z.infer<typeof zMaterialRequestSaveResponsePayload>;

export const zMaterialRequestItemSaveResponsePayload = z.object({
    data: zMaterialRequestItem.optional(),
    message: z.string(),
    status: z.boolean(),
});
export type MaterialRequestItemSaveResponsePayload = z.infer<typeof zMaterialRequestItemSaveResponsePayload>;

export const zMaterialRequestListPayload = z.object({
  data: z.array(zSelectOption),
  status: z.boolean(),
});