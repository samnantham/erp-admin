// src/services/user-access/permission/schema.ts

import { z } from 'zod';

const zRouteItem = z.object({
  id:         z.string(),
  name:       z.string(),
  path:       z.string(),
  is_granted: z.boolean().optional().nullable(),
});

const zModuleGroup = z.object({
  module: z.string(),
  routes: z.array(zRouteItem),
});

export const zPermissionPayload = z.object({
  data:   z.array(zModuleGroup),
  status: z.boolean(),
});

export type RouteItem         = z.infer<typeof zRouteItem>;
export type ModuleGroup       = z.infer<typeof zModuleGroup>;
export type PermissionPayload = z.infer<typeof zPermissionPayload>;