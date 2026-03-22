import { z } from 'zod';
import { zUser } from '@/services/user-access/adminuser/schema';

export const zLoginPayload = () =>
  z.object({
    status: z.boolean(),
    message: z.string(),
    data: zUser.extend({
      token: z.string(),
    }),
  });
export type LoginPayload = z.infer<ReturnType<typeof zLoginPayload>>;