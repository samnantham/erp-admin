import { z } from 'zod';
import { zAdminUser } from '@/services/profile/schema';

export const zLoginPayload = () =>
  z.object({
    status: z.boolean(),
    message: z.string(),
    data: zAdminUser.extend({
      token: z.string(),
    }),
  });
export type LoginPayload = z.infer<ReturnType<typeof zLoginPayload>>;