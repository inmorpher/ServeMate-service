import { z } from 'zod';

export const WorkspaceSettingsSchema = z.object({
  theme: z.string().trim().min(1).max(64).optional(),

  sidebar: z
    .object({
      width: z.number().int().min(180).max(600).optional(),
      collapsed: z.boolean().optional(),
    })
    .optional(),

  notifications: z
    .object({
      enabled: z.boolean().optional(),
      sound: z.boolean().optional(),
    })
    .optional(),

  density: z.enum(['compact', 'comfortable', 'spacious']).optional(),

  language: z.string().trim().min(2).max(8).optional(),
});

export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;
