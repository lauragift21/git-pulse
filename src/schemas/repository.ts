import { z } from "zod/v4";

export const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable().default(null),
  language: z.string().nullable().default(null),
  stargazers_count: z.number().default(0),
  forks_count: z.number().default(0),
  open_issues_count: z.number().default(0),
  watchers_count: z.number().default(0),
  updated_at: z.string(),
  created_at: z.string(),
  pushed_at: z.string(),
  html_url: z.string(),
  visibility: z.string().default("public"),
  default_branch: z.string().default("main"),
  topics: z.array(z.string()).default([]),
  owner: z.object({
    login: z.string(),
    avatar_url: z.string(),
    html_url: z.string(),
    id: z.number(),
  }),
  starred_by_me: z.boolean().default(false),
});

export type Repository = z.infer<typeof repositorySchema>;
