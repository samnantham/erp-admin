import { z } from 'zod';

import { zBasicObject } from '@/services/global-schema';

const zDepartment =  zBasicObject.extend({
      emails: z.string().optional().nullable()
})

export type IndexPayload = z.infer<typeof zIndexPayload>;
export type DataColumn = z.infer<typeof zDataColumn>;

export const zIndexPayload = z.object({
  data: z.array(
    zDepartment.extend({
      actions: z.string().optional()
    })
  )
});

export const zDetailsPayload = z.object({
  data: zDepartment.extend({
    actions: z.string().optional(),
  }),
  status: z.boolean(),
});

/* ================= Data Column ================= */

export const zDataColumn = zDepartment.extend({
  actions: z.string().optional()
});