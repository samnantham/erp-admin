import { z } from 'zod';
import { zBasicObject, zPagination } from '@/services/global-schema';

/* ================= User ================= */

export const zRole = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_fixed: z.boolean().nullable().optional(),
  is_super_admin: z.boolean().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});

export const zDepartmentRoleItem = z.object({
  department_role_id: z.string().uuid(),
  role_id: z.string().uuid(),
  name: z.string(),
  is_fixed: z.boolean().nullable().optional(),
  is_super_admin: z.boolean().nullable().optional(),
});

export const zDepartmentWithRoles = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_fixed: z.boolean().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
  roles: z.array(zDepartmentRoleItem),
});

export const zDepartmentRole = z.object({
  id: z.string().uuid(), // same as department_role_id
  department_role_id: z.string().uuid().optional(), // optional (sometimes same as id)
  department_id: z.string().uuid(),
  role_id: z.string().uuid(),

  is_fixed: z.boolean().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),

  department: zDepartmentWithRoles,
  role: zRole,
});

export const zUser = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  department_role_id: z.string().uuid().nullable().optional(),
  department_role: zDepartmentRole.optional().nullable(),
  department_id: z.string().uuid().nullable().optional(),
  department: zBasicObject,
  is_fixed: z.boolean().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_At: z.string().nullable().optional(),
});


/* ================= Admin User Index ================= */

export const zAdminUserIndexPayload = z.object({
  data: z.array(zUser),
  pagination: zPagination,
});

/* ================= Admin User List ================= */

export const zAdminUserListPayload = z.object({
  items: z.record(z.string()),
  status: z.boolean(),
});

/* ================= Admin User Data Column ================= */

export const zAdminUserDataColumn = zUser.extend({
  actions: z.string().optional(),
});

/* ================= Create / Update Response ================= */

export const zCreateAdminUserPayload = z.object({
  id: z.string().uuid().optional(),
  message: z.string(),
  status: z.boolean(),
});

/* ================= Admin User Details ================= */

export const zAdminUserDetailsPayload = z.object({
  data: zUser,
  status: z.boolean(),
});

/* ================= Types ================= */

export type User = z.infer<typeof zUser>;
export type AdminUserIndexPayload = z.infer<typeof zAdminUserIndexPayload>;
export type AdminUserListPayload = z.infer<typeof zAdminUserListPayload>;
export type AdminUserDataColumn = z.infer<typeof zAdminUserDataColumn>;
export type CreateAdminUserPayload = z.infer<typeof zCreateAdminUserPayload>;
export type AdminUserDetailsPayload = z.infer<typeof zAdminUserDetailsPayload>;