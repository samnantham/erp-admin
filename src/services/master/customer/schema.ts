import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";

/* =========================================================
   Sub Models
========================================================= */

/* ---------- Quality Certificate ---------- */

export const zQualityCertificate = zStandardObject.extend({
    certificate_type: z.string(),
    doc_no:           z.string(),
    validity_date:    z.string().nullable().optional(),
    issue_date:       z.string().nullable().optional(),
    doc_url:          z.string().nullable().optional(),
});

export type QualityCertificate = z.infer<typeof zQualityCertificate>;

/* ---------- Contact Manager ---------- */

export const zCustomerContactManager = zStandardObject.extend({
    attention:     z.string(),
    address_line1: z.string().nullable().optional(),
    address_line2: z.string().nullable().optional(),
    city:          z.string().nullable().optional(),
    state:         z.string().nullable().optional(),
    zip_code:      z.string().nullable().optional(),
    country:       z.string().nullable().optional(),
    phone:         z.string().nullable().optional(),
    fax:           z.string().nullable().optional(),
    email:         z.string().nullable().optional(),
    remarks:       z.string().nullable().optional(),
});

export type CustomerContactManager = z.infer<typeof zCustomerContactManager>;

/* ---------- Shipping Address ---------- */

export const zCustomerShippingAddress = zStandardObject.extend({
    attention:      z.string(),
    consignee_name: z.string(),
    address_line1:  z.string().nullable().optional(),
    address_line2:  z.string().nullable().optional(),
    city:           z.string().nullable().optional(),
    state:          z.string().nullable().optional(),
    zip_code:       z.string().nullable().optional(),
    country:        z.string().nullable().optional(),
    phone:          z.string().nullable().optional(),
    fax:            z.string().nullable().optional(),
    email:          z.string().nullable().optional(),
    remarks:        z.string().nullable().optional(),
    is_default:     z.boolean().optional(),
});

export type CustomerShippingAddress = z.infer<typeof zCustomerShippingAddress>;

/* ---------- Customer Bank ---------- */

export const zCustomerBank = zStandardObject.extend({
    beneficiary_name: z.string(),
    name:             z.string(),
    branch:           z.string().nullable().optional(),
    address_line1:    z.string().nullable().optional(),
    address_line2:    z.string().nullable().optional(),
    ac_iban_no:       z.string().nullable().optional(),
    type_of_ac:       z.string().nullable().optional(),
    swift:            z.string().nullable().optional(),
    aba_routing_no:   z.string().nullable().optional(),
    contact_name:     z.string().nullable().optional(),
    phone:            z.string().nullable().optional(),
    fax:              z.string().nullable().optional(),
    mobile:           z.string().nullable().optional(),
    email:            z.string().nullable().optional(),
});

export type CustomerBank = z.infer<typeof zCustomerBank>;

/* ---------- Principle Owner ---------- */

export const zCustomerPrincipleOwner = zStandardObject.extend({
    owner:            z.string().nullable().optional(),
    phone:            z.string().nullable().optional(),
    email:            z.string().nullable().optional(),
    id_passport_copy: z.string().nullable().optional(),
    remarks:          z.string().nullable().optional(),
});

export type CustomerPrincipleOwner = z.infer<typeof zCustomerPrincipleOwner>;

/* ---------- Trader Reference ---------- */

export const zCustomerTraderReference = zStandardObject.extend({
    vendor_name:   z.string(),
    attention:     z.string().nullable().optional(),
    address_line1: z.string().nullable().optional(),
    address_line2: z.string().nullable().optional(),
    city:          z.string().nullable().optional(),
    state:         z.string().nullable().optional(),
    zip_code:      z.string().nullable().optional(),
    country:       z.string().nullable().optional(),
    phone:         z.string().nullable().optional(),
    fax:           z.string().nullable().optional(),
    email:         z.string().nullable().optional(),
    remarks:       z.string().nullable().optional(),
});

export type CustomerTraderReference = z.infer<typeof zCustomerTraderReference>;

/* =========================================================
   Customer
========================================================= */

export const zCustomer = zStandardObject.extend({
    business_name:      z.string(),
    code:               z.string(),
    email:              z.string().nullable().optional(),
    business_type_id:   z.string().uuid(),
    contact_type_id:    z.string().uuid(),
    currency_id:        z.string().uuid(),
    customer_status_id: z.string().uuid().nullable().optional(),
    payment_mode_id:    z.string().uuid(),
    payment_term_id:    z.string().uuid(),
    nature_of_business: z.string().nullable().optional(),
    remarks:            z.string().nullable().optional(),
    total_credit_amount: z.number().nullable().optional(),
    total_credit_period: z.number().nullable().optional(),
    year_of_business:    z.number().nullable().optional(),
    is_foreign_entity:   z.boolean().optional(),
    license_trade_no:      z.string().nullable().optional(),
    license_trade_exp_date: z.string().nullable().optional(),
    license_trade_url:     z.string().nullable().optional(),
    vat_tax_id:  z.string().nullable().optional(),
    vat_tax_url: z.string().nullable().optional(),
    created_by:  z.string().nullable().optional(),

    /* ---------- Relations ---------- */
    business_type:   zBasicObject.nullable().optional(),
    contact_type:    zBasicObject.nullable().optional(),
    customer_status: zBasicObject.extend({
        code: z.string().nullable().optional(),
    }).nullable().optional(),
    currency: zBasicObject.extend({
        code:   z.string().nullable().optional(),
        symbol: z.string().nullable().optional(),
    }).nullable().optional(),
    payment_mode:          zBasicObject.nullable().optional(),
    payment_term:          zBasicObject.nullable().optional(),
    quality_certificates:  z.array(zQualityCertificate).optional(),
    contact_managers:      z.array(zCustomerContactManager).optional(),
    shipping_addresses:    z.array(zCustomerShippingAddress).optional(),
    banks:                 z.array(zCustomerBank).optional(),
    principle_owners:      z.array(zCustomerPrincipleOwner).optional(),
    trader_references:     z.array(zCustomerTraderReference).optional(),
    completion_percentage: z.number().optional(),
});

export type Customer = z.infer<typeof zCustomer>;

/* =========================================================
   API Payloads
========================================================= */

/* ---------- Index ---------- */

export const zCustomerIndexPayload = z.object({
    data:       z.array(zCustomer),
    pagination: zPagination,
});

export type CustomerIndexPayload = z.infer<typeof zCustomerIndexPayload>;

export const zCustomerDataColumn = zCustomer.extend({
    actions: z.string().optional(),
});

export type CustomerDataColumn = z.infer<typeof zCustomerDataColumn>;

/* ---------- Create / Update ---------- */

export const zCreateResponsePayload = z.object({
    data:    zCustomer.optional(),
    message: z.string(),
    status:  z.boolean(),
});

export type CreateResponsePayload = z.infer<typeof zCreateResponsePayload>;

/* ---------- Details ---------- */

export const zCustomerDetailsPayload = z.object({
    data:   zCustomer,
    status: z.boolean(),
});

export type CustomerDetailsPayload = z.infer<typeof zCustomerDetailsPayload>;

/* ---------- Unique Check ---------- */

const zUniqueCheckResponse = z.object({
    status: z.boolean(),
    exists: z.record(z.boolean()),
    errors: z.record(z.string()).optional(),
});

export const zBulkCustomerUniqueCheckPayload = () => zUniqueCheckResponse;
export type BulkCustomerUniqueCheckPayload = z.infer<typeof zUniqueCheckResponse>;

export const zRelationUniqueCheckPayload = () => zUniqueCheckResponse;
export type RelationUniqueCheckPayload = z.infer<typeof zUniqueCheckResponse>;

/* ---------- Bulk Upload ---------- */

const zBulkUploadResponse = z.object({
    status:          z.boolean(),
    inserted_count:  z.number(),
    duplicate_count: z.number(),
    duplicates:      z.array(z.any()).optional(),
});

export const zBulkCustomerUploadResponse  = () => zBulkUploadResponse;
export const zRelationBulkUploadResponse  = () => zBulkUploadResponse;
export type CustomerBulkUploadResponse    = z.infer<typeof zBulkUploadResponse>;
export type RelationBulkUploadResponse    = z.infer<typeof zBulkUploadResponse>;

/* =========================================================
   Relation Create Response Schemas
========================================================= */

export const zCustomerCreateResponse = () =>
    z.object({
        data:    zCustomer.optional(),
        message: z.string(),
        status:  z.boolean(),
    });

const zRelationCreateResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data:    dataSchema.optional(),
        message: z.string(),
        status:  z.boolean(),
    });

export const zBankCreateResponse              = () => zRelationCreateResponse(zCustomerBank);
export const zContactManagerCreateResponse    = () => zRelationCreateResponse(zCustomerContactManager);
export const zShippingAddressCreateResponse   = () => zRelationCreateResponse(zCustomerShippingAddress);
export const zPrincipleOwnerCreateResponse    = () => zRelationCreateResponse(zCustomerPrincipleOwner);
export const zTraderReferenceCreateResponse   = () => zRelationCreateResponse(zCustomerTraderReference);

export type CustomerCreateResponse          = z.infer<ReturnType<typeof zCustomerCreateResponse>>;
export type BankCreateResponse              = z.infer<ReturnType<typeof zBankCreateResponse>>;
export type ContactManagerCreateResponse    = z.infer<ReturnType<typeof zContactManagerCreateResponse>>;
export type ShippingAddressCreateResponse   = z.infer<ReturnType<typeof zShippingAddressCreateResponse>>;
export type PrincipleOwnerCreateResponse    = z.infer<ReturnType<typeof zPrincipleOwnerCreateResponse>>;
export type TraderReferenceCreateResponse   = z.infer<ReturnType<typeof zTraderReferenceCreateResponse>>;

export const zCustomerListPayload = z.object({
    data:   z.array(zSelectOption),
    status: z.boolean(),
});

/* =========================================================
   Contact Group
========================================================= */

export const zContactGroupMember = zStandardObject.extend({
    group_id:   z.string().uuid(),
    contact_id: z.string().uuid(),
    contact:    zCustomer.nullable().optional(),
});

export type ContactGroupMember = z.infer<typeof zContactGroupMember>;

export const zContactGroup = zStandardObject.extend({
    name:            z.string(),
    contact_type:    zBasicObject.nullable().optional(),
    contact_type_id: z.string().uuid().nullable().optional(),
    members:         z.array(zContactGroupMember).optional(),
});

export type ContactGroup = z.infer<typeof zContactGroup>;

/* =========================================================
   Contact Group API Payloads
========================================================= */

export const zContactGroupIndexPayload = z.object({
    data:       z.array(zContactGroup),
    pagination: zPagination,
});

export type ContactGroupIndexPayload = z.infer<typeof zContactGroupIndexPayload>;

export const zContactGroupDataColumn = zContactGroup.extend({
    actions: z.string().optional(),
});

export type ContactGroupDataColumn = z.infer<typeof zContactGroupDataColumn>;

export const zContactGroupDetailsPayload = z.object({
    data:   zContactGroup,
    status: z.boolean(),
});

export type ContactGroupDetailsPayload = z.infer<typeof zContactGroupDetailsPayload>;

export const zContactGroupCreateResponse = () =>
    z.object({
        data:    zContactGroup.optional(),
        message: z.string(),
        status:  z.boolean(),
    });

export type ContactGroupCreateResponse = z.infer<ReturnType<typeof zContactGroupCreateResponse>>;

export const zContactGroupListPayload = z.object({
    data:   z.array(zSelectOption),
    status: z.boolean(),
});

export type ContactGroupListPayload = z.infer<typeof zContactGroupListPayload>;

export const zContactGroupMembersPayload = z.object({
    data:   z.array(zContactGroupMember),
    status: z.boolean(),
});

export type ContactGroupMembersPayload = z.infer<typeof zContactGroupMembersPayload>;