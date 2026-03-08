import { z } from 'zod';

/* ================= Option Item ================= */

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

export const zBasicObject = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
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
});

export interface QueryParams {
  status?: string;
}