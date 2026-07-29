import { getContentByPromptAttribution } from '@/features/analytics/application/GetContentByPromptAttribution';
import { createSupabaseAnalyticsRepository } from '@/infrastructure/repositories/SupabaseAnalyticsRepository';
import { createClient } from '@supabase/supabase-js';

async function testAttribution() {
  console.log('--- TEST STEP 7: PROMPT ATTRIBUTION QUERY ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const analyticsRepo = (createSupabaseAnalyticsRepository as any)(supabase);

  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const actorId = 'b69f24f9-d994-4e34-8f89-e985d512f538';
  const actorRole = 'owner';

  const res = await getContentByPromptAttribution(
    { startDate, endDate, actorId, actorRole },
    { analyticsRepository: analyticsRepo }
  );

  console.log('Attribution Result success:', res.success);
  console.log('Attribution Data:', JSON.stringify(res.data, null, 2));
  console.log('--- ATTRIBUTION TEST COMPLETE ---');
}

testAttribution().catch(console.error).finally(() => process.exit());
