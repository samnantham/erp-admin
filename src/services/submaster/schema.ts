import { z } from 'zod';

import { zBasicObject } from '@/services/global-schema';

export type IndexPayload = z.infer<typeof zIndexPayload>;

export const zIndexPayload = z.object({
  data: z.array(
    zBasicObject.extend({
      code: z.string().optional(),
      actions: z.string().optional()
    })
  )
});

export const zDetailsPayload = z.object({
  data: zBasicObject.extend({
    actions: z.string().optional(),
  }),
  status: z.boolean(),
});

/* ================= Data Column ================= */

export type DataColumn<T = {}> = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  is_fixed?: boolean | null;
} & T;