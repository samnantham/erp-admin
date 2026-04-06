import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";
import { zMaterialRequestItem, zMaterialRequest } from "@/services/purchase/material-request/schema";
import { zCustomerContactManager } from "@/services/master/customer/schema";

/* =========================================================
Sub Models
========================================================= */
const zPRFQItem = zStandardObject.extend({
    prfq_id: z.string().uuid(),
    part_number_id: z.string().uuid(),
    condition_id: z.string().uuid(),
    unit_of_measure_id: z.string().uuid(),
    material_request_item_id: z.string().uuid().nullable().optional(),
    material_request_id: z.string().uuid().nullable().optional(),
    material_request_code: z.string().nullable().optional(),
    qty: z.number(),
    remark: z.string().nullable().optional(),
    is_closed: z.boolean().nullable().optional(),
    has_pending_request: z.boolean().optional(),
    pending_request_message: z.string().nullable().optional(),
    material_request_info: zMaterialRequest.optional().nullable(),
    material_request_item_info: zMaterialRequestItem.optional().nullable(),
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
export type PRFQItem = z.infer<typeof zPRFQItem>;

/* =========================================================
Vendor (Customer used as Vendor)
========================================================= */
const zPRFQVendor = zStandardObject.extend({
    prfq_id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    customer_contact_manager_id: z.string().uuid(),
    token: z.string(),
    is_approved: z.boolean().optional(),
    quotation_fulfillment: z.number().optional(),
    // Relations
    vendor: zStandardObject.extend({
        business_name: z.string().nullable().optional(),
        code: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
    }).nullable().optional(),
    customer_contact_manager: zCustomerContactManager.nullable().optional(),
});
export type PRFQVendor = z.infer<typeof zPRFQVendor>;

/* =========================================================
PRFQ Material Request (junction)
========================================================= */
const zPRFQMaterialRequest = zStandardObject.extend({
    prfq_id: z.string().uuid(),
    material_request_id: z.string().uuid(),
    // Relation (included when include_relations=True)
    material_request: zMaterialRequest.nullable().optional(),
});
export type PRFQMaterialRequest = z.infer<typeof zPRFQMaterialRequest>;

/* =========================================================
PRFQ
========================================================= */
export const zPRFQ = zStandardObject.extend({
    code: z.string().nullable().optional(),
    need_by_date: z.string(),
    remarks: z.string().nullable().optional(),
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
    total_vendors: z.number().optional(),
    // Foreign Keys
    priority_id: z.string().uuid(),
    // Always present — frontend uses for prefill
    material_request_ids: z.array(z.string().uuid()).optional(),
    // Relations
    priority: zBasicObject.nullable().optional(),
    user: zBasicObject.extend({
        full_name: z.string().optional(),
    }).nullable().optional(),
    items: z.array(zPRFQItem).optional(),
    vendors: z.array(zPRFQVendor).optional(),
    material_requests: z.array(zPRFQMaterialRequest).optional(),
});
export type PRFQ = z.infer<typeof zPRFQ>;

/* =========================================================
API Payloads
========================================================= */
export const zPRFQIndexPayload = z.object({
    data: z.array(zPRFQ),
    pagination: zPagination,
});
export type PRFQIndexPayload = z.infer<typeof zPRFQIndexPayload>;

export const zPRFQDetailsPayload = z.object({
    data: zPRFQ,
    status: z.boolean(),
});
export type PRFQDetailsPayload = z.infer<typeof zPRFQDetailsPayload>;

export const zPRFQSaveResponsePayload = z.object({
    data: zPRFQ.optional(),
    message: z.string(),
    status: z.boolean(),
});
export type PRFQSaveResponsePayload = z.infer<typeof zPRFQSaveResponsePayload>;

export const zPRFQItemSaveResponsePayload = z.object({
    data: zPRFQItem.optional(),
    message: z.string(),
    status: z.boolean(),
});
export type PRFQItemSaveResponsePayload = z.infer<typeof zPRFQItemSaveResponsePayload>;

/* =========================================================
PRFQ Vendor Info (get_vendors endpoint)
========================================================= */
export const zPRFQVendorInfo = z.object({
    id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    customer_contact_manager_id: z.string().uuid(),
    is_approved: z.boolean().optional(),
    // Customer
    business_name: z.string().nullable().optional(),
    code: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    // Contact manager
    attention: z.string().nullable().optional(),
    address_line1: z.string().nullable().optional(),
    contact_email: z.string().nullable().optional(),
    contact_phone: z.string().nullable().optional(),
    token: z.string(),
    prfq_id: z.string().uuid(),
    contact: zCustomerContactManager.nullable().optional(),
});
export type PRFQVendorInfo = z.infer<typeof zPRFQVendorInfo>;

export const zPRFQVendorsPayload = z.object({
    status: z.boolean(),
    data: z.array(zPRFQVendorInfo),
});
export type PRFQVendorsPayload = z.infer<typeof zPRFQVendorsPayload>;

/* =========================================================
Add Vendor to PRFQ  (POST /<prfq_id>/vendors)
========================================================= */
export const zAddVendorToPRFQVariables = z.object({
    prfq_id: z.string().uuid(),
    vendor_id: z.string().uuid(),
    customer_contact_manager_id: z.string().uuid(),
});
export type AddVendorToPRFQVariables = z.infer<typeof zAddVendorToPRFQVariables>;

export const zAddVendorToPRFQPayload = z.object({
    status: z.boolean(),
    message: z.string(),
    data: zPRFQVendorInfo.optional(),
});
export type AddVendorToPRFQPayload = z.infer<typeof zAddVendorToPRFQPayload>;

/* =========================================================
PRFQ List (select options)
========================================================= */
export const zPRFQListPayload = z.object({
    data: z.array(zSelectOption),
    status: z.boolean(),
});