import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NvidiaAdapter } from '@/infrastructure/ai/NvidiaAdapter';

const { mockChatCompletionsCreate, mockConstructor } = vi.hoisted(() => {
  return {
    mockChatCompletionsCreate: vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Mocked response content from Nvidia GLM.',
          },
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    }),
    mockConstructor: vi.fn(),
  };
});

vi.mock('openai', () => {
  class MockOpenAI {
    constructor(options: any) {
      mockConstructor(options);
    }
    chat = {
      completions: {
        create: mockChatCompletionsCreate,
      },
    };
  }
  return {
    default: MockOpenAI,
  };
});

describe('NvidiaAdapter', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should throw startup error if API key is missing', () => {
    delete process.env.NVIDIA_API_KEY;
    expect(() => new NvidiaAdapter()).toThrow(
      'NVIDIA_API_KEY environment variable is missing. Please configure it in your environment.'
    );
  });

  it('should initialize successfully with environment variable', () => {
    process.env.NVIDIA_API_KEY = 'nvapi-env-test-key';
    const adapter = new NvidiaAdapter();
    expect(adapter).toBeDefined();
    expect(mockConstructor).toHaveBeenCalledWith({
      apiKey: 'nvapi-env-test-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  });

  it('should initialize successfully with injected key', () => {
    const adapter = new NvidiaAdapter('nvapi-injected-test-key');
    expect(adapter).toBeDefined();
    expect(mockConstructor).toHaveBeenCalledWith({
      apiKey: 'nvapi-injected-test-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  });

  it('should complete completion request, calculate cost, and return correct format', async () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test-key';
    const adapter = new NvidiaAdapter();

    const result = await adapter.complete('Hello, how are you?', {
      temperature: 0.8,
      maxTokens: 500,
    });

    expect(mockChatCompletionsCreate).toHaveBeenCalledWith({
      model: 'z-ai/glm-5.2',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      temperature: 0.8,
      max_tokens: 500,
    });

    expect(result.text).toBe('Mocked response content from Nvidia GLM.');
    expect(result.tokenUsage.promptTokens).toBe(100);
    expect(result.tokenUsage.completionTokens).toBe(50);
    expect(result.tokenUsage.totalTokens).toBe(150);

    // Cost calculation: 100 * 0.0000009086 + 50 * 0.000002856 = 0.00009086 + 0.0001428 = 0.00023366
    expect(result.estimatedCost).toBeCloseTo(0.00023366, 8);
  });

  it('should handle API errors by throwing a formatted message', async () => {
    process.env.NVIDIA_API_KEY = 'nvapi-test-key';
    const adapter = new NvidiaAdapter();

    mockChatCompletionsCreate.mockRejectedValueOnce(
      new Error('Rate limit exceeded')
    );

    await expect(adapter.complete('Hello')).rejects.toThrow(
      'NVIDIA API error: Rate limit exceeded'
    );
  });
});
