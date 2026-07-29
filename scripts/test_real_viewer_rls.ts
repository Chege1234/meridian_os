import { db } from '@/infrastructure/supabase/db';
import { users, roles } from '@/infrastructure/supabase/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

async function testRealViewerRls() {
  console.log('Setting test user role to viewer...');
  const [viewerRole] = await db.select().from(roles).where(eq(roles.name, 'viewer'));
  
  await db.update(users).set({ roleId: viewerRole!.id }).where(eq(users.email, 'qa_viewer_test@meridian.os'));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const viewerClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { data: authData, error: signInErr } = await viewerClient.auth.signInWithPassword({
    email: 'qa_viewer_test@meridian.os',
    password: 'ViewerPassword123!',
  });

  if (signInErr) {
    console.error('Sign in error:', signInErr);
    return;
  }

  console.log('Viewer user signed in with ID:', authData.user.id);

  // 1. SELECT (should succeed)
  const { data: selData, error: selErr } = await viewerClient.from('content_items').select('id, caption');
  console.log('Viewer SELECT success:', !selErr, 'Rows count:', selData?.length);

  // 2. INSERT (should fail due to RLS)
  const { data: insData, error: insErr } = await viewerClient.from('content_items').insert({
    platform: 'instagram',
    type: 'post',
    caption: 'Unauthorized viewer insert attempt',
    author_id: authData.user.id,
  }).select();
  console.log('Viewer INSERT blocked by RLS:', !!insErr, insErr?.message || '');

  // 3. UPDATE (should fail due to RLS)
  const { data: updData, error: updErr } = await viewerClient.from('content_items').update({
    caption: 'Hacked by viewer attempt 2',
  }).eq('id', 'ec197d34-2497-46cc-8e5e-9fa4a5f390d4').select();
  console.log('Viewer UPDATE blocked by RLS:', !!updErr, updErr?.message || '');
}

testRealViewerRls().catch(console.error).finally(() => process.exit());
