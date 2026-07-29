import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CredentialResolver } from '@/infrastructure/ai/CredentialResolver';
import type { ProviderCredentialRepository, AiConversationRepository } from '@/domain/repositories';
import type { ProviderCredentialWithKey } from '@/domain/entities';

// Mock AiClientFactory createAiClient
vi.mock('@/infrastructure/ai/AiClientFactory', () => ({
  createAiClient: vi.fn(),
}));

import { createAiClient } from '@/infrastructure/ai/AiClientFactory';

describe('CredentialResolver', () => {
  let mockCredentialRepo: ProviderCredentialRepository;
  let mockAiConvRepo: AiConversationRepository;

  const credPriority1: ProviderCredentialWithKey = {
    id: 'cred-p1',
    provider: 'nvidia',
    label: 'GLM 5.2 Priority 1',
    modelTier: 'fast',
    decryptedKey: 'nvapi-key-1',
    priority: 1,
    status: 'active',
    lastErrorAt: null,
    lastErrorMessage: null,
    rateLimitResetAt: null,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const credPriority2: ProviderCredentialWithKey = {
    id: 'cred-p2',
    provider: 'nvidia',
    label: 'GLM 4.7 Priority 2',
    modelTier: 'fast',
    decryptedKey: 'nvapi-key-2',
    priority: 2,
    status: 'active',
    lastErrorAt: null,
    lastErrorMessage: null,
    rateLimitResetAt: null,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCredentialRepo = {
      findAll: vi.fn().mockResolvedValue([credPriority1, credPriority2]),
      findActiveByProviderAndTier: vi.fn().mockResolvedValue([credPriority1, credPriority2]),
      findById: vi.fn(),
      findByProvider: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    } as unknown as ProviderCredentialRepository;

    mockAiConvRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn().mockResolvedValue(undefined),
    } as unknown as AiConversationRepository;
  });

  it('should extract status from NVIDIA 401 error string, mark priority-1 credential as error, and failover to priority-2', async () => {
    const p1Client = {
      complete: vi.fn().mockRejectedValue(new Error('NVIDIA API error: 401 Incorrect API key provided')),
    };

    const p2Client = {
      complete: vi.fn().mockResolvedValue({
        text: 'Generated text from priority 2',
        tokenUsage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
        estimatedCost: 0.0001,
      }),
    };

    vi.mocked(createAiClient)
      .mockReturnValueOnce(p1Client as any)
      .mockReturnValueOnce(p2Client as any);

    const resolver = new CredentialResolver({
      credentialRepository: mockCredentialRepo,
      conversationRepository: mockAiConvRepo,
      userId: 'user-123',
    });

    const response = await resolver.complete('Test prompt', {
      context: { callType: 'content_generation', modelTier: 'fast', provider: 'nvidia' },
    });

    expect(response.text).toBe('Generated text from priority 2');
    expect(response.credentialId).toBe('cred-p2');

    // Confirm priority-1 credential status was updated to 'error'
    expect(mockCredentialRepo.updateStatus).toHaveBeenCalledWith('cred-p1', {
      status: 'error',
      lastErrorMessage: expect.stringContaining('Auth failure (401)'),
    });
  });

  it('should extract status from structured error objects and mark status rate_limited on 429', async () => {
    const structuredErr = {
      status: 429,
      message: 'Rate limit exceeded for nvidia api',
    };

    const p1Client = {
      complete: vi.fn().mockRejectedValue(structuredErr),
    };

    const p2Client = {
      complete: vi.fn().mockResolvedValue({
        text: 'Success after rate limit',
        tokenUsage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        estimatedCost: 0.00005,
      }),
    };

    vi.mocked(createAiClient)
      .mockReturnValueOnce(p1Client as any)
      .mockReturnValueOnce(p2Client as any);

    const resolver = new CredentialResolver({
      credentialRepository: mockCredentialRepo,
      conversationRepository: mockAiConvRepo,
      userId: 'user-123',
    });

    const response = await resolver.complete('Test prompt', {
      context: { callType: 'content_generation', modelTier: 'fast', provider: 'nvidia' },
    });

    expect(response.text).toBe('Success after rate limit');
    expect(mockCredentialRepo.updateStatus).toHaveBeenCalledWith('cred-p1', {
      status: 'rate_limited',
      lastErrorMessage: expect.stringContaining('Rate limited'),
      rateLimitResetAt: expect.any(Date),
    });
  });
});
