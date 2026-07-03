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
import { createAiClient } from '@/infrastructure/ai/AiClientFactory';

interface Dependencies {
  promptRepository: PromptRepository;
  aiConversationRepository: AiConversationRepository;
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

    // 3. Instantiate pluggable AI client based on prompt configuration
    const aiClient = createAiClient(prompt.provider);

    // 4. Complete the AI request
    const response = await aiClient.complete(filledPromptText, {
      model: input.options?.model,
      temperature: input.options?.temperature,
      maxTokens: input.options?.maxTokens,
    });

    // 5. Log the AI interaction in DB (BR-904, BR-906)
    const conversationLog = await deps.aiConversationRepository.create({
      userId: input.userId,
      provider: prompt.provider,
      model: input.options?.model || (prompt.provider === 'openai' ? 'gpt-4o-mini' : prompt.provider === 'google' ? 'gemini-1.5-flash' : 'claude-3-5-sonnet-20241022'),
      promptId: prompt.id,
      input: filledPromptText,
      response: response.text,
      tokenUsage: response.tokenUsage,
      estimatedCost: response.estimatedCost,
    });

    // 6. Increment Prompt Usage statistics (BR-700 tracking)
    await deps.promptRepository.incrementUsageCount(prompt.id).catch((err) => {
      console.warn('Failed to increment prompt usage count:', err.message);
    });

    return {
      success: true,
      text: response.text,
      conversationId: conversationLog.id,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'AI generation failed.',
    };
  }
}
