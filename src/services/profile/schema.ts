import { z } from 'zod';
import { zUser } from '@/services/user-access/adminuser/schema';

/* =====================================================
   Admin User (Base Schema)
===================================================== */


export const zProfileDetailsPayload = z.object({
  status: z.boolean(),
  data: zUser.extend({
    token: z.string(),
    is_super_admin: z.boolean(),
    permissions: z.array(z.string()).optional(),
  })
  // .extend({
  //   menu: z.array(zMenuItem).optional().nullable(),
  // }),
});

export type ProfileDetailsPayload = z.infer<
  typeof zProfileDetailsPayload
>;

/* =====================================================
   Simple Profile Payload
===================================================== */

export const ProfilePayload = z.object({
  status: z.boolean(),
  data: zUser.nullable(),
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