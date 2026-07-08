import { NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase';
import {
  createSupabaseSopRepository,
  createSupabaseAutomationRepository,
  createSupabaseUserRepository,
  createSupabaseActivityLogRepository,
  createSupabaseTaskRepository,
  createSupabaseContentRepository,
  createSupabaseCampaignRepository,
  createSupabaseSettingRepository,
  createSupabaseContactRepository,
} from '@/infrastructure/repositories';
import { getSetting, updateSetting, syncMarketplaceContact } from '@/application/use-cases';
import { eventBus } from '@/shared/utils';
import postgres from 'postgres';

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
    const userRepository = createSupabaseUserRepository(supabase);
    const activityLogRepository = createSupabaseActivityLogRepository(supabase);
    const taskRepository = createSupabaseTaskRepository(supabase);
    const contentRepository = createSupabaseContentRepository(supabase);
    const campaignRepository = createSupabaseCampaignRepository(supabase);

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
          results.scheduledAutomationsTriggered++;
        }
      } catch (err: any) {
        results.errors.push(`Automation ${auto.id} error: ${err.message}`);
      }
    }

    // 3. Sync contacts from Campus Marketplace
    const marketplaceDbUrl = process.env.CAMPUS_MARKETPLACE_DATABASE_URL;
    if (marketplaceDbUrl) {
      const settingRepository = createSupabaseSettingRepository(supabase);
      const contactRepository = createSupabaseContactRepository(supabase);

      const lastSyncSetting = await getSetting('campus_marketplace_last_sync', { settingRepository });
      const lastSyncTimestamp = lastSyncSetting?.value || '1970-01-01T00:00:00Z';

      const cmClient = postgres(marketplaceDbUrl, { prepare: false });
      try {
        const rows = await cmClient`
          select id, username, email, phone, role, avatar, is_verified, created_at, student_id, preferred_language, last_seen_at, account_status, home_town 
          from users 
          where is_verified = true and created_at > ${lastSyncTimestamp} 
          order by created_at asc
        `;

        results.marketplaceSync = {
          queriedRows: rows.length,
          syncedRows: 0,
          skippedRows: 0,
        };

        let maxCreatedAt: Date | null = null;
        let allSucceeded = true;

        for (const row of rows) {
          try {
            const syncResult = await syncMarketplaceContact(
              {
                id: row.id.toString(),
                username: row.username,
                email: row.email,
                phone: row.phone,
                role: row.role,
                avatar: row.avatar,
                isVerified: row.is_verified,
                createdAt: new Date(row.created_at),
                studentId: row.student_id,
                preferredLanguage: row.preferred_language,
                lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
                accountStatus: row.account_status,
                homeTown: row.home_town,
              },
              { contactRepository, activityLogRepository }
            );

            if (!syncResult.success) {
              allSucceeded = false;
              results.errors.push(`Marketplace contact sync failed for ID ${row.id}: ${syncResult.error}`);
              break;
            }

            if (syncResult.skipped) {
              results.marketplaceSync.skippedRows++;
            } else {
              results.marketplaceSync.syncedRows++;
            }

            const rowCreatedAt = new Date(row.created_at);
            if (!maxCreatedAt || rowCreatedAt > maxCreatedAt) {
              maxCreatedAt = rowCreatedAt;
            }
          } catch (err: any) {
            allSucceeded = false;
            results.errors.push(`Marketplace contact sync error for ID ${row.id}: ${err.message}`);
            break;
          }
        }

        if (allSucceeded && maxCreatedAt) {
          await updateSetting(
            {
              key: 'campus_marketplace_last_sync',
              value: maxCreatedAt.toISOString(),
            },
            { settingRepository }
          );
        }
      } catch (err: any) {
        results.errors.push(`Marketplace database query failed: ${err.message}`);
      } finally {
        await cmClient.end();
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
