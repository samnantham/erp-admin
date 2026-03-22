import { z } from 'zod';
import { zBasicObject } from '@/services/global-schema';

const zRoute = zBasicObject.extend({
  name:      z.string(),
  path: z.string(),
  is_active: z.boolean().optional().nullable(),
  module: z.string(),
  actions:   z.string().optional(),
});

export const zIndexPayload = z.object({
  data:   z.array(zRoute),
  status: z.boolean().optional(),
});

export const zDetailsPayload = z.object({
  data:   zRoute,
  status: z.boolean(),
});

export const zDataColumn = zRoute;


export type IndexPayload   = z.infer<typeof zIndexPayload>;
export type DataColumn     = z.infer<typeof zDataColumn>;
