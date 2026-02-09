import { z } from "zod/v4";

export const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  actor: z.object({
    id: z.number(),
    login: z.string(),
    display_login: z.string(),
    avatar_url: z.string(),
  }),
  repo: z.object({
    id: z.number(),
    name: z.string(),
    url: z.string(),
  }),
  payload: z.record(z.string(), z.unknown()).default({}),
  public: z.boolean().default(true),
  created_at: z.string(),
});

export type Event = z.infer<typeof eventSchema>;
