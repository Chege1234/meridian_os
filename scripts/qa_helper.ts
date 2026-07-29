import { db } from '@/infrastructure/supabase/db';
import { prompts, promptVersions, providerCredentials, contentItems, contentVersions, aiConversations, activityLogs } from '@/infrastructure/supabase/schema';
import { eq, desc } from 'drizzle-orm';

export async function runQuery(type: string, arg?: string) {
  if (type === 'prompts') {
    const res = await db.select().from(prompts);
    console.log('PROMPTS:', JSON.stringify(res, null, 2));
  } else if (type === 'active_prompt') {
    const res = await db.select().from(prompts).where(eq(prompts.status, 'active'));
    console.log('ACTIVE PROMPTS:', JSON.stringify(res, null, 2));
  } else if (type === 'prompt_versions') {
    const res = await db.select().from(promptVersions);
    console.log('PROMPT VERSIONS:', JSON.stringify(res, null, 2));
  } else if (type === 'credentials') {
    const res = await db.select().from(providerCredentials);
    console.log('CREDENTIALS:', JSON.stringify(res, null, 2));
  } else if (type === 'content_latest') {
    const res = await db.select().from(contentItems).orderBy(desc(contentItems.createdAt)).limit(5);
    console.log('LATEST CONTENT ITEMS:', JSON.stringify(res, null, 2));
  } else if (type === 'content_versions') {
    const res = await db.select().from(contentVersions).orderBy(desc(contentVersions.createdAt)).limit(5);
    console.log('LATEST CONTENT VERSIONS:', JSON.stringify(res, null, 2));
  } else if (type === 'ai_conversations') {
    const res = await db.select().from(aiConversations).orderBy(desc(aiConversations.createdAt)).limit(5);
    console.log('LATEST AI CONVERSATIONS:', JSON.stringify(res, null, 2));
  } else if (type === 'activity_logs') {
    const res = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(10);
    console.log('LATEST ACTIVITY LOGS:', JSON.stringify(res, null, 2));
  }
}

const command = process.argv[2] || 'prompts';
const arg = process.argv[3];
runQuery(command, arg).catch(console.error).finally(() => process.exit());
