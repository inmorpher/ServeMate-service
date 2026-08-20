import { z } from 'zod';

export const WorkspaceTabSchema = z.object({
  id: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(100),
  type: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),

  state: z.record(z.string(), z.unknown()).optional(),
  pinned: z.boolean().optional(),
  order: z.number().int().min(0),
});

export type WorkspaceTab = z.infer<typeof WorkspaceTabSchema>;
