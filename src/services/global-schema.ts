import { z } from 'zod';

/* ================= Option Item ================= */

export const zUploadPayload = () =>
  z
    .object({
      message: z.string(),
      data: z.object({
        file_name: z.string(),
        file_path: z.string(),
      }),
    })
    .transform((val) => ({
      ...val,
      status: true,
    }));

export type UploadPayload = z.infer<ReturnType<typeof zUploadPayload>>;


export const zSelectOption = z.object({
  label: z.string(),
  value: z.string(),
});

/* ================= Dynamic Option Groups ================= */

export const zSelectOptionsGroup = z.record(
  z.string(),
  z.array(zSelectOption)
);

export const zDropdownPayload = z.record(
  z.string(),
  z.array(zSelectOption)
);

export type DropdownPayload = z.infer<typeof zDropdownPayload>;

/* ================= Types ================= */

export type SelectOption = z.infer<typeof zSelectOption>;
export type SelectOptionsGroup = z.infer<typeof zSelectOptionsGroup>;

/* =====================================================
   Base Reusable Schemas
===================================================== */

export const zStandardObject = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  has_pending_request: z.boolean().optional(),
  pending_request_message: z.string().nullable().optional(),
  updated_at: z.string().nullable(),
  deleted_at: z.string().nullable().optional()
});


export const zBasicObject = zStandardObject.extend({
  name: z.string(),
  is_fixed: z.boolean().nullable().optional(),
});

export const zPagination = z.object({
  current_page: z.number(),
  total_pages: z.number(),
  limit: z.number(),
  total: z.number(),
});


export type IndexPayload = z.infer<typeof zIndexPayload>;
export type DataColumn = z.infer<typeof zDataColumn>;
export type CreatePayload = z.infer<typeof zCreatePayload>;
export type ListPayload = z.infer<typeof zListPayload>;
export type DetailsPayload = z.infer<typeof zDetailsPayload>;

/* ================= Index ================= */

export const zIndexPayload = z.object({
  data: z.array(
    zBasicObject.extend({
      actions: z.string().optional()
    })
  )
});

/* ================= Data Column ================= */

export const zDataColumn = zBasicObject.extend({
  actions: z.string().optional()
});

/* ================= List ================= */

export const zListPayload = z.object({
  items: z.record(z.string()),
  status: z.boolean(),
});

/* ================= Details ================= */

export const zDetailsPayload = z.object({
  data: zBasicObject.extend({
    actions: z.string().optional(),
  }),
  status: z.boolean(),
});

/* ================= Create / Update ================= */

export const zCreatePayload = z.object({
  status: z.boolean(),
  message: z.string(),
  data: zBasicObject.extend({
    id: z.string().uuid()
  }).optional()
});

export interface QueryParams {
  status?: string;
  is_fixed?: boolean;
  query?: string;
  is_purchase_request_fulfilled?: boolean;
  exist_ids?: string;
  contact_type_id?: string;
}


export type ApiResp = {
  status: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};
