import { z } from "zod";

export const zItemSchema = z.object({
  id: z.number(),
  classs: z.string(),
  description: z.string(),
  name: z.string(),
});

export const zUnIndexPayload = () => {
  return z.object({
    items: z.array(zItemSchema),
    status: z.boolean(),
  });
};

export const zUnDetailsPayload = () => {
  return z.object({
    item: 
      z.object({
        created_at: z.string(),
        id: z.number(),
        modified_at: z.string(),
        classs: z.string(),
        description: z.string(),
        name: z.string(),
      }),
    status: z.boolean(),
  });
};


export type UnIndexPayload = z.infer<
  ReturnType<typeof zUnIndexPayload>
>;

export type UNDetailsPayload = z.infer<ReturnType<typeof zUnDetailsPayload>>;
