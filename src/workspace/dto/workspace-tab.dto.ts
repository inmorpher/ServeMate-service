import { z } from 'zod';

export const WorkspaceTabSchema = z
  .object({
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
  })
  .superRefine((tab, context) => {
    const singleEntityTypes = new Set([
      'user',
      'order',
      'table',
      'payment',
      'food',
      'food-item',
      'drink',
      'drink-item',
      'reservation',
    ]);

    if (singleEntityTypes.has(tab.type)) {
      const id = tab.state?.id;

      if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['state', 'id'],
          message: 'A positive numeric id is required for a single entity tab',
        });
      }
    }
  });

export type WorkspaceTab = z.infer<typeof WorkspaceTabSchema>;
