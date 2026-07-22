'use server';

import { getAuthUser } from '@/infrastructure/auth';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseProviderCredentialRepository,
  createSupabaseAiConversationRepository,
} from '@/infrastructure/repositories';
import { CredentialResolver } from '@/infrastructure/ai/CredentialResolver';

export async function askDashboardAi(query: string) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return { success: false, error: 'Unauthenticated.' };
    }

    const supabase = await createServerClient();
    const conversationRepository = createSupabaseAiConversationRepository(supabase);
    const credentialRepository = createSupabaseProviderCredentialRepository();

    const resolver = new CredentialResolver({
      credentialRepository,
      conversationRepository,
      userId: authUser.id,
    });

    const response = await resolver.complete(query, {
      temperature: 0.7,
      maxTokens: 1000,
      context: {
        callType: 'internal',
        modelTier: 'flagship',
        provider: 'nvidia',
      },
    });

    return {
      success: true,
      text: response.text,
      credentialId: response.credentialId,
    };
  } catch (err: any) {
    console.error('[askDashboardAi error]', err);
    return {
      success: false,
      error: err?.message || 'Failed to generate response.',
    };
  }
}
