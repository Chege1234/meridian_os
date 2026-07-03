/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';
import { triggerAutomation } from '@/features/automation/application/TriggerAutomation';
import { approveAutomationRun } from '@/features/automation/application/ApproveAutomationRun';
import {
  createSupabaseAutomationRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseTaskRepository,
  createSupabaseContentRepository,
  createSupabaseCampaignRepository,
  createSupabaseSopRepository,
} from '@/infrastructure/repositories';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('Automation Integration Flow', () => {
  let mockSupabase: any;
  let automationRepo: any;
  let userRepo: any;
  let activityLogRepo: any;
  let taskRepo: any;
  let contentRepo: any;
  let campaignRepo: any;
  let sopRepo: any;

  // Dynamic DB state for integration test mock
  let runStatus = 'pending_approval';
  let approvedBy: string | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset DB state
    runStatus = 'pending_approval';
    approvedBy = null;

    mockSupabase = {
      currentTable: '',
      from: vi.fn().mockImplementation((table) => {
        mockSupabase.currentTable = table;
        return mockSupabase;
      }),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockImplementation((data) => {
        if (mockSupabase.currentTable === 'automation_runs') {
          if (data.status !== undefined) runStatus = data.status;
          if (data.approved_by !== undefined) approvedBy = data.approved_by;
        }
        return mockSupabase;
      }),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        const table = mockSupabase.currentTable;
        if (table === 'automations') {
          return Promise.resolve({
            data: {
              id: 'auto-123',
              name: 'Test Task Creator',
              trigger_type: 'event',
              trigger_config: { event: 'campaign.status_changed' },
              action_type: 'create_task',
              action_config: { title: 'Follow up campaign kickoff', priority: 'medium' },
              status: 'active',
              requires_approval: true,
              created_by: 'user-123',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'automation_runs') {
          return Promise.resolve({
            data: {
              id: 'run-123',
              automation_id: 'auto-123',
              status: runStatus,
              triggered_at: new Date().toISOString(),
              input_snapshot: { campaignId: 'camp-123' },
              approved_by: approvedBy,
            },
            error: null,
          });
        }
        if (table === 'users') {
          return Promise.resolve({
            data: {
              id: 'user-123',
              full_name: 'Admin User',
              email: 'admin@meridian.com',
              status: 'active',
              role_id: 'role-123',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: { id: 'role-123', name: 'admin' },
            },
            error: null,
          });
        }
        if (table === 'tasks') {
          return Promise.resolve({
            data: {
              id: 'task-999',
              title: 'Follow up campaign kickoff',
              status: 'todo',
              created_by: 'user-123',
            },
            error: null,
          });
        }
        if (table === 'activity_logs') {
          return Promise.resolve({
            data: { id: 'log-123' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);

    // Repos
    automationRepo = createSupabaseAutomationRepository(mockSupabase);
    userRepo = createSupabaseUserRepository(mockSupabase);
    activityLogRepo = createSupabaseActivityLogRepository(mockSupabase);
    taskRepo = createSupabaseTaskRepository(mockSupabase);
    contentRepo = createSupabaseContentRepository(mockSupabase);
    campaignRepo = createSupabaseCampaignRepository(mockSupabase);
    sopRepo = createSupabaseSopRepository(mockSupabase);
  });

  it('should trigger automation in pending_approval status if requiresApproval is true', async () => {
    const result = await triggerAutomation(
      {
        automationId: 'auto-123',
        inputSnapshot: { campaignId: 'camp-123' },
      },
      { automationRepository: automationRepo }
    );

    expect(result.success).toBe(true);
    expect(result.run).toBeDefined();
    expect(result.run?.status).toBe('pending_approval');
  });

  it('should execute task creation use case when run is approved', async () => {
    const result = await approveAutomationRun('run-123', 'user-123', {
      automationRepository: automationRepo,
      userRepository: userRepo,
      activityLogRepository: activityLogRepo,
      taskRepository: taskRepo,
      contentRepository: contentRepo,
      campaignRepository: campaignRepo,
      sopRepository: sopRepo,
    });

    console.log('APPROVE RUN RESULT:', result);
    expect(result.success).toBe(true);
    // Verifying update call has set run status to executed or approved
    expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
    expect(mockSupabase.insert).toHaveBeenCalled();
  });
});
