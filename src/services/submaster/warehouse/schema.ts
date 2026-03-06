import { z } from 'zod';

import { UserSchema } from '../schema';

export type WarehouseIndexPayload = z.infer<
  ReturnType<typeof zWarehouseIndexPayload>
>;
export type WarehouseDetailsPayload = z.infer<
  ReturnType<typeof zWarehouseDetailsPayload>
>;
export type WarehouseDataColumn = z.infer<
  ReturnType<typeof zWarehouseDataColumn>
>;
export type CreateWarehousePayload = z.infer<
  ReturnType<typeof zCreateWarehousePayload>
>;
export type WarehouseListPayload = z.infer<
  ReturnType<typeof zWarehouseListPayload>
>;

export const zWarehouseIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        address: z.string(),
        city: z.string().nullable(),
        consignee_name: z.string(),
        country: z.string(),
        created_at: z.string(),
        email: z.string().nullable().optional(),
        fax: z.string().nullable().optional(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        phone: z.string(),
        remarks: z.string().nullable().optional(),
        state: z.string().nullable(),
        zip_code: z.string().nullable(),
        deleted_at: z.string().nullable().optional(),
        added_by: z.number().nullable().optional(),
        added_user: UserSchema.nullable().optional(),
      })
    ),
    status: z.boolean(),
  });
};

export const zWarehouseDetailsPayload = () => {
  return z
    .object({
      item: z.object({
        address: z.string(),
        city: z.string().nullable(),
        consignee_name: z.string(),
        country: z.string(),
        created_at: z.string(),
        email: z.string(),
        fax: z.string().nullable().optional(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        phone: z.string(),
        remarks: z.string().nullable().optional(),
        state: z.string().nullable(),
        zip_code: z.string().nullable(),
      }),
    })
    .optional();
};

export const zWarehouseDataColumn = () => {
  return z.object({
    address: z.string(),
    city: z.string().nullable(),
    consignee_name: z.string(),
    country: z.string(),
    created_at: z.string(),
    email: z.string().nullable().optional(),
    fax: z.string().nullable().optional(),
    id: z.number(),
    modified_at: z.string(),
    name: z.string(),
    phone: z.string(),
    remarks: z.string().nullable().optional(),
    state: z.string().nullable(),
    zip_code: z.string().nullable(),
    actions: z.optional(z.string()),
    deleted_at: z.string().nullable().optional(),
    added_by: z.number().nullable().optional(),
    added_user: UserSchema.nullable().optional(),
  });
};

export const zWarehouseListPayload = () => {
  return z.object({
    items: z.record(z.string()),
    status: z.boolean(),
  });
};

export const zCreateWarehousePayload = () => {
  return z.object({ message: z.string(), status: z.boolean() });
};
