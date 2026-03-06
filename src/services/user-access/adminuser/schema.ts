import { z } from 'zod';
import { zBasicObject, zPagination } from '@/services/global-schema';

/* ================= User ================= */

export const zUser = z.object({
  id: z.string().uuid(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string(),

  department_id: z.string().uuid(),
  department: zBasicObject,
  is_fixed: z.boolean().nullable().optional(),
  role_id: z.string().uuid(),
  role: zBasicObject,
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