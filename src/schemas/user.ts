import { z } from "zod/v4";

export const userSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string(),
  html_url: z.string(),
  type: z.string().default("User"),
});

export type User = z.infer<typeof userSchema>;
