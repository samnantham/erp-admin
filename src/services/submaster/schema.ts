import { z } from 'zod';

export type IndexPayload = z.infer<ReturnType<typeof zIndexPayload>>;
export type DetailsPayload = z.infer<ReturnType<typeof zDetailsPayload>>;
export type ShipACIndexPayload = z.infer<
  ReturnType<typeof zShipACIndexPayload>
>;
export type PriorityIndexPayload = z.infer<
  ReturnType<typeof zPriorityIndexPayload>
>;
export type PriorityDetailPayload = z.infer<
  ReturnType<typeof zPriorityDetailsPayload>
>;
export type PaymentTermIndexPayload = z.infer<
  ReturnType<typeof zPaymentTermIndexPayload>
>;
export type DepartmentIndexPayload = z.infer<
  ReturnType<typeof zDepartmentIndexPayload>
>;
export type UOMIndexPayload = z.infer<ReturnType<typeof zUOMIndexPayload>>;
export type DataColumn = z.infer<ReturnType<typeof zDataColumn>>;
export type ShipACDataColumn = z.infer<ReturnType<typeof zShipACDataColumn>>;
export type PriorityDataColumn = z.infer<
  ReturnType<typeof zPriorityDataColumn>
>;
export type PaymentTermDataColumn = z.infer<
  ReturnType<typeof zPaymentTermDataColumn>
>;
export type CreatePayload = z.infer<ReturnType<typeof zCreatePayload>>;
export type ListPayload = z.infer<ReturnType<typeof zListPayload>>;

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  created_at: z.optional(z.string()),
  modified_at: z.optional(z.string()),
});

export const zIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        created_at: z.string(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        actions: z.optional(z.string()),
        deleted_at: z.string().nullable().optional(),
        added_by: z.number().nullable().optional(),
        added_user: UserSchema.nullable().optional(),
      })
    ),
    status: z.boolean(),
  });
};

export const zDetailsPayload = () => {
  return z.object({
    item: z.object({
      created_at: z.string(),
      id: z.number(),
      modified_at: z.string(),
      name: z.string(),
    }),
    status: z.boolean(),
  });
};

export const zShipACIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        created_at: z.string(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        account_number: z.string().nullable(),
        deleted_at: z.string().nullable().optional(),
        added_by: z.number().nullable().optional(),
        added_user: UserSchema.nullable().optional(),
      })
    ),
    status: z.boolean(),
  });
};

export const zDepartmentIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        created_at: z.string(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        emails: z.string(),
        actions: z.optional(z.string()),
        deleted_at: z.string().nullable().optional(),
        added_by: z.number().nullable().optional(),
        added_user: UserSchema.nullable().optional(),
      })
    ),
    status: z.boolean(),
  });
};

export const zUOMIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        created_at: z.string(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        group_id: z.number(),
        actions: z.optional(z.string()),
      })
    ),
    status: z.boolean(),
  });
};

export const zPaymentTermIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        created_at: z.string(),
        deleted_at: z.string().nullable().optional(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        is_fixed: z.boolean(),
        no_of_days: z.optional(z.number()),
        actions: z.optional(z.string()),
        added_by: z.number().nullable().optional(),
        added_user: UserSchema.nullable().optional(),
      })
    ),
    status: z.boolean(),
  });
};

export const zPriorityIndexPayload = () => {
  return z.object({
    items: z.array(
      z.object({
        created_at: z.string(),
        deleted_at: z.string().nullable().optional(),
        id: z.number(),
        modified_at: z.string(),
        name: z.string(),
        days: z.number().nullable().optional(),
        actions: z.optional(z.string()),
        added_by: z.number().nullable().optional(),
        added_user: UserSchema.nullable().optional(),
      })
    ),
    status: z.boolean(),
  });
};

export const zPriorityDetailsPayload = () => {
  return z.object({
    item: z.object({
      created_at: z.string(),
      id: z.number(),
      modified_at: z.string(),
      name: z.string(),
      is_custom: z.boolean(),
      days: z.number().nullable().optional(),
      actions: z.optional(z.string()),
    }),
    status: z.boolean(),
  });
};

export const zDataColumn = () => {
  return z.object({
    created_at: z.string(),
    id: z.number(),
    modified_at: z.string(),
    name: z.string(),
    actions: z.optional(z.string()),
    deleted_at: z.string().nullable().optional(),
    added_by: z.number().nullable().optional(),
    added_user: UserSchema.nullable().optional(),
  });
};

export const zShipACDataColumn = () => {
  return z.object({
    created_at: z.string(),
    id: z.number(),
    modified_at: z.string(),
    name: z.string(),
    account_number: z.string().nullable(),
    actions: z.optional(z.string()),
    deleted_at: z.string().nullable().optional(),
    added_by: z.number().nullable().optional(),
    added_user: UserSchema.nullable().optional(),
  });
};

export const zPaymentTermDataColumn = () => {
  return z.object({
    created_at: z.string(),
    deleted_at: z.string().nullable().optional(),
    id: z.number(),
    modified_at: z.string(),
    name: z.string(),
    is_fixed: z.boolean(),
    no_of_days: z.optional(z.number()),
    actions: z.optional(z.string()),
    added_by: z.number().nullable().optional(),
    added_user: UserSchema.nullable().optional(),
  });
};

export const zPriorityDataColumn = () => {
  return z.object({
    created_at: z.string(),
    deleted_at: z.string().nullable().optional(),
    id: z.number(),
    modified_at: z.string(),
    name: z.string(),
    days: z.number().nullable().optional(),
    actions: z.optional(z.string()),
    added_by: z.number().nullable().optional(),
    added_user: UserSchema.nullable().optional(),
  });
};

export const zListPayload = () => {
  return z.object({
    items: z.record(z.string()),
    status: z.boolean(),
  });
};

export const zCreatePayload = () => {
  return z.object({ message: z.string(), status: z.boolean() });
};

export interface QueryParams {
  status?: string;
}
