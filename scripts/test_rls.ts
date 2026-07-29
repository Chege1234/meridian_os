import { createClient } from '@supabase/supabase-js';
import { db } from '@/infrastructure/supabase/db';
import { users, roles } from '@/infrastructure/supabase/schema';
import { eq } from 'drizzle-orm';

async function testRls() {
  console.log('--- TEST STEP 8: RLS SANITY CHECK ---');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // 1. Test unauthenticated (anon) access — should return 0 rows or error for all tables
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  const { data: anonContent } = await anonClient.from('content_items').select('*');
  console.log('Anon content_items access count:', anonContent?.length ?? 0);

  const { data: anonVersions } = await anonClient.from('content_versions').select('*');
  console.log('Anon content_versions access count:', anonVersions?.length ?? 0);

  const { data: anonAiConv } = await anonClient.from('ai_conversations').select('*');
  console.log('Anon ai_conversations access count:', anonAiConv?.length ?? 0);

  const { data: anonPrompts } = await anonClient.from('prompts').select('*');
  console.log('Anon prompts access count:', anonPrompts?.length ?? 0);

  // 2. Ensure viewer test user exists
  const adminClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const viewerEmail = 'qa_viewer_test@meridian.os';
  const viewerPassword = 'ViewerPassword123!';

  const { data: existingAuth } = await adminClient.auth.admin.listUsers();
  let viewerUser = existingAuth.users.find(u => u.email === viewerEmail);

  if (!viewerUser) {
    const { data: created, error } = await adminClient.auth.admin.createUser({
      email: viewerEmail,
      password: viewerPassword,
      email_confirm: true,
    });
    if (error) {
      console.error('Failed to create viewer user:', error.message);
      return;
    }
    viewerUser = created.user;

    const [viewerRole] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
    if (viewerRole) {
      await db.insert(users).values({
        id: viewerUser.id,
        email: viewerEmail,
        fullName: 'QA Viewer Test',
        username: 'qa_viewer',
        roleId: viewerRole.id,
        status: 'active',
      }).onConflictDoNothing();
    }
  }

  // 3. Sign in as viewer user
  const viewerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { error: signInErr } = await viewerClient.auth.signInWithPassword({
    email: viewerEmail,
    password: viewerPassword,
  });

  if (signInErr) {
    console.error('Viewer sign in failed:', signInErr.message);
    return;
  }

  console.log('Viewer user signed in successfully.');

  // 4. Test Viewer SELECT permission
  const { data: viewerItems } = await viewerClient.from('content_items').select('id, caption');
  console.log('Viewer content_items SELECT count:', viewerItems?.length ?? 0);

  // 5. Test Viewer INSERT permission (should fail or be blocked by RLS)
  const { error: insertErr } = await viewerClient.from('content_items').insert({
    platform: 'instagram',
    type: 'post',
    caption: 'Unauthorized viewer insert test',
    author_id: viewerUser.id,
  });
  console.log('Viewer content_items INSERT blocked by RLS:', !!insertErr, insertErr?.message || '');

  // 6. Test Viewer UPDATE permission (should fail or be blocked by RLS)
  const { error: updateErr } = await viewerClient.from('content_items').update({
    caption: 'Hacked caption by viewer',
  }).eq('id', 'ec197d34-2497-46cc-8e5e-9fa4a5f390d4');
  console.log('Viewer content_items UPDATE blocked by RLS:', !!updateErr, updateErr?.message || '');

  console.log('--- RLS SANITY CHECK COMPLETE ---');
}

testRls().catch(console.error).finally(() => process.exit());
