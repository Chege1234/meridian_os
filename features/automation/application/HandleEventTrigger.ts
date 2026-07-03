import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseAutomationRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseTaskRepository,
  createSupabaseContentRepository,
  createSupabaseCampaignRepository,
  createSupabaseSopRepository,
} from '@/infrastructure/repositories';
import { triggerAutomation } from './TriggerAutomation';

/**
 * Global handler for event-triggered automations.
 * Dynamically imported by EventBus to ensure execution in serverless contexts.
 */
export async function handleEventTrigger(event: string, payload: any): Promise<void> {
  try {
    const supabase = await createServerClient();
    const automationRepository = createSupabaseAutomationRepository(supabase);

    // Query active automations
    const activeAutomations = await automationRepository.findAll({ status: 'active' });
    
    // Filter matching event trigger config
    const matching = activeAutomations.filter(
      (auto) => auto.triggerType === 'event' && auto.triggerConfig.event === event
    );

    if (matching.length === 0) {
      return;
    }

    const userRepository = createSupabaseUserRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);
    const taskRepository = createSupabaseTaskRepository(supabase);
    const contentRepository = createSupabaseContentRepository(supabase);
    const campaignRepository = createSupabaseCampaignRepository(supabase);
    const sopRepository = createSupabaseSopRepository(supabase);

    for (const auto of matching) {
      await triggerAutomation(
        {
          automationId: auto.id,
          inputSnapshot: payload,
        },
        {
          automationRepository,
          userRepository,
          activityLogRepository,
          taskRepository,
          contentRepository,
          campaignRepository,
          sopRepository,
        }
      );
    }
  } catch (err: any) {
    console.error(`Error in handleEventTrigger for event "${event}":`, err.message);
  }
}
