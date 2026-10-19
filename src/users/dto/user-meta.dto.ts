import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const UserMetaSchema = z.object({
  roles: z.array(z.enum(UserRole)),
  activeStates: z.array(z.boolean()),
  createdAtRange: z.object({
    min: z.string(),
    max: z.string(),
  }),
});

export type UserMetaDto = z.infer<typeof UserMetaSchema>;
