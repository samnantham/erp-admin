import { z } from 'zod';

import { zBasicObject } from '@/services/global-schema';

const zDepartment =  zBasicObject.extend({
      emails: z.string().optional().nullable(),
      actions: z.string().optional()
})

export type IndexPayload = z.infer<typeof zIndexPayload>;
export type DataColumn = z.infer<typeof zDataColumn>;

export const zIndexPayload = z.object({
  data: z.array(
    zDepartment
  )
});

export const zDetailsPayload = z.object({
  data: zDepartment,
  status: z.boolean(),
});

/* ================= Data Column ================= */

export const zDataColumn = zDepartment.extend({
  actions: z.string().optional()
});