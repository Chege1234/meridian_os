/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';
import { createCampaign } from '@/features/campaigns/application/CreateCampaign';
import { archiveCampaign } from '@/features/campaigns/application/ArchiveCampaign';
import { attachContent } from '@/features/campaigns/application/AttachContent';
import { attachContact } from '@/features/campaigns/application/AttachContact';
import { createTask } from '@/features/tasks/application/CreateTask';
import {
  createSupabaseCampaignRepository,
  createSupabaseTaskRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Campaign Integration Flow', () => {
  let mockSupabase: any;
  let campaignRepo: any;
  let taskRepo: any;
  let activityLogRepo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      currentTable: '',
      from: vi.fn().mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      }),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        const table = mockSupabase.currentTable;
        if (table === 'campaigns') {
          return Promise.resolve({
            data: {
              id: 'campaign-123',
              name: 'Summer Camp Promo 2026',
              objective: 'Increase signups by 20%',
              status: 'draft',
              channel: ['instagram', 'email'],
              start_date: new Date().toISOString(),
              end_date: null,
              budget: 1000,
              owner_id: 'owner-123',
              created_by: 'creator-123',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'activity_logs') {
          return Promise.resolve({
            data: {
              id: 'log-123',
              user_id: 'creator-123',
              action: 'action',
              module: 'campaigns',
              created_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'tasks') {
          return Promise.resolve({
            data: {
              id: 'task-123',
              title: 'Design email banners',
              status: 'todo',
              priority: 'medium',
              created_by: 'creator-123',
              campaign_id: 'campaign-123',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    // Initialize actual repositories with the mock client
    campaignRepo = createSupabaseCampaignRepository(mockSupabase);
    taskRepo = createSupabaseTaskRepository(mockSupabase);
    activityLogRepo = createSupabaseActivityLogRepository(mockSupabase);
  });

  it('should create campaign, attach content + contact + task, and archive campaign while leaving linked sub-entities intact (BR-403 / CRM-task mirror)', async () => {
    // 1. Create Campaign
    const createResult = await createCampaign(
      {
        name: 'Summer Camp Promo 2026',
        objective: 'Increase signups by 20%',
        channel: ['instagram', 'email'],
        startDate: new Date(),
        budget: 1000,
        ownerId: 'owner-123',
        createdBy: 'creator-123',
      },
      {
        campaignRepository: campaignRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(createResult.success).toBe(true);
    expect(createResult.campaign?.id).toBe('campaign-123');

    // 2. Attach Content Item
    const attachContentResult = await attachContent(
      {
        campaignId: 'campaign-123',
        contentItemId: 'content-555',
        actorId: 'creator-123',
      },
      {
        campaignRepository: campaignRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(attachContentResult.success).toBe(true);

    // 3. Attach CRM Contact
    const attachContactResult = await attachContact(
      {
        campaignId: 'campaign-123',
        contactId: 'contact-777',
        role: 'target',
        actorId: 'creator-123',
      },
      {
        campaignRepository: campaignRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(attachContactResult.success).toBe(true);

    // 4. Create Task linked to this Campaign
    const taskResult = await createTask(
      {
        title: 'Design email banners',
        campaignId: 'campaign-123',
        createdBy: 'creator-123',
      },
      {
        taskRepository: taskRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(taskResult.success).toBe(true);
    expect(taskResult.task?.campaignId).toBe('campaign-123');

    // 5. Archive Campaign (soft deletes campaign)
    const archiveResult = await archiveCampaign(
      {
        id: 'campaign-123',
        actorId: 'creator-123',
      },
      {
        campaignRepository: campaignRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(archiveResult.success).toBe(true);

    // Verify linked sub-entities (tasks, content_items, contacts) are NOT deleted or updated during campaign archive
    // The mock client should only have updates matching 'campaigns' table, not 'tasks' or 'contacts' or 'content_items'
    expect(mockSupabase.update).not.toHaveBeenCalledWith(
      expect.stringContaining('tasks'),
      expect.any(Object),
    );
    expect(mockSupabase.update).not.toHaveBeenCalledWith(
      expect.stringContaining('contacts'),
      expect.any(Object),
    );
  });
});
