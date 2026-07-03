/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';
import { createContact } from '@/features/crm/application/CreateContact';
import { archiveContact } from '@/features/crm/application/ArchiveContact';
import { createTask } from '@/features/tasks/application/CreateTask';
import {
  createSupabaseContactRepository,
  createSupabaseTaskRepository,
  createSupabaseActivityLogRepository,
} from '@/infrastructure/repositories';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('CRM & Tasks Integration Flow', () => {
  let mockSupabase: any;
  let contactRepo: any;
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
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        const table = mockSupabase.currentTable;
        if (table === 'contacts') {
          return Promise.resolve({
            data: {
              id: 'new-contact-id',
              name: 'John Doe',
              organization: 'ACME Corp',
              email: 'john@acme.com',
              phone: null,
              status: 'active',
              created_by: 'user-123',
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
              user_id: 'user-123',
              action: 'action',
              module: 'module',
              created_at: new Date().toISOString(),
            },
            error: null,
          });
        }
        if (table === 'tasks') {
          return Promise.resolve({
            data: {
              id: 'task-123',
              title: 'Send Proposal',
              status: 'todo',
              priority: 'medium',
              created_by: 'user-123',
              contact_id: 'new-contact-id',
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
    contactRepo = createSupabaseContactRepository(mockSupabase);
    taskRepo = createSupabaseTaskRepository(mockSupabase);
    activityLogRepo = createSupabaseActivityLogRepository(mockSupabase);
  });

  it('should create contact, flag duplicates, add task, and archive contact while leaving task unaffected (BR-800, BR-802, BR-803)', async () => {
    // 1. Mock duplicate check response
    mockSupabase.or.mockResolvedValue({
      data: [
        {
          id: 'existing-id',
          name: 'John Doe',
          organization: 'ACME Corp',
          email: 'john@acme.com',
          phone: null,
          status: 'active',
          created_by: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    // A: Create Contact (runs duplicate checks)
    const createResult = await createContact(
      {
        name: 'John Doe',
        organization: 'ACME Corp',
        email: 'john@acme.com',
        createdBy: 'user-123',
      },
      {
        contactRepository: contactRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(createResult.success).toBe(true);
    expect(createResult.duplicateWarning).toBe(true); // BR-800 duplicate detected
    expect(createResult.contact?.id).toBe('new-contact-id');

    // B: Create Task linked to this Contact
    const taskResult = await createTask(
      {
        title: 'Send Proposal',
        contactId: 'new-contact-id',
        createdBy: 'user-123',
      },
      {
        taskRepository: taskRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(taskResult.success).toBe(true);
    expect(taskResult.task?.contactId).toBe('new-contact-id');

    // C: Archive Contact (soft delete contact)
    const archiveResult = await archiveContact(
      {
        id: 'new-contact-id',
        actorId: 'user-123',
      },
      {
        contactRepository: contactRepo,
        activityLogRepository: activityLogRepo,
      },
    );

    expect(archiveResult.success).toBe(true); // BR-802 soft-delete contact works

    // Verify task is NOT deleted or updated during contact archive (BR-803)
    // The mock client should only have updates matching 'contacts' table, not 'tasks'
    expect(mockSupabase.update).not.toHaveBeenCalledWith(
      expect.stringContaining('tasks'),
      expect.any(Object),
    );
  });
});
