import { z } from "zod";
import { zStandardObject, zBasicObject, zPagination, zSelectOption } from "@/services/global-schema";

/* =========================================================
   Sub Models
========================================================= */

const zUN = zBasicObject.extend({
  description: z.string().nullable().optional(),
  un_class: z.string().nullable().optional(),
});

/* =========================================================
   PartNumber
========================================================= */

export const zPartNumber = zStandardObject.extend({
  name: z.string(),
  description: z.string(),
  manufacturer_name: z.string().nullable().optional(),
  cage_code: z.string().nullable().optional(),
  ata: z.string().nullable().optional(),
  is_shelf_life: z.boolean(),
  is_serialized: z.boolean(),
  total_shelf_life: z.number().nullable().optional(),
  is_llp: z.boolean(),
  is_dg: z.boolean(),
  msds: z.string().nullable().optional(),
  ipc_ref: z.string().nullable().optional(),
  picture: z.string().nullable().optional(),
  xref: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  created_by: z.string().nullable().optional(),
  has_pending_request: z.boolean().optional(),
  pending_request_message: z.string().nullable().optional(),

  // Foreign Keys
  unit_of_measure_id: z.string().uuid(),
  spare_type_id: z.string().uuid(),
  spare_model_id: z.string().uuid().nullable().optional(),
  hsc_code_id: z.string().uuid(),
  un_id: z.string().uuid().nullable().optional(),

  // Relations
  unit_of_measure: zBasicObject.nullable().optional(),
  spare_type: zBasicObject.nullable().optional(),
  spare_model: zBasicObject.nullable().optional(),
  hsc_code: zBasicObject.nullable().optional(),
  un: zUN.nullable().optional(),
});

export type PartNumber = z.infer<typeof zPartNumber>;

/* =========================================================
   Alternate
========================================================= */

const zAlternate = z.object({
  id: z.string().uuid(),
  part_number_id: z.string().uuid(),
  alternate_part_number_id: z.string().uuid(),
  remark: z.string().nullable().optional(),
  alt_ref_doc: z.string().nullable().optional(),
  alternate_part_number: zPartNumber.nullable().optional(),
});

export type Alternate = z.infer<typeof zAlternate>;

/* =========================================================
   PartNumber with Alternates
========================================================= */

export const zPartNumberWithAlternates = zPartNumber.extend({
  alternates: z.array(zAlternate).optional().nullable(),
});

export type PartNumberWithAlternates = z.infer<typeof zPartNumberWithAlternates>;

/* =========================================================
   API Payloads
========================================================= */

export const zPartNumberIndexPayload = z.object({
  data: z.array(zPartNumber.extend({
    is_alternate: z.boolean().nullable().optional(),
    alternate_of_info: z.object({
      id: z.string().uuid(),
      name: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      alt_ref_doc: z.string().nullable().optional(),
    }).nullable().optional(),
  })),
  pagination: zPagination,
});
export type PartNumberIndexPayload = z.infer<typeof zPartNumberIndexPayload>;

export const zPartNumberDetailsPayload = z.object({
  data: zPartNumberWithAlternates,
  status: z.boolean(),
});
export type PartNumberDetailsPayload = z.infer<typeof zPartNumberDetailsPayload>;

export const zPartNumberSaveResponsePayload =
z.object({
    data: zPartNumber.optional(),
    message: z.string(),
    status: z.boolean(),
  });
export type PartNumberSaveResponsePayload = z.infer<typeof zPartNumberSaveResponsePayload>;

/* =========================================================
   Search Part Number
========================================================= */

export const zSearchPartNumberPayload = () =>
  z.object({
    data: z.array(zPartNumber),
    status: z.boolean(),
    pagination: zPagination.optional(),
  });
export type SearchPartNumberPayload = z.infer<ReturnType<typeof zSearchPartNumberPayload>>;

/* =========================================================
   Spare Details (Imperative fetch)
========================================================= */

export const zSpareDetailsPayload = () =>
  z.object({
    data: zPartNumberWithAlternates,
    status: z.boolean(),
  });
export type SpareDetailsPayload = z.infer<ReturnType<typeof zSpareDetailsPayload>>;

/* =========================================================
   Bulk Upload / Unique Check
========================================================= */

const zBulkUploadResponse = z.object({
  status: z.boolean(),
  inserted_count: z.number(),
  duplicate_count: z.number(),
  duplicates: z.array(z.any()).optional(),
});
export const zPartNumberBulkUploadResponse = () => zBulkUploadResponse;
export type PartNumberBulkUploadResponse = z.infer<typeof zBulkUploadResponse>;

const zUniqueCheckResponse = z.object({
  status: z.boolean(),
  exists: z.record(z.boolean()),
  errors: z.record(z.string()).optional(),
});
export const zPartNumberUniqueCheckPayload = () => zUniqueCheckResponse;
export type PartNumberUniqueCheckPayload = z.infer<typeof zUniqueCheckResponse>;

/* =========================================================
   Assign Alternate Parts
========================================================= */

export const zAssignAltSparePartsRespPayload = () =>
  z.object({
    status: z.boolean(),
    successful_mappings: z.array(
      z.object({
        part_number_id: z.string().uuid(),
        alternate_part_number_id: z.string().uuid(),
        remark: z.string().nullable().optional(),
        alt_ref_doc: z.string().nullable().optional(),
        alternate_part_number: zPartNumber.optional(),
        part_number: zPartNumber.optional()
      })
    ).nullable().optional(),
    errors: z.array(
      z.object({
        part_number_id: z.string().uuid(),
        alternate_part_number_id: z.string().uuid(),
        message: z.string(),
        remark: z.string().nullable().optional(),
        alt_ref_doc: z.string().nullable().optional(),
        alternate_part_number: zPartNumber.optional(),
        part_number: zPartNumber.optional()
      })
    ).nullable().optional(),
  });

export type AssignAltSpareRespPayload = z.infer<ReturnType<typeof zAssignAltSparePartsRespPayload>>;

export const zPartNumberListPayload = z.object({
    data: z.array(zSelectOption),
    status: z.boolean(),
});
export type PartNumberListPayload = z.infer<typeof zPartNumberListPayload>;

/* =========================================================
   Validate Part Numbers By Name
========================================================= */

export const zValidatePartNumbersByNamePayload = z.object({
  status: z.boolean(),
  // Map of { [partNumberName]: PartNumber record }
  data: z.record(zPartNumber),
  not_found: z.array(z.string()),
});
export type ValidatePartNumbersByNamePayload = z.infer<typeof zValidatePartNumbersByNamePayload>;