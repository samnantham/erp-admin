import { z } from 'zod';
import { zBasicObject } from '@/services/global-schema';

const zDepartment =  zBasicObject.extend({
      emails: z.string().optional().nullable()
})

/* =====================================================
   Admin User (Base Schema)
===================================================== */

export const zAdminUser = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  email: z.string().email(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  full_name: z.string().optional(),
  phone: z.string().nullable(),

  department_id: z.string().uuid().nullable(),
  role_id: z.string().uuid().nullable(),

  department: zDepartment.nullable().optional(),
  role: zBasicObject.nullable().optional(),

  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});

/* =====================================================
   Types
===================================================== */

export type AdminUser = z.infer<typeof zAdminUser>;

/* =====================================================
   List / Index
===================================================== */

export const zAdminUserIndexPayload = z.object({
  current_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  data: z.array(zAdminUser),
});

export const zAdminUserListPayload = z.object({
  items: z.record(z.string()),
  status: z.boolean(),
});

/* =====================================================
   Data Table Version (with actions column)
===================================================== */

export const zAdminUserDataColumn = zAdminUser.extend({
  actions: z.string().optional(),
});

/* =====================================================
   Update Response
===================================================== */

export const zUpdateResponsePayload = z.object({
  status: z.boolean(),
  message: z.string(),
});

export type UpdateResponsePayload = z.infer<
  typeof zUpdateResponsePayload
>;

/* =====================================================
   Profile Details
===================================================== */

export const zMenuItem = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string(),
  link: z.string().nullable(),
  submenu: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        icon: z.string(),
        link: z.string(),
      })
    )
    .optional(),
});

export const zProfileDetailsPayload = z.object({
  status: z.boolean(),
  data: zAdminUser.extend({
    menu: z.array(zMenuItem).optional().nullable(),
  }),
});

export type ProfileDetailsPayload = z.infer<
  typeof zProfileDetailsPayload
>;

/* =====================================================
   Simple Profile Payload
===================================================== */

export const ProfilePayload = z.object({
  status: z.boolean(),
  data: zAdminUser.nullable(),
});