import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateContent } from '@/features/content-studio/application/GenerateContent';
import type { PromptRepository, AiConversationRepository } from '@/domain/repositories';
import type { AiClient } from '@/infrastructure/ai/AiClient';
import type { Prompt, PromptVersion, AiConversation } from '@/domain/entities';

describe('GenerateContent Use Case', () => {
  let mockPromptRepo: PromptRepository;
  let mockAiConvRepo: AiConversationRepository;
  let mockAiClient: AiClient;

  const mockPrompt: Prompt = {
    id: 'prompt-123',
    title: 'Ad Generator',
    description: 'Ad creator',
    prompt: 'Write an ad about {{topic}} for {{audience}}.',
    variables: ['topic', 'audience'],
    provider: 'openai',
    version: 2,
    status: 'active',
    usageCount: 5,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  };

  const mockActiveVersion: PromptVersion = {
    id: 'version-123',
    promptId: 'prompt-123',
    version: 2,
    prompt: 'Write an ad about {{topic}} for {{audience}}.',
    variables: ['topic', 'audience'],
    authorId: 'user-123',
    summary: 'Updated ad version',
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPromptRepo = {
      findById: vi.fn().mockResolvedValue(mockPrompt),
      findByTitle: vi.fn(),
      findActiveByPromptId: vi.fn().mockResolvedValue(mockActiveVersion),
      findVersionHistory: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      createVersion: vi.fn(),
      incrementUsageCount: vi.fn().mockResolvedValue(undefined),
    } as unknown as PromptRepository;

    mockAiConvRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
    } as unknown as AiConversationRepository;

    mockAiClient = {
      complete: vi.fn().mockResolvedValue({
        text: 'Mocked AI generated output text for topic: Meridian.',
        tokenUsage: {
          promptTokens: 40,
          completionTokens: 20,
          totalTokens: 60,
        },
        estimatedCost: 0.0001,
        credentialId: 'cred-123',
      }),
    };
  });

  it('should resolve active prompt version, inject variables, invoke CredentialResolver, and track usage (BR-700, BR-901, BR-904, BR-906)', async () => {
    const input = {
      promptId: 'prompt-123',
      variables: {
        topic: 'Meridian',
        audience: 'Students',
      },
      userId: 'user-123',
    };

    const result = await generateContent(input, {
      promptRepository: mockPromptRepo,
      aiConversationRepository: mockAiConvRepo,
      aiClient: mockAiClient,
    });

    expect(result.success).toBe(true);
    expect(result.text).toContain('topic: Meridian');

    // Confirm prompt lookup
    expect(mockPromptRepo.findById).toHaveBeenCalledWith('prompt-123');
    expect(mockPromptRepo.findActiveByPromptId).toHaveBeenCalledWith('prompt-123');

    // Confirm AI client was invoked with correct context
    expect(mockAiClient.complete).toHaveBeenCalledWith(
      'Write an ad about Meridian for Students.',
      expect.objectContaining({
        context: {
          callType: 'content_generation',
          modelTier: 'fast',
        },
      }),
    );

    // Confirm prompt usage statistic was incremented
    expect(mockPromptRepo.incrementUsageCount).toHaveBeenCalledWith('prompt-123');
  });

  it('should return error if prompt is deprecated', async () => {
    const deprecatedPrompt = { ...mockPrompt, status: 'deprecated' as const };
    mockPromptRepo.findById = vi.fn().mockResolvedValue(deprecatedPrompt);

    const input = {
      promptId: 'prompt-123',
      variables: {},
      userId: 'user-123',
    };

    const result = await generateContent(input, {
      promptRepository: mockPromptRepo,
      aiConversationRepository: mockAiConvRepo,
      aiClient: mockAiClient,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('deprecated');
  });
});
