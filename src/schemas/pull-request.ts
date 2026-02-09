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

export const pullRequestSchema = z.object({
  id: z.number(),
  number: z.number(),
  title: z.string(),
  body: z.string().nullable().default(null),
  state: z.enum(["open", "closed"]),
  draft: z.boolean().default(false),
  merged_at: z.string().nullable().default(null),
  labels: z.array(labelRef).default([]),
  assignees: z.array(userRef).default([]),
  requested_reviewers: z.array(userRef).default([]),
  milestone: milestoneRef,
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable().default(null),
  user: userRef,
  html_url: z.string(),
  head: z.object({ ref: z.string(), sha: z.string() }),
  base: z.object({ ref: z.string(), sha: z.string() }),
  additions: z.number().default(0),
  deletions: z.number().default(0),
  changed_files: z.number().default(0),
  review_comments: z.number().default(0),
  commits: z.number().default(0),
  repository_full_name: z.string().default(""),
});

export type PullRequest = z.infer<typeof pullRequestSchema>;
