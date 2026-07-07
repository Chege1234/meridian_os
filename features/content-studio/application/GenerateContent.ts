/**
 * Use Case — Generate Content with AI
 *
 * Resolves active prompt template, replaces variables, invokes pluggable AI client,
 * logs request/response details, tracks cost/tokens, and increments prompt usage.
 * Per BR-700, BR-901: every AI request references Prompt Library.
 * Per BR-902: AI responses remain editable.
 * Per BR-903: AI never silently changes business data (returns draft to user).
 * Per BR-904, BR-906: logs conversations and tracks costs.
 */

import type { PromptRepository, AiConversationRepository } from '@/domain/repositories';
import type { AiClient } from '@/infrastructure/ai/AiClient';

interface Dependencies {
  promptRepository: PromptRepository;
  aiConversationRepository: AiConversationRepository;
  aiClient: AiClient;
}

interface GenerateContentInput {
  readonly promptId: string;
  readonly variables: Record<string, string>;
  readonly userId: string;
  readonly options?: {
    readonly model?: string;
    readonly temperature?: number;
    readonly maxTokens?: number;
  };
}

interface Result {
  success: boolean;
  text?: string;
  conversationId?: string;
  error?: string;
}

export async function generateContent(
  input: GenerateContentInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    // 1. Fetch prompt and active version snapshot
    const prompt = await deps.promptRepository.findById(input.promptId);
    if (!prompt) {
      return { success: false, error: 'Prompt template not found in library.' };
    }

    if (prompt.status === 'deprecated') {
      return { success: false, error: 'Cannot use a deprecated prompt template.' };
    }

    // Resolve the active prompt template text from versions history (or fall back to current prompt)
    const activeVersion = await deps.promptRepository.findActiveByPromptId(input.promptId);
    let promptTemplateText = activeVersion ? activeVersion.prompt : prompt.prompt;

    // 2. Replace variables in template text (e.g. {{topic}})
    let filledPromptText = promptTemplateText;
    const expectedVariables = activeVersion ? activeVersion.variables : prompt.variables;

    for (const varName of expectedVariables) {
      const value = input.variables[varName] || '';
      // Replace all occurrences of {{varName}}
      const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
      filledPromptText = filledPromptText.replace(regex, value);
    }

    // 3. Invoke the AI client via CredentialResolver (respects provider_credentials priority)
    const response = await deps.aiClient.complete(filledPromptText, {
      temperature: input.options?.temperature,
      maxTokens: input.options?.maxTokens,
      context: {
        callType: 'content_generation', // User-facing content — no cross-provider fallback (BR-1405)
        modelTier: 'fast',
      },
    });

    // 5. AI interaction logging is handled by CredentialResolver automatically (BR-904, BR-906)
    // No manual logging needed — the resolver logs provider, model, tokens, cost, and credentialId.

    // 6. Increment Prompt Usage statistics (BR-700 tracking)
    await deps.promptRepository.incrementUsageCount(prompt.id).catch((err) => {
      console.warn('Failed to increment prompt usage count:', err.message);
    });

    return {
      success: true,
      text: response.text,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'AI generation failed.',
    };
  }
}
