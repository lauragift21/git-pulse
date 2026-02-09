import { z } from "zod/v4";

const labelRef = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  description: z.string().nullable().default(null),
});

const userRef = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string(),
  html_url: z.string(),
});

const milestoneRef = z
  .object({
    id: z.number(),
    title: z.string(),
    state: z.string(),
    number: z.number(),
  })
  .nullable()
  .default(null);

export const issueSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().default(null),
  state: z.enum(["open", "closed"]),
  state_reason: z.string().nullable().default(null),
  labels: z.array(labelRef).default([]),
  assignees: z.array(userRef).default([]),
  milestone: milestoneRef,
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable().default(null),
  comments: z.number().default(0),
  user: userRef,
  html_url: z.string(),
  repository_full_name: z.string().default(""),
  priority: z.number().default(0),
});

export type Issue = z.infer<typeof issueSchema>;
