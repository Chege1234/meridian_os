/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@/infrastructure/supabase/server';
import { runAgent } from '@/features/agents/application/RunAgent';
import {
  createSupabaseAgentRepository,
  createSupabasePromptRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseAiConversationRepository,
} from '@/infrastructure/repositories';
import { createAiClient } from '@/infrastructure/ai/AiClientFactory';

vi.mock('@/infrastructure/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/infrastructure/ai/AiClientFactory', () => ({
  createAiClient: vi.fn(),
}));

describe('Agent Whitelist Filter Integration Flow', () => {
  let mockSupabase: any;
  let mockAiClient: any;
  let agentRepo: any;
  let promptRepo: any;
  let aiConversationRepo: any;
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
      single: vi.fn().mockImplementation(() => {
        const table = mockSupabase.currentTable;
        if (table === 'agents') {
          return Promise.resolve({
            data: {
              id: 'agent-123',
              name: 'Content Copywriter Agent',
              description: 'Drafts promo copies.',
              goal: 'Create campaign content drafts.',
              allowed_actions: ['generate_content_draft'], // Whitelist has only this
              prompt_id: 'prompt-123',
              status: 'active',
              created_by: 'user-123',
            },
            error: null,
          });
        }
        if (table === 'prompts') {
          return Promise.resolve({
            data: {
              id: 'prompt-123',
              title: 'Agent Core Prompt',
              prompt: 'Draft something for {{topic}}',
              variables: ['topic'],
              provider: 'google',
              status: 'active',
            },
            error: null,
          });
        }
        if (table === 'agent_runs' || table === 'ai_conversations' || table === 'activity_logs') {
          return Promise.resolve({
            data: { id: 'created-id-123' },
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
    };

    mockAiClient = {
      complete: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          reasoning_trace: 'Staging content draft and setting a system setting.',
          proposed_actions: [
            {
              type: 'generate_content_draft',
              config: { platform: 'instagram', type: 'post', body: 'Kickoff post!' },
            },
            {
              type: 'update_status', // NOT whitelisted for this agent
              config: { targetType: 'campaign', targetId: 'camp-123', status: 'archived' },
            },
          ],
        }),
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        estimatedCost: 0.0005,
      }),
    };

    (createClient as any).mockResolvedValue(mockSupabase);
    (createAiClient as any).mockReturnValue(mockAiClient);

    agentRepo = createSupabaseAgentRepository(mockSupabase);
    promptRepo = createSupabasePromptRepository(mockSupabase);
    aiConversationRepo = createSupabaseAiConversationRepository(mockSupabase);
    activityLogRepo = createSupabaseActivityLogRepository(mockSupabase);
  });

  it('should run agent, parse proposed actions, and filter out non-whitelisted actions before staging', async () => {
    // Intercept agent_runs insert to assert on proposed_actions
    mockSupabase.insert = vi.fn().mockImplementation((insertData) => {
      const table = mockSupabase.currentTable;
      if (table === 'agent_runs') {
        const proposed = insertData.proposed_actions;
        expect(proposed).toHaveLength(2);
        
        // Whitelisted action -> pending approval
        expect(proposed[0].type).toBe('generate_content_draft');
        expect(proposed[0].status).toBe('pending');
        
        // Non-whitelisted action -> automatically rejected before user review
        expect(proposed[1].type).toBe('update_status');
        expect(proposed[1].status).toBe('rejected');
        expect(proposed[1].error).toContain('Violates agent allowed_actions whitelist');
      }
      return mockSupabase;
    });

    const result = await runAgent(
      {
        agentId: 'agent-123',
        userId: 'user-123',
        variables: { topic: 'Summer Launch' },
      },
      {
        agentRepository: agentRepo,
        promptRepository: promptRepo,
        aiConversationRepository: aiConversationRepo,
        activityLogRepository: activityLogRepo,
      }
    );

    expect(result.success).toBe(true);
    expect(mockAiClient.complete).toHaveBeenCalled();
  });
});
