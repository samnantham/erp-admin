import { z } from 'zod';
import { zBasicObject, zStandardObject } from '@/services/global-schema';

/** 🔹 Role */
const zRole = zBasicObject.extend({
  is_super_admin: z.boolean()
});

/** 🔹 Department Role (mapping inside department) */
const zDepartmentRole = z.object({
  department_role_id: z.string().uuid(),
  role_id: z.string().uuid(),
  name: z.string(),
  is_fixed: z.boolean(),
  is_super_admin: z.boolean(),
});

/** 🔹 Department */
const zDepartment = zBasicObject.extend({
  roles: z.array(zDepartmentRole)
});

/** 🔹 Department ↔ Role Mapping */
const zDepartmentMapping = zStandardObject.extend({
  department_id: z.string().uuid(),
  role_id: z.string().uuid(),
  is_fixed: z.boolean(),

  role: zRole,
  department: zDepartment
});

/** 🔹 API Response */
export const zCreatePayload = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.array(zDepartmentMapping)
});

export type CreatePayload = z.infer<typeof zCreatePayload>;