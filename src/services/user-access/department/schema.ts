// src/services/user-access/department/schema.ts

import { z } from 'zod';
import { zBasicObject } from '@/services/global-schema';

const zRole = z.object({
  department_role_id:      z.string().uuid(),
  role_id:      z.string().uuid(),
  name:      z.string(),
  is_fixed: z.boolean().optional().nullable(),
  is_super_admin: z.boolean().optional(),
}
);

const zDepartment = zBasicObject.extend({
  name:      z.string(),
  is_active: z.boolean().optional().nullable(),
  actions:   z.string().optional(),
   is_fixed: z.boolean().optional().nullable(),
  roles: z.array(zRole).optional().nullable(),
});

export type IndexPayload   = z.infer<typeof zIndexPayload>;
export type DataColumn     = z.infer<typeof zDataColumn>;

export const zIndexPayload = z.object({
  data:   z.array(zDepartment),
  status: z.boolean().optional(),
});

export const zDetailsPayload = z.object({
  data:   zDepartment,
  status: z.boolean(),
});

export const zDataColumn = zDepartment;