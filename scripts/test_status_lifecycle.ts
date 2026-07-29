import { transitionContentStatus } from '@/features/content-studio/application/TransitionContentStatus';
import { createSupabaseContentRepository } from '@/infrastructure/repositories/SupabaseContentRepository';
import { createSupabaseActivityLogRepository } from '@/infrastructure/repositories/SupabaseActivityLogRepository';
import { db } from '@/infrastructure/supabase/db';
import { activityLogs, contentItems } from '@/infrastructure/supabase/schema';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

async function testLifecycle() {
  console.log('--- TEST STEP 6: STATUS LIFECYCLE ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const contentRepo = createSupabaseContentRepository(supabase);
  const activityRepo = createSupabaseActivityLogRepository(supabase);

  const contentId = 'ec197d34-2497-46cc-8e5e-9fa4a5f390d4';
  const userId = 'b69f24f9-d994-4e34-8f89-e985d512f538';
  const userRole = 'owner';

  const transitions = ['draft', 'review', 'approved', 'published'] as const;

  for (const status of transitions) {
    console.log(`Transitioning to ${status}...`);
    const res = await transitionContentStatus(
      { id: contentId, status, actorId: userId, actorRoleName: userRole },
      { contentRepository: contentRepo, activityLogRepository: activityRepo }
    );

    if (!res.success) {
      console.error(`Transition to ${status} failed:`, res.error);
    } else {
      console.log(`Successfully transitioned to ${status}!`);
    }

    // Inspect activity logs directly from DB
    const latestLogs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.entityId, contentId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(1);

    if (latestLogs.length > 0) {
      const log = latestLogs[0]!;
      console.log(`Activity Log recorded: action="${log.action}", module="${log.module}", entity="${log.entity}", entityId="${log.entityId}"`);
    }
  }

  console.log('--- STATUS LIFECYCLE TEST COMPLETE ---');
}

testLifecycle().catch(console.error).finally(() => process.exit());
