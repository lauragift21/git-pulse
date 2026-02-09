import { z } from "zod/v4";

export const labelSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable().default(null),
  repository_full_name: z.string().default(""),
});

export type Label = z.infer<typeof labelSchema>;
