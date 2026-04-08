import { z } from 'zod';
import { zBasicObject } from '@/services/global-schema';

const zRouteModule = z.object({
  id:          z.string(),
  name:        z.string(),
  description: z.string().optional().nullable(),
  priority:    z.number(),
  is_default:  z.boolean().optional().nullable(),
  is_active:   z.boolean().optional().nullable(),
});

const zRoute = zBasicObject.extend({
  name:      z.string(),
  path:      z.string(),
  is_active: z.boolean().optional().nullable(),
  is_default: z.boolean().optional().nullable(),
  module_id: z.string(),
  module:    zRouteModule.optional().nullable(),
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

export type RouteModule    = z.infer<typeof zRouteModule>;
export type DataColumn     = z.infer<typeof zDataColumn>;
export type IndexPayload   = z.infer<typeof zIndexPayload>;
export type DetailsPayload = z.infer<typeof zDetailsPayload>;