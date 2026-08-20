import { z } from 'zod';
import { WorkspaceSettingsSchema } from './workspace-settings.dto';
import { WorkspaceTabSchema } from './workspace-tab.dto';

export const UpdateWorkspaceSchema = z
  .object({
    tabs: z.array(WorkspaceTabSchema).max(10),

    activeTabId: z.string().trim().max(64).nullable(),

    settings: WorkspaceSettingsSchema,

    expectedVersion: z.number().int().min(1),
  })
  .superRefine((workspace, context) => {
    const tabIds = workspace.tabs.map(tab => tab.id);
    const uniqueTabIds = new Set(tabIds);

    if (uniqueTabIds.size !== tabIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['tabs'],
        message: 'Duplicate tab ids found in workspace tabs',
      });
    }

    if (
      workspace.activeTabId !== null &&
      !uniqueTabIds.has(workspace.activeTabId)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['activeTabId'],
        message: 'Active tab id does not exist in workspace tabs',
      });
    }

    if (workspace.tabs.length === 0 && workspace.activeTabId !== null) {
      context.addIssue({
        code: 'custom',
        path: ['activeTabId'],
        message: 'Active tab id must be null when there are no tabs',
      });
    }
  });

export type UpdateWorkspaceDto = z.infer<typeof UpdateWorkspaceSchema>;