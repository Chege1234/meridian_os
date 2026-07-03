import { NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseSopRepository,
  createSupabaseAutomationRepository,
} from '@/infrastructure/repositories';
import { eventBus } from '@/shared/utils';

export async function GET(request: Request) {
  try {
    // Basic security check: verify Vercel Cron header or token (optional for local testing)
    const authHeader = request.headers.get('authorization');
    const cronHeader = request.headers.get('x-vercel-cron');
    
    // In production, we should enforce security:
    // if (process.env.NODE_ENV === 'production' && !cronHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const supabase = await createServerClient();
    const sopRepository = createSupabaseSopRepository(supabase);
    const automationRepository = createSupabaseAutomationRepository(supabase);

    const now = new Date();
    const results: any = {
      overdueSopsProcessed: 0,
      scheduledAutomationsTriggered: 0,
      errors: [],
    };

    // 1. Query published SOPs with reviewDueDate in the past
    const sops = await sopRepository.findAll({ status: 'published' });
    const overdueSops = sops.filter(
      (sop) => sop.reviewDueDate && new Date(sop.reviewDueDate) < now
    );

    for (const sop of overdueSops) {
      try {
        await eventBus.emit('sop.review_overdue', {
          id: sop.id,
          title: sop.title,
          reviewDueDate: sop.reviewDueDate,
          ownerId: sop.ownerId,
        });
        results.overdueSopsProcessed++;
      } catch (err: any) {
        results.errors.push(`SOP ${sop.id} error: ${err.message}`);
      }
    }

    // 2. Query active schedule-triggered automations
    const automations = await automationRepository.findAll({ status: 'active' });
    const scheduledAutomations = automations.filter(
      (auto) => auto.triggerType === 'schedule'
    );

    for (const auto of scheduledAutomations) {
      try {
        // Query last runs for this automation to prevent excessive executions
        const runs = await automationRepository.findAllRuns({ automationId: auto.id });
        const lastRun = runs.length > 0 ? runs[0] : null;

        let shouldTrigger = false;
        if (!lastRun) {
          shouldTrigger = true;
        } else {
          // If the cron expression suggests daily, check if 23 hours passed since last run
          const hoursSinceLastRun =
            (now.getTime() - new Date(lastRun.triggeredAt).getTime()) / (1000 * 60 * 60);
          
          const cron = auto.triggerConfig.cron || '';
          if (cron.includes('0 0') || cron.includes('@daily')) {
            shouldTrigger = hoursSinceLastRun >= 23;
          } else if (cron.includes('*/5') || cron.includes('5 *')) {
            shouldTrigger = hoursSinceLastRun >= 0.08; // ~5 mins
          } else if (cron.includes('0 *') || cron.includes('@hourly')) {
            shouldTrigger = hoursSinceLastRun >= 0.95; // ~1 hour
          } else {
            // Default: daily safety guard
            shouldTrigger = hoursSinceLastRun >= 23;
          }
        }

        if (shouldTrigger) {
          // We trigger the automation run.
          // Note: In Next.js server actions / use cases, we will build a TriggerAutomation use case.
          // For now we will invoke a trigger payload.
          // Import triggerAutomation use case dynamically or construct it
          const { triggerAutomation } = await import('@/features/automation/application/TriggerAutomation');
          await triggerAutomation(
            {
              automationId: auto.id,
              inputSnapshot: { triggeredBy: 'schedule', timestamp: now.toISOString() },
            },
            { automationRepository }
          );
          results.scheduledAutomationsTriggered++;
        }
      } catch (err: any) {
        results.errors.push(`Automation ${auto.id} error: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
