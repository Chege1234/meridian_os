import type { Agent, AgentRun, AgentProposedAction } from '@/domain/entities';
import type {
  AgentRepository,
  PromptRepository,
  AiConversationRepository,
  ActivityLogRepository,
} from '@/domain/repositories';
import type { AiClient } from '@/infrastructure/ai/AiClient';
import { validateProposedActions } from '@/domain/rules/AgentRules';

interface Dependencies {
  agentRepository: AgentRepository;
  promptRepository: PromptRepository;
  aiConversationRepository: AiConversationRepository;
  activityLogRepository: ActivityLogRepository;
  aiClient: AiClient;
}

interface RunAgentInput {
  readonly agentId: string;
  readonly userId: string;
  readonly variables: Record<string, string>;
}

interface Result {
  success: boolean;
  run?: AgentRun;
  error?: string;
}

export async function runAgent(
  input: RunAgentInput,
  deps: Dependencies,
): Promise<Result> {
  try {
    // 1. Fetch agent
    const agent = await deps.agentRepository.findById(input.agentId);
    if (!agent) {
      return { success: false, error: 'Agent profile not found.' };
    }

    if (agent.status === 'paused') {
      return { success: false, error: 'Agent is paused and cannot run.' };
    }

    // 2. Fetch prompt and active version snapshot
    const prompt = await deps.promptRepository.findById(agent.promptId);
    if (!prompt) {
      return { success: false, error: 'Agent prompt template not found in library.' };
    }

    const activeVersion = await deps.promptRepository.findActiveByPromptId(agent.promptId);
    let promptTemplateText = activeVersion ? activeVersion.prompt : prompt.prompt;
    const expectedVariables = activeVersion ? activeVersion.variables : prompt.variables;

    // 3. Fill variables
    let filledPromptText = promptTemplateText;
    for (const varName of expectedVariables) {
      const value = input.variables[varName] || '';
      const regex = new RegExp(`\\{\\{\\s*${varName}\\s*\\}\\}`, 'g');
      filledPromptText = filledPromptText.replace(regex, value);
    }

    // Inject agent instructions context so the LLM responds with reasoning trace and actions array
    const systemInstruction = `
You are the AI Agent named "${agent.name}".
Your stated Goal is: "${agent.goal}"
You are allowed to propose ONLY the following action types: [${agent.allowedActions.join(', ')}]. Any other action type will be automatically rejected.

IMPORTANT: You MUST respond in a valid JSON format only, matching this structure exactly:
{
  "reasoning_trace": "A comprehensive explanation of what you are doing, why you are doing it, and your reasoning.",
  "proposed_actions": [
    {
      "type": "action_type_name_here",
      "config": {
        // action parameters, e.g. for create_task: title, description, priority (low|medium|high)
        // for generate_content_draft: platform, type, body, caption
      }
    }
  ]
}
Do not wrap your JSON in markdown code blocks or add any additional conversational text. Respond with pure JSON.
`;

    const fullPromptInput = `${systemInstruction}\n\nUser Context / Input:\n${filledPromptText}`;

    // 4. Invoke the AI client via CredentialResolver (respects provider_credentials priority)
    const completion = await deps.aiClient.complete(fullPromptInput, {
      temperature: 0.2, // Low temperature for structured JSON output
      context: {
        callType: 'internal', // Agent reasoning = internal (enables cross-provider fallback)
        modelTier: 'fast',
      },
    });

    // 5. Parse JSON response
    let parsed: { reasoning_trace?: string; proposed_actions?: { type: string; config: any }[] } = {};
    let parseError: string | null = null;
    
    // Clean response text if LLM wrapped in markdown code blocks
    let cleanedText = completion.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    try {
      parsed = JSON.parse(cleanedText);
    } catch (err: any) {
      parseError = `Failed to parse Agent JSON response: ${err.message}. Raw output: ${completion.text}`;
    }

    const reasoningTrace = parsed.reasoning_trace || (parseError ? `Error: ${parseError}` : 'No reasoning trace provided.');
    const rawActions = parsed.proposed_actions || [];

    // 6. Validate proposed actions against whitelists (AgentRules check)
    // Defense in depth: non-whitelisted actions are marked status: 'rejected' before storage
    const proposedActions = validateProposedActions(agent.allowedActions, rawActions);

    // Determine final status
    const allRejected = proposedActions.length > 0 && proposedActions.every(a => a.status === 'rejected');
    const runStatus = parseError ? 'failed' : (proposedActions.length === 0 ? 'completed' : (allRejected ? 'rejected' : 'pending_approval'));

    // 7. Store agent run log in database
    const run = await deps.agentRepository.createRun({
      agentId: agent.id,
      triggeredBy: 'manual', // or triggerType based on invoke context
      status: runStatus,
      reasoningTrace,
      proposedActions,
      tokenUsage: completion.tokenUsage,
      estimatedCost: completion.estimatedCost,
    });

    // 8. AI interaction logging is handled by CredentialResolver automatically (BR-904, BR-906)
    // No manual logging needed — the resolver logs provider, model, tokens, cost, and credentialId.

    // 9. Increment Prompt Usage statistics (BR-700 tracking)
    await deps.promptRepository.incrementUsageCount(prompt.id).catch((err) => {
      console.warn('Failed to increment prompt usage count:', err.message);
    });

    // Log the activity
    await deps.activityLogRepository.create({
      userId: input.userId,
      action: 'agent.run',
      module: 'agents',
      entity: 'agent_run',
      entityId: run.id,
      metadata: {
        agentId: agent.id,
        status: run.status,
        actionsCount: proposedActions.length,
      },
    });

    return {
      success: true,
      run,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to run agent.',
    };
  }
}
