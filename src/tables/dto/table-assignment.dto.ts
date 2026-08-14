import { z } from 'zod';

export const TableAssignmentSchema = z.object({
  serverId: z.coerce.number().int().positive(),
  isPrimary: z.boolean().default(true),
  assignedTables: z.array(z.coerce.number().int().positive()),
});

export type TableAssignmentDto = z.infer<typeof TableAssignmentSchema>;
